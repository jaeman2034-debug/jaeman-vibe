import { useEffect, useState } from 'react';
export function useMicPermission() {
    const [state, setState] = useState('unknown');
    useEffect(() => {
        let mounted = true;
        async function probe() {
            try {
                // 일부 브라우저는 'microphone'을 지원
                // 지원 안 하면 getUserMedia를 눌렀을 때 요청하도록 대기
                const p = navigator.permissions?.query
                    ? await navigator.permissions.query({ name: 'microphone' })
                    : null;
                if (!mounted)
                    return;
                if (p) {
                    const s = p.state || 'prompt';
                    setState(s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'prompt');
                    p.onchange = () => {
                        const ns = p.state || 'prompt';
                        setState(ns === 'granted' ? 'granted' : ns === 'denied' ? 'denied' : 'prompt');
                    };
                }
                else {
                    setState('prompt');
                }
            }
            catch {
                setState('prompt');
            }
        }
        probe();
        return () => { mounted = false; };
    }, []);
    async function request() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
            setState('granted');
            return true;
        }
        catch {
            setState('denied');
            return false;
        }
    }
    return { state, request };
}
