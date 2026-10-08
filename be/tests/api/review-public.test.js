// 홈 화면 항해일지용 공개 리뷰 API: 로그인 없이 조회, 이름은 가려서 반환
jest.mock('../../src/models', () => require('./helpers/fakeDb'));

const request = require('supertest');
const db = require('./helpers/fakeDb');
const app = require('../../src/app');
const { maskName } = require('../../src/modules/review/review.public.service');

const URL = '/public/reviews';
const row = (overrides = {}) => ({
  review_id: 1, content: '좋았어요', rating: 5,
  apply: { User: { name: '김서연' }, Meetup: { title: '소설의 바다' } },
  ...overrides,
});

beforeEach(() => db.reset());

describe('maskName', () => {
  test.each([
    ['김서연', '김*연'],
    ['김가나다', '김**다'],
    ['김서', '김*'],
    ['김', '김'],
    ['  이준호 ', '이*호'],
    ['', '익명'],
    [null, '익명'],
    ['a😀b', 'a*b'],
  ])('%j → %j', (input, expected) => expect(maskName(input)).toBe(expected));
});

describe('GET /public/reviews', () => {
  test('토큰 없이 조회되고 이름은 가려지며 실명·아이디는 내려가지 않음', async () => {
    db.Review.findAll.mockResolvedValue([row()]);

    const res = await request(app).get(URL);

    expect(res.status).toBe(200);
    expect(res.body.document).toEqual([
      { review_id: '1', content: '좋았어요', rating: 5, reviewer_name: '김*연', meetup_title: '소설의 바다' },
    ]);
    expect(JSON.stringify(res.body)).not.toContain('김서연');
  });

  test('내용이 비어 있는 리뷰는 제외함', async () => {
    db.Review.findAll.mockResolvedValue([
      row({ review_id: 1, content: '   ' }),
      row({ review_id: 2, content: null }),
      row({ review_id: 3, content: '남긴 후기' }),
    ]);

    const res = await request(app).get(URL);

    expect(res.body.document.map((r) => r.review_id)).toEqual(['3']);
  });

  test('최대 10개까지만 반환함', async () => {
    db.Review.findAll.mockResolvedValue(Array.from({ length: 15 }, (_, i) => row({ review_id: i + 1 })));

    const res = await request(app).get(URL);

    expect(res.body.document).toHaveLength(10);
  });

  test('리뷰가 없으면 빈 배열', async () => {
    db.Review.findAll.mockResolvedValue([]);

    const res = await request(app).get(URL);

    expect(res.status).toBe(200);
    expect(res.body.document).toEqual([]);
  });

  test('탈퇴 등으로 작성자·모임 정보가 없어도 오류 없이 처리함', async () => {
    db.Review.findAll.mockResolvedValue([row({ apply: { User: null, Meetup: null } })]);

    const res = await request(app).get(URL);

    expect(res.status).toBe(200);
    expect(res.body.document[0]).toMatchObject({ reviewer_name: '익명', meetup_title: null });
  });
});
