export type MeetupStatus = '항해 중' | '승선 대기' | '입항 완료';

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
