import type { Crew } from '../../member';
export interface Logbook {
  logbook_id: string;
  session_id: string;
  apply_id: string;
  content: string | null;
  submitted_at: string | null;
  is_approved: boolean;
}
export interface CrewLogbook extends Crew {
  logbook: Logbook | null;
}
export const logbookPath = (meetupId: string, sessionId: string) =>
  `/logbook/meetups/${encodeURIComponent(meetupId)}/sessions/${encodeURIComponent(sessionId)}`;
// 모임장의 '숙제 확인 완료' 승인·취소 (PATCH, body: { is_approved }). 승인된 크루에게만 Zoom 접속 정보 메일이 발송됨
export const approvalPath = (meetupId: string, sessionId: string, logbookId: string) =>
  `${logbookPath(meetupId, sessionId)}/logbooks/${encodeURIComponent(logbookId)}/approval`;
