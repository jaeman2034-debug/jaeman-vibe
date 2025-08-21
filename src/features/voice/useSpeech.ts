// useSpeech.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { startSimpleVAD } from "./simple-vad";
import { detectSttSupport } from "./sttSupport";

// ★ 자동 토글 금지
const AUTO_STT = false;

// VAD 활성화 여부 (PTT만 쓸 때는 false로 설정)
const ENABLE_VAD = false; // VAD 완전 비활성화

// (옵션) 여러 컴포넌트에서 useSpeech()를 써도 VAD가 하나만 돌도록 모듈 레벨 싱글톤
let VAD_SINGLETON: null | { stop: () => void } = null;

// 1) 상단 near imports 아래에 상태 선언 추가
type Thresholds = { noise: number; start: number; stop: number };
type Meter = { rms: number; db: number };

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);

  // ★ 추가: 임계값/미터 상태
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [meter, setMeter] = useState<Meter>({ rms: 0, db: -Infinity });

  // STT 지원 탐지
  const [sttSupport, setSttSupport] = useState<{ok:boolean; reason?:string}>({ ok: true });

  // 버튼 토글의 단일 진실원
  const isListeningRef = useRef(false);

  // Web Speech API 인스턴스
  const recogRef = useRef<SpeechRecognition | null>(null);

  // PTT 전용 음성 인식 인스턴스 ref
  const recRef = useRef<SpeechRecognition | null>(null);

  // VAD 핸들(이 훅 내부에서 참조용)
  const vadRef = useRef<null | { stop: () => void }>(null);

  // 내부에서 프레임마다 업데이트되는 레벨을 ref로 받았다가 100ms마다 state로 반영
  const levelRef = useRef(0);

  // PTT 자동 재시도 관련 refs
  const pressedRef = useRef(false);
  const busyRef = useRef(false);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ★ 추가: 100ms 간격으로 미터 표시 업데이트
  useEffect(() => {
    const id = setInterval(() => {
      const rms = levelRef.current;
      const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
      setMeter({ rms, db });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // 초기 한 번만 체크
  useEffect(() => {
    setSttSupport(detectSttSupport());
  }, []);

  // --- Web Speech 준비
  const makeRecognizer = useCallback((): SpeechRecognition => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn("Web Speech API not supported in this browser.");
      throw new Error("Web Speech API not supported");
    }
    const r: SpeechRecognition = new SR();
    r.lang = "ko-KR";        // 필요 언어로 변경
    r.continuous = true;     // 길게 듣기
    r.interimResults = true; // 중간 결과 필요 없으면 false
    r.maxAlternatives = 1;

    r.onresult = (ev: SpeechRecognitionEvent) => {
      const last = ev.results[ev.results.length - 1];
      const text = last[0]?.transcript ?? "";
      // TODO: 여기서 text를 파서/상태로 넘기세요.
      console.log("[STT] text:", text);
    };

    const restart = () => {
      if (!pressedRef.current) return;
      if (busyRef.current) return;
      if (restartTimer.current) clearTimeout(restartTimer.current);
      restartTimer.current = setTimeout(() => {
        try { r.start(); } catch {}
      }, 120); // 짧은 backoff
    };

    r.onerror = (e: any) => {
      // 'no-speech'는 재시도 대상
      if (e?.error === "no-speech") restart();
    };
    r.onend = () => {
      // 사용자가 여전히 누르고 있으면 재시도
      restart();
    };
    r.onstart = () => {
      // console.log("[STT] onstart");
    };

    return r;
  }, []);

  const ensureRecognition = useCallback(() => {
    if (recogRef.current) return;
    try {
      recogRef.current = makeRecognizer();
    } catch (e) {
      console.warn("Failed to create recognizer:", e);
    }
  }, [makeRecognizer]);

  // --- STT 제어
  const startSTT = useCallback(async () => {
    if (!sttSupport.ok) {
      console.warn("[STT] not supported:", sttSupport.reason);
      return;
    }
    if (isListeningRef.current) return;
    ensureRecognition();
    if (!recogRef.current) return;

    console.log("starting STT...");
    try {
      recogRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e) {
      console.warn("STT start failed:", e);
    }
  }, [ensureRecognition, sttSupport]);

  const stopSTT = useCallback(async () => {
    if (!isListeningRef.current) return;
    if (!recogRef.current) return;

    console.log("stopping STT...");
    try {
      recogRef.current.stop();
    } catch (e) {
      console.warn("STT stop failed:", e);
    }
    isListeningRef.current = false;
    setIsListening(false);
  }, []);

  // PTT 전용 함수들
  const startPTT = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    pressedRef.current = true;

    if (!recRef.current) {
      try {
        recRef.current = makeRecognizer();
      } catch (e) {
        console.warn("Failed to create recognizer for PTT:", e);
        busyRef.current = false;
        return;
      }
    }
    
    try { 
      recRef.current.start(); 
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e) {
      console.warn("PTT start failed:", e);
    } finally { 
      busyRef.current = false; 
    }
  }, [makeRecognizer]);

  const stopPTT = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    pressedRef.current = false;
    
    if (!recRef.current) {
      console.warn('[PTT] stop ignored (no active rec)');
      busyRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }
    
    try { 
      recRef.current.stop();
    } catch (e) {
      console.warn('[PTT] stop failed', e);
    } finally { 
      recRef.current = null;
      busyRef.current = false; 
    }
    
    if (restartTimer.current) { 
      clearTimeout(restartTimer.current); 
      restartTimer.current = null; 
    }
    
    isListeningRef.current = false;
    setIsListening(false);
  }, []);

  const onMicClick = useCallback(() => {
    if (isListeningRef.current) stopSTT();
    else startSTT();
  }, [startSTT, stopSTT]);

  // --- VAD 초기화(정말 한 번만)
  useEffect(() => {
    // VAD가 비활성화되어 있으면 초기화하지 않음
    if (!ENABLE_VAD) {
      console.log("[VAD] Disabled - PTT mode only");
      return;
    }

    // 이미 다른 컴포넌트에서 만든 싱글톤이 있으면 그대로 재사용
    if (VAD_SINGLETON) {
      vadRef.current = VAD_SINGLETON;
      return;
    }

    let cancelled = false;
    startSimpleVAD({
      onRms: (r) => { levelRef.current = r; },           // ★ 추가: 레벨만 ref로 축적
      onReady: (info) => setThresholds(info),            // ★ 추가: 임계값 수신
      onSpeechStart: () => {
        console.log("[VAD] Speech detected");
        if (!AUTO_STT) return;              // 수동 모드
        if (!isListeningRef.current) startSTT();
      },
      onSpeechEnd: () => {
        console.log("[VAD] Speech ended");
        if (!AUTO_STT) return;
        if (isListeningRef.current) stopSTT();
      },
    }).then((v) => {
      if (!cancelled) {
        vadRef.current = v;
        VAD_SINGLETON = v; // 모듈 레벨 싱글톤 보관
      }
    });

    return () => {
      cancelled = true;
      // 싱글톤이므로 여기서 stop()는 호출하지 않음
      // (앱 전역에서 VAD 하나만 유지; 필요하면 Provider 패턴 권장)
    };
  }, [startSTT, stopSTT]);

  // cleanup: 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      try { 
        recRef.current?.stop(); 
        recogRef.current?.stop();
      } catch {}
      recRef.current = null;
      recogRef.current = null;
    };
  }, []);

  // ★ 추가: thresholds, meter를 함께 반환
  return { isListening, onMicClick, startSTT, stopSTT, startPTT, stopPTT, thresholds, meter, sttSupport };
} 