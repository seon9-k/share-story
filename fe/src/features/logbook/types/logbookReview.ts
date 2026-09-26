export type LogbookReviewStatus = '검토 대기' | '승인 완료' | '미제출';

export interface CrewLogbookReport {
  id: number;
  crewId: number;
  sessionNumber: number;
  label: string;
  chars: number;
  submittedAt: string | null;
  status: LogbookReviewStatus;
  content: string;
}

export interface LogbookSession {
  number: number;
  date: string;
  topic: string;
}

export interface LogbookReviewSummary {
  confirmedCount: number;
  submittedCount: number;
  approvedCount: number;
}
