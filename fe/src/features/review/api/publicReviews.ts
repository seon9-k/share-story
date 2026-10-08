import { documentRequest } from '../../../shared/api/client';

// GET /public/reviews 응답. 로그인 없이 조회되며 reviewer_name은 서버에서 가운데를 가려 내려줌
export interface HighlightReview {
  review_id: string;
  content: string;
  rating: number | null;
  reviewer_name: string;
  meetup_title: string | null;
}

export const fetchHighlightReviews = (signal?: AbortSignal) =>
  documentRequest<HighlightReview[]>('/public/reviews', { signal });
