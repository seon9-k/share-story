import { defineConfig, devices } from '@playwright/test';

// 실제 브라우저 E2E. 임시 PostgreSQL + 실제 BE + 프로덕션 빌드 FE를 함께 띄워 검증함
// 실행: npm run test:e2e   (필요: Homebrew PostgreSQL 등 initdb·postgres·psql 명령)
const FE_PORT = 4173;
const BE_PORT = 3100;
const PG_PORT = 54330;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  outputDir: './e2e/.artifacts',
  // 하나의 DB를 공유하므로 순차 실행함 (각 테스트는 고유한 계정·모임을 만들어 서로 독립적임)
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${FE_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'bash e2e/scripts/db.sh', port: PG_PORT, reuseExistingServer: false, timeout: 60_000 },
    { command: 'bash e2e/scripts/be.sh', url: `http://127.0.0.1:${BE_PORT}/ping`, reuseExistingServer: false, timeout: 90_000 },
    { command: 'bash e2e/scripts/fe.sh', url: `http://127.0.0.1:${FE_PORT}`, reuseExistingServer: false, timeout: 120_000 },
  ],
});
