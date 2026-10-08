// 모집 마감일은 첫 회차 시작 시각(KST)보다 이전이어야 함 (시작일에 항해 중으로 바뀌는 배치와 어긋나지 않게)
jest.mock('../../src/models', () => require('./helpers/fakeDb'));
jest.mock('../../src/common/services/blob.service');

const request = require('supertest');
const db = require('./helpers/fakeDb');
const app = require('../../src/app');
const { bearer } = require('./helpers/token');
const { isDeadlineBeforeFirstSession } = require('../../src/modules/meetup/meetup.validation');

// 첫 회차: 2099-01-10 20:00 KST = 2099-01-10T11:00:00Z
const session = (n) => ({
  session_number: n, topic: `${n}회차 주제`, sch_date: `2099-0${n}-10`, sch_day: '토',
  sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00',
});
const sessions = [1, 2, 3, 4].map(session);
const validMeetup = (over = {}) => ({
  title: '함께 읽는 소설', description: '4주 동안 소설을 읽습니다.', book_title: '채식주의자', price: 40000,
  min_capacity: 4, max_capacity: 8, deadline: '2098-12-31T00:00:00Z', sessions, ...over,
});

beforeEach(() => db.reset());

describe('isDeadlineBeforeFirstSession', () => {
  test.each([
    ['첫 회차 시작 1초 전', '2099-01-10T10:59:59Z', true],
    ['첫 회차 시작과 같은 시각', '2099-01-10T11:00:00Z', false],
    ['첫 회차 이후', '2099-01-11T00:00:00Z', false],
    ['마지막 회차 이후', '2099-05-01T00:00:00Z', false],
  ])('%s → %s', (_label, deadline, expected) => {
    expect(isDeadlineBeforeFirstSession(deadline, sessions)).toBe(expected);
  });

  test('회차 순서가 뒤섞여도 가장 이른 회차를 기준으로 함', () => {
    expect(isDeadlineBeforeFirstSession('2099-02-01T00:00:00Z', [...sessions].reverse())).toBe(false);
  });

  test('회차 날짜·시간을 해석할 수 없으면 다른 검증에 맡기고 통과시킴', () => {
    expect(isDeadlineBeforeFirstSession('2099-12-31T00:00:00Z', [{ sch_date: 'x', sch_st_time: 'y' }])).toBe(true);
    expect(isDeadlineBeforeFirstSession('2099-12-31T00:00:00Z', [])).toBe(true);
  });
});

describe('POST /meetup 모집 마감일과 첫 회차', () => {
  const post = (body) => request(app).post('/meetup').set('Authorization', bearer('leader01')).send(body);

  beforeEach(() => {
    db.User.findByPk.mockResolvedValue({ user_id: 'leader01' });
    db.Meetup.create.mockImplementation(async (v) => ({ ...v, meetup_id: 1 }));
    db.Session.bulkCreate.mockImplementation(async (rows) => rows.map((r, i) => ({ ...r, session_id: i + 1 })));
  });

  test('마감일이 첫 회차보다 늦으면 400', async () => {
    const res = await post(validMeetup({ deadline: '2099-02-01T00:00:00Z' }));

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('deadline은 첫 회차 시작 시각보다 이전이어야 합니다.');
    expect(db.Meetup.create).not.toHaveBeenCalled();
  });

  test('첫 회차 당일이라도 시작 시각 이전이면 통과', async () => {
    const res = await post(validMeetup({ deadline: '2099-01-10T10:59:59Z' }));

    expect(res.status).toBe(201);
  });

  test('첫 회차 시작 시각과 같거나 늦으면 400', async () => {
    const res = await post(validMeetup({ deadline: '2099-01-10T11:00:00Z' }));

    expect(res.status).toBe(400);
  });

  test('회차 입력이 잘못된 경우에는 회차 오류만 알려줌', async () => {
    const res = await post(validMeetup({ deadline: '2099-02-01T00:00:00Z', sessions: [1, 2, 3].map(session) }));

    expect(res.status).toBe(400);
    expect(res.body.errors.join()).not.toContain('첫 회차');
  });
});

describe('PATCH /meetup/:id 마감일·일정 변경', () => {
  const patch = (body) => request(app).patch('/meetup/1').set('Authorization', bearer('leader01')).send(body);
  let meetup;

  beforeEach(() => {
    meetup = {
      meetup_id: 1, leader_id: 'leader01', title: '기존', status: 'RECRUITING', deadline: '2098-12-31T00:00:00Z',
      update: jest.fn(async (values) => Object.assign(meetup, values)),
    };
    db.Meetup.findByPk.mockImplementation(async () => meetup);
    db.Session.findAll.mockResolvedValue(sessions.map((s, i) => ({ ...s, session_id: i + 1, meetup_id: 1 })));
    db.Session.findByPk.mockImplementation(async (id) => ({
      session_id: id, meetup_id: 1, update: jest.fn(async (values) => values),
    }));
  });

  test('마감일을 첫 회차 이후로 바꾸면 400 (트랜잭션 안에서 던져 롤백됨)', async () => {
    const res = await patch({ deadline: '2099-02-01T00:00:00Z' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('첫 회차');
  });

  test('마감일을 첫 회차 이전으로 바꾸면 200', async () => {
    const res = await patch({ deadline: '2099-01-05T00:00:00Z' });

    expect(res.status).toBe(200);
  });

  test('회차 날짜를 마감일 이전으로 앞당기면 400', async () => {
    db.Session.findAll.mockResolvedValue(
      sessions.map((s, i) => ({ ...s, sch_date: i === 0 ? '2098-12-01' : s.sch_date, session_id: i + 1, meetup_id: 1 })),
    );

    const res = await patch({ sessions: [{ session_id: 1, sch_date: '2098-12-01' }] });

    expect(res.status).toBe(400);
  });

  test('일정과 무관한 수정은 기존 모임(마감일이 첫 회차 이후)이어도 막지 않음', async () => {
    meetup.deadline = '2099-02-01T00:00:00Z';

    const res = await patch({ title: '제목만 수정' });

    expect(res.status).toBe(200);
  });
});
