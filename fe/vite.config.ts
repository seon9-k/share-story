import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || 'http://localhost:3000';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // /meetup API만 프록시하고 /meetups 같은 FE 화면 경로는 가로채지 않도록 경계 지정
      proxy: Object.fromEntries(
        ['auth', 'meetup', 'member', 'session', 'logbook', 'review'].map((path) => [
          `^/${path}(?:/|$)`,
          { target, changeOrigin: true },
        ]),
      ),
    },
  };
});
