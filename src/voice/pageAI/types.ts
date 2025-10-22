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

  /** ?�택: ?�이지 로컬 ?�태�??�기 */
  getState?: () => any;

  /** ?�택: ?�이지 로컬 ?�태�?부�??�데?�트 */
  setState?: (patch: any) => void;
}

/** true �?반환?�면 처리 ?�료(추�? NLU ?�우??불필?? */
export type PageAIHandler = (
  input: string,
  ctx: PageAIContext
) => Promise<boolean> | boolean;

export interface PageAIPlugin {
  /** ?? "market.core" */
  id: string;
  pageId: PageId;
  /** ?�심 처리�?*/
  handle: PageAIHandler;
  /** ?�시 발화(?�택) */
  examples?: string[];
} 
