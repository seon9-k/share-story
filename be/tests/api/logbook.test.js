// REQ-SES-002 로그북(독후감) 제출, REQ-SES-003 모임장 확인
jest.mock('../../src/models', () => require('./helpers/fakeDb'));

const request = require('supertest');
const db = require('./helpers/fakeDb');
const app = require('../../src/app');
const { bearer } = require('./helpers/token');

const URL = '/logbook/meetups/1/sessions/2';
const crewSetup = () => {
  db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
  db.Apply.findOne.mockResolvedValue({ apply_id: 10 });
  db.Session.findOne.mockResolvedValue({ session_id: '2', meetup_id: '1', status: 'SCHEDULED' });
  db.Session.findAll.mockResolvedValue([]);
};

beforeEach(() => db.reset());

describe('PUT /logbook/.../me 로그북 제출', () => {
  test('토큰이 없으면 401', async () => {
    const res = await request(app).put(`${URL}/me`).send({ content: '내용' });
    expect(res.status).toBe(401);
  });

  test('신청한 크루가 처음 제출하면 생성함 (승인 전 상태)', async () => {
    crewSetup();
    db.Logbook.findOne.mockResolvedValue(null);
    db.Logbook.create.mockImplementation(async (v) => v);

    const res = await request(app).put(`${URL}/me`).set('Authorization', bearer('crew01')).send({ content: '  독후감 내용  ' });

    expect(res.status).toBe(200);
    expect(db.Logbook.create.mock.calls[0][0]).toMatchObject({
      content: '독후감 내용', // 앞뒤 공백 제거
      apply_id: 10,
      is_approved: false,
    });
  });

  test('이미 제출했으면 새로 만들지 않고 덮어쓰며 승인 상태를 초기화함', async () => {
    crewSetup();
    const existing = { deleted_at: null, update: jest.fn(async (v) => v) };
    db.Logbook.findOne.mockResolvedValue(existing);

    const res = await request(app).put(`${URL}/me`).set('Authorization', bearer('crew01')).send({ content: '수정본' });

    expect(res.status).toBe(200);
    expect(db.Logbook.create).not.toHaveBeenCalled();
    expect(existing.update).toHaveBeenCalledWith(expect.objectContaining({ content: '수정본', is_approved: false }), expect.anything());
  });

  test('삭제했던 로그북은 복구 후 덮어씀 (unique 충돌 방지)', async () => {
    crewSetup();
    const deleted = { deleted_at: new Date(), restore: jest.fn(), update: jest.fn(async (v) => v) };
    db.Logbook.findOne.mockResolvedValue(deleted);

    const res = await request(app).put(`${URL}/me`).set('Authorization', bearer('crew01')).send({ content: '재작성' });

    expect(res.status).toBe(200);
    expect(deleted.restore).toHaveBeenCalled();
  });

  test.each([[''], ['   '], [undefined]])('내용이 %p이면 400', async (content) => {
    const res = await request(app).put(`${URL}/me`).set('Authorization', bearer('crew01')).send({ content });
    expect(res.status).toBe(400);
  });

  test('모임 크루가 아니면 403', async () => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
    db.Apply.findOne.mockResolvedValue(null);
    const res = await request(app).put(`${URL}/me`).set('Authorization', bearer('stranger1')).send({ content: '내용' });
    expect(res.status).toBe(403);
  });

  test('다른 모임의 세션이면 404', async () => {
    crewSetup();
    db.Session.findOne.mockResolvedValue(null);
    const res = await request(app).put(`${URL}/me`).set('Authorization', bearer('crew01')).send({ content: '내용' });
    expect(res.status).toBe(404);
  });

  test('취소된 세션에는 제출할 수 없어 409', async () => {
    crewSetup();
    db.Session.findOne.mockResolvedValue({ session_id: '2', status: 'CANCELLED' });
    const res = await request(app).put(`${URL}/me`).set('Authorization', bearer('crew01')).send({ content: '내용' });
    expect(res.status).toBe(409);
  });

  test('session_id에 숫자가 아닌 값이면 400', async () => {
    const res = await request(app).put('/logbook/meetups/1/sessions/abc/me').set('Authorization', bearer('crew01')).send({ content: '내용' });
    expect(res.status).toBe(400);
  });
});

describe('GET /logbook/.../me 본인 로그북 조회', () => {
  test('본인 신청 건 기준으로 조회함', async () => {
    crewSetup();
    db.Logbook.findOne.mockResolvedValue({ logbook_id: 1, content: '내용' });

    const res = await request(app).get(`${URL}/me`).set('Authorization', bearer('crew01'));

    expect(res.status).toBe(200);
    expect(db.Logbook.findOne.mock.calls[0][0].where).toEqual({ session_id: '2', apply_id: 10 });
  });
});

describe('DELETE /logbook/.../me', () => {
  test('제출한 로그북이 없으면 404', async () => {
    crewSetup();
    db.Logbook.findOne.mockResolvedValue(null);
    const res = await request(app).delete(`${URL}/me`).set('Authorization', bearer('crew01'));
    expect(res.status).toBe(404);
  });

  test('본인 로그북을 soft delete 함', async () => {
    crewSetup();
    const logbook = { logbook_id: 3, session_id: '2', update: jest.fn(), destroy: jest.fn() };
    db.Logbook.findOne.mockResolvedValue(logbook);

    const res = await request(app).delete(`${URL}/me`).set('Authorization', bearer('crew01'));

    expect(res.status).toBe(200);
    expect(logbook.destroy).toHaveBeenCalled();
  });
});

