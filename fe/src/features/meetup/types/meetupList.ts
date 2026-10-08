// RECRUITING 승선 대기 / CLOSED 승선 마감 / IN_PROGRESS 항해 중 / COMPLETED 항해 완료
export type MeetupStatus = '승선 대기' | '승선 마감' | '항해 중' | '항해 완료';

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
