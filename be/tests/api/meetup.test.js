// REQ-GRP-001~004 모임 등록·목록·상세·수정, REQ-PAY-001(신청) 중 신청 상태 처리, REQ-PAY-002 정원 마감
jest.mock('../../src/models', () => require('./helpers/fakeDb'));
jest.mock('../../src/common/services/blob.service');

const request = require('supertest');
const { Op } = require('sequelize');
const db = require('./helpers/fakeDb');
const app = require('../../src/app');
const { bearer } = require('./helpers/token');
const blob = require('../../src/common/services/blob.service');

const future = (days) => new Date(Date.now() + days * 86400000).toISOString();

const session = (n) => ({
  session_number: n,
  topic: `${n}회차 주제`,
  sch_date: `2099-0${n}-10`,
  sch_day: '토',
  sch_time: '20:00',
  sch_st_time: '20:00',
  sch_ed_time: '22:00',
});

const validMeetup = () => ({
  title: '함께 읽는 소설',
  description: '4주 동안 소설을 읽습니다.',
  book_title: '채식주의자',
  price: 40000,
  min_capacity: 4,
  max_capacity: 8,
  deadline: future(7),
  sessions: [1, 2, 3, 4].map(session),
});

beforeEach(() => db.reset());

describe('POST /meetup 모임 등록 (REQ-GRP-001)', () => {
  test('토큰이 없으면 401', async () => {
    const res = await request(app).post('/meetup').send(validMeetup());
    expect(res.status).toBe(401);
  });

  test('유효한 입력이면 모임과 4개 회차를 생성하고 201', async () => {
    db.User.findByPk.mockResolvedValue({ user_id: 'leader01' });
    db.Meetup.create.mockImplementation(async (v) => ({ ...v, meetup_id: 1 }));
    db.Session.bulkCreate.mockImplementation(async (rows) => rows.map((r, i) => ({ ...r, session_id: i + 1 })));

    const res = await request(app).post('/meetup').set('Authorization', bearer('leader01')).send(validMeetup());

    expect(res.status).toBe(201);
    expect(res.body.document.meetup).toMatchObject({ leader_id: 'leader01', status: 'RECRUITING' });
    expect(res.body.document.sessions).toHaveLength(4);
    expect(db.Meetup.create.mock.calls[0][0].leader_id).toBe('leader01');
  });

  test.each([
    ['최소 인원 4명 미만', { min_capacity: 3 }],
    ['최대 인원 8명 초과', { max_capacity: 9 }],
    ['최소 인원이 최대 인원보다 큼', { min_capacity: 8, max_capacity: 5 }],
    ['제목 없음', { title: '' }],
    ['도서명 없음', { book_title: ' ' }],
    ['모집 마감일이 과거', { deadline: '2000-01-01T00:00:00Z' }],
    ['회차가 3개', { sessions: [1, 2, 3].map(session) }],
    ['회차가 5개', { sessions: [1, 2, 3, 4, 5].map(session) }],
    ['회차 번호 중복', { sessions: [1, 1, 3, 4].map(session) }],
    ['가격이 음수', { price: -1 }],
  ])('%s이면 400', async (_label, override) => {
    const res = await request(app)
      .post('/meetup')
      .set('Authorization', bearer('leader01'))
      .send({ ...validMeetup(), ...override });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(db.Meetup.create).not.toHaveBeenCalled();
  });

  test('모임장 계정이 DB에 없으면 404', async () => {
    db.User.findByPk.mockResolvedValue(null);
    const res = await request(app).post('/meetup').set('Authorization', bearer('ghost01')).send(validMeetup());
    expect(res.status).toBe(404);
  });
});