describe('GET /logbook/.../sessions/:id 모임장의 제출 현황 조회 (REQ-GRP-005)', () => {
  test('모임장은 미제출 크루까지 포함해 조회함', async () => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
    db.Session.findOne.mockResolvedValue({ session_id: '2' });
    db.Apply.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [
        { apply_id: 1, user_id: 'crew01', status: 'ING', User: { name: 'A' }, Logbooks: [{ logbook_id: 9, content: '독후감' }] },
        { apply_id: 2, user_id: 'crew02', status: 'ING', User: { name: 'B' }, Logbooks: [] },
      ],
    });

    const res = await request(app).get(URL).set('Authorization', bearer('leader01'));

    expect(res.status).toBe(200);
    const [submitted, notSubmitted] = res.body.document.items;
    expect(submitted.logbook.content).toBe('독후감');
    expect(notSubmitted.logbook).toBeNull();
  });

  test('모임장이 아닌 크루는 다른 크루의 로그북을 볼 수 없어 403', async () => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
    const res = await request(app).get(URL).set('Authorization', bearer('crew01'));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /logbook/.../logbooks/:id/approval 숙제 확인 완료 (REQ-SES-003)', () => {
  const APPROVE = `${URL}/logbooks/9/approval`;
  const submitted = (over = {}) => ({
    logbook_id: 9, session_id: '2', apply_id: 10, submitted_at: new Date(), is_approved: false,
    update: jest.fn(async function (values) { Object.assign(this, values); return this; }),
    ...over,
  });
  const leaderSetup = (logbook) => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
    db.Session.findOne.mockResolvedValue({ session_id: '2', meetup_id: '1', status: 'SCHEDULED' });
    db.Logbook.findOne.mockResolvedValue(logbook);
  };

  test('토큰이 없으면 401', async () => {
    const res = await request(app).patch(APPROVE);
    expect(res.status).toBe(401);
  });

  test('모임장이 승인하면 is_approved가 true가 되고 변경자가 기록됨', async () => {
    const logbook = submitted();
    leaderSetup(logbook);

    const res = await request(app).patch(APPROVE).set('Authorization', bearer('leader01'));

    expect(res.status).toBe(200);
    expect(res.body.document).toEqual({ logbook_id: 9, session_id: '2', apply_id: 10, is_approved: true });
    expect(logbook.update).toHaveBeenCalledWith({ is_approved: true, updated_user_id: 'leader01' }, expect.anything());
  });

  test('이 모임·회차의 로그북만 조회하며 재제출과 겹치지 않게 행을 잠금', async () => {
    leaderSetup(submitted());
    await request(app).patch(APPROVE).set('Authorization', bearer('leader01'));
    const options = db.Logbook.findOne.mock.calls[0][0];
    expect(options.where).toEqual({ logbook_id: '9', meetup_id: '1', session_id: '2' });
    expect(options.lock).toBe('UPDATE');
  });

  test('is_approved:false로 승인을 취소할 수 있음', async () => {
    const logbook = submitted({ is_approved: true });
    leaderSetup(logbook);

    const res = await request(app).patch(APPROVE).set('Authorization', bearer('leader01')).send({ is_approved: false });

    expect(res.status).toBe(200);
    expect(res.body.document.is_approved).toBe(false);
  });

  test.each([['yes'], [1], [null]])('is_approved가 %p이면 400', async (value) => {
    leaderSetup(submitted());
    const res = await request(app).patch(APPROVE).set('Authorization', bearer('leader01')).send({ is_approved: value });
    expect(res.status).toBe(400);
  });

  test('모임장이 아니면 본인 모임의 크루라도 403 (자기 로그북을 스스로 승인 불가)', async () => {
    const logbook = submitted();
    leaderSetup(logbook);
    const res = await request(app).patch(APPROVE).set('Authorization', bearer('crew01'));
    expect(res.status).toBe(403);
    expect(logbook.update).not.toHaveBeenCalled();
  });

  test('다른 모임의 모임장은 403', async () => {
    leaderSetup(submitted());
    const res = await request(app).patch(APPROVE).set('Authorization', bearer('other-leader'));
    expect(res.status).toBe(403);
  });

  test('로그북이 없거나 다른 회차 것이면 404', async () => {
    leaderSetup(null);
    const res = await request(app).patch(APPROVE).set('Authorization', bearer('leader01'));
    expect(res.status).toBe(404);
  });

  test('제출 전(submitted_at 없음) 로그북은 승인할 수 없어 409', async () => {
    const logbook = submitted({ submitted_at: null });
    leaderSetup(logbook);
    const res = await request(app).patch(APPROVE).set('Authorization', bearer('leader01'));
    expect(res.status).toBe(409);
    expect(logbook.update).not.toHaveBeenCalled();
  });

  test('다른 모임의 회차면 404', async () => {
    leaderSetup(submitted());
    db.Session.findOne.mockResolvedValue(null);
    const res = await request(app).patch(APPROVE).set('Authorization', bearer('leader01'));
    expect(res.status).toBe(404);
  });

  test('logbook_id가 숫자가 아니면 400', async () => {
    const res = await request(app).patch(`${URL}/logbooks/abc/approval`).set('Authorization', bearer('leader01'));
    expect(res.status).toBe(400);
  });
});
