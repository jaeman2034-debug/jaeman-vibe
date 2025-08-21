import { test, expect } from "@playwright/test";

// 음성 개발 시스템 E2E 테스트
test.describe("Voice Dev System", () => {
  
  test("비허용 사용자는 /voice 접근 시 홈으로 리다이렉트", async ({ page }) => {
    await page.goto("/voice");
    await expect(page).toHaveURL("/");
  });

  test("비허용 사용자는 홈에서 '개발 도구' 섹션을 볼 수 없음", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('text=개발 도구')).not.toBeVisible();
  });

  test("로컬 강제 허용 시 개발 도구 접근 가능", async ({ page }) => {
    await page.goto("/");
    
    // 로컬 강제 허용 설정
    await page.evaluate(() => localStorage.setItem("dev:allow", "1"));
    await page.reload();
    
    // 개발 도구 섹션 노출 확인
    await expect(page.locator('text=개발 도구')).toBeVisible();
    
    // /voice 접근 가능 확인
    await page.goto("/voice");
    await expect(page).toHaveURL("/voice");
    await expect(page.locator('text=Voice Dev Suite')).toBeVisible();
  });

  test("허용 사용자는 모달 호출 가능", async ({ page }) => {
    // 로컬 강제 허용 설정
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("dev:allow", "1"));
    await page.reload();
    
    // VAD 모달 호출 테스트
    await page.locator('text=VAD Modal').click();
    await expect(page.locator('text=VAD Test (Modal)')).toBeVisible();
    
    // 모달 닫기
    await page.locator('button:has-text("닫기")').click();
    await expect(page.locator('text=VAD Test (Modal)')).not.toBeVisible();
  });

  test("라우트별 페이지 접근 가능", async ({ page }) => {
    // 로컬 강제 허용 설정
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("dev:allow", "1"));
    await page.reload();
    
    // 각 라우트 접근 테스트
    await page.goto("/voice/vad");
    await expect(page.locator('text=VAD Test (Page)')).toBeVisible();
    
    await page.goto("/voice/asr");
    await expect(page.locator('text=ASR Test (Page)')).toBeVisible();
    
    await page.goto("/voice/one-shot-signup");
    await expect(page.locator('text=One‑Shot Voice Signup (Page)')).toBeVisible();
  });

  test("전역 단축키로 모달 호출 가능", async ({ page }) => {
    // 로컬 강제 허용 설정
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("dev:allow", "1"));
    await page.reload();
    
    // Ctrl+Shift+V로 VAD 모달 호출
    await page.keyboard.press("Control+Shift+V");
    await expect(page.locator('text=VAD Test (Modal)')).toBeVisible();
    
    // 모달 닫기
    await page.locator('button:has-text("닫기")').click();
  });

  test("테스트 페이지에서 모달 시스템 작동", async ({ page }) => {
    await page.goto("/test");
    
    // 모달 버튼들 클릭 테스트
    await page.locator('text=🎙️ VAD 테스트 모달').click();
    await expect(page.locator('text=VAD Test (Modal)')).toBeVisible();
    
    await page.locator('button:has-text("닫기")').click();
    await expect(page.locator('text=VAD Test (Modal)')).not.toBeVisible();
  });

  // PATCH PACK v1 추가 테스트 케이스들
  test("guard: non-whitelisted redirect to home", async ({ page }) => {
    await page.goto("/voice");
    await expect(page).toHaveURL("/");
  });

  test("modal: opens from voice index", async ({ page }) => {
    // 임시 허용(로컬 개발에서만):
    await page.addInitScript(() => localStorage.setItem("dev:allow", "1"));
    await page.goto("/voice");
    await page.getByText("VAD Modal").click();
    await expect(page.getByText("VAD Test (Modal)")).toBeVisible();
  });
});

// 헬퍼 함수들
export async function loginAsDev(page: any) {
  // TODO: 실제 로그인 로직 구현
  // Firebase 인증 또는 테스트 계정으로 로그인
  await page.goto("/login");
  // ... 로그인 로직
}

export async function setupDevAccess(page: any) {
  // 로컬 강제 허용 설정
  await page.evaluate(() => localStorage.setItem("dev:allow", "1"));
} 