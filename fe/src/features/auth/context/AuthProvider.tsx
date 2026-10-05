// src/context/AuthProvider.tsx ;
/*
AuthProvider 와 AuthContext를 분리한 이유
1. Fast Refresh(핫 리로딩)가 깨지는 것을 방지
2. 순환 참조(Circular Dependency) 방지
3. 파일 확장자와 역할의 명확성 (TS vs TSX)
4. 무엇보다 계속 빨간줄 에러...
*/
import { useState, useEffect, type ReactNode, useMemo, useCallback } from 'react';
import type { AuthUser } from '../types/signup';
import { api, setToken, clearToken, setUnauthorizedHandler } from '../lib/api/api';
import { AuthContext, type AuthContextValue } from './AuthContext';

const USER_KEY = 'sharestory.user';

// 디버그용 console.log 삭제 (useAuth, AuthContext 포함)

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    // 이전 버전이 저장한 { user_id }만 있는 값도 user_id로 동작하므로 그대로 사용
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readUser());

  // RequireAuth의 useEffect 의존성으로 쓰이므로 참조 고정
  // 기존엔 렌더마다 새 함수라 핸들러 재등록이 반복됐음
  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // 토큰 만료(401/403) 시 자동으로 로그아웃 처리 (JWT 만료 하루)
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // user 상태가 변경될 때마다 localStorage에 동기화
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (user_id, password) => {
        const data = await api.login({ user_id: user_id.trim(), password });

        // 토큰 없는 응답은 실패로 처리 (기존엔 토큰 없이도 로그인 상태가 됐음)
        if (!data.token) throw new Error('로그인 응답이 올바르지 않습니다.');
        setToken(data.token);

        // 기존엔 { user_id }만 저장 → BE가 준 회원 정보(이름 등) 저장
        // 토큰·사용자 로그는 남기지 않음
        setUser(data.document);
      },
      logout,
    }),
    [user, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
