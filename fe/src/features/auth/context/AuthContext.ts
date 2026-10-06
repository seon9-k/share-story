// src/context/AuthContext.ts
import { createContext } from 'react';
import type { AuthUser } from '../types/signup';

// login 매개변수 이름을 user_id로 통일
export interface AuthContextValue {
  // 기존 SignupForm(비밀번호 필드 포함) 재사용 → 로그인 응답 회원 정보 타입으로 분리
  user: AuthUser | null;
  login: (user_id: string, password: string) => Promise<void>;
  logout: () => void;
  // 회원탈퇴 요청. 로그아웃은 호출한 화면이 이동 후 처리
  withdraw: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
