export type MeetupStatus = '항해 중' | '승선 대기' | '입항 완료';

export type MeetupGenre =
  '현대소설' | '인문·철학' | '과학·기술' | '시·에세이' | '경제·경영' | '역사·문화';

export type MeetupGenreFilter = '전체' | MeetupGenre;

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
  status: MeetupStatus;
  genre: MeetupGenre;
  image: string;
}
