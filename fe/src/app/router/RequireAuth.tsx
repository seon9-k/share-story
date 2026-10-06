import { useEffect } from 'react';
import { getToken, setUnauthorizedHandler } from '../../shared/api/client';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';
export default function RequireAuth() {
  const { user, logout } = useAuth();
  // 개인 페이지에서 발생한 인증 실패는 기존 인증 모듈의 logout으로 처리
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);
  const location = useLocation();
  // 계정이 바뀌면 하위 화면을 다시 마운트하여 이전 계정의 조회 결과와 입력 상태를 비움
  // 로그인 전 접근한 경로와 쿼리는 from에 보관해 로그인 후 복귀
  return user && getToken() ? (
    <Outlet key={user.user_id} />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  );
}
