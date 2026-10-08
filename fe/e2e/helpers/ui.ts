// 화면 조작 헬퍼. 실제 사용자가 하는 순서대로 화면을 채움
import { expect, type Page } from '@playwright/test';
import { PASSWORD, dateAfter } from './api';

/** 가입 화면에서 회원가입을 마치고 로그인 화면(아이디 채워진 상태)까지 이동함 */
export async function signUpViaUi(page: Page, userId: string, name: string, password = PASSWORD) {
  await page.goto('/signup');
  await page.getByPlaceholder('아이디를 입력해 주세요').fill(userId);
  await page.getByRole('button', { name: '중복확인' }).click();
  await expect(page.getByText('사용 가능한 아이디입니다.')).toBeVisible();
  await page.getByPlaceholder('비밀번호', { exact: true }).fill(password);
  await page.getByPlaceholder('비밀번호 확인').fill(password);
  await page.getByLabel('이메일 아이디').fill(userId);
  await page.getByRole('combobox', { name: '이메일 도메인' }).selectOption('gmail.com');
  await page.getByPlaceholder('닉네임을 입력해 주세요').fill(name);
  await page.getByRole('button', { name: '여', exact: true }).click();
  await page.getByRole('combobox', { name: '연령대' }).selectOption('30대');
  await page.getByRole('button', { name: '소설', exact: true }).click();
  await page.getByRole('button', { name: '에세이', exact: true }).click();
  await page.getByRole('button', { name: '3~4권' }).click();
  await page.getByRole('button', { name: '가입하기' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** 로그인 화면에서 로그인함 */
export async function loginViaUi(page: Page, userId: string, password = PASSWORD) {
  await page.getByPlaceholder('아이디를 입력해 주세요').fill(userId);
  await page.getByPlaceholder('비밀번호를 입력해 주세요').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
}

export interface MeetupFormValues {
  bookTitle: string; title: string; intro: string; imageUrl?: string;
  min?: string; max?: string; deadline?: string; zoomUrl?: string; zoomPassword?: string;
}

/** 모임 개설 화면을 채움 (제출은 하지 않음). 회차는 4개 모두 미래 날짜로 입력함 */
export async function fillMeetupForm(page: Page, v: MeetupFormValues) {
  await page.getByLabel('함께 읽을 도서').fill(v.bookTitle);
  if (v.imageUrl) await page.getByLabel('책 이미지 URL').fill(v.imageUrl);
  await page.getByLabel('항해 제목').fill(v.title);
  await page.getByLabel('항해 소개').fill(v.intro);
  await page.getByLabel('Zoom URL').fill(v.zoomUrl ?? 'https://zoom.us/j/987654321');
  await page.getByLabel('Zoom 비밀번호').fill(v.zoomPassword ?? 'pw9876');
  await page.getByLabel('최소 인원').fill(v.min ?? '4');
  await page.getByLabel('최대 인원').fill(v.max ?? '8');
  await page.getByLabel('모집 마감').fill(v.deadline ?? dateAfter(7));
  for (const [i, days] of [10, 17, 24, 31].entries()) {
    const n = i + 1;
    await page.getByLabel(`${n}회차 날짜`).fill(dateAfter(days));
    await page.getByLabel(`${n}회차 시작 시간`).fill('20:00');
    await page.getByLabel(`${n}회차 주제`).fill(`${n}회차 주제`);
  }
}
