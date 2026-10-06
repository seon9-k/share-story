export interface ReviewItem {
  review_id: string;
  apply_id: string;
  content: string;
  rating: number;
  reviewed_at: string;
  apply: { user_id: string; User: { name: string } | null };
}
export const reviewPath = (meetupId: string) => `/review/meetups/${encodeURIComponent(meetupId)}`;
export const ownReviewPath = (meetupId: string) => `${reviewPath(meetupId)}/me`;
