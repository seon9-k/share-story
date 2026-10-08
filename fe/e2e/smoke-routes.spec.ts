import { expect, test } from '@playwright/test';

const BE_URL = 'http://127.0.0.1:3100';

// 화면 이동·접근 제어 스모크 (smoke.spec.ts 보강)
test.describe('공개 화면 열람', () => {
  for (const path of ['/', '/login', '/signup', '/meetups']) {
    test(`${path} 화면이 열리고 콘솔 오류가 없음`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(path);
      await expect(page).toHaveTitle(/Share Story/);
      await expect(page.getByRole('banner')).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(path);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('잘못된 주소와 서버 상태', () => {
  test('없는 주소는 404 안내 화면을 보여주고 홈으로 돌아갈 수 있음', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByText('페이지를 찾을 수 없습니다.')).toBeVisible();
    await page.getByRole('link', { name: '홈으로' }).click();
    await expect(page).toHaveURL('/');
  });

  test('이전 마이페이지 주소는 비로그인이면 로그인 화면으로 이동함', async ({ page }) => {
    await page.goto('/my-journal');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('BE /ping이 200으로 응답함', async ({ request }) => {
    const res = await request.get(`${BE_URL}/ping`);
    expect(res.status()).toBe(200);
  });
});

test.describe('비로그인 접근 제어', () => {
  for (const path of ['/mypage', '/mypage/profile', '/meetups/create', '/captain/voyages', '/meetups/1/logbooks']) {
    test(`${path}는 로그인 화면으로 이동함`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
