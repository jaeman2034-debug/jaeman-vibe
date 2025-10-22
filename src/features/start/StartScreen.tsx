import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase"; // ✅ 단일 진입점 사용
import { DEFAULT_DASHBOARD_PATH } from "@/constants/routes";

export default function StartScreen() {
  const nav = useNavigate();

  // ✅ Body 클래스 전역 사용/해제 (서버사이드 렌더링 금지)
  useEffect(() => {
    document.body.classList.add("startscreen", "overflow-hidden");
    return () => {
      document.body.classList.remove("startscreen", "overflow-hidden");
    };
  }, []);

  // ✅ UI 모드(사용자 미세 조정): ?ui=compact | lower 같은 쿼리값
  const initialUi = useMemo(() => {
    const hash = location.hash; // HashRouter
    const q = hash.includes("?") ? new URLSearchParams(hash.split("?")[1]) : new URLSearchParams();
    return q.get("ui") || localStorage.getItem("ui.start.ui") || "normal";
  }, []);
  const [uiMode, setUiMode] = useState<string>(initialUi);
  useEffect(() => localStorage.setItem("ui.start.ui", uiMode), [uiMode]);

  // ✅ 추가: 뷰포트 높이에 따른 단계별 로딩 동작 조정
  const [vh, setVh] = useState<number>(() => window.innerHeight);
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isCompact = uiMode === "compact";
  const isLower   = uiMode === "lower";
  // 기존 uiMode 계산을 그대로 사용하면 overlayPad를 뷰포트에 맞게 결정
  const overlayPad = vh < 760 ? "pt-16" : vh < 880 ? "pt-20" : "pt-24";
  const bottomPad  = "pb-40"; // 하단 배너 여유 공간 유지 (기존 pb-28보다 여유)
  const cardMaxW  = isCompact ? "max-w-xs" : "max-w-sm";
  const chipCls   = isCompact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  // ✅ 지역 설정 패턴
  const [region, setRegion] = useState<string>(() => localStorage.getItem("region") || "KR");
  useEffect(() => {
    localStorage.setItem("region", region);
    window.dispatchEvent(new CustomEvent("region:change", { detail: region }));
  }, [region]);

  // ✅ 로그인 상태
  const isLoggedIn = !!auth.currentUser;
  
  // 로그인 상태에 따라 대시보드로 리다이렉트
  useEffect(() => {
    if (isLoggedIn) {
      nav(DEFAULT_DASHBOARD_PATH);
    }
  }, [isLoggedIn, nav]);

  // ✅ 텍스트로
  const goText  = () => nav(DEFAULT_DASHBOARD_PATH);

  // ✅ 마이크로 시작 버튼 (익명 로그인 + 음성 페이지)
  const handleMicroStart = async () => {
    console.log('[START] click');               // A
    try {
      // 1) 익명 로그인 (필요 시)
      if (!auth.currentUser) {
        console.log('[START] anon login...');   // B
        await signInAnonymously(auth);
      }
      // 2) 음성 페이지로 이동
      nav('/voice');
    } catch (e) {
      console.error('[START] signInAnonymously failed', e);
      // 필요시 토스트 '로그인에 문제가 있어요. 다시 시도해주세요'
    }
  };

  return (
    <div
      data-ss="overlay-v8"
      className="min-h-screen flex justify-center bg-slate-50/60 pt-20 pb-36 pointer-events-auto" // 가이드 오버레이 + 클릭 활성화
    >
      <div className="w-full max-w-sm px-3">
        {/* 카드 컨테이너 */}
        <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 px-5 py-6">
          {/* 상단 + 배지 */}
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-white shadow ring-1 ring-black/10 flex items-center justify-center -mt-9">
              <span className="text-base font-semibold">+</span>
            </div>
          </div>

          {/* 헤더 */}
          <div className="mt-1 text-center">
            <div className="text-sm font-semibold tracking-wide text-gray-900">YAGO SPORTS</div>
            <div className="text-[11px] text-gray-400 -mt-0.5">AI Platform for Sports Enthusiasts</div>

            <h1 className="mt-4 text-[19px] font-extrabold tracking-tight">스포츠의 시작, 여기</h1>
            <p className="mt-2 text-[12px] leading-5 text-gray-500">
              체육용품 중고거래 · 모임 · 커뮤니티를 한번에<br />
              말로 찾고 바로 연결하세요
            </p>
          </div>

          {/* 마이크 권한 안내 */}
          <div className="mt-4 rounded-xl bg-blue-50 text-[12px] text-blue-800 px-3 py-2 flex gap-2 items-start">
            <span>🎤</span>
            <span>
              마이크 버튼을 누르면 브라우저에서 권한을 묻습니다
            </span>
          </div>

          {/* 주요 액션 */}
          <div className="mt-3 space-y-2.5">
            <button
              type="button"
              onClick={handleMicroStart}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold py-2.5 shadow relative z-10 text-center block"
            >
              마이크로 시작(권장)
            </button>

            <div>
              <label className="mb-1 block text-[11px] text-gray-500">지역</label>
              <select
                className="w-full rounded-xl border px-3 py-2 text-[13px]"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="KR">대한민국 / KR</option>
              </select>
            </div>

            <button
              type="button"
              onClick={goText}
              className="w-full rounded-xl border bg-white hover:bg-gray-50 text-[13px] py-2.5"
            >
              텍스트로 둘러보기
            </button>
          </div>

          {/* 로그인 옵션 */}
          <div className="mt-3">
            <p className="text-center text-[11px] text-gray-400 mb-2">로그인이 필요</p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={isLoggedIn ? "/account" : `/login?next=${encodeURIComponent(DEFAULT_DASHBOARD_PATH)}`}
                className="rounded-xl border bg-white hover:bg-gray-50 text-[13px] py-2 text-center relative z-10"
                role="button"
              >
                {isLoggedIn ? "계정 관리" : "다른 계정"}
              </Link>

              <Link
                to={`/login?next=${encodeURIComponent(DEFAULT_DASHBOARD_PATH)}`}
                className="rounded-xl border bg-white hover:bg-gray-50 text-[13px] py-2 text-center relative z-10"
                role="button"
              >
                로그인
              </Link>
            </div>
          </div>

          {/* 추천 태그 */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border bg-white px-3 py-1.5 text-[12px] text-gray-700">"중고, 최신 경기 정보"</span>
            <span className="rounded-full border bg-white px-3 py-1.5 text-[12px] text-gray-700">"관심 경기 알림"</span>
            <span className="rounded-full border bg-white px-3 py-1.5 text-[12px] text-gray-700">"스포츠 뉴스"</span>
          </div>
        </div>
      </div>
    </div>
  );
}