import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const Ctx = createContext(null);
export function VoiceProvider({ children }) {
    const navigate = useNavigate();
    const supported = !!SpeechRecognition;
    const [listening, setListening] = useState(false);
    const [lastText, setLastText] = useState('');
    const [interimText, setInterimText] = useState('');
    const recRef = useRef(null);
    const speak = useCallback((msg) => {
        const u = new SpeechSynthesisUtterance(msg);
        u.lang = 'ko-KR';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    }, []);
    const handle = useCallback((text) => {
        const t = text.trim().toLowerCase();
        const rules = [
            [/시작|스타트|start/, '/start'],
            [/왜|소개|about|why/, '/why'],
            [/마켓|market|상품/, '/market'],
            [/모임|그룹|groups?/, '/groups'],
            [/구직|jobs?/, '/jobs'],
            [/뒤로|back/, 'BACK'],
            [/새로고침|refresh|reload/, 'RELOAD']
        ];
        for (const [rx, path] of rules) {
            if (rx.test(t)) {
                if (path === 'BACK') {
                    history.back();
                    speak('뒤로 이동');
                    return;
                }
                if (path === 'RELOAD') {
                    location.reload();
                    return;
                }
                navigate(path);
                speak(`이동: ${path.replace('/', '')}`);
                return;
            }
        }
        // 액션 버튼 트리거
        if (/로그인|login/.test(t)) {
            document.querySelector('[data-voice-action="login"]')?.click();
            speak('로그인');
            return;
        }
        if (/로그아웃|logout/.test(t)) {
            document.querySelector('[data-voice-action="logout"]')?.click();
            speak('로그아웃');
            return;
        }
        if (/행정동 확인|check.*dong/.test(t)) {
            document.querySelector('[data-voice-action="check-dong"]')?.click();
            speak('행정동 확인');
            return;
        }
        // 검색 명령
        if (/검색|search/.test(t)) {
            document.querySelector('[data-voice-action="search"]')?.click();
            speak('검색 실행');
            return;
        }
        // 모임/구직 생성 명령
        if (/모임 만들기|그룹 만들기|create.*group/.test(t)) {
            navigate('/groups/new');
            speak('모임 만들기 페이지로 이동');
            return;
        }
        if (/구인 등록|구직 등록|create.*job/.test(t)) {
            navigate('/jobs/new');
            speak('구인 등록 페이지로 이동');
            return;
        }
        // 새 상품 등록 명령
        if (/새 상품 등록|상품 등록|create.*product/.test(t)) {
            navigate('/product/new');
            speak('새 상품 등록 페이지로 이동');
            return;
        }
        speak('명령을 이해하지 못했어요');
    }, [navigate, speak]);
    const toggle = useCallback(() => {
        if (!supported)
            return;
        if (!listening) {
            const rec = new SpeechRecognition();
            recRef.current = rec;
            rec.lang = 'ko-KR';
            rec.interimResults = true;
            rec.continuous = true;
            rec.onresult = (e) => {
                let interim = '', final = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const txt = e.results[i][0].transcript;
                    if (e.results[i].isFinal)
                        final += txt;
                    else
                        interim += txt;
                }
                if (interim)
                    setInterimText(interim);
                if (final) {
                    setInterimText('');
                    setLastText(final);
                    handle(final);
                }
            };
            rec.onend = () => setListening(false);
            rec.onerror = () => setListening(false);
            rec.start();
            setListening(true);
        }
        else {
            recRef.current?.stop?.();
            setListening(false);
        }
    }, [supported, listening, handle]);
    const value = useMemo(() => ({ supported, listening, lastText, interimText, toggle, speak }), [supported, listening, lastText, interimText, toggle, speak]);
    return _jsx(Ctx.Provider, { value: value, children: children });
}
export const useVoice = () => {
    const v = useContext(Ctx);
    if (!v)
        throw new Error('useVoice must be used within VoiceProvider');
    return v;
};
