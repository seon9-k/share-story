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
