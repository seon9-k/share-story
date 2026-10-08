import { expect, test } from '@playwright/test';

// 환경 점검 + 로고·favicon 로딩 확인
test.describe('기본 화면과 로고·favicon', () => {
  test('favicon 링크가 등록되고 실제 SVG가 서빙됨', async ({ page, request }) => {
    await page.goto('/');
    const icon = page.locator('head link[rel="icon"]');
    await expect(icon).toHaveAttribute('type', 'image/svg+xml');
    await expect(icon).toHaveAttribute('href', '/favicon.svg');

    const res = await request.get('/favicon.svg');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/svg+xml');
    expect(await res.text()).toContain('<svg');
  });

  test('로고 이미지가 헤더에 실제로 로딩됨', async ({ page, request }) => {
    await page.goto('/');
    const logo = page.locator('header img').first();
    await expect(logo).toBeVisible();
    // 깨진 이미지가 아니라 실제 픽셀이 로딩되었는지 확인
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);

    const res = await request.get('/logo.png');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  });

  test('홈 화면이 렌더링되고 콘솔 오류가 없음', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');
    await expect(page).toHaveTitle(/Share Story/);
    await expect(page.getByRole('link', { name: /로그인/ }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
