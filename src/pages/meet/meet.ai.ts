import type { PageAIPlugin, PageAIHandler, PageAIContext } from "@/voice/pageAI/types";

const examples = [
  "오늘 이후 일정만",
  "서울 모임 보여줘",
  "모집중만",
  "첫번째 모임 열어",
];

export function makeMeetPlugin(): (ctx: PageAIContext) => PageAIPlugin {
  const handle: PageAIHandler = async (input, ctx) => {
    const u = new URL(location.href);

    if (/오늘이후|다가오는|다가올|이번주|이번\s?주/.test(input)) {
      u.searchParams.set("date", "upcoming");
      ctx.navigate(u.pathname + u.search);
      return true;
    }

    const mLoc = input.match(/(.+?)\s?(모임)?\s?보여/);
    if (mLoc) {
      const loc = mLoc[1].trim();
      u.searchParams.set("loc", loc);
      ctx.navigate(u.pathname + u.search);
      return true;
    }

    if (/모집중/.test(input)) {
      u.searchParams.set("status", "open");
      ctx.navigate(u.pathname + u.search);
      return true;
    }

    if (/첫|두|세|[1-3]번째?\s?모임|열어/.test(input)) {
      const n = /두/.test(input) ? 2 : /세/.test(input) ? 3 : 1;
      ctx.navigate(`/meet/item-${n}`);
      return true;
    }

    return false;
  };
  return (ctx) => ({ id: "meet.core", pageId: "meet", handle, examples });
} 