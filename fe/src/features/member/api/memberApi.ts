export type MemberRole = 'captain' | 'crew';
// BE의 BIGINT 식별자는 문자열로 유지. Number 변환 시 큰 ID의 정밀도가 손실될 수 있음
export interface MemberMeetup {
  meetup_id: string;
  leader_id: string;
  title: string;
  description: string;
  book_title: string;
  book_image_url: string | null;
  status: 'RECRUITING' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED';
}
export interface MemberSession {
  session_id: string;
  meetup_id: string;
  session_number: number;
  topic: string;
  sch_date: string;
  sch_day: string;
  sch_time: string;
  sch_st_time: string;
  sch_ed_time: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
export interface Crew {
  apply_id: string;
  user_id: string;
  name: string | null;
  status: 'ING' | 'COMPLETED';
}
// GET /member/me 응답. BE가 비밀번호 등 민감 정보를 제외하고 반환
export interface MemberProfile {
  user_id: string;
  name: string | null;
  email: string | null;
}
export const meetupStatus = {
  RECRUITING: '모집 중',
  CLOSED: '모집 마감',
  IN_PROGRESS: '항해 중',
  COMPLETED: '항해 완료',
};
export const sessionStatus = {
  SCHEDULED: '예정',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};
export const memberPath = (id: string) => `/member/meetups/${encodeURIComponent(id)}`;
