import { test, expect } from '@playwright/test';

// 테스트 토큰(형식: eventId.registrationId.uid.exp.sig) — 유효성은 서버에서 검증하므로 임의값 OK
const FAKE_TOKEN = 'E1.R1.testuid.9999999999.fake-signature';

test.describe('오프라인 큐 → 온라인 플러시', () => {
  test('scanCheckin 네트워크 실패 -> 큐 적재 -> 온라인 플러시', async ({ page, context }) => {
    // 1) 페이지 진입
    await page.goto('/events/E1/scan');

    // 2) scanCheckin 호출을 일시적으로 "오프라인"처럼 막기
    await context.route(/scanCheckin/, route => route.abort()); // 네트워크 실패로 처리

    // 3) 디버그 훅으로 스캔 트리거
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate((t) => (window as any).__yagoDebugScan?.(t), FAKE_TOKEN);

    // 4) "대기: N건" 증가 확인
    const queueBadge = page.getByText(/대기:\s*\d+건/);
    await expect(queueBadge).toBeVisible();
    const text1 = await queueBadge.textContent();
    expect(text1 && /\d+/.test(text1)).toBeTruthy();

    // 5) 온라인 복귀(라우팅 해제) + 성공 응답 세팅
    await context.unroute(/scanCheckin/);
    await context.route(/scanCheckin/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ok: true, already: false, eventId: 'E1', registrationId: 'R1' } }),
      });
    });

    // 6) 수동 플러시 버튼 클릭
    await page.getByRole('button', { name: /지금 전송/ }).click();

    // 7) "대기: 0건"으로 감소 확인
    await expect(queueBadge).toHaveText(/대기:\s*0건/);
  });
});
