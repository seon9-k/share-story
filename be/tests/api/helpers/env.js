// app 로드 전에 테스트용 환경변수 고정 (dotenv는 이미 설정된 값을 덮어쓰지 않음)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SALT_ROUNDS = '4'; // bcrypt 속도 확보
process.env.BATCH_API_KEY = 'test-batch-key';

// morgan 요청 로그가 테스트 출력에 섞이지 않도록 무력화
jest.mock('morgan', () => () => (req, res, next) => next());
