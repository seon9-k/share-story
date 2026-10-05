import type { AuthUser, Gender, PreferredGenre, ReadingAmount } from '../../types/signup';
import { getToken, setToken, clearToken } from '../../../../shared/api/client';

// 토큰 키를 shared/api/client.ts와 따로 선언하던 것 → 한 곳에서 가져와 재노출
export { getToken, setToken, clearToken };

// 배포 시 BE 절대 주소, 비우면 Vite 프록시 사용
// 기존엔 fetch(path)만 써서 VITE_API_BASE_URL이 인증 API에만 적용되지 않았음
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// 미사용 delay 헬퍼 삭제

// --- 커스텀 API 에러 클래스 ---
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// --- 인증 실패(401/403) 콜백 핸들러 ---
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (fn: UnauthorizedHandler): void => {
  onUnauthorized = fn;
};

// --- Request 옵션 인터페이스 ---
interface RequestOptions {
  method?: string;
  body?: Record<string, unknown> | FormData;
  auth?: boolean;
}

// --- 안전한 에러 메세지 추출을 위한 타입 가드 함수 ---
interface ErrorResponse {
  message: string;
}

function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as Record<string, unknown>).message === 'string'
  );
}

// --- 공통 Fetch 래퍼 함수 ---
async function request<T = unknown>(
  path: string,
  { method = 'GET', body, auth = false }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const isFormData = body instanceof FormData;
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let data: unknown = null;
  let res: Response;

  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // 서버 다운·네트워크 끊김. 기존엔 브라우저 영문 메시지(Failed to fetch)가 그대로 노출됐음
    throw new ApiError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.', 0);
  }
  // 기존 console.log(JSON.stringify(res)) 삭제 (Response는 직렬화되지 않아 항상 {} 출력)

  try {
    data = await res.json();
  } catch {
    // 응답 바디 없음
  }

  if (!res.ok) {
    if (auth && (res.status === 401 || res.status === 403)) {
      onUnauthorized?.();
    }
    const errorMessage = isErrorResponse(data) ? data.message : `요청 실패 (${res.status})`;
    throw new ApiError(errorMessage, res.status);
  }

  return data as T;
}

// --- API 인터페이스 타입 정의 ---
// 값은 BE가 기대하는 코드값 (types/signup.ts 참고)
export interface SignUpParams extends Record<string, unknown> {
  user_id: string;
  name: string;
  password: string;
  email: string;
  gender: Gender;
  age_group: string;
  // 기존엔 join(',') 문자열이라 BE genres[0]이 첫 글자('N')가 됐음 → 배열 그대로 전송
  genres: PreferredGenre[];
  readingAmount: ReadingAmount;
}

export interface LoginParams extends Record<string, unknown> {
  user_id: string;
  password: string;
}

// 보낸 필드만 수정. 비밀번호 변경 시 current_password 필수
export interface UpdateMyInfoParams extends Record<string, unknown> {
  email?: string;
  name?: string;
  gender?: Gender;
  age_group?: string;
  readingAmount?: ReadingAmount;
  genres?: PreferredGenre[];
  new_password?: string;
  current_password?: string;
}

// 응답 타입. 기존엔 AuthResponse가 이 파일에 두 번, SignupView에 한 번 중복 선언됐음
export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface CheckUserIdResponse extends MessageResponse {
  count: number;
}

export interface LoginResponse extends MessageResponse {
  token: string;
  document: AuthUser;
}

export interface UserResponse extends MessageResponse {
  document: AuthUser;
}

// --- 백엔드 API 연동 객체 ---
export const api = {
  signUp: (params: SignUpParams) =>
    request<MessageResponse>('/auth/signup', { method: 'POST', body: params }),

  // 아이디 중복확인 (기존 getMyInfo → BE 경로 /auth/check-id로 변경)
  checkUserId: (user_id: string) =>
    request<CheckUserIdResponse>('/auth/check-id', { method: 'POST', body: { user_id } }),

  login: (params: LoginParams) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: params }),

  // 본인 정보 수정. BE가 토큰으로 본인 확인하므로 auth: true 필수
  updateMyInfo: (params: UpdateMyInfoParams) =>
    request<UserResponse>('/auth/updateMyInfo', { method: 'PATCH', body: params, auth: true }),
};
