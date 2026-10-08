import type { CreateMeetupPayload } from '../types/meetupForm';
import type { Meetup } from '../types/meetup';
import type { MeetupDetail } from '../types/meetupDetail';
import type { MeetupListItem } from '../types/meetupList';
import { ApiError, request } from '../../../shared/api/client';
import {
  mapMeetupDetailToDetail,
  mapMeetupDetailToListItem,
  mapMeetupListApiItem,
} from '../lib/meetupMapper';

// 업로드 응답의 상대 경로(/files/...)를 절대 URL로 바꿀 때만 사용함. 요청 주소는 공통 request()가 결정함
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export interface MeetupListApiItem {
  meetup_id: number;
  title: string;
  book_title: string;
  book_image_url: string | null;
  min_capacity: number;
  max_capacity: number;
  status: string;
  leader_name: string | null;
  sch_st_date: string | null;
  sch_ed_date: string | null;
  sch_day: string | null;
  sch_time: string | null;
  deadline?: string | null;
}

interface MeetupListApiResponse {
  success: boolean;
  document?: {
    items: MeetupListApiItem[];
  };
  message?: string;
  errors?: unknown[];
}

export interface MeetupDetailApiResponse {
  meetup: {
    meetup_id: number;
    leader_id: string;
    title: string;
    description: string;
    book_title: string;
    book_image_url: string | null;
    price: number;
    min_capacity: number;
    max_capacity: number;
    deadline: string;
    status: string;
    leader_name: string | null;
  };
  sessions: Array<{
    session_id: number;
    session_number: number;
    topic: string;
    sch_date: string | null;
    sch_day: string | null;
    sch_time: string | null;
    sch_st_time: string | null;
    sch_ed_time: string | null;
    zoom_url: string | null;
    zoom_password: string | null;
    status: string;
  }>;
  apply_count: number;
  apply_user_stats: {
    genre_1: Record<string, number>;
    genre_2: Record<string, number>;
    monthly_reading_volume: Record<string, number>;
    age_group: Record<string, number>;
    gender: Record<string, number>;
  };
}

interface MeetupDetailApiEnvelope {
  success: boolean;
  document?: MeetupDetailApiResponse;
  message?: string;
  errors?: unknown[];
}

interface MeetupApplyApiEnvelope {
  success: boolean;
  document?: {
    meetup_id: number;
    user_id: string;
    status?: string;
  };
  message?: string;
  errors?: unknown[];
}

const stringifyErrorItem = (item: unknown) => {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') return JSON.stringify(item);
  return String(item);
};

const extractErrorMessage = (
  payload: { message?: string; errors?: unknown[] } | null,
  fallback: string,
) => {
  const baseMessage = payload?.message || fallback;
  if (!Array.isArray(payload?.errors) || payload.errors.length === 0) return baseMessage;
  const details = payload.errors.map((item: unknown) => stringifyErrorItem(item)).join(', ');
  return `${baseMessage} (${details})`;
};

/*
 * 모든 모임 API를 공통 request()로 호출함.
 * - 토큰 첨부와 401 처리(토큰 삭제 + 로그아웃 핸들러)를 공통 클라이언트에 맡김.
 *   예전엔 fetch를 직접 써서 토큰이 만료되어도 로그인 상태가 유지됐음
 * - 오류 메시지는 기존처럼 서버 message에 errors 상세를 덧붙이고, 없으면 fallback을 사용함
 * - 상태 코드는 ApiError로 그대로 전달해 호출부가 401·404를 구분할 수 있게 함
 */
async function call<T>(path: string, options: RequestInit, fallback: string): Promise<T> {
  try {
    return await request<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError) {
      const message = extractErrorMessage(
        { message: error.serverMessage, errors: error.errors },
        fallback,
      );
      throw new ApiError(message, error.status);
    }
    throw error;
  }
}

