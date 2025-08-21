// usePttStt.ts - PTT 전용 STT 훅 (no-speech 자동 재시도 내장)
import { useEffect, useMemo, useRef, useState } from "react";

function getSR(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

export function usePttStt(lang = "ko-KR", onResult?: (text: string) => void) {
  const [ok, setOk] = useState<boolean>(!!getSR());
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [finalText, setFinalText] = useState("");

  const pressedRef = useRef(false);
  const busyRef = useRef(false);
  const recRef = useRef<SpeechRecognition | null>(null);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micOkRef = useRef(false);

  // ✅ 세션 누적 버퍼 추가
  const finalPiecesRef = useRef<string[]>([]);
  const lastAlternativesRef = useRef<string[]>([]);
  const lastPartialRef = useRef("");

  useEffect(() => setOk(!!getSR()), []);

  // ✅ 버퍼 초기화 함수
  function resetBuffers() { 
    finalPiecesRef.current = []; 
    lastAlternativesRef.current = []; 
  }

  async function ensureMic() {
    if (micOkRef.current) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      micOkRef.current = true;
    } catch (e) {
      alert("마이크 권한을 허용해 주세요.");
      throw e;
    }
  }

  const makeRec = () => {
    const SR: any = getSR();
    if (!SR) return null;
    const r: SpeechRecognition = new SR();
    
    // ✅ 인식기 설정 강화
    r.lang = lang;
    r.continuous = true;          // PTT와 함께 사용
    r.interimResults = true;      // 실시간 자막
    r.maxAlternatives = 5;        // ✅ 대안결과까지 받기(누락 보정에 사용)

    r.onresult = (ev: SpeechRecognitionEvent) => {
      const res = ev.results[ev.results.length - 1];
      const best = res[0]?.transcript?.trim() || "";
      const alts: string[] = [];
      
      // ✅ 대안 결과 수집
      for (let i = 0; i < Math.min(res.length, 5); i++) {
        const t = res[i]?.transcript?.trim();
        if (t) alts.push(t);
      }
      lastAlternativesRef.current = alts;                // ✅ 마지막 N-best 저장

      if (res.isFinal) {
        if (best) finalPiecesRef.current.push(best);     // ✅ 최종 조각 누적
        setPartial("");
        setFinalText(finalPiecesRef.current.join(" "));
      } else {
        lastPartialRef.current = best;
        setPartial(best);
      }

      // 디버그 로그(권장)
      console.log("[STT] result:", best, "alternatives:", alts);
    };

    const restart = () => {
      if (!pressedRef.current) return;
      if (busyRef.current) return;
      if (restartTimer.current) clearTimeout(restartTimer.current);
      restartTimer.current = setTimeout(() => {
        try { r.start(); } catch {} 
      }, 120);
    };

    r.onerror = (e: any) => { 
      console.warn("[STT] onerror:", e?.error||e); 
      if (e?.error === "no-speech" || e?.error === "aborted" || e?.error === "invalid-state") restart(); 
    };
    r.onend = () => { 
      setListening(false); 
      console.log("[STT] onend"); 
      restart(); 
    };
    r.onstart = () => { 
      setListening(true); 
      console.log("[STT] onstart"); 
    };

    return r;
  };

  const start = () => {
    if (!ok || busyRef.current || listening) return;
    busyRef.current = true;
    pressedRef.current = true;
    
    // ✅ start() 호출 시 버퍼 초기화
    resetBuffers();
    
    if (!recRef.current) recRef.current = makeRec();
    try { recRef.current?.start(); } catch {} 
    finally { busyRef.current = false; }
  };

  const stop = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    pressedRef.current = false;
    try { recRef.current?.stop(); } catch {} 
    finally { busyRef.current = false; }
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null; }
  };

  // ✅ stop() 직후 혹시 최종이 늦게 오는 기기 대비: 120ms 지연 후 스냅샷
  function snapshotAfterStop(): { final: string; partial: string; alts: string[] } {
    return { 
      final: finalPiecesRef.current.join(" "), 
      partial: lastPartialRef.current || "", 
      alts: lastAlternativesRef.current 
    };
  }

  const handlers = useMemo(() => {
    const onDown = async (e: any) => {
      e.preventDefault();
      e.stopPropagation();

      // 길게누르기/드래그 방지: 버튼에서 이미 처리했지만 한 번 더 안전망
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

      try { await ensureMic(); } catch { return; }  // ★ 권한 먼저
      start();
      console.log("[PTT] pointerdown");

      // 전역 pointerup으로만 멈춤 (이전 메시지의 global-up 방식 그대로 유지)
      const target = e.currentTarget as HTMLElement;
      const id = e.pointerId;
      const onGlobalUp = () => {
        console.log("[PTT] global pointerup");
        stop();
        try { target.releasePointerCapture?.(id); } catch {} 
        window.removeEventListener("pointerup", onGlobalUp, true);
        window.removeEventListener("pointercancel", onGlobalUp, true);
        window.removeEventListener("blur", onGlobalUp, true);
        document.removeEventListener("visibilitychange", onHide, true);
      };
      const onHide = () => onGlobalUp();

      window.addEventListener("pointerup", onGlobalUp, true);
      window.addEventListener("pointercancel", onGlobalUp, true);
      window.addEventListener("blur", onGlobalUp, true);
      document.addEventListener("visibilitychange", onHide, true);
    };

    return {
      onPointerDown: onDown,
      onClick: (e: any) => e.preventDefault(), // click로 끊기는 것 방지
    };
  }, [start, stop]);

  return { 
    ok, 
    listening, 
    partial, 
    finalText, 
    setFinalText, 
    handlers, 
    start, 
    stop,
    snapshotAfterStop  // start/stop과 함께 스냅샷 함수 제공
  };
} 