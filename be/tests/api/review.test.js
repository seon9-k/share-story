// REQ-REV-001 모임 후기 관리
jest.mock('../../src/models', () => require('./helpers/fakeDb'));

const request = require('supertest');
const db = require('./helpers/fakeDb');
const app = require('../../src/app');
const { bearer } = require('./helpers/token');

const URL = '/review/meetups/1';
const meetup = (status) => db.Meetup.findByPk.mockResolvedValue({ meetup_id: '1', leader_id: 'leader01', status });

beforeEach(() => {
  db.reset();
  db.Apply.findOne.mockResolvedValue({ apply_id: 10 });
});

describe('POST /review/meetups/:id 후기 작성', () => {
  test('토큰이 없으면 401', async () => {
    const res = await request(app).post(URL).send({ content: '좋았어요', rating: 5 });
    expect(res.status).toBe(401);
  });

  test('종료된 모임이면 작성 가능 (201)', async () => {
    meetup('COMPLETED');
    db.Review.findOne.mockResolvedValue(null);
    db.Review.create.mockImplementation(async (v) => v);

    const res = await request(app).post(URL).set('Authorization', bearer('crew01')).send({ content: '좋았어요', rating: 5 });

    expect(res.status).toBe(201);
    expect(db.Review.create.mock.calls[0][0]).toMatchObject({ apply_id: 10, rating: 5, content: '좋았어요' });
  });

  test('진행 중인 모임이면 409', async () => {
    meetup('IN_PROGRESS');
    const res = await request(app).post(URL).set('Authorization', bearer('crew01')).send({ content: '좋았어요', rating: 5 });
    expect(res.status).toBe(409);
  });

  test('이미 작성했으면 409', async () => {
    meetup('COMPLETED');
    db.Review.findOne.mockResolvedValue({ deleted_at: null });
    const res = await request(app).post(URL).set('Authorization', bearer('crew01')).send({ content: '또', rating: 4 });
    expect(res.status).toBe(409);
  });

  test('삭제한 후기가 있으면 복구해서 다시 작성함', async () => {
    meetup('COMPLETED');
    const deleted = { deleted_at: new Date(), restore: jest.fn(), update: jest.fn(async (v) => v) };
    db.Review.findOne.mockResolvedValue(deleted);

    const res = await request(app).post(URL).set('Authorization', bearer('crew01')).send({ content: '재작성', rating: 3 });

    expect(res.status).toBe(201);
    expect(deleted.restore).toHaveBeenCalled();
  });

  test.each([[0], [6], [3.5], ['5'], [undefined]])('별점 %p이면 400', async (rating) => {
    const res = await request(app).post(URL).set('Authorization', bearer('crew01')).send({ content: '좋았어요', rating });
    expect(res.status).toBe(400);
  });

  test('내용이 비어 있으면 400', async () => {
    const res = await request(app).post(URL).set('Authorization', bearer('crew01')).send({ content: ' ', rating: 5 });
    expect(res.status).toBe(400);
  });

  test('모임 크루가 아니면 403', async () => {
    meetup('COMPLETED');
    db.Apply.findOne.mockResolvedValue(null);
    const res = await request(app).post(URL).set('Authorization', bearer('stranger1')).send({ content: '좋았어요', rating: 5 });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /review/meetups/:id/me 후기 수정', () => {
  test('본인 후기를 수정함', async () => {
    meetup('COMPLETED');
    const review = { update: jest.fn(async (v) => v) };
    db.Review.findOne.mockResolvedValue(review);

    const res = await request(app).patch(`${URL}/me`).set('Authorization', bearer('crew01')).send({ content: '수정', rating: 4 });

    expect(res.status).toBe(200);
    expect(db.Review.findOne.mock.calls[0][0].where).toEqual({ apply_id: 10 });
    expect(review.update).toHaveBeenCalledWith(expect.objectContaining({ content: '수정', rating: 4 }), expect.anything());
  });

  test('수정할 후기가 없으면 404', async () => {
    meetup('COMPLETED');
    db.Review.findOne.mockResolvedValue(null);
    const res = await request(app).patch(`${URL}/me`).set('Authorization', bearer('crew01')).send({ content: '수정', rating: 4 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /review/meetups/:id/me 후기 삭제', () => {
  test('본인 후기를 soft delete 함', async () => {
    meetup('COMPLETED');
    const review = { review_id: 1, update: jest.fn(), destroy: jest.fn() };
    db.Review.findOne.mockResolvedValue(review);

    const res = await request(app).delete(`${URL}/me`).set('Authorization', bearer('crew01'));

    expect(res.status).toBe(200);
    expect(review.destroy).toHaveBeenCalled();
  });

  test('삭제할 후기가 없으면 404', async () => {
    meetup('COMPLETED');
    db.Review.findOne.mockResolvedValue(null);
    const res = await request(app).delete(`${URL}/me`).set('Authorization', bearer('crew01'));
    expect(res.status).toBe(404);
  });
});

describe('GET /review/meetups/:id 후기 조회', () => {
  test('모임장은 크루 신청 없이 후기 목록을 조회함', async () => {
    meetup('COMPLETED');
    db.Apply.findOne.mockResolvedValue(null);
    db.Review.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ review_id: 1, rating: 5 }] });

    const res = await request(app).get(URL).set('Authorization', bearer('leader01'));

    expect(res.status).toBe(200);
    expect(res.body.document.items).toHaveLength(1);
  });

  test('모임과 무관한 사용자는 403', async () => {
    meetup('COMPLETED');
    db.Apply.findOne.mockResolvedValue(null);
    const res = await request(app).get(URL).set('Authorization', bearer('stranger1'));
    expect(res.status).toBe(403);
  });
});
