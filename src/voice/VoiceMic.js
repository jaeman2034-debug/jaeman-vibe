import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { httpPing } from '@/diag/globals';
export default function VoiceMic({ tooltip }) {
    const [listening, setListening] = useState(false);
    const recRef = useRef(null);
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR)
            return;
        recRef.current = new SR();
        recRef.current.lang = 'ko-KR';
        recRef.current.continuous = false;
        recRef.current.interimResults = false;
        recRef.current.onresult = (e) => {
            const text = e.results[0][0].transcript.trim();
            console.log('[VOICE] heard:', text);
            handleCommand(text);
            setListening(false);
        };
        recRef.current.onend = () => setListening(false);
    }, []);
    const handleCommand = (text) => {
        // 극단적 심플: 키 액션만 연결
        const clickByAction = (action) => {
            const el = document.querySelector(`[data-voice-action="${action}"]`);
            if (el)
                el.click();
        };
        if (/^마켓$/.test(text))
            return clickByAction('go-market');
        if (/^로그인$/.test(text))
            return clickByAction('signin');
        if (/^로그아웃$/.test(text))
            return clickByAction('signout');
        if (/^(대한민국|한국|코리아)$/.test(text)) {
            const sel = document.querySelector('[data-voice-action="country:select"]');
            if (sel) {
                sel.value = 'KR';
                sel.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return;
        }
        console.log('[VOICE] no rule for:', text);
    };
    const toggle = async () => {
        if (!recRef.current) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다 (Chrome 권장).');
            return;
        }
        // 마이크 활성화 전 네트워크 연결 상태 확인
        const isConnected = await httpPing();
        if (!isConnected) {
            alert('네트워크 연결을 확인할 수 없습니다. 인터넷 연결을 점검해주세요.');
            return;
        }
        if (listening) {
            recRef.current.stop();
            setListening(false);
        }
        else {
            setListening(true);
            recRef.current.start();
        }
    };
    return (_jsx("button", { onClick: toggle, title: tooltip || '음성 명령', className: `h-12 w-12 rounded-full shadow-lg border border-slate-200 
        ${listening ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700'} 
        flex items-center justify-center hover:scale-[1.03] transition`, "aria-label": "\uC74C\uC131 \uBA85\uB839", children: "\uD83C\uDFA4" }));
}
