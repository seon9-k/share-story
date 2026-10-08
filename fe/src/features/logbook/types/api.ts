import type { Crew, MemberMeetup } from '../../member';
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
// GET /logbook/mine: 내가 제출한 모든 로그북을 모임 단위로 묶은 응답 (여러 모임 포함)
export const myLogbooksPath = '/logbook/mine';
export interface MyLogbookEntry {
  logbook_id: string;
  session_id: string;
  session_number: number;
  topic: string;
  sch_date: string;
  content: string | null;
  submitted_at: string;
  is_approved: boolean;
}
export interface MyLogbookGroup {
  meetup: { meetup_id: string; title: string; book_title: string; status: MemberMeetup['status'] };
  logbooks: MyLogbookEntry[];
}
