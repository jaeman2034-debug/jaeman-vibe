import type { PageAIHandler, PageAIPlugin, PageAIContext } from "@/voice/pageAI/types";

const examples = [
  "축구화 카테고리 보여줘",
  "가격 낮은순으로 정렬",
  "서울만 보여줘",
  "첫번째 항목 열어",
  "새 상품 등록",
];

function parseIndex(s: string): number | null {
  const m = s.match(/(첫|두|세|네|다섯|1|2|3|4|5)/);
  const map: Record<string, number> = { 첫:1, 두:2, 세:3, 네:4, 다섯:5 };
  if (!m) return null;
  const k = m[1];
  return map[k] ?? parseInt(k, 10) || null;
}

export function makeMarketPlugin(): (ctx: PageAIContext) => PageAIPlugin {
  const handle: PageAIHandler = async (input, ctx) => {
    const s = input.replace(/\s+/g, "");

    // 카테고리
    const mCat = input.match(/(.+?)\s*(카테고리|만|만보여|찾아|보여)/);
    if (mCat) {
      const cat = mCat[1].trim();
      ctx.navigate(`/market?cat=${encodeURIComponent(cat)}`);
      return true;
    }

    // 정렬
    if (/낮은순|오름차순|저가|싼순/.test(s)) {
      const u = new URL(location.href);
      u.searchParams.set("sort", "price_asc");
      ctx.navigate(`/market${u.search}`);
      return true;
    }
    if (/높은순|내림차순|고가|비싼순/.test(s)) {
      const u = new URL(location.href);
      u.searchParams.set("sort", "price_desc");
      ctx.navigate(`/market${u.search}`);
      return true;
    }

    // 위치 필터(간단): "서울만" → location=서울
    const mLoc = input.match(/(.+?)만\s?보여/);
    if (mLoc) {
      const loc = mLoc[1].trim();
      const u = new URL(location.href);
      u.searchParams.set("loc", loc);
      ctx.navigate(`/market${u.search}`);
      return true;
    }

    // N번째 아이템 열기
    if (/첫|두|세|네|다섯|[1-5]번째?\s?항목|열어/.test(input)) {
      const n = parseIndex(input) ?? 1;
      // 실제 항목 id를 알 수 없으므로, 목록 컴포넌트에서 data-index → id 매핑을 노출해두면 좋습니다.
      // 여기서는 데모로 /market/item-n 으로 이동
      ctx.navigate(`/market/item-${n}`);
      return true;
    }

    // 등록 플로우
    if (/새|신규|상품\s?등록/.test(s)) {
      ctx.openModal("voice:register");
      return true;
    }

    return false;
  };

  return (ctx) => ({ id: "market.core", pageId: "market", handle, examples });
} 