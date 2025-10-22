import { useEffect, useState } from 'react';

type MicState = 'unknown' | 'granted' | 'prompt' | 'denied';

export function useMicPermission() {
  const [state, setState] = useState<MicState>('unknown');

  useEffect(() => {
    let mounted = true;
    async function probe() {
      try {
        // ?��? 브라?��???'microphone'??지??
        // 지?????�면 getUserMedia�??��??????�청?�도�??��?
        const p = (navigator as any).permissions?.query
          ? await (navigator as any).permissions.query({ name: 'microphone' })
          : null;
        if (!mounted) return;
        if (p) {
          const s = (p.state as MicState) || 'prompt';
          setState(s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'prompt');
          p.onchange = () => {
            const ns = (p.state as MicState) || 'prompt';
            setState(ns === 'granted' ? 'granted' : ns === 'denied' ? 'denied' : 'prompt');
          };
        } else {
          setState('prompt');
        }
      } catch {
        setState('prompt');
      }
    }
    probe();
    return () => { mounted = false; };
  }, []);

  async function request(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setState('granted');
      return true;
    } catch {
      setState('denied');
      return false;
    }
  }

  return { state, request };
}
