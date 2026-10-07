// REQ-MEM-003 마이페이지 조회 (신청자: 참여 모임, 모임장: 개설 모임·신청자 목록)
jest.mock('../../src/models', () => require('./helpers/fakeDb'));

const request = require('supertest');
const db = require('./helpers/fakeDb');
const app = require('../../src/app');
const { bearer } = require('./helpers/token');

beforeEach(() => db.reset());

describe('GET /member/me', () => {
  test('비밀번호 없이 화면에 필요한 프로필만 반환함', async () => {
    db.User.findOne.mockResolvedValue({
      user_id: 'reader01', name: '독서왕', email: 'a@b.co', gender: 'F', age_group: '30대',
      monthly_reading_volume: 'BOOKS_3_4', genre_1: 'NOVEL', genre_2: null, password: 'hash',
    });

    const res = await request(app).get('/member/me').set('Authorization', bearer('reader01'));

    expect(res.status).toBe(200);
    expect(res.body.document).toMatchObject({ user_id: 'reader01', readingAmount: 'BOOKS_3_4', genres: ['NOVEL'] });
    expect(JSON.stringify(res.body)).not.toContain('hash');
  });

  test('탈퇴 등으로 회원이 없으면 404', async () => {
    db.User.findOne.mockResolvedValue(null);
    const res = await request(app).get('/member/me').set('Authorization', bearer('ghost01'));
    expect(res.status).toBe(404);
  });
});

describe('모임장·신청자 모임 목록', () => {
  const page = { count: 12, rows: [{ meetup_id: 1 }] };

  test('모임장 목록은 본인이 개설한 모임만 조회함', async () => {
    db.Meetup.findAndCountAll.mockResolvedValue(page);

    const res = await request(app).get('/member/meetups/captain').set('Authorization', bearer('leader01'));

    expect(res.status).toBe(200);
    expect(db.Meetup.findAndCountAll.mock.calls[0][0].where).toEqual({ leader_id: 'leader01' });
    expect(res.body.document).toMatchObject({ page: 1, limit: 10, total: 12, nextPage: 2 });
  });

  test('신청자 목록은 본인 신청 건으로 조인해 조회함', async () => {
    db.Meetup.findAndCountAll.mockResolvedValue(page);

    await request(app).get('/member/meetups/crew').set('Authorization', bearer('crew01'));

    const { include } = db.Meetup.findAndCountAll.mock.calls[0][0];
    expect(include[0]).toMatchObject({ required: true, where: { user_id: 'crew01' } });
  });

  test('role이 잘못되면 400', async () => {
    const res = await request(app).get('/member/meetups?role=admin').set('Authorization', bearer('crew01'));
    expect(res.status).toBe(400);
  });

  test.each(['page=0', 'page=-1', 'page=abc', 'limit=101'])('페이지 입력 %s이면 400', async (query) => {
    const res = await request(app).get(`/member/meetups/captain?${query}`).set('Authorization', bearer('leader01'));
    expect(res.status).toBe(400);
  });

  test('토큰이 없으면 401', async () => {
    const res = await request(app).get('/member/meetups/captain');
    expect(res.status).toBe(401);
  });
});

describe('GET /member/meetups/:id/crews 신청자 목록 (REQ-GRP-005)', () => {
  test('모임장은 신청자 ID·상태를 조회할 수 있음', async () => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
    db.Apply.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ apply_id: 5, user_id: 'crew01', status: 'ING', User: { name: '크루' } }],
    });

    const res = await request(app).get('/member/meetups/1/crews').set('Authorization', bearer('leader01'));

    expect(res.status).toBe(200);
    expect(res.body.document.items[0]).toEqual({ apply_id: 5, user_id: 'crew01', name: '크루', status: 'ING' });
  });

  test('모임장이 아니면 403', async () => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
    const res = await request(app).get('/member/meetups/1/crews').set('Authorization', bearer('crew01'));
    expect(res.status).toBe(403);
  });

  test('meetup_id가 숫자가 아니면 400', async () => {
    const res = await request(app).get('/member/meetups/abc/crews').set('Authorization', bearer('leader01'));
    expect(res.status).toBe(400);
  });
});

describe('GET /member/meetups/:id/sessions', () => {
  test('모임과 무관한 사용자는 403', async () => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
    db.Apply.findOne.mockResolvedValue(null);
    const res = await request(app).get('/member/meetups/1/sessions').set('Authorization', bearer('stranger1'));
    expect(res.status).toBe(403);
  });

  test('모임장은 신청 없이도 회차를 조회함', async () => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01' });
    db.Session.findAll.mockResolvedValue([{ session_id: 1, session_number: 1 }]);
    const res = await request(app).get('/member/meetups/1/sessions').set('Authorization', bearer('leader01'));
    expect(res.status).toBe(200);
    expect(res.body.document).toHaveLength(1);
  });
});
