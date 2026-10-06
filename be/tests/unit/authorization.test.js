const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';
const authorization = require('../../src/common/middleware/authorization');

const run = (header) => {
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const req = { headers: header ? { authorization: header } : {} };
  let passed = false;
  authorization(req, res, () => {
    passed = true;
  });
  return { req, res, passed };
};

test('인증 헤더가 없으면 401', () => {
  const { res, passed } = run();
  assert.equal(res.code, 401);
  assert.equal(passed, false);
});

test('위조된 토큰은 401', () => {
  const token = jwt.sign({ user_id: 'kim' }, 'other-secret');
  const { res, passed } = run(`Bearer ${token}`);
  assert.equal(res.code, 401);
  assert.equal(res.body.success, false);
  assert.equal(passed, false);
});

test('만료된 토큰은 401', () => {
  const token = jwt.sign({ user_id: 'kim', exp: Math.floor(Date.now() / 1000) - 60 }, 'test-secret');
  const { res, passed } = run(`Bearer ${token}`);
  assert.equal(res.code, 401);
  assert.equal(passed, false);
});

test('유효한 토큰은 user_id를 설정하고 다음 단계로 진행', () => {
  const token = jwt.sign({ user_id: 'kim' }, 'test-secret');
  const { req, res, passed } = run(`Bearer ${token}`);
  assert.equal(passed, true);
  assert.equal(req.user_id, 'kim');
  assert.equal(res.code, undefined);
});
