const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

// DB I/O만 대체하고 서비스·컨트롤러 분기는 실제 코드로 실행
const db = {};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '../../models') return db;
  return originalLoad.call(this, request, parent, isMain);
};
const profile = require('../../src/modules/member/profile.service');
const controller = require('../../src/modules/member/profile.controller');
Module._load = originalLoad;

const call = async (req) => {
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
  await controller.me(req, res, (error) => {
    throw error;
  });
  return res;
};

test('내 정보는 필요한 필드만 조회하고 비밀번호는 반환하지 않음', async () => {
  let query;
  db.User = {
    findOne: async (options) => {
      query = options;
      return { user_id: 'kim', name: '김항해', email: 'kim@share.story', password: 'hash' };
    },
  };
  const document = await profile.me({ userId: 'kim' });
  assert.deepEqual(query.where, { user_id: 'kim' });
  assert.deepEqual(query.attributes, ['user_id', 'name', 'email']);
  assert.deepEqual(document, { user_id: 'kim', name: '김항해', email: 'kim@share.story' });
});

test('회원이 없으면 404', async () => {
  db.User = { findOne: async () => null };
  const res = await call({ user_id: 'ghost' });
  assert.equal(res.code, 404);
  assert.equal(res.body.success, false);
});

test('토큰의 사용자 식별자가 없으면 401', async () => {
  const res = await call({});
  assert.equal(res.code, 401);
});

test('성공 응답은 document로 감싸 반환', async () => {
  db.User = { findOne: async () => ({ user_id: 'kim', name: null, email: null }) };
  const res = await call({ user_id: 'kim' });
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, {
    success: true,
    document: { user_id: 'kim', name: null, email: null },
  });
});
