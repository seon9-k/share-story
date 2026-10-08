import type { MemberSession } from '../../member';

// 오늘 날짜(YYYY-MM-DD)를 KST 기준으로 구함. 브라우저 시간대와 무관하게 BE 배치·메일과 같은 기준을 씀
export const kstToday = (now = new Date()) => now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

/**
 * 로그북 작성 화면에 보여줄 '해당 회차' = 오늘(KST) 이후 첫 번째 취소되지 않은 회차
 * - 로그북은 모임 전에 쓰는 독후감이라 다음 예정 회차를 대상으로 함 (회차 당일까지 유지)
 * - 지난 회차는 대상이 아니며 '제출한 로그북'에서만 확인함. 모든 회차가 지났으면 undefined
 */
export function findTargetSession(sessions: MemberSession[], now = new Date()) {
  const today = kstToday(now);
  return sessions
    .filter((session) => session.status !== 'CANCELLED' && session.sch_date.slice(0, 10) >= today)
    .sort((a, b) => a.session_number - b.session_number)[0];
}
