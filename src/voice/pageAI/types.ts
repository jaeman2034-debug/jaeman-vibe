import type { NavigateFunction } from "react-router-dom";

export type PageId = "home" | "market" | "meet" | "jobs" | "sell" | (string & {});

export type PageAIContext = {
  pageId: PageId;
  navigate: NavigateFunction;
  openModal: (key: string, props?: any) => void;
  getState?: () => any;     // 페이지 로컬 스토어가 있다면 연결(선택)
  setState?: (patch: any) => void;
};

// true를 반환하면 처리를 완료(전역 NLU로 넘어가지 않음)
export type PageAIHandler = (input: string, ctx: PageAIContext) => Promise<boolean> | boolean;

export type PageAIPlugin = {
  id: string;                 // "market.core" 등
  pageId: PageId;
  handle: PageAIHandler;      // 핵심 처리기
  examples?: string[];        // UI에 노출할 예시(선택)
}; 