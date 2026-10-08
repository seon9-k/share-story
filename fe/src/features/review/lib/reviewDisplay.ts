import type { HighlightReview } from '../api/publicReviews';
import { reviewMocks } from '../mocks/reviewMocks';
import type { Review } from '../types/review';

/**
 * 이름·닉네임 가운데를 가림. BE(review.public.service.js)와 같은 규칙
 * - 1자: 그대로 / 2자: 김* / 3자 이상: 첫 글자 + * + 끝 글자 (김서연 → 김*연)
 */
export function maskName(name: string | null | undefined) {
  const chars = Array.from((name ?? '').trim());
  if (chars.length === 0) return '익명';
  if (chars.length === 1) return chars[0];
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

/**
 * 홈 화면에 보여줄 항해일지 목록
 * - 실제 리뷰가 하나라도 있으면 실제 리뷰만 사용 (이름은 서버에서 이미 가려진 값)
 * - 없거나 조회에 실패하면 목업 사용 (이름은 여기서 가림)
 */
export function toDisplayReviews(real: HighlightReview[] | undefined): Review[] {
  if (real && real.length > 0) {
    return real.map((item) => ({
      name: item.reviewer_name,
      role: item.meetup_title ? `크루 · ${item.meetup_title}` : '크루',
      text: item.content,
    }));
  }
  return reviewMocks.map((mock) => ({ ...mock, name: maskName(mock.name) }));
}
