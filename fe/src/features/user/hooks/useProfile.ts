import type { MemberProfile } from '../../member';
import { useDocument } from '../../../shared/hooks/useResource';

// 인증 컨텍스트는 user_id만 보관하므로 이름·이메일은 BE에서 별도 조회
// 계정 전환 시 RequireAuth가 하위 화면을 다시 마운트해 새로 조회됨
export function useProfile() {
  return useDocument<MemberProfile>('/member/me');
}
