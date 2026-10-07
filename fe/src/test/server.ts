import { setupServer } from 'msw/node';

// 기본 핸들러 없이 시작하고, 각 테스트가 server.use(...)로 필요한 응답만 지정함
export const server = setupServer();
export const API = 'http://localhost:3000';
