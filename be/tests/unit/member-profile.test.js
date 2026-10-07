// GET /member/me 내 정보 조회: 필요한 필드만 조회하고 비밀번호는 반환하지 않음
jest.mock('../../src/models', () => require('../api/helpers/fakeDb'));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../api/helpers/fakeDb');
const app = require('../../src/app');
const { bearer } = require('../api/helpers/token');

beforeEach(() => db.reset());

const me = (authorization = bearer('kim')) => request(app).get('/member/me').set('Authorization', authorization);

test('내 정보는 필요한 필드만 조회하고 비밀번호는 반환하지 않음', async () => {
  db.User.findOne.mockResolvedValue({
    user_id: 'kim', name: '김항해', email: 'kim@share.story', password: 'hash', gender: 'M',
    age_group: '30대', monthly_reading_volume: 'BOOKS_1_2', genre_1: 'NOVEL', genre_2: null,
  });

  const res = await me();

  const query = db.User.findOne.mock.calls[0][0];
  expect(query.where).toEqual({ user_id: 'kim' });
  expect(query.attributes).toEqual(['user_id', 'name', 'email', 'gender', 'age_group', 'monthly_reading_volume', 'genre_1', 'genre_2']);
  expect(res.body.document).toEqual({
    user_id: 'kim', name: '김항해', email: 'kim@share.story', gender: 'M', age_group: '30대',
    readingAmount: 'BOOKS_1_2', genres: ['NOVEL'],
  });
  expect(JSON.stringify(res.body)).not.toContain('hash');
});

test('회원이 없으면 404', async () => {
  db.User.findOne.mockResolvedValue(null);
  const res = await me(bearer('ghost'));
  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
});

test('토큰에 사용자 식별자가 없으면 401', async () => {
  const res = await me(`Bearer ${jwt.sign({}, process.env.JWT_SECRET)}`);
  expect(res.status).toBe(401);
  expect(db.User.findOne).not.toHaveBeenCalled();
});

test('성공 응답은 document로 감싸 반환', async () => {
  db.User.findOne.mockResolvedValue({ user_id: 'kim', name: null, email: null });
  const res = await me();
  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    success: true,
    document: { user_id: 'kim', name: null, email: null, gender: null, age_group: null, readingAmount: null, genres: [] },
  });
});
