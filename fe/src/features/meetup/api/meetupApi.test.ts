import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, API } from '../../../test/server';
import { ApiError, getToken, setToken, setUnauthorizedHandler } from '../../../shared/api/client';
import {
  applyMeetup,
  createMeetup,
  getMeetupDetail,
  getMeetups,
  updateMeetup,
  uploadBookImage,
} from './meetupApi';

const BLOB_URL = 'https://stasharestory.blob.core.windows.net/images/0b9c.png';

describe('uploadBookImage (Blob Storage 업로드)', () => {
  const png = () => new File([new Uint8Array([1, 2, 3])], 'cover.png', { type: 'image/png' });

  it('Blob 절대 URL 응답은 그대로 사용함 (API 주소를 앞에 붙이지 않음)', async () => {
    server.use(
      http.post(`${API}/meetup/book-image`, () =>
        HttpResponse.json({ success: true, document: { filename: '0b9c.png', url: BLOB_URL } }, { status: 201 }),
      ),
    );

    await expect(uploadBookImage(png())).resolves.toEqual({ filename: '0b9c.png', url: BLOB_URL });
  });

  it('이전 상대 경로 응답은 API 주소를 붙여 절대 URL로 만듦', async () => {
    server.use(
      http.post(`${API}/meetup/book-image`, () =>
        HttpResponse.json({ success: true, document: { filename: 'a.png', url: '/files/a.png' } }),
      ),
    );

    const result = await uploadBookImage(png());

    expect(result.url).toBe(`${API}/files/a.png`);
  });

  it('image 필드명의 multipart와 Bearer 토큰으로 전송함', async () => {
    setToken('tkn');
    let auth: string | null = null;
    let contentType: string | null = null;
    let raw = '';
    server.use(
      http.post(`${API}/meetup/book-image`, async ({ request }) => {
        auth = request.headers.get('Authorization');
        contentType = request.headers.get('Content-Type');
        // jsdom File을 Node fetch(undici)가 직렬화하면 파일명·내용이 유실되므로 필드명과 MIME만 검증
        raw = await request.text();
        return HttpResponse.json({ success: true, document: { filename: 'x', url: BLOB_URL } });
      }),
    );

    await uploadBookImage(png());

    expect(auth).toBe('Bearer tkn');
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(raw).toContain('name="image"');
    expect(raw).toContain('Content-Type: image/png');
  });

  it('401이면 서버 메시지로 오류를 던짐', async () => {
    server.use(
      http.post(`${API}/meetup/book-image`, () =>
        HttpResponse.json({ success: false, message: '다시 로그인해주세요.' }, { status: 401 }),
      ),
    );

    await expect(uploadBookImage(png())).rejects.toThrow('다시 로그인해주세요.');
  });

  it('본문이 JSON이 아닌 실패 응답은 기본 메시지를 사용함', async () => {
    server.use(http.post(`${API}/meetup/book-image`, () => new HttpResponse('<html>', { status: 500 })));
    await expect(uploadBookImage(png())).rejects.toThrow('이미지 업로드에 실패했습니다.');
  });
});

describe('getMeetups (REQ-GRP-002)', () => {
  it('공백을 제거한 keyword를 쿼리로 보냄', async () => {
    let search = '';
    server.use(
      http.get(`${API}/meetup`, ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json({ success: true, document: { items: [] } });
      }),
    );

    await getMeetups('  소설 ');

    expect(decodeURIComponent(search)).toBe('?keyword=소설');
  });

  it('keyword가 공백뿐이면 쿼리를 붙이지 않음', async () => {
    let search = 'unset';
    server.use(
      http.get(`${API}/meetup`, ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json({ success: true, document: { items: [] } });
      }),
    );

    await getMeetups('   ');

    expect(search).toBe('');
  });

  it('서버 오류의 errors 상세를 메시지에 덧붙임', async () => {
    server.use(
      http.get(`${API}/meetup`, () =>
        HttpResponse.json({ success: false, message: '실패', errors: ['a', 'b'] }, { status: 400 }),
      ),
    );

    await expect(getMeetups()).rejects.toThrow('실패 (a, b)');
  });
});

