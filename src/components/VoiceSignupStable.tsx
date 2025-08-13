import React, { useEffect, useRef, useState } from "react";

/**
 * ✅ 안정화 포인트
 * - 마이크 권한 체크 및 친절한 가이드
 * - HTTPS/오프라인/브라우저 호환성 사전 점검
 * - WebAudio 기반 간단 VAD(음성활성감지): RMS 기준으로 말소리 감지 시에만 STT 시작
 * - SpeechRecognition 예외( no-speech / not-allowed / network / 등 )별 처리
 * - onend / onerror 시 재시도 (지수 백오프, 최대 횟수)
 * - 클린업(마이크/오디오노드/recognition) 철저
 *
 * 사용법:
 * 1) 이 파일을 src/components/VoiceSignupStable.tsx 로 저장
 * 2) 페이지에서 <VoiceSignupStable /> 로 렌더링
 */

type RecognitionLike = SpeechRecognition & {
  // 일부 브라우저는 webkitSpeechRecognition 만 제공
};

const getRecognition = (): RecognitionLike | null => {
  const W = window as any;
  const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!SR) return null;
  return new SR();
};

const supportsMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

const HTTPS_REQUIRED_MESSAGE =
  "마이크 사용을 위해 HTTPS가 필요합니다. 로컬 개발은 https://localhost 로 실행하거나, 배포 환경에서 https를 사용하세요.";
const PERMISSION_MESSAGE =
  "마이크 권한이 필요합니다. 브라우저 상단 주소창의 권한 설정에서 마이크 접근을 허용해 주세요.";
const UNSUPPORTED_MESSAGE =
  "이 브라우저는 Web Speech API를 완전히 지원하지 않을 수 있습니다. Chrome 최신 버전을 권장합니다.";

