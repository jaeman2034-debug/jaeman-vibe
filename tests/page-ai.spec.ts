import { test, expect } from "@playwright/test";

async function say(page: any, utter: string) {
  await page.evaluate((u: string) => window.dispatchEvent(new CustomEvent("__voice_test__", { detail: u })), utter);
}

test("market: category + sort", async ({ page }) => {
  await page.goto("/market");
  
  // 테스트용 후크(앱에서 window.__voice_test__ 리스너 → useVoiceAgent.handleTranscript 연결)
  await say(page, "축구화 카테고리 보여줘");
  await expect(page).toHaveURL(/cat=%EC%B6%95%EA%B5%AC%ED%99%94/);
  
  await say(page, "가격 낮은순으로 정렬");
  await expect(page).toHaveURL(/sort=price_asc/);
});

test("market: location filter", async ({ page }) => {
  await page.goto("/market");
  
  await say(page, "서울만 보여줘");
  await expect(page).toHaveURL(/loc=%EC%84%9C%EC%9A%B8/);
});

test("meet: date + status filter", async ({ page }) => {
  await page.goto("/meet");
  
  await say(page, "오늘 이후 일정만");
  await expect(page).toHaveURL(/date=upcoming/);
  
  await say(page, "모집중만");
  await expect(page).toHaveURL(/status=open/);
});

test("jobs: type + role filter", async ({ page }) => {
  await page.goto("/jobs");
  
  await say(page, "계약직만");
  await expect(page).toHaveURL(/type=contract/);
  
  await say(page, "트레이너 공고");
  await expect(page).toHaveURL(/role=trainer/);
}); 