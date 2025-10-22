// src/voice/commandRouter.ts
import { NavigateFunction } from "react-router-dom";
import { DEFAULT_DASHBOARD_PATH, ROUTES } from "@/constants/routes";

export async function routeIntent(intent: string, ctx: { navigate: NavigateFunction, say?: (msg:string)=>void }) {
  switch (intent) {
    case "auth.signin":
      ctx.say?.("ë¡œê·¸???”ë©´?¼ë¡œ ?´ë™? ê²Œ??");
      ctx.navigate(`/login?next=${encodeURIComponent("/start")}`);
      return true;

    case "category.browse":
      ctx.say?.("ì¹´í…Œê³ ë¦¬ ?˜ì´ì§€ë¡??´ë™?©ë‹ˆ??");
      ctx.navigate(`${ROUTES.MARKET}/categories`);
      return true;

    case "meet.create":
      ctx.say?.("ëª¨ì„???ì„±?©ë‹ˆ??");
      ctx.navigate(`${ROUTES.MEET}/new`);
      return true;

    case "meet.browse":
      ctx.say?.("ëª¨ì„ ëª©ë¡?¼ë¡œ ?´ë™?©ë‹ˆ??");
      ctx.navigate(ROUTES.MEET);
      return true;

    case "jobs.create":
      ctx.say?.("êµ¬ì¸ ê³µê³ ë¥??±ë¡?©ë‹ˆ??");
      ctx.navigate(`${ROUTES.JOBS}/new`);
      return true;

    case "jobs.browse":
      ctx.say?.("êµ¬ì¸ êµ¬ì§ ëª©ë¡?¼ë¡œ ?´ë™?©ë‹ˆ??");
      ctx.navigate(ROUTES.JOBS);
      return true;

    case "market.browse":
      ctx.say?.("ë§ˆì¼“?¼ë¡œ ?´ë™?©ë‹ˆ??");
      ctx.navigate(ROUTES.MARKET);
      return true;

    case "help.show":
      ctx.say?.("?„ì?ë§ì„ ë³´ì—¬?œë¦½?ˆë‹¤.");
      // ?„ì?ë§?ëª¨ë‹¬ ?ëŠ” ?˜ì´ì§€ë¡??´ë™ (?„ì¬ êµ¬í˜„ ?†ìŒ)
      return true;

    case "navigation.back":
      ctx.say?.("?´ì „ ?˜ì´ì§€ë¡??´ë™?©ë‹ˆ??");
      ctx.navigate(-1);
      return true;

    case "navigation.home":
      ctx.say?.("?ˆìœ¼ë¡??´ë™?©ë‹ˆ??");
      ctx.navigate(DEFAULT_DASHBOARD_PATH);
      return true;

    case "navigation.start":
      ctx.say?.("?¤í????”ë©´?¼ë¡œ ?´ë™?©ë‹ˆ??");
      ctx.navigate(ROUTES.START);
      return true;

    default:
      return false;
  }
} 
