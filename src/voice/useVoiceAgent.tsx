// src/voice/useVoiceAgent.tsx
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import { auth } from "@/lib/firebase"; // 단일 진입점 사용
import { simpleNlu } from "./nlu/simpleNlu";
import { routeIntent } from "./commandRouter";

// 간단 스포츠 매핑
const sportMap: Record<string, string> = {
  야구: "baseball",
  축구: "football",
  농구: "basketball",
  배구: "volleyball",
  골프: "golf",
  테니스: "tennis",
  러닝: "running",
  아웃도어: "outdoor",
  피트니스: "fitness",
  이스포츠: "esports", "e스포츠": "esports",
};

const regionMap: Record<string, string> = {
  한국: "KR", 대한민국: "KR", 코리아: "KR",
  일본: "JP",
  미국: "US", 아메리카: "US",
};

type AgentOptions = { say?: (text: string) => void };

export default function useVoiceAgent(opts: AgentOptions = {}) {
  const nav = useNavigate();
  const toast = useToast();
  const say = opts.say;

  const setRegion = (r: string) => {
    localStorage.setItem("region", r);
    window.dispatchEvent(new CustomEvent("region:change", { detail: r }));
  };

  const handle = useCallback(async (raw: string) => {
    const input = raw.trim();
    if (!input) return false;

    // 1) NLU 기반 의도 파악 시도
    const nluResult = simpleNlu(input);
    if (nluResult) {
      console.log('[VOICE] NLU 결과:', nluResult);
      const routed = await routeIntent(nluResult.intent, { navigate: nav, say });
      console.log('[VOICE] 라우팅 결과:', routed);
      if (routed) return true;
    }

    // 2) 기존 규칙 기반 처리 (fallback)

    // 1) 도움말
    if (/(도움말|무엇을|할 수)/.test(input)) {
      const msg = "야구 카테고리, 모임 만들기, 구인 등록, 지역 한국, 뒤로 가기";
      toast.info(msg, 4500);
      say?.(msg);
      return true;
    }

    // 2) 뒤로가기/홈/시작
    if (/(뒤로|이전|back)/.test(input)) {
      say?.("이전 페이지로 이동합니다");
      nav(-1);
      return true;
    }
    if (/(홈|home|메인)/.test(input)) {
      say?.("홈으로 이동합니다");
      nav("/market");
      return true;
    }
    if (/(시작|start)/.test(input)) {
      say?.("시작 화면으로 이동합니다");
      nav("/start");
      return true;
    }

    // 3) 단순 주요 진입
    if (/카테고리/.test(input)) {
      say?.("카테고리 페이지로 이동합니다");
      nav("/market/categories");
      return true;
    }
    if (/(모임( 목록)?|meet)/.test(input)) {
      say?.("모임 목록으로 이동합니다");
      nav("/meet");
      return true;
    }
    if (/(구인|구직|jobs|알바)/.test(input) && !/등록|생성|만들/.test(input)) {
      say?.("구인 구직 목록으로 이동합니다");
      nav("/jobs");
      return true;
    }

    // 4) 생성 플로우
    if (/(모임.*(만들|생성|등록))/.test(input)) {
      say?.("모임을 생성합니다");
      nav("/meet/new");
      return true;
    }
    if (/((구인|구직).*(만들|생성|등록))/.test(input)) {
      say?.("구인 공고를 등록합니다");
      nav("/jobs/new");
      return true;
    }

    // 5) 계정/로그인
    if (/(계정|프로필|마이페이지)/.test(input)) {
      if (auth.currentUser) {
        say?.("계정으로 이동합니다");
        nav("/account");
      } else {
        say?.("로그인 페이지로 이동합니다");
        nav("/login?next=/start");
      }
      return true;
    }
    if (/로그인/.test(input)) {
      say?.("로그인 페이지로 이동합니다");
      nav("/login?next=/start");
      return true;
    }

    // 6) 카테고리 필터 이동: "야구 보여줘", "축구 카테고리", "농구 중고"
    for (const [ko, id] of Object.entries(sportMap)) {
      if (input.includes(ko)) {
        const region = localStorage.getItem("region") || "KR";
        const msg = `${ko} 카테고리로 이동합니다`;
        toast.success(msg);
        say?.(msg);
        nav(`/market?cat=${encodeURIComponent(id)}&region=${encodeURIComponent(region)}`);
        return true;
      }
    }

    // 7) 지역변경: "지역 한국/일본/미국"
    const mRegion = input.match(/지역\s*(.*)/);
    if (mRegion) {
      const key = mRegion[1]?.trim();
      const code = regionMap[key];
      if (code) {
        setRegion(code);
        const msg = `지역을 ${key}로 설정했습니다`;
        toast.success(msg);
        say?.(msg);
        return true;
      }
    }

    // 8) 구인 유형 간단 필터: "코치 구인", "파트타임 구직"
    if (/코치/.test(input)) {
      say?.("코치 공고를 보여드립니다");
      nav(`/jobs?type=coach`);
      return true;
    }
    if (/(파트\s*타임|part\s*time)/i.test(input)) {
      say?.("파트타임 공고를 보여드립니다");
      nav(`/jobs?type=parttime`);
      return true;
    }
    if (/(정규직|풀타임|full\s*time)/i.test(input)) {
      say?.("정규직 공고를 보여드립니다");
      nav(`/jobs?type=fulltime`);
      return true;
    }
    if (/(심판|레프리|referee)/i.test(input)) {
      say?.("심판 공고를 보여드립니다");
      nav(`/jobs?type=referee`);
      return true;
    }

    // 9) 기타
    if (/(마켓|market)/.test(input)) {
      say?.("마켓으로 이동합니다");
      nav("/market");
      return true;
    }

    // 매칭 실패
    toast.warn("직접 입력하시거나 '도움말'이라고 말해보세요");
    say?.("직접 입력하시거나 도움말을 말해 보세요");
    return false;
  }, [nav, toast, auth, say]);

  return { handle };
}