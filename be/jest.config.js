// Jest + Supertest 테스트 설정 (tests/api, tests/unit, tests/integration 모두 Jest로 실행)
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/api/helpers/env.js'],
  clearMocks: true,
};
