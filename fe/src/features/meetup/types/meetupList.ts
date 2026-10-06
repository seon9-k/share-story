export type MeetupStatus = '항해 중' | '승선 대기' | '입항 완료';

export interface MeetupListItem {
  id: number;
  title: string;
  book: string;
  captain: string;
  minMembers: number;
  maxMembers: number;
  schedule: string;
  time: string;
  firstDate: string;
  lastDate: string;
  status: MeetupStatus;
  image: string;
}
