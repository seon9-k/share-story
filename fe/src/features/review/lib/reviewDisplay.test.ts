import { describe, expect, it } from 'vitest';
import { maskName, toDisplayReviews } from './reviewDisplay';
import { reviewMocks } from '../mocks/reviewMocks';

describe('maskName', () => {
  it.each([
    ['김서연', '김*연'],
    ['김가나다', '김**다'],
    ['김서', '김*'],
    ['김', '김'],
    ['  이준호 ', '이*호'],
    ['', '익명'],
    [null, '익명'],
    ['a😀b', 'a*b'],
  ])('%j → %j', (input, expected) => {
    expect(maskName(input)).toBe(expected);
  });
});

describe('toDisplayReviews', () => {
  it('실제 리뷰가 없으면 목업을 이름을 가려서 반환함', () => {
    for (const real of [undefined, []]) {
      const result = toDisplayReviews(real);
      expect(result).toHaveLength(reviewMocks.length);
      expect(result[0].name).toBe('김*연');
      expect(result.some((review) => review.name === reviewMocks[0].name)).toBe(false);
    }
  });

  it('실제 리뷰가 있으면 목업 없이 실제 리뷰만 반환하고 서버가 가린 이름을 그대로 사용함', () => {
    const result = toDisplayReviews([
      { review_id: '1', content: '좋았어요', rating: 5, reviewer_name: '홍*동', meetup_title: '소설의 바다' },
      { review_id: '2', content: '또 하고 싶어요', rating: null, reviewer_name: '익명', meetup_title: null },
    ]);

    expect(result).toEqual([
      { name: '홍*동', role: '크루 · 소설의 바다', text: '좋았어요' },
      { name: '익명', role: '크루', text: '또 하고 싶어요' },
    ]);
  });
});
