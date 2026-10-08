export interface Review {
  name: string;
  role: string;
  text: string;
  // 실제 리뷰에는 프로필 사진이 없어 이니셜로 대체함
  avatar?: string;
}
