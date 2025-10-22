// 간단 TTS ??(기본 ko-KR, 브라?��? speechSynthesis ?�용)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TTSOptions = {
  lang?: string;   // "ko-KR"
  rate?: number;   // 0.1 ~ 10 (기본 1)
  pitch?: number;  // 0 ~ 2 (기본 1)
  volume?: number; // 0 ~ 1 (기본 1)
  onTTSStart?: () => void;  // ?�� TTS ?�작 ??콜백
  onTTSEnd?: () => void;    // ?�� TTS 종료 ??콜백
};

export function useTTS(opts: TTSOptions = {}) {
  const { lang = "ko-KR", rate = 1, pitch = 1, volume = 1 } = opts;
  const [ready, setReady] = useState<boolean>(() => "speechSynthesis" in window);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  // 보이??목록 로드
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const vs = window.speechSynthesis.getVoices();
      voicesRef.current = vs;
      const ko = vs.find(v => v.lang?.toLowerCase().startsWith(lang.toLowerCase()));
      setVoice(ko || vs[0] || null);
      setReady(true);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [lang]);

  const cancel = useCallback(() => {
    try { window.speechSynthesis.cancel(); } catch {}
  }, []);

  const speak = useCallback((text: string) => {
    if (!ready || !text) return;
    
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || lang;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    
    // ?�� TTS ?�작 ??STT ?�시 중단
    u.onstart = () => {
      console.log('[TTS] ?�작:', text);
      opts.onTTSStart?.();
    };
    
    // ?�� TTS 종료 ??STT ?�개 가??
    u.onend = () => {
      console.log('[TTS] 종료:', text);
      opts.onTTSEnd?.();
    };
    
    // ?�� TTS ?�류 ?�에??STT ?�개
    u.onerror = () => {
      console.warn('[TTS] ?�류:', text);
      opts.onTTSEnd?.();
    };
    
    window.speechSynthesis.speak(u);
  }, [ready, voice, lang, rate, pitch, volume, opts]);

  return useMemo(() => ({ ready, voice, setVoice, speak, cancel }), [ready, voice, speak, cancel]);
}

export type UseTTSReturn = ReturnType<typeof useTTS>;
