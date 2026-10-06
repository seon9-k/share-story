import type { CreateMeetupPayload } from '../types/meetupForm';
import type { Meetup } from '../types/meetup';
import type { MeetupDetail } from '../types/meetupDetail';
import type { MeetupListItem } from '../types/meetupList';
import { getToken } from '../../../shared/api/client';
import {
	mapMeetupDetailToDetail,
	mapMeetupDetailToListItem,
	mapMeetupListApiItem,
} from '../lib/meetupMapper';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

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

const extractErrorMessage = (payload: any, fallback: string) => {
	const baseMessage = payload?.message || fallback;
	if (!Array.isArray(payload?.errors) || payload.errors.length === 0) return baseMessage;
	const details = payload.errors.map((item: unknown) => stringifyErrorItem(item)).join(', ');
	return `${baseMessage} (${details})`;
};

export async function uploadBookImage(file: File, userId?: string): Promise<{ filename: string; url: string }> {
	const formData = new FormData();
	formData.append('image', file);
	if (userId) formData.append('user_id', userId);

	const token = getToken();
	const response = await fetch(`${API_BASE_URL}/meetup/book-image`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		body: formData,
	});

	const raw = await response.text();
	let data: any = null;
	try {
		data = raw ? JSON.parse(raw) : null;
	} catch {
		data = null;
	}

	if (!response.ok || data?.success === false) {
		throw new Error(extractErrorMessage(data, '이미지 업로드에 실패했습니다.'));
	}

	// BE는 상대 경로만 내려주므로, 화면에 바로 표시/저장할 수 있도록 절대 URL로 변환한다.
	return { filename: data.document.filename, url: `${API_BASE_URL}${data.document.url}` };
}

export async function createMeetup(payload: CreateMeetupPayload) {
	const token = getToken();
	const response = await fetch(`${API_BASE_URL}/meetup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(payload),
	});

	const raw = await response.text();
	let data: any = null;
	try {
		data = raw ? JSON.parse(raw) : null;
	} catch {
		data = null;
	}

	if (!response.ok || data?.success === false) {
		throw new Error(extractErrorMessage(data, '모임 개설에 실패했습니다.'));
	}

	return data?.document;
}

export async function getMeetups(keyword?: string) {
	const query = new URLSearchParams();
	if (keyword && keyword.trim().length > 0) {
		query.set('keyword', keyword.trim());
	}

	const url = `${API_BASE_URL}/meetup${query.toString() ? `?${query.toString()}` : ''}`;
	const response = await fetch(url, { method: 'GET' });
	const raw = await response.text();

	let data: MeetupListApiResponse | null = null;
	try {
		data = raw ? (JSON.parse(raw) as MeetupListApiResponse) : null;
	} catch {
		data = null;
	}

	if (!response.ok || data?.success === false) {
		throw new Error(extractErrorMessage(data, '모임 목록 조회에 실패했습니다.'));
	}

	return data?.document?.items || [];
}

export async function getMeetupDetailApi(meetupId: number): Promise<MeetupDetailApiResponse | undefined> {
	const response = await fetch(`${API_BASE_URL}/meetup/${meetupId}`, { method: 'GET' });
	const raw = await response.text();

	let data: MeetupDetailApiEnvelope | null = null;
	try {
		data = raw ? (JSON.parse(raw) as MeetupDetailApiEnvelope) : null;
	} catch {
		data = null;
	}

	if (response.status === 404) return undefined;
	if (!response.ok || data?.success === false) {
		throw new Error(extractErrorMessage(data, '모임 상세 조회에 실패했습니다.'));
	}

	return data?.document;
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
	const token = getToken();
	const response = await fetch(`${API_BASE_URL}/meetup/${meetupId}/apply`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ user_id: userId, meetup_id: meetupId }),
	});

	const raw = await response.text();
	let data: MeetupApplyApiEnvelope | null = null;
	try {
		data = raw ? (JSON.parse(raw) as MeetupApplyApiEnvelope) : null;
	} catch {
		data = null;
	}

	if (!response.ok || data?.success === false) {
		throw new Error(extractErrorMessage(data, '모임 가입 신청에 실패했습니다.'));
	}

	return data?.document;
}

export async function updateMeetup(
	meetupId: number,
	params: {
		userId: string;
		title: string;
		description: string;
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
	const token = getToken();
	const response = await fetch(`${API_BASE_URL}/meetup/${meetupId}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			user_id: params.userId,
			title: params.title,
			description: params.description,
			...(params.price !== undefined ? { price: params.price } : {}),
			...(params.sessions !== undefined ? { sessions: params.sessions } : {}),
		}),
	});

	const raw = await response.text();
	let data: any = null;
	try {
		data = raw ? JSON.parse(raw) : null;
	} catch {
		data = null;
	}

	if (!response.ok || data?.success === false) {
		throw new Error(extractErrorMessage(data, '모임 수정에 실패했습니다.'));
	}

	return data?.document;
}
