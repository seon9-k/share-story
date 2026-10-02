// 로그인 기능 연동 전까지 사용할 단일 진실 공급원(single source of truth) 식별값 조회.
export function getCurrentUserId(): string {
  const stored = localStorage.getItem('user_id')?.trim();
  if (stored) return stored;

  const devId = (import.meta.env.VITE_DEV_USER_ID || import.meta.env.VITE_DEV_LEADER_ID || '').trim();
  return devId;
}
