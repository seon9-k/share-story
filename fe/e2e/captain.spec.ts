import { expect, request as pwRequest, test, type APIRequestContext } from '@playwright/test';
import {
  type Account, type MeetupSeed, PASSWORD, apply, completeMeetup, createAccount,
  myLogbook, signInAs, submitLogbook, uniqueId, BE,
} from './helpers/api';
import { fillMeetupForm, loginViaUi, signUpViaUi } from './helpers/ui';

// 캡틴(모임장) 시나리오: 가입 → 모임 개설 → 상세·수정 → 마이페이지 → 크루 로그북 승인 → 종료 후 후기 확인
// 앞 단계에서 만든 모임을 뒤 단계가 이어서 사용하므로 순서대로 실행함
test.describe.serial('캡틴 시나리오', () => {
  let api: APIRequestContext;
  let captain: Account;
  let meetupId: string;
  const captainId = uniqueId('c');
  const captainName = '캡틴E2E';
  const title = `캡틴 모임 ${uniqueId('t')}`;

  test.beforeAll(async () => {
    api = await pwRequest.newContext();
  });
  test.afterAll(async () => {
    await api.dispose();
  });

  test('C1 회원가입 → 로그인', async ({ page }) => {
    await signUpViaUi(page, captainId, captainName);
    // 가입 직후에는 아이디가 채워지고 안내 문구가 보임
    await expect(page.getByText('회원가입이 완료되었습니다. 로그인해 주세요.')).toBeVisible();
    await expect(page.getByPlaceholder('아이디를 입력해 주세요')).toHaveValue(captainId);

    await loginViaUi(page, captainId);
    await expect(page).toHaveURL('/');
    // 로그인 상태: 토큰과 회원 정보가 저장됨
    expect(await page.evaluate(() => localStorage.getItem('sharestory.token'))).toBeTruthy();
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('sharestory.user') ?? '{}'));
    expect(user).toMatchObject({ user_id: captainId, name: captainName });
    expect(user.password).toBeUndefined();

    const login = await api.post(`${BE}/auth/login`, { data: { user_id: captainId, password: PASSWORD } });
    const body = await login.json();
    captain = { userId: captainId, name: captainName, token: body.token, user: body.document };
  });

  test('C1 잘못된 비밀번호로는 로그인되지 않음', async ({ page }) => {
    await page.goto('/login');
    await loginViaUi(page, captainId, 'wrong-pass1');
    await expect(page.getByText('아이디 또는 비밀번호가 올바르지 않습니다.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('sharestory.token'))).toBeNull();
  });

  test('C2 모임 개설: 입력 검증 오류 후 정상 개설', async ({ page }) => {
    await signInAs(page, captain);
    await page.goto('/meetups/create');
    const form = { bookTitle: '채식주의자', title, intro: '캡틴이 개설한 E2E 모임입니다.', imageUrl: 'http://127.0.0.1:4173/logo.png' };

    // 최소 인원이 4명 미만이면 개설되지 않음
    await fillMeetupForm(page, { ...form, min: '3' });
    await page.getByRole('button', { name: '개설하기' }).click();
    await expect(page.getByText(/모집 인원은 4~8명/)).toBeVisible();
    await expect(page).toHaveURL(/\/meetups\/create$/);

    // 정상 값으로 고치면 개설되고 목록으로 이동함
    await page.getByLabel('최소 인원').fill('4');
    await page.getByRole('button', { name: '개설하기' }).click();
    await expect(page).toHaveURL(/\/meetups$/);
    const card = page.getByRole('link', { name: new RegExp(title) });
    await expect(card).toBeVisible();
    await expect(card).toContainText('인원 4~8명');
    await expect(card).toContainText('승선 대기');

    const href = await card.getAttribute('href');
    meetupId = href!.split('/').pop()!;
    expect(meetupId).toMatch(/^\d+$/);
  });

  test('C3 상세 화면: 본인 모임은 수정 가능, 참여 신청은 불가', async ({ page }) => {
    await signInAs(page, captain);
    await page.goto(`/meetups/${meetupId}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    for (const n of [1, 2, 3, 4]) await expect(page.getByText(`${n}회차 주제`).first()).toBeVisible();
    await expect(page.getByRole('link', { name: '항해수정' })).toHaveAttribute('href', `/meetups/${meetupId}/edit`);
    await expect(page.getByRole('button', { name: '항해 참여하기' })).toBeDisabled();
  });

  test('C4 모임 수정: 제목·소개 변경이 상세에 반영됨', async ({ page }) => {
    await signInAs(page, captain);
    await page.goto(`/meetups/${meetupId}/edit`);
    const newTitle = `${title} (수정)`;
    await page.getByLabel('항해명').fill(newTitle);
    await page.getByLabel('소개').fill('수정된 소개입니다.');
    await page.getByRole('button', { name: '수정 내용 저장' }).click();

    await page.goto(`/meetups/${meetupId}`);
    await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();
    await expect(page.getByText('수정된 소개입니다.')).toBeVisible();
  });

  test('C4 모임장이 아닌 사용자는 수정 API가 거부됨', async () => {
    const other = await createAccount(api, '타인');
    const res = await api.patch(`${BE}/meetup/${meetupId}`, {
      headers: { Authorization: `Bearer ${other.token}` },
      data: { title: '탈취 시도', description: 'x' },
    });
    expect(res.status()).toBe(403);
  });

  test('C5 마이페이지 캡틴 탭: 내 모임과 신청한 크루가 보임', async ({ page }) => {
    const crewA = await createAccount(api, '크루에이');
    const crewB = await createAccount(api, '크루비');
    const seed: MeetupSeed = { meetupId, title, sessionIds: [] };
    await apply(api, crewA, seed.meetupId);
    await apply(api, crewB, seed.meetupId);

    await signInAs(page, captain);
    await page.goto('/mypage/journal?role=captain');
    await expect(page.getByRole('button', { name: /캡틴/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(`${title} (수정)`)).toBeVisible();

    // 크루 로그북 확인 화면에서 신청한 크루 두 명이 모두 보임
    await page.getByRole('link', { name: '크루 로그북 확인' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/meetups/${meetupId}/logbooks/review`));
    await expect(page.getByText('참여 크루 2명')).toBeVisible();
    await expect(page.getByText(/크루에이/).first()).toBeVisible();
    await expect(page.getByText(/크루비/).first()).toBeVisible();
  });

  test('C6 크루 로그북 확인: 숙제 확인 완료 → 취소', async ({ page }) => {
    // 크루 1명이 1회차 로그북을 제출함 (모임 신청은 C5에서 한 크루 중 새로 만든 계정 사용)
    const crew = await createAccount(api, '제출크루');
    await apply(api, crew, meetupId);
    const sessionsRes = await api.get(`${BE}/member/meetups/${meetupId}/sessions`, { headers: { Authorization: `Bearer ${captain.token}` } });
    const sessionIds = (await sessionsRes.json()).document.map((s: { session_id: string }) => String(s.session_id));
    const seed: MeetupSeed = { meetupId, title, sessionIds };
    const logbook = await submitLogbook(api, crew, seed, 0, '제출한 독후감 내용입니다.');
    expect(logbook.is_approved).toBe(false);

    await signInAs(page, captain);
    await page.goto(`/meetups/${meetupId}/logbooks/review`);
    await expect(page.getByText(/제출 1명 · 미제출 \d명/)).toBeVisible();

    // 미제출 크루를 누르면 안내만 보이고 승인 버튼은 없음
    await page.getByRole('button', { name: /크루에이/ }).click();
    await expect(page.getByText('아직 로그북을 제출하지 않았습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '숙제 확인 완료' })).toHaveCount(0);

    // 제출한 크루의 로그북을 읽고 승인함
    await page.getByRole('button', { name: /제출크루/ }).click();
    await expect(page.getByText('제출한 독후감 내용입니다.')).toBeVisible();
    await expect(page.getByText(/확인을 완료해야 이 크루에게 Zoom 접속 정보가 발송됩니다/)).toBeVisible();
    await page.getByRole('button', { name: '숙제 확인 완료' }).click();
    await expect(page.getByRole('button', { name: '확인 취소' })).toBeVisible();
    await expect(page.getByRole('button', { name: /제출크루/ })).toContainText('확인 완료');
    expect((await myLogbook(api, crew, seed, 0))?.is_approved).toBe(true); // 서버에도 저장됨

    // 새로고침해도 승인 상태가 유지됨
    await page.reload();
    await page.getByRole('button', { name: /제출크루/ }).click();
    await expect(page.getByRole('button', { name: '확인 취소' })).toBeVisible();

    // 승인 취소
    await page.getByRole('button', { name: '확인 취소' }).click();
    await expect(page.getByRole('button', { name: '숙제 확인 완료' })).toBeVisible();
    expect((await myLogbook(api, crew, seed, 0))?.is_approved).toBe(false);
  });

  test('C7 종료된 모임: 크루가 남긴 후기를 캡틴이 조회함', async ({ page }) => {
    const crew = await createAccount(api, '후기크루');
    await apply(api, crew, meetupId);
    completeMeetup(meetupId);
    const res = await api.post(`${BE}/review/meetups/${meetupId}`, {
      headers: { Authorization: `Bearer ${crew.token}` }, data: { rating: 5, content: '정말 좋은 모임이었습니다.' },
    });
    expect(res.status()).toBe(201);

    await signInAs(page, captain);
    await page.goto(`/meetups/${meetupId}/reviews`);
    await expect(page.getByText('정말 좋은 모임이었습니다.')).toBeVisible();
    // 캡틴은 후기를 작성하는 사람이 아니므로 작성 버튼이 없음
    await expect(page.getByRole('link', { name: '후기 작성' })).toHaveCount(0);
  });
});