const jsonBody = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export async function uploadBookImage(
  file: File,
  userId?: string,
): Promise<{ filename: string; url: string }> {
  const formData = new FormData();
  formData.append('image', file);
  if (userId) formData.append('user_id', userId);

  const data = await call<{ document: { filename: string; url: string } }>(
    '/meetup/book-image',
    { method: 'POST', body: formData },
    '이미지 업로드에 실패했습니다.',
  );

  // 이전 상대 경로 응답과 Blob 절대 URL 응답을 모두 지원
  return {
    filename: data.document.filename,
    url: new URL(data.document.url, API_BASE_URL).toString(),
  };
}

export async function createMeetup(payload: CreateMeetupPayload) {
  const data = await call<{ document?: unknown }>(
    '/meetup',
    jsonBody('POST', payload),
    '모임 개설에 실패했습니다.',
  );
  return data.document;
}

export async function getMeetups(keyword?: string) {
  const query = new URLSearchParams();
  if (keyword && keyword.trim().length > 0) {
    query.set('keyword', keyword.trim());
  }

  const data = await call<MeetupListApiResponse>(
    `/meetup${query.toString() ? `?${query.toString()}` : ''}`,
    { method: 'GET' },
    '모임 목록 조회에 실패했습니다.',
  );
  return data.document?.items || [];
}

export async function getMeetupDetailApi(
  meetupId: number,
): Promise<MeetupDetailApiResponse | undefined> {
  try {
    const data = await call<MeetupDetailApiEnvelope>(
      `/meetup/${meetupId}`,
      { method: 'GET' },
      '모임 상세 조회에 실패했습니다.',
    );
    return data.document;
  } catch (error) {
    // 없는 모임은 오류가 아니라 "없음"으로 처리
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getMeetup(id: number): Promise<MeetupListItem | undefined> {
  if (!Number.isSafeInteger(id) || id <= 0) return undefined;
  const detail = await getMeetupDetailApi(id);
  return detail ? mapMeetupDetailToListItem(detail) : undefined;
}

export async function getMeetupDetail(id: number): Promise<MeetupDetail | undefined> {
  if (!Number.isSafeInteger(id) || id <= 0) return undefined;
  const detail = await getMeetupDetailApi(id);
  return detail ? mapMeetupDetailToDetail(detail) : undefined;
}

export async function fetchMeetupSectionItems(): Promise<Meetup[]> {
  const apiItems = await getMeetups();
  return apiItems.map(mapMeetupListApiItem).map((item) => ({
    id: item.id,
    title: item.title,
    captain: item.captain,
    book: item.book,
    members: null,
    maxMembers: item.maxMembers,
    status: item.status,
    nextMeeting: `${item.schedule} · ${item.time}`,
    dateRange: `${item.firstDate}~${item.lastDate}`,
    location: '상세 안내 확인',
    image: item.image,
  }));
}

export async function applyMeetup(meetupId: number, userId: string) {
  const data = await call<MeetupApplyApiEnvelope>(
    `/meetup/${meetupId}/apply`,
    jsonBody('POST', { user_id: userId, meetup_id: meetupId }),
    '모임 가입 신청에 실패했습니다.',
  );
  return data.document;
}

export async function updateMeetup(
  meetupId: number,
  params: {
    userId: string;
    title: string;
    description: string;
    book_image_url?: string | null;
    price?: number;
    sessions?: Array<{
      session_id: number;
      session_number: number;
      topic: string;
      sch_date: string;
      sch_day: string;
      sch_time: string;
      sch_st_time: string;
      sch_ed_time: string;
      zoom_url?: string | null;
      zoom_password?: string | null;
    }>;
  },
) {
  const data = await call<{ document?: unknown }>(
    `/meetup/${meetupId}`,
    jsonBody('PATCH', {
      user_id: params.userId,
      title: params.title,
      description: params.description,
      ...(params.book_image_url !== undefined ? { book_image_url: params.book_image_url } : {}),
      ...(params.price !== undefined ? { price: params.price } : {}),
      ...(params.sessions !== undefined ? { sessions: params.sessions } : {}),
    }),
    '모임 수정에 실패했습니다.',
  );
  return data.document;
}
