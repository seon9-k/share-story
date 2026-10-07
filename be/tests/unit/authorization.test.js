// 인증 미들웨어(Authorization: Bearer <token>) 단위 검증. 실제 Express 요청으로 확인함
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authorization = require('../../src/common/middleware/authorization');

const handler = jest.fn((req, res) => res.json({ user_id: req.user_id }));
const app = express();
app.get('/protected', authorization, handler);

const get = (header) => {
  const req = request(app).get('/protected');
  return header ? req.set('Authorization', header) : req;
};

test('인증 헤더가 없으면 401', async () => {
  const res = await get();
  expect(res.status).toBe(401);
  expect(handler).not.toHaveBeenCalled();
});

test('Bearer 형식이 아니면 401', async () => {
  const res = await get(`Basic ${jwt.sign({ user_id: 'kim' }, 'test-secret')}`);
  expect(res.status).toBe(401);
  expect(handler).not.toHaveBeenCalled();
});

test('위조된 토큰은 401', async () => {
  const token = jwt.sign({ user_id: 'kim' }, 'other-secret');
  const res = await get(`Bearer ${token}`);
  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
  expect(handler).not.toHaveBeenCalled();
});

test('만료된 토큰은 401', async () => {
  const token = jwt.sign({ user_id: 'kim', exp: Math.floor(Date.now() / 1000) - 60 }, 'test-secret');
  const res = await get(`Bearer ${token}`);
  expect(res.status).toBe(401);
  expect(handler).not.toHaveBeenCalled();
});

test('유효한 토큰은 user_id를 설정하고 다음 단계로 진행', async () => {
  const token = jwt.sign({ user_id: 'kim' }, 'test-secret');
  const res = await get(`Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ user_id: 'kim' });
});