describe('POST /meetup/book-image 도서 이미지 업로드', () => {
  test('비로그인 요청은 Blob 업로드 전에 401로 차단됨', async () => {
    const res = await request(app).post('/meetup/book-image').attach('image', Buffer.from('x'), 'a.png');
    expect(res.status).toBe(401);
    expect(blob.uploadStream).not.toHaveBeenCalled();
  });

  test('이미지를 올리면 Blob 공개 URL을 반환함 (201)', async () => {
    const url = 'https://stasharestory.blob.core.windows.net/images/0b9c.png';
    // 스트림을 끝까지 소비해야 multer가 요청 처리를 마침
    blob.uploadStream.mockImplementation(async (stream) => {
      stream.resume();
      await new Promise((resolve) => stream.on('end', resolve));
      return { blobName: '0b9c.png', url };
    });

    const res = await request(app)
      .post('/meetup/book-image')
      .set('Authorization', bearer('leader01'))
      .attach('image', Buffer.from('fake-png'), { filename: '표지 이미지.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.document).toEqual({ filename: '0b9c.png', url });
    expect(blob.uploadStream).toHaveBeenCalledWith(expect.anything(), '표지 이미지.png', 'image/png');
  });

  test.each([
    ['텍스트 파일', 'a.txt', 'text/plain'],
    ['PDF', 'a.pdf', 'application/pdf'],
    ['SVG(스크립트 삽입 가능)', 'a.svg', 'image/svg+xml'],
  ])('이미지가 아닌 %s는 Blob에 올리지 않고 400', async (_label, filename, contentType) => {
    const res = await request(app)
      .post('/meetup/book-image')
      .set('Authorization', bearer('leader01'))
      .attach('image', Buffer.from('not-an-image'), { filename, contentType });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, message: expect.stringContaining('이미지 파일') });
    expect(blob.uploadStream).not.toHaveBeenCalled();
  });

  test('10MB를 넘으면 413', async () => {
    const res = await request(app)
      .post('/meetup/book-image')
      .set('Authorization', bearer('leader01'))
      .attach('image', Buffer.alloc(10 * 1024 * 1024 + 1), { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
    expect(res.body.message).toContain('10MB');
  });

  test('파일 없이 요청하면 400', async () => {
    const res = await request(app).post('/meetup/book-image').set('Authorization', bearer('leader01'));
    expect(res.status).toBe(400);
  });

  test('Blob 업로드가 실패하면 500이며 내부 오류는 노출하지 않음', async () => {
    blob.uploadStream.mockImplementation(async (stream) => {
      stream.resume();
      await new Promise((resolve) => stream.on('end', resolve));
      throw new Error('AccountKey=secret');
    });

    const res = await request(app)
      .post('/meetup/book-image')
      .set('Authorization', bearer('leader01'))
      .attach('image', Buffer.from('x'), { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});

describe('GET /meetup 모임 목록 (REQ-GRP-002)', () => {
  test('카드 표시에 필요한 도서 이미지·도서명·모임장과 페이지 정보를 반환함 (비로그인 허용)', async () => {
    db.Meetup.findAndCountAll.mockResolvedValue({
      count: 25,
      rows: [
        {
          meetup_id: 1,
          title: '소설 모임',
          book_title: '채식주의자',
          book_image_url: 'https://stasharestory.blob.core.windows.net/images/a.png',
          min_capacity: 4,
          max_capacity: 8,
          status: 'RECRUITING',
          User: { name: '모임장' },
          Sessions: [
            { session_number: 2, sch_date: '2099-02-10', sch_day: '토', sch_time: '20:00' },
            { session_number: 1, sch_date: '2099-01-10', sch_day: '토', sch_time: '20:00' },
          ],
        },
      ],
    });

    const res = await request(app).get('/meetup?page=1&limit=10');

    expect(res.status).toBe(200);
    const { items, total, nextPage } = res.body.document;
    expect(total).toBe(25);
    expect(nextPage).toBe(2);
    expect(items[0]).toMatchObject({
      book_title: '채식주의자',
      book_image_url: expect.stringContaining('blob.core.windows.net'),
      leader_name: '모임장',
      sch_st_date: '2099-01-10', // 회차 번호 순으로 시작·종료일 계산
      sch_ed_date: '2099-02-10',
    });
  });

  test('마지막 페이지면 nextPage는 null', async () => {
    db.Meetup.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
    const res = await request(app).get('/meetup?page=1&limit=10');
    expect(res.body.document.nextPage).toBeNull();
  });

  test('limit은 최대 100으로 제한됨 (NFR-PER-001)', async () => {
    db.Meetup.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await request(app).get('/meetup?limit=5000');
    expect(db.Meetup.findAndCountAll.mock.calls[0][0].limit).toBe(100);
  });

  test('keyword와 status가 조회 조건으로 전달됨', async () => {
    db.Meetup.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await request(app).get('/meetup?keyword=소설&status=RECRUITING');
    const { where } = db.Meetup.findAndCountAll.mock.calls[0][0];
    expect(where.status).toBe('RECRUITING');
    expect(where.title[Op.iLike]).toBe('%소설%');
  });
});

describe('GET /meetup/:id 모임 상세 (REQ-GRP-003)', () => {
  test('신청자 통계를 항목별로 집계해 반환함', async () => {
    db.Meetup.findByPk.mockResolvedValue({
      meetup_id: 1,
      leader_id: 'leader01',
      title: '소설 모임',
      price: 40000,
      min_capacity: 4,
      max_capacity: 8,
      status: 'RECRUITING',
      User: { name: '모임장' },
    });
    db.Session.findAll.mockResolvedValue([{ session_id: 1, session_number: 1 }]);
    db.Apply.findAll.mockResolvedValue([
      { User: { genre_1: 'NOVEL', genre_2: null, monthly_reading_volume: 'BOOKS_1_2', age_group: '20대', gender: 'F' } },
      { User: { genre_1: 'NOVEL', genre_2: 'ESSAY', monthly_reading_volume: 'BOOKS_3_4', age_group: '20대', gender: 'M' } },
    ]);

    const res = await request(app).get('/meetup/1');

    expect(res.status).toBe(200);
    expect(res.body.document.apply_count).toBe(2);
    expect(res.body.document.apply_user_stats).toEqual({
      genre_1: { NOVEL: 2 },
      genre_2: { ESSAY: 1 },
      monthly_reading_volume: { BOOKS_1_2: 1, BOOKS_3_4: 1 },
      age_group: { '20대': 2 },
      gender: { F: 1, M: 1 },
    });
    expect(res.body.document.meetup.leader_name).toBe('모임장');
  });

  test('없는 모임이면 404', async () => {
    db.Meetup.findByPk.mockResolvedValue(null);
    const res = await request(app).get('/meetup/999');
    expect(res.status).toBe(404);
  });

  test('id가 숫자가 아니면 400', async () => {
    const res = await request(app).get('/meetup/abc');
    expect(res.status).toBe(400);
  });
});

describe('PATCH /meetup/:id 모임 수정 (REQ-GRP-004)', () => {
  test('토큰이 없으면 401', async () => {
    const res = await request(app).patch('/meetup/1').send({ title: '수정' });
    expect(res.status).toBe(401);
  });

  test('모임장이 아니면 403', async () => {
    db.Meetup.findByPk.mockResolvedValue({ meetup_id: 1, leader_id: 'leader01' });
    const res = await request(app).patch('/meetup/1').set('Authorization', bearer('other01')).send({ title: '수정' });
    expect(res.status).toBe(403);
  });

  test('없는 모임이면 404', async () => {
    db.Meetup.findByPk.mockResolvedValue(null);
    const res = await request(app).patch('/meetup/1').set('Authorization', bearer('leader01')).send({ title: '수정' });
    expect(res.status).toBe(404);
  });

  test('title을 빈 문자열로 바꾸려 하면 400', async () => {
    const res = await request(app).patch('/meetup/1').set('Authorization', bearer('leader01')).send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('URL과 body의 meetup_id가 다르면 400', async () => {
    const res = await request(app).patch('/meetup/1').set('Authorization', bearer('leader01')).send({ meetup_id: 2, title: '수정' });
    expect(res.status).toBe(400);
  });
});

describe('POST /meetup/:id/apply 모임 신청 (REQ-PAY-001, REQ-PAY-002)', () => {
  const recruiting = (over = {}) => ({
    meetup_id: '1',
    leader_id: 'leader01',
    status: 'RECRUITING',
    deadline: future(3),
    max_capacity: 8,
    update: jest.fn(),
    ...over,
  });

  test('토큰이 없으면 401 (비로그인 신청 불가)', async () => {
    const res = await request(app).post('/meetup/1/apply');
    expect(res.status).toBe(401);
  });

  test('신청에 성공하면 201', async () => {
    const meetup = recruiting();
    db.Meetup.findByPk.mockResolvedValue(meetup);
    db.Apply.findOne.mockResolvedValue(null);
    db.Apply.count.mockResolvedValue(2);
    db.Apply.create.mockImplementation(async (v) => ({ apply_id: 10, ...v }));

    const res = await request(app).post('/meetup/1/apply').set('Authorization', bearer('crew01'));

    expect(res.status).toBe(201);
    expect(db.Apply.create.mock.calls[0][0]).toMatchObject({ meetup_id: '1', user_id: 'crew01', status: 'ING' });
    expect(meetup.update).not.toHaveBeenCalled(); // 정원 미달이면 계속 모집
  });

  test('마지막 자리를 채우면 같은 트랜잭션에서 모집 마감(CLOSED) 처리 (REQ-PAY-002)', async () => {
    const meetup = recruiting({ max_capacity: 8 });
    db.Meetup.findByPk.mockResolvedValue(meetup);
    db.Apply.findOne.mockResolvedValue(null);
    db.Apply.count.mockResolvedValue(7);
    db.Apply.create.mockImplementation(async (v) => ({ apply_id: 10, ...v }));

    const res = await request(app).post('/meetup/1/apply').set('Authorization', bearer('crew08'));

    expect(res.status).toBe(201);
    expect(meetup.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CLOSED' }), expect.anything());
  });

  test('정원이 이미 찼으면 409', async () => {
    db.Meetup.findByPk.mockResolvedValue(recruiting({ max_capacity: 4 }));
    db.Apply.findOne.mockResolvedValue(null);
    db.Apply.count.mockResolvedValue(4);

    const res = await request(app).post('/meetup/1/apply').set('Authorization', bearer('crew05'));

    expect(res.status).toBe(409);
    expect(db.Apply.create).not.toHaveBeenCalled();
  });

  test('이미 신청한 모임이면 409', async () => {
    db.Meetup.findByPk.mockResolvedValue(recruiting());
    db.Apply.findOne.mockResolvedValue({ apply_id: 1 });

    const res = await request(app).post('/meetup/1/apply').set('Authorization', bearer('crew01'));

    expect(res.status).toBe(409);
  });

  test('모집 마감일이 지났으면 409', async () => {
    db.Meetup.findByPk.mockResolvedValue(recruiting({ deadline: '2000-01-01T00:00:00Z' }));
    const res = await request(app).post('/meetup/1/apply').set('Authorization', bearer('crew01'));
    expect(res.status).toBe(409);
  });

  test('모집 중이 아닌 모임이면 409', async () => {
    db.Meetup.findByPk.mockResolvedValue(recruiting({ status: 'CLOSED' }));
    const res = await request(app).post('/meetup/1/apply').set('Authorization', bearer('crew01'));
    expect(res.status).toBe(409);
  });

  test('모임장은 자신의 모임에 신청할 수 없음 (400)', async () => {
    db.Meetup.findByPk.mockResolvedValue(recruiting());
    const res = await request(app).post('/meetup/1/apply').set('Authorization', bearer('leader01'));
    expect(res.status).toBe(400);
  });

  test('없는 모임이면 404', async () => {
    db.Meetup.findByPk.mockResolvedValue(null);
    const res = await request(app).post('/meetup/1/apply').set('Authorization', bearer('crew01'));
    expect(res.status).toBe(404);
  });
});
