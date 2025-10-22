// Web Speech API 기반 간단 STT 훅(ko-KR 기본)
// 브라우저 지원: Chrome/Edge 권장 (사파리는 webkit 접두어 필요)

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechError =
  | "not-supported"
  | "no-permission"
  | "network"
  | "aborted"
  | "no-speech"
  | "audio-capture"
  | "service-not-allowed"
  | "unknown";

export function useSpeech(lang: string = "ko-KR", toast?: { error: (msg: string) => void }) {
  // @ts-ignore
  const SR: typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition | undefined =
    // @ts-ignore
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const supported = !!SR;
  const [isListening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<SpeechError | null>(null);

  const recRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const isSpeakingRef = useRef(false); // 현재 TTS 중일 때 STT 차단

  const ensureInit = useCallback(() => {
    if (!supported) return;
    if (recRef.current) return;
    // @ts-ignore
    const rec: SpeechRecognition = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      // 현재 TTS 중일 때는 STT 결과 무시 (에코 방지)
      if (isSpeakingRef.current) {
        console.log('[SPEECH] TTS 중이므로 STT 결과 무시');
        return;
      }
      
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalChunk += res[0].transcript;
        else interimChunk += res[0].transcript;
      }
      if (finalChunk) {
        setTranscript((prev) => (prev ? prev + " " : "") + finalChunk.trim());
        setPartial("");
      } else {
        setPartial(interimChunk);
      }
    };

    rec.onerror = (ev: any) => {
      // https://wicg.github.io/speech-api/#speechreco-error
      const err = String(ev.error || "unknown") as SpeechError;
      setError(
        (["no-speech", "audio-capture", "not-allowed", "network"].includes(err)
          ? (err === "not-allowed" ? "no-permission" : (err as any))
          : "unknown") as SpeechError
      );
      setListening(false);
    };

    rec.onstart = () => {
      isListeningRef.current = true;
      setListening(true);
    };

    rec.onend = () => {
      isListeningRef.current = false;
      setListening(false);
    };

    recRef.current = rec;
  }, [SR, supported, lang]);

  const start = useCallback(async () => {
    setError(null);
    if (!supported) {
      setError("not-supported");
      return;
    }
    
    try {
      // 단계 1: 마이크 권한 요청 (사용자 제스처 후에 실행)
      console.log('[SPEECH] Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[SPEECH] Microphone permission granted, stream:', stream);
      
      // 단계 2: AudioContext 생성/활성화 (Chrome 정책)
      if (window.AudioContext || (window as any).webkitAudioContext) {
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ac.state === 'suspended') {
          console.log('[SPEECH] AudioContext suspended, resuming...');
          await ac.resume();
          console.log('[SPEECH] AudioContext resumed:', ac.state);
        }
      }
      
      // 단계 3: SpeechRecognition 시작
      ensureInit();
      try {
        await recRef.current!.start();
        setListening(true);
        console.log('[SPEECH] Speech recognition started successfully');
      } catch (e: any) {
        // 이미 시작된 상태면 조용히 무시
        if (e?.name !== 'InvalidStateError') throw e;
        console.log('[SPEECH] Already started, continuing...');
      }
      
    } catch (e: any) {
      console.error('[SPEECH] Failed to start:', e);
      
      // 권한 관련 오류 처리
             if (e.name === 'NotAllowedError') {
         setError("no-permission");
         toast?.error("마이크 권한이 거부되었습니다. 주소창에서 허용해주세요");
       } else if (e.name === 'NotFoundError') {
         setError("audio-capture");
         toast?.error("마이크를 찾을 수 없습니다. 연결 상태를 확인해주세요");
       } else if (e.name === 'NotSupportedError') {
         setError("not-supported");
         toast?.error("브라우저에서 음성 인식을 지원하지 않습니다");
       } else {
         setError("unknown");
         toast?.error(`음성 인식 시작 실패: ${e.message || e.name}`);
       }
      
      setListening(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [supported, ensureInit]);

  const stop = useCallback((abort = false) => {
    const rec = recRef.current;
    if (!rec) return;
    
    try {
      abort ? rec.abort() : rec.stop();
    } catch (e) {
      console.warn('[SPEECH] Stop failed:', e);
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setPartial("");
    setError(null);
  }, []);

  // 현재 TTS 시작 시 STT 즉시 중단
  const pauseForTTS = useCallback(() => {
    isSpeakingRef.current = true;
    if (isListeningRef.current) {
      console.log('[SPEECH] TTS 시작, STT 즉시 중단');
      try {
        recRef.current?.stop();
      } catch (e) {
        console.warn('[SPEECH] TTS로 STT 중단 실패:', e);
      }
    }
  }, []);

  // 현재 TTS 종료 후 STT 재개
  const resumeAfterTTS = useCallback(() => {
    isSpeakingRef.current = false;
    console.log('[SPEECH] TTS 종료, STT 재개 가능');
    // 자동으로 STT를 다시 시작하지 않음 (사용자가 명시적으로 시작해야 함)
  }, []);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {}
      recRef.current = null;
    };
  }, []);

  return useMemo(
    () => ({ 
      supported, 
      isListening, 
      transcript, 
      partial, 
      error, 
      start, 
      stop, 
      reset,
      pauseForTTS,    // 현재 TTS 시작 시 STT 즉시 중단
      resumeAfterTTS  // 현재 TTS 종료 후 STT 재개
    }),
    [supported, isListening, transcript, partial, error, start, stop, reset, pauseForTTS, resumeAfterTTS]
  );
}

export type UseSpeechReturn = ReturnType<typeof useSpeech>;