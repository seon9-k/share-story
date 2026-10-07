import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, API } from '../../test/server';
import {
  ApiError,
  allPages,
  clearToken,
  documentRequest,
  getToken,
  request,
  setToken,
  setUnauthorizedHandler,
} from './client';

describe('공통 API 클라이언트 (NFR-SEC-001)', () => {
  it('토큰이 있으면 Authorization: Bearer 헤더를 붙임', async () => {
    setToken('abc');
    let header: string | null = null;
    server.use(
      http.get(`${API}/member/me`, ({ request }) => {
        header = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, document: {} });
      }),
    );

    await request('/member/me');

    expect(header).toBe('Bearer abc');
  });

  it('토큰이 없으면 Authorization 헤더를 보내지 않음', async () => {
    let header: string | null = 'unset';
    server.use(
      http.get(`${API}/meetup`, ({ request }) => {
        header = request.headers.get('Authorization');
        return HttpResponse.json({ success: true });
      }),
    );

    await request('/meetup');

    expect(header).toBeNull();
  });

  it('JSON body는 Content-Type을 지정하고 FormData는 브라우저에 맡김', async () => {
    const types: Array<string | null> = [];
    server.use(
      http.post(`${API}/x`, ({ request }) => {
        types.push(request.headers.get('Content-Type'));
        return HttpResponse.json({ success: true });
      }),
    );

    await request('/x', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    await request('/x', { method: 'POST', body: new FormData() });

    expect(types[0]).toBe('application/json');
    expect(types[1]).toMatch(/^multipart\/form-data; boundary=/);
  });

  it('401이면 토큰을 지우고 만료 핸들러를 호출한 뒤 ApiError를 던짐', async () => {
    setToken('expired');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    server.use(
      http.get(`${API}/member/me`, () =>
        HttpResponse.json({ success: false, message: '로그인이 만료되었습니다.' }, { status: 401 }),
      ),
    );

    await expect(request('/member/me')).rejects.toMatchObject({
      status: 401,
      message: '로그인이 만료되었습니다.',
    });
    expect(getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    setUnauthorizedHandler(null);
  });

  it('403은 모임 권한 부족이므로 로그아웃하지 않음', async () => {
    setToken('valid');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    server.use(
      http.get(`${API}/member/meetups/1/crews`, () =>
        HttpResponse.json({ success: false, message: '캡틴만 이용할 수 있습니다.' }, { status: 403 }),
      ),
    );

    await expect(request('/member/meetups/1/crews')).rejects.toMatchObject({ status: 403 });
    expect(getToken()).toBe('valid');
    expect(onUnauthorized).not.toHaveBeenCalled();
    setUnauthorizedHandler(null);
  });

  it('200이어도 success:false면 오류로 처리함', async () => {
    server.use(http.get(`${API}/x`, () => HttpResponse.json({ success: false, message: '실패' })));
    await expect(request('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('서버 메시지가 없으면 상태 코드로 기본 메시지를 만듦', async () => {
    server.use(http.get(`${API}/x`, () => new HttpResponse(null, { status: 500 })));
    await expect(request('/x')).rejects.toMatchObject({ message: '요청에 실패했습니다 (500).', status: 500 });
  });

  it('documentRequest는 document만 꺼내 반환함', async () => {
    server.use(http.get(`${API}/x`, () => HttpResponse.json({ success: true, document: { id: 1 } })));
    await expect(documentRequest('/x')).resolves.toEqual({ id: 1 });
  });

  it('clearToken 이후에는 토큰이 없음', () => {
    setToken('a');
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe('allPages (NFR-PER-001 페이징 조회)', () => {
  const page = (items: number[], nextPage: number | null) =>
    HttpResponse.json({ success: true, document: { items, page: 1, limit: 100, total: 3, nextPage } });

  it('nextPage가 끝날 때까지 모든 페이지를 이어 붙임', async () => {
    const requested: string[] = [];
    server.use(
      http.get(`${API}/list`, ({ request }) => {
        const p = new URL(request.url).searchParams.get('page');
        requested.push(p!);
        return p === '1' ? page([1, 2], 2) : page([3], null);
      }),
    );

    await expect(allPages<number>('/list')).resolves.toEqual([1, 2, 3]);
    expect(requested).toEqual(['1', '2']);
  });

  it('이미 쓴 path에 쿼리가 있으면 & 로 이어 붙임', async () => {
    let url = '';
    server.use(
      http.get(`${API}/list`, ({ request }) => {
        url = request.url;
        return page([], null);
      }),
    );

    await allPages('/list?role=crew');

    expect(url).toContain('role=crew&page=1&limit=100');
  });

  it('서버가 같은 nextPage를 반복해도 무한 요청하지 않고 실패함', async () => {
    server.use(http.get(`${API}/list`, () => page([1], 1)));
    await expect(allPages('/list')).rejects.toThrow('목록을 불러오지 못했습니다');
  });
});

// 기존 tests/member-api.test.cjs(node:test)에서 이관한 케이스
describe('이관된 회원 API 케이스', () => {
  it('BIGINT 범위의 id를 손실 없이 경로에 담고 JSON 본문을 보존함', async () => {
    setToken('test-token');
    let seen: { url: string; auth: string | null; body: unknown } | undefined;
    server.use(
      http.put(`${API}/logbook/meetups/1/sessions/9007199254740993/me`, async ({ request }) => {
        seen = { url: new URL(request.url).pathname, auth: request.headers.get('Authorization'), body: await request.json() };
        return HttpResponse.json({ success: true, document: { content: '독서 기록' } });
      }),
    );

    const data = await documentRequest<{ content: string }>('/logbook/meetups/1/sessions/9007199254740993/me', {
      method: 'PUT',
      body: JSON.stringify({ content: '독서 기록' }),
    });

    expect(data.content).toBe('독서 기록');
    expect(seen).toEqual({
      url: '/logbook/meetups/1/sessions/9007199254740993/me',
      auth: 'Bearer test-token',
      body: { content: '독서 기록' },
    });
  });

  it('allPages는 첫 페이지 밖의 항목을 숨기지 않고 순서대로 이어 붙임', async () => {
    const pages: string[] = [];
    server.use(
      http.get(`${API}/logbook/meetups/1/sessions/2`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page')!;
        pages.push(page);
        return HttpResponse.json({
          success: true,
          document: page === '1' ? { items: ['submitted'], nextPage: 2 } : { items: ['unsubmitted'], nextPage: null },
        });
      }),
    );

    await expect(allPages('/logbook/meetups/1/sessions/2')).resolves.toEqual(['submitted', 'unsubmitted']);
    expect(pages).toEqual(['1', '2']);
  });

  it('중복 후기(409) 오류를 성공으로 처리하지 않음', async () => {
    server.use(
      http.post(`${API}/review/meetups/1`, () =>
        HttpResponse.json({ success: false, message: '이미 리뷰를 작성한 모임입니다.' }, { status: 409 }),
      ),
    );

    await expect(documentRequest('/review/meetups/1', { method: 'POST', body: '{}' })).rejects.toThrow('이미 리뷰');
  });

  it('요청 취소(AbortSignal)가 전파됨', async () => {
    const controller = new AbortController();
    server.use(
      http.get(`${API}/member/meetups/crew`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({ success: true, document: { items: [], nextPage: null } });
      }),
    );

    const pending = allPages('/member/meetups/crew', controller.signal);
    controller.abort();

    await expect(pending).rejects.toThrow();
  });
});
