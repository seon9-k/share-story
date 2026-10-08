import { expect, request as pwRequest, test, type APIRequestContext } from '@playwright/test';
import {
  type Account, BE, PASSWORD, apply, approveLogbook, completeMeetup, createAccount, createMeetup,
  myLogbook, signInAs, submitLogbook, uniqueId,
} from './helpers/api';
import { loginViaUi, signUpViaUi } from './helpers/ui';

// 크루(신청자) 시나리오. 각 테스트는 자신의 계정·모임을 새로 만들어 서로 독립적으로 실행됨
test.describe('크루 시나리오', () => {
  let api: APIRequestContext;
  let captain: Account;

  test.beforeAll(async () => {
    api = await pwRequest.newContext();
    captain = await createAccount(api, '모임캡틴');
  });
  test.afterAll(async () => {
    await api.dispose();
  });

  test('K1 비로그인 상세 열람 → 참여하기 → 로그인 → 돌아와서 신청 완료', async ({ page }) => {
    const m = await createMeetup(api, captain);
    const crew = await createAccount(api, 'K1크루');

    // 로그인 없이도 상세를 볼 수 있음
    await page.goto(`/meetups/${m.meetupId}`);
    await expect(page.getByRole('heading', { name: m.title })).toBeVisible();

    // 참여하기를 누르면 로그인 화면으로 이동함
    await page.getByRole('button', { name: '항해 참여하기' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // 로그인하면 원래 보던 모임 상세로 돌아옴
    await loginViaUi(page, crew.userId);
    await expect(page).toHaveURL(new RegExp(`/meetups/${m.meetupId}$`));

    await page.getByRole('button', { name: '항해 참여하기' }).click();
    await expect(page.getByText('항해 참여 신청이 완료되었습니다.')).toBeVisible();
  });

  test('K2 회원가입 입력 검증', async ({ page }) => {
    const existing = await createAccount(api, '기존회원');
    await page.goto('/signup');

    // 규칙에 맞지 않는 아이디
    await page.getByPlaceholder('아이디를 입력해 주세요').fill('abc');
    await page.getByRole('button', { name: '중복확인' }).click();
    await expect(page.getByText('아이디는 영문과 숫자를 포함해 4~10자로 입력해 주세요.')).toBeVisible();

    // 이미 사용 중인 아이디
    await page.getByPlaceholder('아이디를 입력해 주세요').fill(existing.userId);
    await page.getByRole('button', { name: '중복확인' }).click();
    await expect(page.getByText('이미 사용 중인 아이디입니다.')).toBeVisible();

    // 비밀번호 확인이 다르면 즉시 안내함
    await page.getByPlaceholder('비밀번호', { exact: true }).fill(PASSWORD);
    await page.getByPlaceholder('비밀번호 확인').fill('different1');
    await expect(page.getByText('비밀번호가 일치하지 않습니다.')).toBeVisible();

    // 선호 장르는 최대 2개: 2개를 고르면 나머지는 선택할 수 없음
    await page.getByRole('button', { name: '소설', exact: true }).click();
    await page.getByRole('button', { name: '에세이', exact: true }).click();
    await expect(page.getByRole('button', { name: 'IT', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '에세이', exact: true }).click(); // 해제하면 다시 선택 가능
    await expect(page.getByRole('button', { name: 'IT', exact: true })).toBeEnabled();

    // 필수 항목이 맞지 않으면 가입되지 않고 화면에 이유가 표시됨 (입력창 아래 안내 + 하단 알림)
    await page.getByRole('button', { name: '가입하기' }).click();
    await expect(page.getByText('비밀번호가 일치하지 않습니다.')).toHaveCount(2);
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('K2 회원가입 성공 → 로그인 → 마이페이지 정보 확인', async ({ page }) => {
    const userId = uniqueId('k');
    await signUpViaUi(page, userId, 'K2신규');
    await loginViaUi(page, userId);
    await expect(page).toHaveURL('/');

    // 처음에는 입력창 없이 텍스트로 보이고, 수정 버튼을 눌러야 입력창이 열림
    await page.goto('/mypage/profile');
    await expect(page.getByText(userId, { exact: true })).toBeVisible();
    await expect(page.getByText('K2신규', { exact: true })).toBeVisible();
    await expect(page.getByText(`${userId}@gmail.com`, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await page.getByRole('button', { name: '회원정보 수정' }).click();
    await expect(page.getByLabel('닉네임')).toHaveValue('K2신규');
  });

  test('K3 신청 오류: 이미 신청한 모임, 정원이 찬 모임', async ({ page }) => {
    // 이미 신청한 모임
    const crew = await createAccount(api, 'K3크루');
    const m1 = await createMeetup(api, captain);
    await apply(api, crew, m1.meetupId);
    await signInAs(page, crew);
    await page.goto(`/meetups/${m1.meetupId}`);
    await page.getByRole('button', { name: '항해 참여하기' }).click();
    await expect(page.getByText('이미 신청한 모임입니다.')).toBeVisible();

    // 정원(4명)이 모두 찬 모임은 마지막 신청에서 자동으로 마감되어 더 신청할 수 없음
    // 화면에서도 '승선 마감'으로 표시되고 참여하기 버튼이 비활성화됨 (신청 API의 거부는 BE 테스트에서 검증)
    const m2 = await createMeetup(api, captain, { minCapacity: 4, maxCapacity: 4 });
    for (const n of ['가', '나', '다', '라']) await apply(api, await createAccount(api, `정원${n}`), m2.meetupId);
    await page.goto(`/meetups/${m2.meetupId}`);
    await expect(page.getByRole('button', { name: '항해 참여하기' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '승선 마감' })).toBeDisabled();
  });

  test('K4 마이페이지 크루 탭: 신청한 모임만 보임', async ({ page }) => {
    const crew = await createAccount(api, 'K4크루');
    const joined = await createMeetup(api, captain);
    const other = await createMeetup(api, captain);
    await apply(api, crew, joined.meetupId);

    await signInAs(page, crew);
    await page.goto('/mypage/journal');
    await expect(page.getByRole('button', { name: /크루/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(joined.title)).toBeVisible();
    await expect(page.getByText(other.title)).toHaveCount(0);
    await expect(page.getByRole('link', { name: '로그북 작성·조회' })).toHaveAttribute('href', `/meetups/${joined.meetupId}/logbooks`);

    // 캡틴 탭에는 만든 모임이 없음
    await page.getByRole('button', { name: /캡틴/ }).click();
    await expect(page.getByText('아직 만든 모임이 없어요.')).toBeVisible();
  });

  test('K5 로그북 작성 → 제출한 로그북 → 수정(승인 해제) → 삭제', async ({ page }) => {
    const crew = await createAccount(api, 'K5크루');
    const m = await createMeetup(api, captain);
    await apply(api, crew, m.meetupId);
    await signInAs(page, crew);
    await page.goto(`/meetups/${m.meetupId}/logbooks`);
    // 작성 탭에는 모든 회차가 아니라 다음 예정 회차(1회차)와 그 로그북 입력창만 보임
    const first = page.locator('article', { hasText: '1회차 · 1회차 주제' });
    await expect(first).toContainText('미제출');
    await expect(page.getByRole('heading', { name: /^[234]회차/ })).toHaveCount(0);

    // 내용이 없으면 제출할 수 없음
    await expect(first.getByRole('button', { name: '로그북 제출' })).toBeDisabled();

    // 작성·제출
    await first.getByLabel('나의 독서 기록').fill('첫 번째 독서 기록입니다.');
    await expect(first.getByText(/\d+자 · 제출 후에도 수정할 수 있습니다/)).toBeVisible();
    await first.getByRole('button', { name: '로그북 제출' }).click();
    await expect(page.getByText('1회차 로그북을 제출했습니다.')).toBeVisible();
    await expect(first).toContainText('제출 완료');
    expect((await myLogbook(api, crew, m, 0))?.content).toBe('첫 번째 독서 기록입니다.');

    // 제출한 로그북 탭: 모임 단위로 묶여 읽기 전용으로 보임
    await page.getByRole('button', { name: '제출한 로그북' }).click();
    const group = page.locator('section', { has: page.getByRole('heading', { name: m.title }) });
    await expect(group.getByText('첫 번째 독서 기록입니다.')).toBeVisible();
    await expect(group.getByRole('textbox')).toHaveCount(0);
    await page.getByRole('button', { name: '로그북 작성' }).click();

    // 캡틴이 승인한 뒤 크루가 수정본을 다시 제출하면 승인이 풀림
    const mine = await api.get(`${BE}/logbook/meetups/${m.meetupId}/sessions/${m.sessionIds[0]}/me`, { headers: { Authorization: `Bearer ${crew.token}` } });
    const logbookId = (await mine.json()).document.logbook_id;
    await approveLogbook(api, captain, m, 0, logbookId);
    expect((await myLogbook(api, crew, m, 0))?.is_approved).toBe(true);

    await first.getByLabel('나의 독서 기록').fill('수정한 독서 기록입니다.');
    await first.getByRole('button', { name: '수정하여 다시 제출' }).click();
    await expect(page.getByText('1회차 로그북을 제출했습니다.')).toBeVisible();
    await expect.poll(async () => (await myLogbook(api, crew, m, 0))?.is_approved).toBe(false);
    expect((await myLogbook(api, crew, m, 0))?.content).toBe('수정한 독서 기록입니다.');

    // 삭제 (확인 창에서 승인)
    page.once('dialog', (dialog) => dialog.accept());
    await first.getByRole('button', { name: '로그북 삭제' }).click();
    await expect(page.getByText('1회차 로그북을 삭제했습니다.')).toBeVisible();
    await expect(first).toContainText('미제출');
    expect(await myLogbook(api, crew, m, 0)).toBeNull();
  });

  test('K5 여러 모임에서 제출한 로그북은 제출한 로그북 탭에 모임 단위로 묶여 보임', async ({ page }) => {
    const crew = await createAccount(api, 'K5다중');
    const a = await createMeetup(api, captain);
    const b = await createMeetup(api, captain);
    for (const m of [a, b]) await apply(api, crew, m.meetupId);
    await submitLogbook(api, crew, a, 0, 'A 모임 1회차 기록');
    await submitLogbook(api, crew, a, 1, 'A 모임 2회차 기록');
    await submitLogbook(api, crew, b, 0, 'B 모임 1회차 기록');
    await signInAs(page, crew);

    await page.goto(`/meetups/${a.meetupId}/logbooks`);
    await page.getByRole('button', { name: '제출한 로그북' }).click();

    const groupA = page.locator('section', { has: page.getByRole('heading', { name: a.title }) });
    const groupB = page.locator('section', { has: page.getByRole('heading', { name: b.title }) });
    await expect(groupA.getByRole('heading', { level: 3 })).toHaveText(['1회차 · 1회차 주제', '2회차 · 2회차 주제']);
    await expect(groupA).toContainText('A 모임 2회차 기록');
    await expect(groupB.getByRole('heading', { level: 3 })).toHaveText(['1회차 · 1회차 주제']);
    await expect(groupB).toContainText('B 모임 1회차 기록');
    // 지금 보는 모임(A)에는 작성 링크가 없고, 다른 모임(B)에는 작성 화면 링크가 있음
    await expect(groupA.getByRole('link', { name: '로그북 작성하기' })).toHaveCount(0);
    await expect(groupB.getByRole('link', { name: '로그북 작성하기' })).toHaveAttribute('href', `/meetups/${b.meetupId}/logbooks`);
  });

  test('K5 다른 크루의 로그북은 볼 수 없고, 캡틴 전용 화면은 거부됨', async () => {
    const owner = await createAccount(api, 'K5주인');
    const stranger = await createAccount(api, 'K5타인');
    const m = await createMeetup(api, captain);
    await apply(api, owner, m.meetupId);
    await submitLogbook(api, owner, m, 0, '비공개 기록');

    // 신청하지 않은 사용자는 로그북에 접근할 수 없음
    const res = await api.get(`${BE}/logbook/meetups/${m.meetupId}/sessions/${m.sessionIds[0]}/me`, { headers: { Authorization: `Bearer ${stranger.token}` } });
    expect(res.status()).toBe(403);
    // 크루는 회차별 제출 현황(캡틴 전용)을 조회할 수 없음
    const list = await api.get(`${BE}/logbook/meetups/${m.meetupId}/sessions/${m.sessionIds[0]}`, { headers: { Authorization: `Bearer ${owner.token}` } });
    expect(list.status()).toBe(403);
  });

  test('K6 후기: 진행 중에는 작성 불가, 종료 후 작성·수정·삭제', async ({ page }) => {
    const crew = await createAccount(api, 'K6크루');
    const m = await createMeetup(api, captain);
    await apply(api, crew, m.meetupId);
    await signInAs(page, crew);

    // 종료 전에는 작성 폼 대신 안내가 보이고 후기를 쓸 수 없음
    await page.goto(`/meetups/${m.meetupId}/reviews/create`);
    await expect(page.getByText('모임이 종료된 후 후기를 남길 수 있습니다.')).toBeVisible();
    await expect(page.getByRole('button', { name: '후기 등록' })).toHaveCount(0);
    // 서버도 종료 전 작성을 거부함 (화면을 우회한 요청 방어)
    const early = await api.post(`${BE}/review/meetups/${m.meetupId}`, { headers: { Authorization: `Bearer ${crew.token}` }, data: { rating: 5, content: '우회' } });
    expect(early.status()).toBe(409);

    // 종료 후 작성
    completeMeetup(m.meetupId);
    await page.reload();
    await page.getByLabel('5점').check();
    await page.getByLabel('항해 후기').fill('정말 즐거운 항해였습니다.');
    await page.getByRole('button', { name: '후기 등록' }).click();
    await expect(page).toHaveURL(new RegExp(`/meetups/${m.meetupId}/reviews$`));
    await expect(page.getByText('항해 후기를 등록했습니다.')).toBeVisible();
    await expect(page.getByText('정말 즐거운 항해였습니다.')).toBeVisible();
    await expect(page.getByText('이 모임에 후기를 남겼습니다.')).toBeVisible();
    await expect(page.getByRole('link', { name: '후기 작성' })).toHaveCount(0); // 모임당 1개

    // 수정
    await page.getByRole('link', { name: '후기 수정' }).click();
    await page.getByLabel('3점').check();
    await page.getByLabel('항해 후기').fill('수정한 후기입니다.');
    await page.getByRole('button', { name: '후기 수정' }).click();
    await expect(page.getByText('항해 후기를 수정했습니다.')).toBeVisible();
    await expect(page.getByText('수정한 후기입니다.')).toBeVisible();

    // 삭제하면 다시 작성할 수 있음
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '후기 삭제' }).click();
    await expect(page.getByText('후기를 삭제했습니다.')).toBeVisible();
    await expect(page.getByRole('link', { name: '후기 작성' })).toBeVisible();
  });

  test('K7 회원정보 수정 → 비밀번호 변경', async ({ page }) => {
    const crew = await createAccount(api, 'K7크루');
    await signInAs(page, crew);
    await page.goto('/mypage/profile');

    await page.getByRole('button', { name: '회원정보 수정' }).click();
    await page.getByLabel('닉네임').fill('바뀐닉네임');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('회원정보를 수정했습니다.')).toBeVisible();
    await expect(page.getByText('바뀐닉네임', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);

    // 비밀번호 변경: 현재 비밀번호가 틀리면 거부, 맞으면 새 비밀번호로만 로그인됨
    await page.getByRole('button', { name: '회원정보 수정' }).click();
    const [current, next, confirm] = await page.locator('form', { hasText: '비밀번호 변경' }).locator('input[type="password"]').all();
    await current.fill('wrong-pass1');
    await next.fill('newpassword1');
    await confirm.fill('newpassword1');
    await page.getByRole('button', { name: '비밀번호 변경' }).click();
    await expect(page.getByText('현재 비밀번호가 올바르지 않습니다.')).toBeVisible();

    await current.fill(PASSWORD);
    await page.getByRole('button', { name: '비밀번호 변경' }).click();
    await expect(page.getByText('비밀번호를 변경했습니다.')).toBeVisible();

    const oldLogin = await api.post(`${BE}/auth/login`, { data: { user_id: crew.userId, password: PASSWORD } });
    const newLogin = await api.post(`${BE}/auth/login`, { data: { user_id: crew.userId, password: 'newpassword1' } });
    expect(oldLogin.status()).toBe(401);
    expect(newLogin.status()).toBe(200);
  });

  test('K7 회원탈퇴: 참여 중인 모임이 있으면 불가, 없으면 탈퇴되어 로그인할 수 없음', async ({ page }) => {
    const crew = await createAccount(api, 'K7탈퇴');
    const m = await createMeetup(api, captain);
    await apply(api, crew, m.meetupId);
    await signInAs(page, crew);
    await page.goto('/mypage/profile');

    // 진행 중인 모임에 참여 중이면 탈퇴할 수 없음
    await page.getByRole('button', { name: '회원탈퇴' }).click();
    await page.getByLabel('비밀번호 확인').fill(PASSWORD);
    await page.getByRole('dialog').getByRole('button', { name: '회원탈퇴' }).click();
    await expect(page.getByText('참여 중인 모임이 끝난 뒤 탈퇴할 수 있습니다.')).toBeVisible();

    // 모임이 끝나면 탈퇴할 수 있음
    completeMeetup(m.meetupId);
    await page.getByRole('dialog').getByRole('button', { name: '회원탈퇴' }).click();
    await expect(page).toHaveURL('/');

    const login = await api.post(`${BE}/auth/login`, { data: { user_id: crew.userId, password: PASSWORD } });
    expect(login.status()).toBe(401);
    const check = await api.post(`${BE}/auth/check-id`, { data: { user_id: crew.userId } });
    expect((await check.json()).count).toBe(1); // 탈퇴한 아이디는 다시 쓸 수 없음
  });

  test('K8 토큰이 만료·위조되면 자동 로그아웃되어 로그인 화면으로 이동함', async ({ page }) => {
    const crew = await createAccount(api, 'K8크루');
    await signInAs(page, { ...crew, token: 'invalid.token.value' });
    await page.goto('/mypage/journal');

    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('sharestory.token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('sharestory.user'))).toBeNull();
    // 이후 보호된 화면에 접근하면 로그인 화면으로 보내고, 원래 가려던 경로를 기억함
    await page.goto('/mypage/profile');
    await expect(page).toHaveURL(/\/login$/);
  });
});
