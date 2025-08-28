import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

// ★ 음성 UI 토글: 필요 없으면 false
const VOICE_UI = true;

export default function StartScreen() {
  const nav = useNavigate();

  // region 퍼시 (없으면 간이 버전)
  const [region, setRegion] = useState(() => localStorage.getItem('region') || 'KR');
  useEffect(() => { localStorage.setItem('region', region); }, [region]);

  // 로그인 여부(임시 더미)
  const [me, setMe] = useState<{id:string; email:string} | null>(null);
  useEffect(() => { setMe(null); }, []);

  // 전역 FAB 숨김 + 스크롤 잠금 (CSS가 죽어도 동작)
  useEffect(() => {
    document.body.classList.add('startscreen','overflow-hidden');
    const fabs = Array.from(document.querySelectorAll<HTMLElement>('.voice-fab, .mic-btn'));
    const prev = fabs.map(el => el.style.display);
    fabs.forEach(el => (el.style.display = 'none'));
    return () => {
      document.body.classList.remove('startscreen','overflow-hidden');
      fabs.forEach((el,i) => (el.style.display = prev[i] ?? ''));
    };
  }, []);

  // 음성 시작 (권한/시작은 VoicePage에서)
  const onVoiceStart = () => nav('/voice');

  const onPrimary = () => (me ? nav('/account') : nav(`/login?next=${encodeURIComponent(location.hash ? location.hash.slice(1) : location.pathname)}`));
  const onLogin   = () => nav(`/login?next=${encodeURIComponent(location.hash ? location.hash.slice(1) : location.pathname)}`);
  const onBrowse  = () => nav('/market');

  // ===== 폴백(인라인) + 표준 Tailwind 유틸 =====
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 2147483000,
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    paddingTop: '24vh', paddingBottom: '10vh', paddingLeft: 16, paddingRight: 16,
    background: '#f6f7fb', overflow: 'auto'
  };
  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 384, // ≈ max-w-sm
    background: '#fff', borderRadius: 16,
    boxShadow: '0 12px 30px rgba(0,0,0,.12)',
    border: '1px solid rgba(0,0,0,.08)'
  };

  const ui = (
    <div data-ss="overlay-v10" style={overlayStyle}
         className="fixed inset-0 z-50 flex items-start justify-center bg-gray-50 overflow-auto pt-20 pb-10 px-4">
      <div style={cardStyle}
           className="relative w-full max-w-xs bg-white rounded-2xl shadow-xl border border-black/10">

        {/* 로고 박스 */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl
                bg-white border border-black/10 shadow-md flex items-center justify-center">
          <span className="text-base">＋</span>
        </div>

                 {/* 헤더 */}
         <div className="pt-9 px-5 pb-4 text-center">
           <h1 className="text-xl font-extrabold tracking-tight">YAGO SPORTS</h1>
           <p className="text-xs text-gray-500 mt-1">AI Platform for Sports Enthusiasts</p>
           <div className="text-lg font-bold mt-3">스포츠의 시작, 야고</div>
           <p className="text-sm leading-6 text-gray-500 mt-1">
             <span className="block">체육인 중고거래 · 모임 · 커뮤니티를 하나로,</span>
             <span className="block">말로 찾고 바로 연결됩니다.</span>
           </p>
         </div>

                 {/* 본문 – compact */}
         <div className="px-5 pb-5 space-y-4">
           {VOICE_UI && (
             <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/70
                             px-3 py-2 text-[13px] leading-5 text-blue-700">
               <span className="mt-0.5">🎙️</span>
               <span>마이크 버튼을 누르면 브라우저에서 권한을 묻습니다</span>
             </div>
           )}

           {VOICE_UI && (
             <button
               onClick={() => nav('/voice')}
               className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
             >
               마이크로 시작(권장)
             </button>
           )}

           <div className="space-y-2">
             <label className="block text-xs text-gray-500">국가/지역</label>
             <select
               value={region}
               onChange={(e) => setRegion(e.target.value)}
               className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="KR">대한민국 / KR</option>
               <option value="JP">日本 / JP</option>
               <option value="US">United States / US</option>
             </select>
           </div>

           {VOICE_UI && (
             <button
               onClick={onBrowse}
               className="w-full h-9 rounded-xl border border-gray-300 text-[15px] font-medium
                          hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
             >
               텍스트로 둘러보기
             </button>
           )}

           <div className="text-center text-xs text-gray-400">로그인 필요</div>

           <div className="grid grid-cols-2 gap-3">
             <button
               onClick={onPrimary}
               className="h-9 rounded-xl border border-gray-300 text-sm font-semibold whitespace-nowrap
                          hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
             >
               계정 관리 / 다른 계정으로
             </button>
             <button
               onClick={onLogin}
               className="h-9 rounded-xl border border-gray-300 text-sm font-semibold whitespace-nowrap
                          hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
             >
               로그인
             </button>
           </div>

           {VOICE_UI && (
             <div className="grid grid-cols-2 gap-2">
               {['"야고, 최신 경기 알려줘"', '"두산 경기 일정"', '"내 팀 뉴스"'].map((t) => (
                 <span key={t}
                       className="px-2.5 py-1 rounded-full border bg-white text-xs text-gray-700 hover:bg-gray-50">
                   {t}
                 </span>
               ))}
             </div>
           )}
         </div>
      </div>
    </div>
  );

  return (
    <>
      {import.meta.env.DEV && (
        <div className="fixed top-2 left-2 text-blue-700">StartScreen Loaded</div>
      )}
      {createPortal(ui, document.body)}
    </>
  );
}
