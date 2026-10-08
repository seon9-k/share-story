// 테스트 준비용 헬퍼. 화면으로 검증하지 않는 사전 조건(계정·모임·신청 등)은 BE API로 빠르게 만들고,
// 종료된 모임처럼 API로 만들 수 없는 상태는 임시 DB에 직접 반영함
import { execFileSync } from 'node:child_process';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const BE = 'http://127.0.0.1:3100';
export const PASSWORD = 'password1';

let seq = 0;
// 4~10자 영문+숫자 (실행마다 겹치지 않도록 시간과 순번을 섞음)
export const uniqueId = (prefix = 'e') =>
  `${prefix}${Date.now().toString(36).slice(-5)}${String(seq++ % 100).padStart(2, '0')}`;

const pad = (n: number) => String(n).padStart(2, '0');
export const dateAfter = (days: number) => {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export interface Account {
  userId: string;
  name: string;
  token: string;
  user: Record<string, unknown>;
}

const signupBody = (userId: string, name: string) => ({
  user_id: userId, password: PASSWORD, email: `${userId}@example.com`, name,
  gender: 'F', age_group: '30대', readingAmount: 'BOOKS_3_4', genres: ['NOVEL', 'ESSAY'],
});

/** 회원가입 + 로그인까지 API로 처리함 */
export async function createAccount(api: APIRequestContext, name = '테스터', userId = uniqueId()): Promise<Account> {
  const signup = await api.post(`${BE}/auth/signup`, { data: signupBody(userId, name) });
  expect(signup.status(), await signup.text()).toBe(201);
  const login = await api.post(`${BE}/auth/login`, { data: { user_id: userId, password: PASSWORD } });
  expect(login.status()).toBe(200);
  const body = await login.json();
  return { userId, name, token: body.token, user: body.document };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export interface MeetupSeed { meetupId: string; title: string; sessionIds: string[] }

/** 4회차 모임을 API로 개설함. 모든 회차는 미래 날짜라 신청·로그북 제출이 가능함 */
export async function createMeetup(
  api: APIRequestContext,
  leader: Account,
  over: { title?: string; maxCapacity?: number; minCapacity?: number } = {},
): Promise<MeetupSeed> {
  const title = over.title ?? `E2E 모임 ${uniqueId('m')}`;
  const res = await api.post(`${BE}/meetup`, {
    headers: auth(leader.token),
    data: {
      title, description: 'E2E 테스트용 모임 소개', book_title: '채식주의자', book_image_url: null, price: 40000,
      min_capacity: over.minCapacity ?? 4, max_capacity: over.maxCapacity ?? 8,
      deadline: `${dateAfter(7)}T23:59:59`,
      sessions: [10, 17, 24, 31].map((days, i) => ({
        session_number: i + 1, topic: `${i + 1}회차 주제`, sch_date: dateAfter(days), sch_day: '토',
        sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00',
        zoom_url: 'https://zoom.us/j/123456', zoom_password: 'pw1234',
      })),
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const doc = (await res.json()).document;
  return {
    meetupId: String(doc.meetup.meetup_id),
    title,
    sessionIds: doc.sessions.map((s: { session_id: string | number }) => String(s.session_id)),
  };
}

export async function apply(api: APIRequestContext, who: Account, meetupId: string) {
  const res = await api.post(`${BE}/meetup/${meetupId}/apply`, { headers: auth(who.token) });
  expect(res.status(), await res.text()).toBe(201);
}

export async function submitLogbook(api: APIRequestContext, who: Account, m: MeetupSeed, sessionIndex: number, content: string) {
  const res = await api.put(`${BE}/logbook/meetups/${m.meetupId}/sessions/${m.sessionIds[sessionIndex]}/me`, {
    headers: auth(who.token), data: { content },
  });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()).document as { logbook_id: string; is_approved: boolean };
}

export async function approveLogbook(api: APIRequestContext, captain: Account, m: MeetupSeed, sessionIndex: number, logbookId: string) {
  const res = await api.patch(
    `${BE}/logbook/meetups/${m.meetupId}/sessions/${m.sessionIds[sessionIndex]}/logbooks/${logbookId}/approval`,
    { headers: auth(captain.token), data: { is_approved: true } },
  );
  expect(res.status(), await res.text()).toBe(200);
}

export async function myLogbook(api: APIRequestContext, who: Account, m: MeetupSeed, sessionIndex: number) {
  const res = await api.get(`${BE}/logbook/meetups/${m.meetupId}/sessions/${m.sessionIds[sessionIndex]}/me`, { headers: auth(who.token) });
  return (await res.json()).document as { is_approved: boolean; content: string } | null;
}

/** 임시 DB에 직접 SQL을 실행함 (E2E 전용 DB라 안전함) */
export function sql(query: string): string {
  return execFileSync('psql', ['-h', '127.0.0.1', '-p', '54330', '-U', 'postgres', '-d', 'sharestory_e2e', '-tA', '-c', query], {
    encoding: 'utf8',
  }).trim();
}

/** 모임을 종료 상태로 바꿈 (후기 작성은 종료된 모임에서만 가능함) */
export const completeMeetup = (meetupId: string) => sql(`UPDATE meetup SET status = 'COMPLETED' WHERE meetup_id = ${Number(meetupId)}`);

/** 화면 로그인 없이 로그인 상태로 시작함 (localStorage에 토큰·회원 정보를 미리 심음) */
export async function signInAs(page: Page, who: Account) {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('sharestory.token', token);
    localStorage.setItem('sharestory.user', JSON.stringify(user));
  }, { token: who.token, user: who.user });
}
