// src/voice/commandRouter.ts
import { NavigateFunction } from "react-router-dom";
import { DEFAULT_DASHBOARD_PATH, ROUTES } from "@/constants/routes";

export async function routeIntent(intent: string, ctx: { navigate: NavigateFunction, say?: (msg:string)=>void }) {
  switch (intent) {
    case "auth.signin":
      ctx.say?.("로그???�면?�로 ?�동?�게??");
      ctx.navigate(`/login?next=${encodeURIComponent("/start")}`);
      return true;

    case "category.browse":
      ctx.say?.("카테고리 ?�이지�??�동?�니??");
      ctx.navigate(`${ROUTES.MARKET}/categories`);
      return true;

    case "meet.create":
      ctx.say?.("모임???�성?�니??");
      ctx.navigate(`${ROUTES.MEET}/new`);
      return true;

    case "meet.browse":
      ctx.say?.("모임 목록?�로 ?�동?�니??");
      ctx.navigate(ROUTES.MEET);
      return true;

    case "jobs.create":
      ctx.say?.("구인 공고�??�록?�니??");
      ctx.navigate(`${ROUTES.JOBS}/new`);
      return true;

    case "jobs.browse":
      ctx.say?.("구인 구직 목록?�로 ?�동?�니??");
      ctx.navigate(ROUTES.JOBS);
      return true;

    case "market.browse":
      ctx.say?.("마켓?�로 ?�동?�니??");
      ctx.navigate(ROUTES.MARKET);
      return true;

    case "help.show":
      ctx.say?.("?��?말을 보여?�립?�다.");
      // ?��?�?모달 ?�는 ?�이지�??�동 (?�재 구현 ?�음)
      return true;

    case "navigation.back":
      ctx.say?.("?�전 ?�이지�??�동?�니??");
      ctx.navigate(-1);
      return true;

    case "navigation.home":
      ctx.say?.("?�으�??�동?�니??");
      ctx.navigate(DEFAULT_DASHBOARD_PATH);
      return true;

    case "navigation.start":
      ctx.say?.("?��????�면?�로 ?�동?�니??");
      ctx.navigate(ROUTES.START);
      return true;

    default:
      return false;
  }
} 
