import { useDocument } from '../../../shared/hooks/useResource';
import type { MemberMeetup } from '../api/memberApi';

// meetup 모듈의 getMeetupDetailApi는 요청 취소와 Vite 프록시를 지원하지 않아
// 토큰·취소를 처리하는 공통 클라이언트로 같은 /meetup/:id API 조회
export const meetupDetailPath = (meetupId: string) => `/meetup/${encodeURIComponent(meetupId)}`;

export function useMeetupDetail(meetupId: string) {
  return useDocument<{ meetup: MemberMeetup }>(meetupDetailPath(meetupId));
}
