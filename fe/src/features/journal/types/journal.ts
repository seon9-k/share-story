export type CrewVoyageStatus = '승선 대기' | '항해 중' | '입항 완료';

export type CaptainVoyageStatus = '모집 중' | '모집 마감' | '종료';

export type JournalView = 'crew' | 'captain';

export type CrewJournalTab = '전체' | CrewVoyageStatus;

export type CaptainJournalTab = '전체' | CaptainVoyageStatus;

export interface CrewJournalItem {
  id: number;
  title: string;
  book: string;

  appliedMembers: number;
  maxMembers: number;
  confirmedMembers: number;

  period: string;
  schedule: string;

  status: CrewVoyageStatus;

  writableLogbookSession: WritableLogbookSession | null;
}

export interface CaptainJournalItem {
  id: number;
  title: string;

  appliedMembers: number;
  maxMembers: number;
  confirmedMembers: number;

  period: string;

  status: CaptainVoyageStatus;
}

export interface WritableLogbookSession {
  sessionNumber: number;
  topic: string;
  deadline: string;
}
