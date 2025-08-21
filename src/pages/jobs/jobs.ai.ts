import type { PageAIPlugin, PageAIHandler, PageAIContext } from "@/voice/pageAI/types";

const examples = [
  "계약직만",
  "트레이너 공고",
  "최신순",
  "첫번째 채용 열어",
];

export function makeJobsPlugin(): (ctx: PageAIContext) => PageAIPlugin {
  const handle: PageAIHandler = async (input, ctx) => {
    const u = new URL(location.href);

    if (/계약직|파트|파트타임/.test(input)) { u.searchParams.set("type", "contract"); ctx.navigate(`/jobs${u.search}`); return true; }
    if (/정규직|풀타임/.test(input))        { u.searchParams.set("type", "full");     ctx.navigate(`/jobs${u.search}`); return true; }
    if (/트레이너|코치|강사/.test(input))     { u.searchParams.set("role", "trainer");   ctx.navigate(`/jobs${u.search}`); return true; }
    if (/최신순|최근|새로/.test(input))        { u.searchParams.set("sort", "latest");    ctx.navigate(`/jobs${u.search}`); return true; }

    if (/첫|두|세|[1-3]번째?\s?채용|열어/.test(input)) {
      const n = /두/.test(input) ? 2 : /세/.test(input) ? 3 : 1;
      ctx.navigate(`/jobs/item-${n}`);
      return true;
    }

    return false;
  };
  return (ctx) => ({ id: "jobs.core", pageId: "jobs", handle, examples });
} 