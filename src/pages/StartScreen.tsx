// src/pages/StartScreen.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isInAppBrowser } from "@/utils/inapp";
import InAppBlocked from "@/components/InAppBlocked";
import { sendSessionStarted } from "@/lib/analytics";

type Country = { code: string; label: string };

const COUNTRIES: Country[] = [
  { code: "KR", label: "대한민국 / KR" },
  { code: "JP", label: "日本 / JP" },
  { code: "US", label: "United States / US" },
];

export default function StartScreen() {
  const nav = useNavigate();
  
  // 인앱 브라우저 감지 시 차단 화면 표시
  if (isInAppBrowser()) {
    return <InAppBlocked />;
  }
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(
    "마이크 버튼을 누르면 브라우저에서 권한을 얻습니다"
  );

  const goMarket = () => {
    localStorage.setItem("startSeen", String(Date.now()));
    sendSessionStarted(country.code);
    nav("/market");
  };
  const goGroup  = () => {
    sendSessionStarted(country.code);
    nav("/meetups");
  };
  const goJobs   = () => {
    sendSessionStarted(country.code);
    nav("/jobs");
  };
  const goLogin  = () => nav("/login");
  const goNaverLogin = () => {
    // 로그인 버튼 클릭 시 현재 위치를 next 파라미터로 전달
    const next = location.pathname + location.search;
    const returnTo = `${location.origin}/login/success?next=${encodeURIComponent(next)}`;
    location.href = `https://us-central1-jaeman-vibe-platform.cloudfunctions.net/naverLogin?return_to=${encodeURIComponent(returnTo)}`;
  };

  // 내 기본 클럽 ID 가져오기 (임시 구현)
  const getMyDefaultClubId = (): string | null => {
    // TODO: 실제로는 Firestore에서 사용자의 클럽 목록을 조회
    // 현재는 localStorage에서 최근 사용 클럽 ID를 가져옴
    return localStorage.getItem('lastUsedClubId') || null;
  };

  // 클럽 블로그 글쓰기 버튼 클릭
  const onClickBlogNew = () => {
    const myClubId = getMyDefaultClubId(); // 내가 운영/가입한 클럽 중 기본값
    if (myClubId) {
      nav(`/clubs/${myClubId}?go=blog/new`);
    } else {
      // 아직 기본 클럽이 없으면 선택 화면으로 보내되, 선택 후 돌아갈 목적(go)을 넘긴다
      nav(`/clubs/select?go=blog/new`);
    }
  };

  const requestMic = async () => {
    if (!("mediaDevices" in navigator)) {
      setMsg("이 브라우저는 마이크 권한을 지원하지 않습니다");
      return;
    }
    try {
      setBusy(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      localStorage.setItem("yago:voiceEnabled", "1");
      setMsg("마이크 권한 허용됨 · 음성 입력을 사용할 수 있어요");
      goMarket();
    } catch (e) {
      setMsg("마이크 권한이 거부되었어요 · 텍스트로 둘러보기를 이용하세요");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex items-start sm:items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-lg border border-[#eef2f7] p-5 sm:p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div />
          <div className="w-8 h-8 rounded-full bg-[#f5f7fb] border border-[#e8ecf3] flex items-center justify-center text-[#8a93a6] text-lg select-none">＋</div>
        </div>

        <div className="text-center">
          <div className="text-[22px] font-extrabold tracking-tight">YAGO SPORTS</div>
          <div className="text-[11px] text-[#8a93a6] -mt-1">AI Platform for Sports Enthusiasts</div>
        </div>

        {/* 타이틀 & 서브 */}
        <div className="mt-5 text-center">
          <div className="text-[18px] font-bold">스포츠의 시작, 야고</div>
          <p className="text-[13px] text-[#667085] leading-relaxed mt-2">
            체육인 광고게시판 · 모임 · 커뮤니티를 하나로,<br />
            알고 찾고 비교로 연결합니다.
          </p>
        </div>

        {/* 마이크 안내 문구 */}
        <div className="mt-4 text-xs text-zinc-500 text-center">
          마이크를 허용하면 음성으로 검색할 수 있어요.
        </div>

        {/* 음성으로 시작하기 */}
        <button
          onClick={requestMic}
          disabled={busy}
          className="mt-2 w-full h-11 rounded-2xl bg-blue-600 text-white text-[14px] font-semibold transition"
        >
          {busy ? "확인 중..." : "음성으로 시작하기"}
        </button>

        {/* 국가/지역 */}
        <div className="mt-3">
          <label className="block text-[12px] text-[#7a8197] mb-1">국가/지역</label>
          <select
            value={country.code}
            onChange={(e) =>
              setCountry(COUNTRIES.find((c) => c.code === e.target.value) ?? COUNTRIES[0])
            }
            className="w-full h-10 rounded-lg border border-[#e4e7ee] bg-white px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#c6d4ff]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 텍스트로 둘러보기 */}
        <button
          onClick={goMarket}
          className="mt-2 w-full h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[#111827] text-[13px]"
        >
          텍스트로 둘러보기
        </button>

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] flex-1 bg-[#eef1f6]" />
          <span className="text-[11px] text-[#9aa3b2]">로그인 필요</span>
          <div className="h-[1px] flex-1 bg-[#eef1f6]" />
        </div>

        {/* 계정 관리 / 로그인 */}
        <div className="flex gap-8 justify-between">
          <button
            onClick={goLogin}
            className="text-[13px] text-[#1f2937] underline underline-offset-2 hover:opacity-80"
          >
            계정 관리 / 다른 계정으로
          </button>
          <button
            onClick={goLogin}
            className="text-[13px] text-[#1f2937] underline underline-offset-2 hover:opacity-80"
          >
            Google 로그인
          </button>
          <button
            onClick={goNaverLogin}
            className="text-[13px] text-[#03c75a] underline underline-offset-2 hover:opacity-80"
          >
            네이버 로그인
          </button>
        </div>

        {/* 퀵 링크 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onClickBlogNew}
            className="h-9 rounded-lg text-[12px] border border-[#e7ebf3] bg-white hover:bg-[#f9fafb]"
          >
            "클럽 블로그 글쓰기"
          </button>
          <button
            onClick={() => nav("/clubs")}
            className="h-9 rounded-lg text-[12px] border border-[#e7ebf3] bg-white hover:bg-[#f9fafb]"
          >
            "클럽 목록 보기"
          </button>
        </div>

        {/* 섹션 이동 힌트 (마켓/모임/일자리) */}
        <div className="mt-6 text-[12px] text-[#6b7280]">
          <div className="mb-1">
            동네 소식/거래는 <button onClick={goMarket} className="text-[#1d4ed8] underline">마켓</button>에서
          </div>
          <div className="mb-1">
            이웃과 활동은 <button onClick={goGroup} className="text-[#1d4ed8] underline">모임</button>에서
          </div>
          <div>
            구인/구직은 <button onClick={goJobs} className="text-[#1d4ed8] underline">일자리</button>에서
          </div>
        </div>
      </div>
    </div>
  );
}