describe('getMeetupDetail (REQ-GRP-003)', () => {
  const detail = {
    meetup: {
      meetup_id: 1, leader_id: 'leader01', title: '소설 모임', description: '소개', book_title: '채식주의자',
      book_image_url: BLOB_URL, price: 40000, min_capacity: 4, max_capacity: 8,
      deadline: '2099-01-01T00:00:00', status: 'RECRUITING', leader_name: '모임장',
    },
    sessions: [
      { session_id: '12', session_number: 2, topic: '둘째', sch_date: '2099-02-10', sch_day: '토', sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00', zoom_url: null, zoom_password: null, status: 'SCHEDULED' },
      { session_id: '11', session_number: 1, topic: '첫째', sch_date: '2099-01-10', sch_day: '토', sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00', zoom_url: null, zoom_password: null, status: 'SCHEDULED' },
    ],
    apply_count: 3,
    apply_user_stats: {
      genre_1: {}, genre_2: {}, monthly_reading_volume: { BOOKS_3_4: 2, BOOKS_7_PLUS: 1 },
      age_group: { '20대': 3 }, gender: { F: 2, M: 1 },
    },
  };

  it('회차를 번호순으로 정렬하고 BIGINT 문자열 id를 숫자로 변환함', async () => {
    server.use(http.get(`${API}/meetup/1`, () => HttpResponse.json({ success: true, document: detail })));

    const result = await getMeetupDetail(1);

    expect(result?.sessions.map((s) => [s.number, s.sessionId])).toEqual([[1, 11], [2, 12]]);
    expect(result).toMatchObject({ captain: '모임장', appliedMembers: 3, bookImageUrl: BLOB_URL });
  });

  it('독서량 코드를 한글로 바꿔 통계에 담음', async () => {
    server.use(http.get(`${API}/meetup/1`, () => HttpResponse.json({ success: true, document: detail })));

    const result = await getMeetupDetail(1);

    expect(result?.stats.reading).toEqual([
      { label: '3~4권', count: 2 },
      { label: '7권 이상', count: 1 },
    ]);
    expect(result?.stats.gender).toEqual([{ label: 'F', count: 2 }, { label: 'M', count: 1 }]);
  });

  it('404는 undefined를 반환함', async () => {
    server.use(http.get(`${API}/meetup/9`, () => HttpResponse.json({ success: false }, { status: 404 })));
    await expect(getMeetupDetail(9)).resolves.toBeUndefined();
  });

  it.each([0, -1, 1.5, NaN])('id %p는 요청 없이 undefined (미처리 요청이면 테스트 실패)', async (id) => {
    await expect(getMeetupDetail(id)).resolves.toBeUndefined();
  });

  it('500은 오류를 던짐', async () => {
    server.use(http.get(`${API}/meetup/1`, () => HttpResponse.json({ success: false, message: '서버 오류' }, { status: 500 })));
    await expect(getMeetupDetail(1)).rejects.toThrow('서버 오류');
  });
});

describe('applyMeetup (REQ-PAY-001)', () => {
  it('토큰과 함께 신청하고 결과를 반환함', async () => {
    setToken('tkn');
    let auth: string | null = null;
    server.use(
      http.post(`${API}/meetup/1/apply`, ({ request }) => {
        auth = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, document: { meetup_id: 1, user_id: 'crew01' } }, { status: 201 });
      }),
    );

    await expect(applyMeetup(1, 'crew01')).resolves.toMatchObject({ user_id: 'crew01' });
    expect(auth).toBe('Bearer tkn');
  });

  it('정원 초과 등 409 메시지를 그대로 전달함', async () => {
    server.use(
      http.post(`${API}/meetup/1/apply`, () =>
        HttpResponse.json({ success: false, message: '모집 인원이 마감되었습니다.' }, { status: 409 }),
      ),
    );

    await expect(applyMeetup(1, 'crew01')).rejects.toThrow('모집 인원이 마감되었습니다.');
  });
});

describe('updateMeetup (REQ-GRP-004)', () => {
  it('지정한 필드만 PATCH body에 담음', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.patch(`${API}/meetup/1`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, document: {} });
      }),
    );

    await updateMeetup(1, { userId: 'leader01', title: '새 제목', description: '새 소개', price: 0 });

    expect(body).toEqual({ user_id: 'leader01', title: '새 제목', description: '새 소개', price: 0 });
  });

  it('권한이 없으면 403 메시지로 실패함', async () => {
    server.use(
      http.patch(`${API}/meetup/1`, () =>
        HttpResponse.json({ success: false, message: '모임 수정 권한이 없습니다.' }, { status: 403 }),
      ),
    );

    await expect(updateMeetup(1, { userId: 'x', title: 't', description: 'd' })).rejects.toThrow('모임 수정 권한이 없습니다.');
  });
});

describe('토큰 만료(401) 처리 (공통 request 사용)', () => {
  const expired = () =>
    HttpResponse.json({ success: false, message: '로그인이 만료되었습니다.' }, { status: 401 });
  const file = () => new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
  const payload = { leader_id: 'a', user_id: 'a', title: 't', description: 'd', book_title: 'b', book_image_url: null, price: 0, min_capacity: 4, max_capacity: 8, deadline: '2099-01-01T00:00:00', sessions: [] };

  it.each([
    ['applyMeetup', 'post', '/meetup/1/apply', () => applyMeetup(1, 'crew01')],
    ['createMeetup', 'post', '/meetup', () => createMeetup(payload)],
    ['updateMeetup', 'patch', '/meetup/1', () => updateMeetup(1, { userId: 'a', title: 't', description: 'd' })],
    ['uploadBookImage', 'post', '/meetup/book-image', () => uploadBookImage(file())],
  ] as const)('%s가 401을 받으면 토큰을 지우고 로그아웃 핸들러를 호출하며 status 401을 유지함', async (_name, method, path, call) => {
    setToken('expired');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    server.use(http[method](`${API}${path}`, expired));

    const error = await call().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: '로그인이 만료되었습니다.' });
    expect(getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    setUnauthorizedHandler(null);
  });

  it('403은 로그아웃하지 않음', async () => {
    setToken('valid');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    server.use(http.patch(`${API}/meetup/1`, () => HttpResponse.json({ success: false, message: '권한 없음' }, { status: 403 })));

    await expect(updateMeetup(1, { userId: 'a', title: 't', description: 'd' })).rejects.toMatchObject({ status: 403 });

    expect(getToken()).toBe('valid');
    expect(onUnauthorized).not.toHaveBeenCalled();
    setUnauthorizedHandler(null);
  });

  it('createMeetup은 JSON body와 errors 상세 메시지를 처리함', async () => {
    let sent: unknown;
    server.use(
      http.post(`${API}/meetup`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ success: false, message: '입력값을 확인해주세요.', errors: ['title은 필수입니다.'] }, { status: 400 });
      }),
    );

    await expect(createMeetup(payload)).rejects.toThrow('입력값을 확인해주세요. (title은 필수입니다.)');
    expect(sent).toEqual(payload);
  });

  it('공개 조회(목록·상세)는 토큰이 없어도 동작함', async () => {
    server.use(http.get(`${API}/meetup`, () => HttpResponse.json({ success: true, document: { items: [] } })));
    await expect(getMeetups()).resolves.toEqual([]);
  });
});
