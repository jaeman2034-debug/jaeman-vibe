import type { NavigateFunction } from "react-router-dom";

export type PageId =
  | "home"
  | "market"
  | "meet"
  | "jobs"
  | "sell"
  | (string & {});

export interface PageAIContext {
  pageId: PageId;
  navigate: NavigateFunction;
  openModal: (key: string, props?: any) => void;

  /** ? íƒ: ?˜ì´ì§€ ë¡œì»¬ ?íƒœë¥??½ê¸° */
  getState?: () => any;

  /** ? íƒ: ?˜ì´ì§€ ë¡œì»¬ ?íƒœë¥?ë¶€ë¶??…ë°?´íŠ¸ */
  setState?: (patch: any) => void;
}

/** true ë¥?ë°˜í™˜?˜ë©´ ì²˜ë¦¬ ?„ë£Œ(ì¶”ê? NLU ?¼ìš°??ë¶ˆí•„?? */
export type PageAIHandler = (
  input: string,
  ctx: PageAIContext
) => Promise<boolean> | boolean;

export interface PageAIPlugin {
  /** ?? "market.core" */
  id: string;
  pageId: PageId;
  /** ?µì‹¬ ì²˜ë¦¬ê¸?*/
  handle: PageAIHandler;
  /** ?ˆì‹œ ë°œí™”(? íƒ) */
  examples?: string[];
} 
