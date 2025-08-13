// src/utils/mic.ts

/** 마이크 권한: 성공 true / 실패 false */
export async function ensureMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        }
      });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (err) {
      console.error("마이크 권한 요청 실패:", err);
      return false;
    }
  }
  
  /** 안전 에러 호출(콜백 없으면 콘솔만) */
  function safeError(onError: ((m: string) => void) | undefined, msg: string) {
    console.error(msg);
    if (typeof onError === "function") { try { onError(msg); } catch (e) { console.error(e); } }
  }
  
  // >>> @MIC_LISTEN_ONCE_P_SIMPLE
// === 겹점유 차단용 전역 ===
let __activeStream: MediaStream | null = null;
let __activeAudioCtx: AudioContext | null = null;
let __activeRecognition: any | null = null;

export function forceKillMic() {
  try { __activeRecognition?.stop?.(); } catch {}
  __activeRecognition = null;
  try { __activeStream?.getTracks?.().forEach(t => t.stop()); } catch {}
  __activeStream = null;
  try { 
    if (__activeAudioCtx && __activeAudioCtx.state !== 'closed') {
      __activeAudioCtx.close(); 
    }
  } catch {}
  __activeAudioCtx = null;
}

/**
 * 음성을 한 번만 듣고 텍스트 반환 (간결판)
 * - 간단하고 안정적인 구조
 * - 최종 결과 우선, interim 백업
 * - 겹점유 방지 없이 순수 STT만
 */
export function listenOnceP(locale="ko-KR", totalTimeout=20000, preSpeechTimeout=8000, resultTimeout=10000){
  return new Promise<string>((resolve, reject) => {
    const SR:any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return reject(new Error("이 브라우저는 음성 인식을 지원하지 않습니다."));

    const rec:any = new SR();
    rec.lang = locale;
    rec.interimResults = true;         // 🔸 중간 결과도 받기
    rec.maxAlternatives = 3;
    rec.continuous = false;

    let finished = false, gotSpeech = false;
    let bestFinal = "", bestInterim = "";

    const finish = (fn:()=>void) => { if (finished) return; finished = true;
      try { rec.onresult = rec.onerror = rec.onend = rec.onaudiostart = rec.onsoundstart = rec.onspeechstart = null; } catch {}
      try { rec.stop(); } catch {}
      fn();
    };

    const tTotal = setTimeout(() => finish(() => reject(new Error("시간 초과: 인식이 완료되지 않았습니다."))), totalTimeout);
    let tPre:any, tRes:any;
    const clearTimers = ()=>{ clearTimeout(tTotal); clearTimeout(tPre); clearTimeout(tRes); };

    const armRes = ()=>{ clearTimeout(tRes); tRes=setTimeout(()=>{
      if (!finished) {
        const text = bestFinal || bestInterim || "";
        if (text) finish(()=>{ clearTimers(); resolve(text); });
        else finish(()=>{ clearTimers(); reject(new Error("인식이 조기에 종료되었습니다.")); });
      }
    }, resultTimeout); };

    const mark = ()=>{ if (!gotSpeech){ gotSpeech = true; armRes(); } };
    rec.onaudiostart = mark; rec.onsoundstart = mark; rec.onspeechstart = mark;

    tPre = setTimeout(()=>{ if (!gotSpeech) finish(()=>{ clearTimers(); reject(new Error("말소리가 감지되지 않았습니다.")); }); }, preSpeechTimeout);

    rec.onresult = (e:any) => {
      try {
        console.log("🔍 onresult 이벤트 발생!");
        console.log("📊 results:", e.results);
        
        for (let i=e.resultIndex; i<e.results.length; i++){
          const r=e.results[i], a=r?.[0];
          const t=(a?.transcript||"").trim();
          if (!t) continue;
          if (r.isFinal) bestFinal = t; else bestInterim = t;
        }
        if (gotSpeech) armRes();
        if (bestFinal) finish(()=>{ clearTimers(); resolve(bestFinal); }); // 최종 뜨면 즉시 반환
      } catch {}
    };

    rec.onerror = (e:any) => { finish(()=>{ clearTimers(); reject(new Error(e?.error || "음성 인식 오류")); }); };

    rec.onend = () => {
      console.log("🔚 onend 이벤트 발생");
      if (!finished) {
        const text = bestFinal || bestInterim || "";
        if (text) {
          console.log("✅ onend에서 텍스트 확인:", text);
          finish(()=>{ clearTimers(); resolve(text); });
        } else {
          console.log("⚠️ onend에서 텍스트 없음");
          finish(()=>{ clearTimers(); reject(new Error("인식이 조기에 종료되었습니다.")); });
        }
      }
    };

    try { 
      rec.start(); 
      console.log("🎤 SpeechRecognition 시작됨");
    } catch { 
      finish(()=> reject(new Error("SpeechRecognition 시작 실패"))); 
    }
  });
}
// <<< @MIC_LISTEN_ONCE_P_SIMPLE
  
  /** (옵션) 연속 인식이 필요할 때 사용할 수 있는 헬퍼 */
  export function startListening(
    locale: string,
    onResult: (text: string) => void,
    onError?: (message: string) => void
  ) {
    try {
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) { safeError(onError, "이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해 주세요."); return () => {}; }
  
      const rec: any = new SR();
      rec.lang = locale || "ko-KR";
      rec.interimResults = true;
      rec.continuous = true;
  
      rec.onresult = (e: any) => {
        let acc = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          acc += e.results[i][0].transcript;
        }
        onResult(acc.trim());
      };
  
      rec.onerror = (e: any) => {
        const code = e?.error;
        let msg = "음성 인식 오류가 발생했습니다. 다시 시도해 주세요.";
        if (code === "not-allowed") msg = "마이크 권한이 거부되었습니다. 주소창 왼쪽 🔒에서 '허용'으로 변경하세요.";
        if (code === "audio-capture") msg = "마이크 장치를 찾을 수 없습니다. OS의 입력 장치를 확인하세요.";
        if (code === "no-speech") msg = "말소리가 감지되지 않았습니다. 조금 더 크게 또렷하게 말씀해 주세요.";
        safeError(onError, msg);
      };
  
      rec.start();
      return () => { try { rec.stop(); } catch {} };
    } catch {
      safeError(onError, "startListening 초기화 실패");
      return () => {};
    }
  }
  
