// 로그인 기능 연동 전까지 사용할 단일 진실 공급원(single source of truth) 식별값 조회.
const AUTH_USER_STORAGE_KEY = 'sharestory.user';

export function getCurrentUserId(): string {
  // 1) 실제 로그인된 사용자(AuthProvider가 저장한 값)를 최우선으로 사용함.
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { user_id?: string } | null;
      const userId = parsed?.user_id?.trim();
      if (userId) return userId;
    }
  } catch {
    // 저장된 값이 JSON이 아니면 무시하고 아래 폴백으로 진행함.
  }

  const stored = localStorage.getItem('user_id')?.trim();
  if (stored) return stored;

  const devId = (import.meta.env.VITE_DEV_USER_ID || import.meta.env.VITE_DEV_LEADER_ID || '').trim();
  return devId;
}
