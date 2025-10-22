// ê°„ë‹¨ TTS ??(ê¸°ë³¸ ko-KR, ë¸Œë¼?°ì? speechSynthesis ?¬ìš©)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TTSOptions = {
  lang?: string;   // "ko-KR"
  rate?: number;   // 0.1 ~ 10 (ê¸°ë³¸ 1)
  pitch?: number;  // 0 ~ 2 (ê¸°ë³¸ 1)
  volume?: number; // 0 ~ 1 (ê¸°ë³¸ 1)
  onTTSStart?: () => void;  // ?”’ TTS ?œìž‘ ??ì½œë°±
  onTTSEnd?: () => void;    // ?”’ TTS ì¢…ë£Œ ??ì½œë°±
};

export function useTTS(opts: TTSOptions = {}) {
  const { lang = "ko-KR", rate = 1, pitch = 1, volume = 1 } = opts;
  const [ready, setReady] = useState<boolean>(() => "speechSynthesis" in window);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  // ë³´ì´??ëª©ë¡ ë¡œë“œ
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
    
    // ?”’ TTS ?œìž‘ ??STT ?¼ì‹œ ì¤‘ë‹¨
    u.onstart = () => {
      console.log('[TTS] ?œìž‘:', text);
      opts.onTTSStart?.();
    };
    
    // ?”’ TTS ì¢…ë£Œ ??STT ?¬ê°œ ê°€??
    u.onend = () => {
      console.log('[TTS] ì¢…ë£Œ:', text);
      opts.onTTSEnd?.();
    };
    
    // ?”’ TTS ?¤ë¥˜ ?œì—??STT ?¬ê°œ
    u.onerror = () => {
      console.warn('[TTS] ?¤ë¥˜:', text);
      opts.onTTSEnd?.();
    };
    
    window.speechSynthesis.speak(u);
  }, [ready, voice, lang, rate, pitch, volume, opts]);

  return useMemo(() => ({ ready, voice, setVoice, speak, cancel }), [ready, voice, speak, cancel]);
}

export type UseTTSReturn = ReturnType<typeof useTTS>;
