// src/voice/nlu/simpleNlu.ts
export type NluResult = { intent: string; slots?: Record<string, any> };

export function simpleNlu(text: string): NluResult | null {
  const t = text.trim().toLowerCase();

  // 로그인/회원가입
  const loginSyns = [
    "회원가입", "가입할래", "가입하고싶어", "계정 만들기",
    "로그인", "로그인할래", "구글 로그인", "계정 연결"
  ];
  if (loginSyns.some(s => t.includes(s))) {
    return { intent: "auth.signin" };
  }

  // 카테고리 관련
  if (t.includes("카테고리") || t.includes("분류")) {
    return { intent: "category.browse" };
  }

  // 모임 관련
  if (t.includes("모임") || t.includes("meet")) {
    if (t.includes("만들") || t.includes("생성") || t.includes("등록")) {
      return { intent: "meet.create" };
    }
    return { intent: "meet.browse" };
  }

  // 구인구직 관련
  if (t.includes("구인") || t.includes("구직") || t.includes("jobs")) {
    if (t.includes("만들") || t.includes("생성") || t.includes("등록")) {
      return { intent: "jobs.create" };
    }
    return { intent: "jobs.browse" };
  }

  // 마켓/상품 관련
  if (t.includes("마켓") || t.includes("market") || t.includes("상품")) {
    return { intent: "market.browse" };
  }

  // 도움말
  if (t.includes("도움말") || t.includes("무엇을") || t.includes("할수있어")) {
    return { intent: "help.show" };
  }

  // 뒤로가기
  if (t.includes("뒤로") || t.includes("이전") || t.includes("back")) {
    return { intent: "navigation.back" };
  }
  if (t.includes("홈") || t.includes("home") || t.includes("메인")) {
    return { intent: "navigation.home" };
  }

  // 시작화면
  if (t.includes("시작") || t.includes("start")) {
    return { intent: "navigation.start" };
  }

  return null; // 모르면 null
}