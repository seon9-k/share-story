// 기존 로그인 모듈이 저장한 토큰을 읽어 모임·로그북 API 요청에 사용
// 인증 모듈(features/auth/lib/api/api.ts)도 이 함수들을 사용해 키를 한 곳에서 관리
const TOKEN_KEY = 'sharestory.token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
let unauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorized = handler;
};
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
// 주소를 생략하면 같은 출처로 요청하여 개발 시 Vite 프록시 사용
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // FormData의 multipart boundary는 브라우저가 설정하도록 둠
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) {
    // BE는 모임 접근 권한이 없는 경우에도 403을 반환하므로 일괄 로그아웃하지 않음
    if (response.status === 401) {
      clearToken();
      unauthorized?.();
    }
    throw new ApiError(
      body?.message || `요청에 실패했습니다 (${response.status}).`,
      response.status,
    );
  }
  if (body === null) throw new ApiError('서버 응답을 읽을 수 없습니다.', response.status);
  return body as T;
}
// 로그인 등 응답 형태가 다른 API는 request를, document로 감싼 API는 이 함수 사용
export async function documentRequest<T>(path: string, options?: RequestInit): Promise<T> {
  return (await request<{ document: T }>(path, options)).document;
}
export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  nextPage: number | null;
}
// 화면의 전체 크루 목록과 제출 인원 집계를 위해 nextPage가 끝날 때까지 조회
export async function allPages<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  let page: number | null = 1;
  const visited = new Set<number>();
  while (page !== null) {
    // 잘못된 nextPage 응답이 반복되어 요청이 무한히 이어지는 것을 방지
    if (visited.has(page)) throw new Error('목록을 불러오지 못했습니다. 다시 시도해 주세요.');
    visited.add(page);
    const data: Page<T> = await documentRequest(
      `${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=100`,
      { signal },
    );
    items.push(...data.items);
    page = data.nextPage;
  }
  return items;
}