// >>> @MIC_VU_METER
/**
 * 실시간 마이크 레벨 미터
 * - onLevel: 0~1 사이 입력 강도 콜백(초당 30~60회)
 * - 반환: stop() 함수 (스트림/오디오컨텍스트 정리)
 */
export async function startMicLevelMeter(onLevel: (v: number) => void) {
  // 🔴 다른 점유 모두 종료
  forceKillMic();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: 16000
    }
  });
  __activeStream = stream;

  const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  __activeAudioCtx = ctx;

  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  const data = new Uint8Array(analyser.frequencyBinCount);
  src.connect(analyser);

  let raf = 0;
  const loop = () => {
    analyser.getByteTimeDomainData(data);
    // 파형의 중앙(128)에서 얼마나 벗어나는지로 레벨 계산
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const dev = Math.abs(data[i] - 128) / 128; // 0~1
      if (dev > peak) peak = dev;
    }
    onLevel(Math.min(1, peak * 2)); // 민감도 살짝 올림
    raf = requestAnimationFrame(loop);
  };
  loop();

  const stop = () => {
    cancelAnimationFrame(raf);
    try { src.disconnect(); } catch {}
    try { analyser.disconnect(); } catch {}
    try { stream.getTracks().forEach(t => t.stop()); } catch {}
    try { ctx.close(); } catch {}
  };
  return stop;
}
// <<< @MIC_VU_METER

// === 디버깅용 전역 노출 ===
(window as any).debugListenOnceP = listenOnceP;
(window as any).debugForceKillMic = forceKillMic;
  