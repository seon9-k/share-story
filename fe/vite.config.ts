import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || 'http://localhost:3000';
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.test.{ts,tsx}'], // tests/ 의 node:test 파일과 분리
      css: false,
      // meetupApi는 기본 주소가 localhost:3000이라 두 API 클라이언트가 같은 주소를 보도록 고정
      env: { VITE_API_BASE_URL: 'http://localhost:3000' },
    },
    server: {
      port: 5173,
      // /meetup API만 프록시하고 /meetups 같은 FE 화면 경로는 가로채지 않도록 경계 지정
      // /meetup?keyword=... 처럼 쿼리가 붙은 요청도 프록시되도록 ? 경계를 허용
      proxy: Object.fromEntries(
        ['auth', 'meetup', 'member', 'session', 'logbook', 'review'].map((path) => [
          `^/${path}(?:[/?]|$)`,
          { target, changeOrigin: true },
        ]),
      ),
    },
  };
});
