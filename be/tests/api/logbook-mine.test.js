// 내가 제출한 로그북 모아보기: 여러 모임의 로그북을 모임 단위로 묶어 반환함
jest.mock('../../src/models', () => require('./helpers/fakeDb'));

const request = require('supertest');
const { Op } = require('sequelize');
const db = require('./helpers/fakeDb');
const app = require('../../src/app');
const { bearer } = require('./helpers/token');

const URL = '/logbook/mine';
const book = (id, applyId, sessionNumber, over = {}) => ({
  logbook_id: String(id), apply_id: applyId, session_id: String(id * 10), content: `내용${id}`,
  submitted_at: new Date(`2026-10-0${id}T01:00:00Z`), is_approved: false,
  Session: { session_id: String(id * 10), session_number: sessionNumber, topic: `주제${id}`, sch_date: `2026-10-1${id}` },
  ...over,
});

beforeEach(() => db.reset());

describe('GET /logbook/mine', () => {
  test('토큰이 없으면 401', async () => {
    expect((await request(app).get(URL)).status).toBe(401);
  });

  test('여러 모임의 로그북을 모임별로 묶고, 최근 제출한 모임이 먼저 오며 회차는 번호순', async () => {
    db.Apply.findAll.mockResolvedValue([{ apply_id: 10, meetup_id: '1' }, { apply_id: 20, meetup_id: '2' }]);
    db.Logbook.findAll.mockResolvedValue([
      book(3, 10, 2), // 모임1 2회차 (10/03 제출)
      book(1, 10, 1), // 모임1 1회차 (10/01 제출)
      book(4, 20, 1), // 모임2 1회차 (10/04 제출 → 가장 최근)
    ]);
    db.Meetup.findAll.mockResolvedValue([
      { meetup_id: '1', title: '소설 모임', book_title: '채식주의자', status: 'IN_PROGRESS' },
      { meetup_id: '2', title: '과학 모임', book_title: '코스모스', status: 'CLOSED' },
    ]);

    const res = await request(app).get(URL).set('Authorization', bearer('crew01'));

    expect(res.status).toBe(200);
    expect(res.body.document.map((g) => g.meetup.title)).toEqual(['과학 모임', '소설 모임']);
    expect(res.body.document[1].logbooks.map((l) => l.session_number)).toEqual([1, 2]);
    expect(res.body.document[1].logbooks[0]).toEqual({
      logbook_id: '1', session_id: '10', session_number: 1, topic: '주제1', sch_date: '2026-10-11',
      content: '내용1', submitted_at: expect.any(String), is_approved: false,
    });
  });

  test('조회는 본인 신청(apply)의 제출된 로그북만 대상으로 함', async () => {
    db.Apply.findAll.mockResolvedValue([{ apply_id: 10, meetup_id: '1' }]);
    db.Logbook.findAll.mockResolvedValue([]);
    db.Meetup.findAll.mockResolvedValue([]);

    await request(app).get(URL).set('Authorization', bearer('crew01'));

    expect(db.Apply.findAll.mock.calls[0][0].where).toEqual({ user_id: 'crew01' });
    const where = db.Logbook.findAll.mock.calls[0][0].where;
    expect(where.apply_id[Op.in]).toEqual([10]); // 본인 신청(apply_id)만
    expect(where.submitted_at[Op.ne]).toBeNull(); // 제출된 로그북만
  });

  test('삭제된 모임·회차의 로그북은 제외함', async () => {
    db.Apply.findAll.mockResolvedValue([{ apply_id: 10, meetup_id: '1' }, { apply_id: 20, meetup_id: '2' }]);
    db.Logbook.findAll.mockResolvedValue([
      book(1, 10, 1),
      book(2, 20, 1),
      book(3, 10, 2, { Session: null }), // 삭제된 회차
    ]);
    db.Meetup.findAll.mockResolvedValue([{ meetup_id: '1', title: '소설 모임', book_title: 'b', status: 'IN_PROGRESS' }]); // 모임2는 삭제됨

    const res = await request(app).get(URL).set('Authorization', bearer('crew01'));

    expect(res.body.document).toHaveLength(1);
    expect(res.body.document[0].logbooks.map((l) => l.logbook_id)).toEqual(['1']);
  });

  test('신청 내역이 없으면 빈 배열이고 다른 조회를 하지 않음', async () => {
    db.Apply.findAll.mockResolvedValue([]);

    const res = await request(app).get(URL).set('Authorization', bearer('crew01'));

    expect(res.status).toBe(200);
    expect(res.body.document).toEqual([]);
    expect(db.Logbook.findAll).not.toHaveBeenCalled();
  });
});
