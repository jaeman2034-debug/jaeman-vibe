// src/hooks/useSpeech.ts
import { useEffect, useRef, useState } from 'react';
// 브라우저 Web Speech API
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export function useSpeech(lang = 'ko-KR') {
    const supported = !!SR;
    const recRef = useRef(null);
    const [permission, setPermission] = useState('unknown');
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState('');
    const [finalText, setFinalText] = useState('');
    const [error, setError] = useState(null);
    // 마이크 권한 상태(가능 시)
    useEffect(() => {
        (async () => {
            try {
                const p = navigator.permissions?.query
                    ? await navigator.permissions.query({ name: 'microphone' })
                    : null;
                if (!p)
                    return;
                const toPerm = (s) => s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'unknown';
                setPermission(toPerm(p.state));
                p.onchange = () => setPermission(toPerm(p.state));
            }
            catch {
                /* ignore */
            }
        })();
    }, []);
    // 권한 요청(필요 시)
    async function requestPermission() {
        try {
            const st = await navigator.mediaDevices.getUserMedia({ audio: true });
            st.getTracks().forEach(t => t.stop());
            setPermission('granted');
            return true;
        }
        catch {
            setPermission('denied');
            return false;
        }
    }
    function ensureRecognizer() {
        if (!supported)
            return null;
        if (!recRef.current) {
            const rec = new SR();
            rec.lang = lang;
            rec.continuous = true;
            rec.interimResults = true;
            rec.onstart = () => setListening(true);
            rec.onend = () => setListening(false);
            rec.onerror = (e) => setError(e?.error || 'speech-error');
            rec.onresult = (ev) => {
                let interimStr = '';
                let finalStr = finalText;
                for (let i = ev.resultIndex; i < ev.results.length; i++) {
                    const res = ev.results[i];
                    const txt = (res[0]?.transcript || '').trim();
                    if (res.isFinal)
                        finalStr += (finalStr ? ' ' : '') + txt;
                    else
                        interimStr = txt;
                }
                setInterim(interimStr);
                setFinalText(finalStr);
            };
            recRef.current = rec;
        }
        return recRef.current;
    }
    async function start() {
        if (!supported)
            return;
        if (permission !== 'granted') {
            const ok = await requestPermission();
            if (!ok)
                return;
        }
        setError(null);
        ensureRecognizer()?.start();
    }
    function stop() {
        try {
            ensureRecognizer()?.stop();
        }
        catch { /* ignore */ }
    }
    function reset() {
        setInterim('');
        setFinalText('');
        setError(null);
    }
    return { supported, permission, listening, interim, finalText, error, start, stop, reset, requestPermission };
}
