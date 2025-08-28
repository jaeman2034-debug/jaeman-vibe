import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
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
    const [me, setMe] = useState(null);
    useEffect(() => { setMe(null); }, []);
    // 전역 FAB 숨김 + 스크롤 잠금 (CSS가 죽어도 동작)
    useEffect(() => {
        document.body.classList.add('startscreen', 'overflow-hidden');
        const fabs = Array.from(document.querySelectorAll('.voice-fab, .mic-btn'));
        const prev = fabs.map(el => el.style.display);
        fabs.forEach(el => (el.style.display = 'none'));
        return () => {
            document.body.classList.remove('startscreen', 'overflow-hidden');
            fabs.forEach((el, i) => (el.style.display = prev[i] ?? ''));
        };
    }, []);
    // 음성 시작 (권한/시작은 VoicePage에서)
    const onVoiceStart = () => nav('/voice');
    const onPrimary = () => (me ? nav('/account') : nav(`/login?next=${encodeURIComponent(location.hash ? location.hash.slice(1) : location.pathname)}`));
    const onLogin = () => nav(`/login?next=${encodeURIComponent(location.hash ? location.hash.slice(1) : location.pathname)}`);
    const onBrowse = () => nav('/market');
    // ===== 폴백(인라인) + 표준 Tailwind 유틸 =====
    const overlayStyle = {
        position: 'fixed', inset: 0, zIndex: 2147483000,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        paddingTop: '24vh', paddingBottom: '10vh', paddingLeft: 16, paddingRight: 16,
        background: '#f6f7fb', overflow: 'auto'
    };
    const cardStyle = {
        width: '100%', maxWidth: 384, // ≈ max-w-sm
        background: '#fff', borderRadius: 16,
        boxShadow: '0 12px 30px rgba(0,0,0,.12)',
        border: '1px solid rgba(0,0,0,.08)'
    };
    const ui = (_jsx("div", { "data-ss": "overlay-v10", style: overlayStyle, className: "fixed inset-0 z-50 flex items-start justify-center bg-gray-50 overflow-auto pt-20 pb-10 px-4", children: _jsxs("div", { style: cardStyle, className: "relative w-full max-w-xs bg-white rounded-2xl shadow-xl border border-black/10", children: [_jsx("div", { className: "absolute -top-7 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl\r\n                bg-white border border-black/10 shadow-md flex items-center justify-center", children: _jsx("span", { className: "text-base", children: "\uFF0B" }) }), _jsxs("div", { className: "pt-9 px-5 pb-4 text-center", children: [_jsx("h1", { className: "text-xl font-extrabold tracking-tight", children: "YAGO SPORTS" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "AI Platform for Sports Enthusiasts" }), _jsx("div", { className: "text-lg font-bold mt-3", children: "\uC2A4\uD3EC\uCE20\uC758 \uC2DC\uC791, \uC57C\uACE0" }), _jsxs("p", { className: "text-sm leading-6 text-gray-500 mt-1", children: [_jsx("span", { className: "block", children: "\uCCB4\uC721\uC778 \uC911\uACE0\uAC70\uB798 \u00B7 \uBAA8\uC784 \u00B7 \uCEE4\uBBA4\uB2C8\uD2F0\uB97C \uD558\uB098\uB85C," }), _jsx("span", { className: "block", children: "\uB9D0\uB85C \uCC3E\uACE0 \uBC14\uB85C \uC5F0\uACB0\uB429\uB2C8\uB2E4." })] })] }), _jsxs("div", { className: "px-5 pb-5 space-y-4", children: [VOICE_UI && (_jsxs("div", { className: "flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/70\r\n                             px-3 py-2 text-[13px] leading-5 text-blue-700", children: [_jsx("span", { className: "mt-0.5", children: "\uD83C\uDF99\uFE0F" }), _jsx("span", { children: "\uB9C8\uC774\uD06C \uBC84\uD2BC\uC744 \uB204\uB974\uBA74 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C \uAD8C\uD55C\uC744 \uBB3B\uC2B5\uB2C8\uB2E4" })] })), VOICE_UI && (_jsx("button", { onClick: () => nav('/voice'), className: "w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold\r\n                          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: "\uB9C8\uC774\uD06C\uB85C \uC2DC\uC791(\uAD8C\uC7A5)" })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-xs text-gray-500", children: "\uAD6D\uAC00/\uC9C0\uC5ED" }), _jsxs("select", { value: region, onChange: (e) => setRegion(e.target.value), className: "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm\r\n                          focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "KR", children: "\uB300\uD55C\uBBFC\uAD6D / KR" }), _jsx("option", { value: "JP", children: "\u65E5\u672C / JP" }), _jsx("option", { value: "US", children: "United States / US" })] })] }), VOICE_UI && (_jsx("button", { onClick: onBrowse, className: "w-full h-9 rounded-xl border border-gray-300 text-[15px] font-medium\r\n                          hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: "\uD14D\uC2A4\uD2B8\uB85C \uB458\uB7EC\uBCF4\uAE30" })), _jsx("div", { className: "text-center text-xs text-gray-400", children: "\uB85C\uADF8\uC778 \uD544\uC694" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("button", { onClick: onPrimary, className: "h-9 rounded-xl border border-gray-300 text-sm font-semibold whitespace-nowrap\r\n                          hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: "\uACC4\uC815 \uAD00\uB9AC / \uB2E4\uB978 \uACC4\uC815\uC73C\uB85C" }), _jsx("button", { onClick: onLogin, className: "h-9 rounded-xl border border-gray-300 text-sm font-semibold whitespace-nowrap\r\n                          hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: "\uB85C\uADF8\uC778" })] }), VOICE_UI && (_jsx("div", { className: "grid grid-cols-2 gap-2", children: ['"야고, 최신 경기 알려줘"', '"두산 경기 일정"', '"내 팀 뉴스"'].map((t) => (_jsx("span", { className: "px-2.5 py-1 rounded-full border bg-white text-xs text-gray-700 hover:bg-gray-50", children: t }, t))) }))] })] }) }));
    return (_jsxs(_Fragment, { children: [import.meta.env.DEV && (_jsx("div", { className: "fixed top-2 left-2 text-blue-700", children: "StartScreen Loaded" })), createPortal(ui, document.body)] }));
}
