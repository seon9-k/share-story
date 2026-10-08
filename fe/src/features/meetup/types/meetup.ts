// RECRUITING 승선 대기 / CLOSED 승선 마감 / IN_PROGRESS 항해 중 / COMPLETED 항해 완료
export type MeetupStatus = '승선 대기' | '승선 마감' | '항해 중' | '항해 완료';

export interface Meetup {
  id: number;
  title: string;
  captain: string;
  book: string;
  members: number | null;
  maxMembers: number;
  status: MeetupStatus;
  nextMeeting: string;
  dateRange: string;
  location: string;
  image: string;
}
