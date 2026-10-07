// REQ-MEM-002 회원가입, NFR-SEC-001 비밀번호 단방향 암호화·토큰 인증
jest.mock('../../src/models', () => require('./helpers/fakeDb'));

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./helpers/fakeDb');
const app = require('../../src/app');
const { bearer, expiredBearer } = require('./helpers/token');

const validSignup = () => ({
  user_id: 'reader01',
  password: 'password1',
  email: 'reader@example.com',
  name: '독서왕',
  gender: 'F',
  age_group: '30대',
  readingAmount: 'BOOKS_3_4',
  genres: ['NOVEL', 'ESSAY'],
});

beforeEach(() => db.reset());

describe('POST /auth/signup (REQ-MEM-002)', () => {
  test('유효한 입력이면 201과 함께 비밀번호를 해시해 저장함', async () => {
    db.User.count.mockResolvedValue(0);
    db.User.create.mockImplementation(async (values) => values);

    const res = await request(app).post('/auth/signup').send(validSignup());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, document: { user_id: 'reader01', name: '독서왕' } });
    const saved = db.User.create.mock.calls[0][0];
    expect(saved.password).not.toBe('password1');
    expect(await bcrypt.compare('password1', saved.password)).toBe(true);
    expect(saved).toMatchObject({ genre_1: 'NOVEL', genre_2: 'ESSAY', monthly_reading_volume: 'BOOKS_3_4' });
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  test.each([
    ['아이디가 4자 미만', { user_id: 'ab1' }],
    ['아이디에 숫자가 없음', { user_id: 'readeronly' }],
    ['비밀번호가 8자 미만', { password: 'pw1' }],
    ['비밀번호에 숫자가 없음', { password: 'onlyletters' }],
    ['이메일 형식 오류', { email: 'not-an-email' }],
    ['성별이 코드값이 아님', { gender: '여' }],
    ['장르가 3개 초과', { genres: ['NOVEL', 'ESSAY', 'IT'] }],
    ['장르가 중복됨', { genres: ['NOVEL', 'NOVEL'] }],
    ['장르가 문자열', { genres: 'NOVEL,ESSAY' }],
    ['독서량이 코드값이 아님', { readingAmount: '1~2권' }],
  ])('%s이면 400', async (_label, override) => {
    const res = await request(app).post('/auth/signup').send({ ...validSignup(), ...override });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(db.User.create).not.toHaveBeenCalled();
  });

  test('이미 사용 중인 아이디면 409', async () => {
    db.User.count.mockResolvedValueOnce(1);

    const res = await request(app).post('/auth/signup').send(validSignup());

    expect(res.status).toBe(409);
    expect(db.User.create).not.toHaveBeenCalled();
  });

  test('이미 가입된 이메일이면 409', async () => {
    db.User.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

    const res = await request(app).post('/auth/signup').send(validSignup());

    expect(res.status).toBe(409);
    expect(db.User.create).not.toHaveBeenCalled();
  });
});