const VoiceSignupStable: React.FC = () => {
  // UI 상태
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "waiting" | "error">("idle");
  const [hint, setHint] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [lastError, setLastError] = useState<string>("");

  // 오디오 & 인식 객체
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const waitingForSpeechRef = useRef<boolean>(false);

  // 재시도 관리
  const attemptRef = useRef<number>(0);
  const maxAttempts = 4; // 필요 시 조정
  const baseBackoffMs = 800;

  // VAD 파라미터 (간단 RMS 기반)
  const RMS_THRESHOLD = 0.035; // 말소리 시작 인지 기준 (0~1)
  const SPEECH_HANGOVER_MS = 500; // 말 멈춘 뒤 대기 시간
  const minListenMs = 350; // 너무 짧은 발화 방지

  const vadStateRef = useRef<{
    speaking: boolean;
    lastSpeechTs: number;
    startedAt: number | null;
  }>({ speaking: false, lastSpeechTs: 0, startedAt: null });

  // 사전 점검
  useEffect(() => {
    (async () => {
      try {
        if (location.protocol !== "https:" && location.hostname !== "localhost") {
          setHint(HTTPS_REQUIRED_MESSAGE);
        }
        if (!navigator.onLine) {
          setHint("오프라인 상태입니다. 네트워크 연결을 확인하세요.");
        }
        if (!supportsMedia) {
          setHint("이 환경에서는 마이크 접근이 지원되지 않습니다.");
        }
        if (!getRecognition()) {
          setHint((prev) => (prev ? prev + " " : "") + UNSUPPORTED_MESSAGE);
        }

        // 권한 프롬프트 유도 (소음 억제 옵션 포함)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        // 오디오 그래프 구성
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyserRef.current = analyser;
        source.connect(analyser);

        setReady(true);
        setHint("준비 완료. 말소리를 감지하면 자동으로 인식을 시작합니다.");
      } catch (e: any) {
        console.error(e);
        setStatus("error");
        if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) {
          setLastError(PERMISSION_MESSAGE);
        } else {
          setLastError("마이크 초기화 중 오류가 발생했습니다: " + (e?.message || e));
        }
      }
    })();

    return () => {
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // VAD 루프
  useEffect(() => {
    if (!ready || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const data = new Float32Array(analyser.fftSize);

    const tick = () => {
      analyser.getFloatTimeDomainData(data);
      const rms = computeRMS(data);

      const now = performance.now();
      const vs = vadStateRef.current;

      // speaking 판정
      if (!vs.speaking && rms > RMS_THRESHOLD) {
        vs.speaking = true;
        vs.startedAt = now;
        vs.lastSpeechTs = now;
        // 최초 감지 시 STT 시작
        maybeStartRecognition();
      } else if (vs.speaking) {
        if (rms > RMS_THRESHOLD) {
          vs.lastSpeechTs = now;
        } else {
          // 말 멈춤 감지 (hangover)
          if (now - vs.lastSpeechTs > SPEECH_HANGOVER_MS) {
            vs.speaking = false;
            vs.startedAt = null;
            // 인식은 SpeechRecognition이 종료 이벤트에서 마무리
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const computeRMS = (buf: Float32Array) => {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  };

  const maybeStartRecognition = () => {
    if (status === "listening" || waitingForSpeechRef.current) return;
    // 너무 짧은 소음 방지
    const vs = vadStateRef.current;
    if (vs.startedAt && performance.now() - vs.startedAt < minListenMs) return;

    startRecognition();
  };

  const startRecognition = () => {
    const rec = getRecognition();
    if (!rec) {
      setStatus("error");
      setLastError("SpeechRecognition이 지원되지 않습니다. Chrome 최신 버전을 사용해 주세요.");
      return;
    }

    // 초기화
    setStatus("listening");
    setHint("듣고 있어요… 또렷하게 말씀해 주세요.");
    setLastError("");
    attemptRef.current = 0;

    rec.lang = "ko-KR";
    rec.interimResults = true;
    rec.continuous = false; // 발화 단위로 종료

    rec.onstart = () => {
      // console.log("recognition start");
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = res[0]?.transcript || "";
        if (res.isFinal) finalText += txt;
        else interimText += txt;
      }

      if (finalText) setTranscript((prev) => (prev ? prev + " " : "") + finalText.trim());
      if (interimText) setHint(`인식 중: ${interimText}`);
    };

    rec.onerror = (event: any) => {
      const err = event?.error || "unknown";
      handleRecognitionError(err);
    };

    rec.onend = () => {
      // 결과 없이 끝난 경우 재시도
      if (status === "listening") {
        if (!hint.startsWith("인식 중:") && !transcript) {
          scheduleRetry("말소리가 감지되었지만 텍스트가 나오지 않았습니다.");
        } else {
          // 정상 종료 후 대기
          setStatus("waiting");
          setHint("대기 중… 다시 말하면 자동으로 인식합니다.");
        }
      }
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const scheduleRetry = (reason: string) => {
    attemptRef.current += 1;
    if (attemptRef.current > maxAttempts) {
      setStatus("error");
      setLastError(`인식 실패(재시도 초과): ${reason}`);
      setHint("재시도 한도를 초과했습니다. 다시 시도 버튼을 눌러주세요.");
      stopRecognition();
      return;
    }
    const delay = baseBackoffMs * Math.pow(2, attemptRef.current - 1);
    setHint(`다시 시도 중… (${attemptRef.current}/${maxAttempts}) 사유: ${reason}`);
    stopRecognition();
    setTimeout(() => {
      if (status !== "error") startRecognition();
    }, delay);
  };

  const handleRecognitionError = (error: string) => {
    // 브라우저별 공통 에러 핸들링
    switch (error) {
      case "no-speech":
        scheduleRetry("음성이 감지되지 않았습니다.");
        break;
      case "audio-capture":
        setStatus("error");
        setLastError("마이크를 찾을 수 없습니다. 다른 입력 장치를 선택하거나 권한을 확인하세요.");
        break;
      case "not-allowed":
      case "service-not-allowed":
        setStatus("error");
        setLastError(PERMISSION_MESSAGE);
        break;
      case "network":
        scheduleRetry("네트워크 문제로 인식이 중단되었습니다.");
        break;
      case "aborted":
        // 사용자가 수동 정지한 경우 등
        setStatus("idle");
        setHint("중지되었습니다.");
        break;
      default:
        scheduleRetry(`알 수 없는 오류: ${error}`);
        break;
    }
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop();
      recognitionRef.current?.abort();
    } catch {}
    recognitionRef.current = null;
  };

  const cleanupAll = () => {
    stopRecognition();

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  // UI 핸들러
  const handleStart = () => {
    if (!ready) {
      setHint("초기화 중이거나 권한이 없습니다. 새로고침 후 권한을 허용해주세요.");
      return;
    }
    setTranscript("");
    attemptRef.current = 0;
    setStatus("waiting");
    setHint("대기 중… 말하면 자동으로 인식합니다.");
    // VAD가 말소리를 감지하면 자동 시작됨
  };

  const handleStop = () => {
    setStatus("idle");
    setHint("중지됨.");
    stopRecognition();
  };

  const handleClear = () => {
    setTranscript("");
    setHint("텍스트를 초기화했습니다. 말하면 다시 인식합니다.");
  };

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>🎤 음성 회원가입 — 안정화 모드</h2>

      <div style={styles.badgeRow}>
        <Badge label={ready ? "마이크 초기화 OK" : "마이크 준비 중"} ok={ready} />
        <Badge label={navigator.onLine ? "온라인" : "오프라인"} ok={navigator.onLine} />
        <Badge
          label={getRecognition() ? "SpeechRecognition OK" : "SpeechRecognition 미지원"}
          ok={!!getRecognition()}
        />
        <Badge label={location.protocol === "https:" || location.hostname === "localhost" ? "HTTPS/로컬" : "HTTP"} ok={location.protocol === "https:" || location.hostname === "localhost"} />
      </div>

      <div style={styles.controls}>
        <button onClick={handleStart} disabled={!ready || status === "waiting" || status === "listening"} style={styles.btn}>
          시작
        </button>
        <button onClick={handleStop} style={styles.btn}>
          중지
        </button>
        <button onClick={handleClear} style={styles.btnGhost}>
          텍스트 초기화
        </button>
      </div>

      <div style={styles.panel}>
        <div style={styles.row}>
          <span style={styles.label}>상태</span>
          <span style={styles.value}>
            {status === "idle" && "대기"}
            {status === "waiting" && "말소리 대기 중"}
            {status === "listening" && "인식 중"}
            {status === "error" && "오류"}
          </span>
        </div>
        {hint && (
          <div style={styles.hint}>
            {hint}
          </div>
        )}
        {lastError && (
          <div style={styles.error}>
            ⚠️ {lastError}
          </div>
        )}
        <div style={styles.transcript}>
          <div style={styles.tLabel}>인식 결과</div>
          <div style={styles.tBox}>{transcript || <span style={{ opacity: 0.6 }}>아직 텍스트가 없습니다.</span>}</div>
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => {
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        background: ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        color: ok ? "#10B981" : "#EF4444",
        border: `1px solid ${ok ? "#10B981" : "#EF4444"}`,
        marginRight: 8,
      }}
    >
      {label}
    </span>
  );
};

// 인라인 스타일(샘플)
const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 760, margin: "32px auto", padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" },
  title: { fontSize: 20, marginBottom: 12 },
  badgeRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  controls: { display: "flex", gap: 8, marginBottom: 12 },
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#111827",
    color: "white",
    cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "transparent",
    color: "#111827",
    cursor: "pointer",
  },
  panel: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 },
  row: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 13, color: "#6b7280" },
  value: { fontSize: 13, fontWeight: 600 },
  hint: { marginTop: 8, fontSize: 13, color: "#374151" },
  error: { marginTop: 8, fontSize: 13, color: "#b91c1c" },
  transcript: { marginTop: 12 },
  tLabel: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  tBox: {
    minHeight: 90,
    border: "1px dashed #cbd5e1",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
};

export default VoiceSignupStable;