describe('POST /auth/check-id', () => {
  test('사용 가능한 아이디면 count 0', async () => {
    db.User.count.mockResolvedValue(0);
    const res = await request(app).post('/auth/check-id').send({ user_id: 'reader01' });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  test('이미 있는 아이디면 count 1', async () => {
    db.User.count.mockResolvedValue(1);
    const res = await request(app).post('/auth/check-id').send({ user_id: 'reader01' });
    expect(res.body.count).toBe(1);
  });

  test('형식이 틀리면 DB를 조회하지 않고 400', async () => {
    const res = await request(app).post('/auth/check-id').send({ user_id: 'x' });
    expect(res.status).toBe(400);
    expect(db.User.count).not.toHaveBeenCalled();
  });
});

describe('POST /auth/login (NFR-SEC-001)', () => {
  const storedUser = async () => ({
    user_id: 'reader01',
    name: '독서왕',
    email: 'reader@example.com',
    password: await bcrypt.hash('password1', 4),
  });

  test('성공하면 JWT를 발급하고 비밀번호는 응답에 없음', async () => {
    db.User.findOne.mockResolvedValue(await storedUser());

    const res = await request(app).post('/auth/login').send({ user_id: 'reader01', password: 'password1' });

    expect(res.status).toBe(200);
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET).user_id).toBe('reader01');
    expect(res.body.document).toMatchObject({ user_id: 'reader01', name: '독서왕' });
    expect(res.body.document.password).toBeUndefined();
  });

  test('비밀번호가 틀리면 401', async () => {
    db.User.findOne.mockResolvedValue(await storedUser());
    const res = await request(app).post('/auth/login').send({ user_id: 'reader01', password: 'wrong-pass1' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('없는 아이디도 같은 401 메시지로 응답해 계정 존재 여부를 노출하지 않음', async () => {
    db.User.findOne.mockResolvedValueOnce(await storedUser()).mockResolvedValueOnce(null);
    const wrongPw = await request(app).post('/auth/login').send({ user_id: 'reader01', password: 'wrong-pass1' });
    const noUser = await request(app).post('/auth/login').send({ user_id: 'ghost01', password: 'password1' });
    expect(noUser.status).toBe(401);
    expect(noUser.body.message).toBe(wrongPw.body.message);
  });

  test('소셜 회원처럼 password가 null이어도 500이 아닌 401', async () => {
    db.User.findOne.mockResolvedValue({ user_id: 'kakao01', password: null });
    const res = await request(app).post('/auth/login').send({ user_id: 'kakao01', password: 'password1' });
    expect(res.status).toBe(401);
  });

  test('아이디 또는 비밀번호가 없으면 400', async () => {
    const res = await request(app).post('/auth/login').send({ user_id: 'reader01' });
    expect(res.status).toBe(400);
  });
});

describe('인증 미들웨어', () => {
  test('토큰이 없으면 401', async () => {
    const res = await request(app).get('/member/me');
    expect(res.status).toBe(401);
  });

  test('위조된 토큰이면 401', async () => {
    const res = await request(app).get('/member/me').set('Authorization', 'Bearer fake.token.value');
    expect(res.status).toBe(401);
  });

  test('만료된 토큰이면 401이며 만료 안내 메시지', async () => {
    const res = await request(app).get('/member/me').set('Authorization', expiredBearer('reader01'));
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('만료');
  });
});

describe('PATCH /auth/updateMyInfo', () => {
  test('토큰이 없으면 401', async () => {
    const res = await request(app).patch('/auth/updateMyInfo').send({ name: '새이름' });
    expect(res.status).toBe(401);
  });

  test('body의 user_id는 무시하고 토큰의 본인만 수정함', async () => {
    const user = { user_id: 'reader01', email: 'a@b.co', password: 'x', name: '이전', update: jest.fn() };
    db.User.findByPk.mockResolvedValue(user);

    const res = await request(app)
      .patch('/auth/updateMyInfo')
      .set('Authorization', bearer('reader01'))
      .send({ user_id: 'victim99', name: '새이름' });

    expect(res.status).toBe(200);
    expect(db.User.findByPk).toHaveBeenCalledWith('reader01');
    expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ name: '새이름', updated_user_id: 'reader01' }));
  });

  test('수정할 항목이 없으면 400', async () => {
    const res = await request(app).patch('/auth/updateMyInfo').set('Authorization', bearer('reader01')).send({});
    expect(res.status).toBe(400);
  });

  test('현재 비밀번호가 틀리면 401이 아닌 400 (FE 자동 로그아웃 방지)', async () => {
    const user = { user_id: 'reader01', email: 'a@b.co', password: await bcrypt.hash('password1', 4), update: jest.fn() };
    db.User.findByPk.mockResolvedValue(user);

    const res = await request(app)
      .patch('/auth/updateMyInfo')
      .set('Authorization', bearer('reader01'))
      .send({ new_password: 'newpassword1', current_password: 'wrong-pass1' });

    expect(res.status).toBe(400);
    expect(user.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /auth/me', () => {
  const withUser = async () =>
    db.User.findByPk.mockResolvedValue({
      user_id: 'reader01',
      password: await bcrypt.hash('password1', 4),
      update: jest.fn(),
      destroy: jest.fn(),
    });

  test('운영 중인 모임의 캡틴이면 409로 탈퇴 불가', async () => {
    await withUser();
    db.Meetup.count.mockResolvedValue(1);

    const res = await request(app).delete('/auth/me').set('Authorization', bearer('reader01')).send({ password: 'password1' });

    expect(res.status).toBe(409);
  });

  test('참여 중인 모임이 있으면 409', async () => {
    await withUser();
    db.Meetup.count.mockResolvedValue(0);
    db.Apply.count.mockResolvedValue(2);

    const res = await request(app).delete('/auth/me').set('Authorization', bearer('reader01')).send({ password: 'password1' });

    expect(res.status).toBe(409);
  });

  test('조건을 만족하면 soft delete 후 200', async () => {
    await withUser();
    db.Meetup.count.mockResolvedValue(0);
    db.Apply.count.mockResolvedValue(0);

    const res = await request(app).delete('/auth/me').set('Authorization', bearer('reader01')).send({ password: 'password1' });

    expect(res.status).toBe(200);
    const user = await db.User.findByPk.mock.results[0].value;
    expect(user.destroy).toHaveBeenCalled();
  });
});
