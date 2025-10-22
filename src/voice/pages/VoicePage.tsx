import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSpeech } from "@/voice/hooks/useSpeech";
import { useToast } from "@/components/ui/Toast";
import { useTTS } from "@/voice/hooks/useTTS";
import useVoiceAgent from "@/voice/useVoiceAgent";
import { isLoginIntent, getLoginRoute, getVoicePageLoginRoute } from "@/voice/intentLogin";
import { useVoiceOnboard } from "@/voice/hooks/useVoiceOnboard";
import { useAuth } from "@/features/auth/AuthContext";

export default function VoicePage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const { supported, isListening, transcript, partial, error, start, stop, reset, pauseForTTS, resumeAfterTTS } = useSpeech("ko-KR", toast);
  
  // TTS 상태 추적 (useSpeech 훅의 상태와 분리)
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { speak, cancel } = useTTS({ 
    lang: "ko-KR", 
    rate: 1,
    onTTSStart: () => {
      setIsSpeaking(true);
      pauseForTTS();
    },
    onTTSEnd: () => {
      setIsSpeaking(false);
      resumeAfterTTS();
    }
  });
  const agent = useVoiceAgent({ say: speak });                  // 에이전트에게 말하라고 전달
  const lastLenRef = useRef(0);

  // URL 파라미터에서 from, next, autostart, flow, stage 추출
  const from = searchParams.get("from") || "/start";
  const next = searchParams.get("next") || "/market";
  const autostart = searchParams.get("autostart") === "1";
  const flow = searchParams.get("flow") || "onboard"; // 기본값을 onboard로 설정
  const stage = searchParams.get("stage");

  // 온보딩 컨텍스트 초기화
  const onboardCtx = {
    say: transcript,
    go: nav,
    user,
    tts: speak,
    get: (key: string) => searchParams.get(key)
  };
  const { handle: handleOnboard } = useVoiceOnboard(onboardCtx);

  // 자동 시작 로직 (한번만)
  const didAutostart = useRef(false);
  useEffect(() => {
    if (autostart && !didAutostart.current && !isListening && supported) {
      didAutostart.current = true; // 한번만 실행
      start().catch(console.warn);
    }
  }, [autostart, isListening, supported, start]);

  // TTS 종료 후 자동 시작이었으면 STT 재개
  useEffect(() => {
    if (autostart && didAutostart.current && !isListening && !isSpeaking) {
      // TTS가 끝나고 STT가 멈춰있다면 다시 시작
      start().catch(console.warn);
    }
  }, [autostart, isListening, isSpeaking, start]);

  // Welcome stage 처리 (가입 완료 후)
  useEffect(() => {
    if (stage === 'welcome' && user) {
      speak('가입 완료, 바로 시작합니다');
      setTimeout(() => {
        nav(next);
      }, 2000);
    }
  }, [stage, user, speak, nav, next]);

  useEffect(() => {
    if (!supported) {
      toast.warn("브라우저에서 음성 인식을 지원하지 않습니다. Chrome/Edge를 권장합니다");
    }
    
    // 권한 상태 표시를 위한 확인
    const updatePermissionStatus = async () => {
      try {
        // 마이크 권한 상태 확인
        if (navigator.permissions?.query) {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          const statusEl = document.getElementById('permission-status');
          if (statusEl) {
            statusEl.textContent = permission.state;
            statusEl.className = permission.state === 'granted' ? 'text-green-600 font-medium' : 
                                permission.state === 'prompt' ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium';
          }
          
          // 권한 상태 변경 감지
          permission.onchange = () => updatePermissionStatus();
        }
        
        // AudioContext 상태 확인
        if (window.AudioContext || (window as any).webkitAudioContext) {
          const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
          const statusEl = document.getElementById('audiocontext-status');
          if (statusEl) {
            statusEl.textContent = ac.state;
            statusEl.className = ac.state === 'running' ? 'text-green-600 font-medium' : 
                                ac.state === 'suspended' ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium';
          }
        }
      } catch (e) {
        console.error('Permission status check failed:', e);
      }
    };
    
    updatePermissionStatus();
  }, [supported, toast]);

  useEffect(() => {
    if (!error) return;
    let m = "";
    
    if (error === "no-permission") {
      m = "주소창에서 마이크 권한을 허용해주세요. 사용 시 '음성 시작'이라고 말해 주세요";
    } else if (error === "audio-capture") {
      m = "마이크를 찾을 수 없어요. 연결 상태를 확인해주세요";
    } else if (error === "network") {
      m = "음성 인식 서비스 네트워크 오류가 발생했습니다";
    } else if (error === "popup-blocked") {
      m = "브라우저에서 로그인 창을 허용해주세요. 음성 '구글 로그인'이라고 말해 보세요";
    } else {
      m = "음성 인식에 문제가 발생했습니다";
    }
    
    toast.error(m);
    speak(m);
  }, [error, toast, speak]);

  // 최종 문장 완성될 때만 에이전트 호출
  useEffect(() => {
    if (!transcript) { lastLenRef.current = 0; return; }
    const delta = transcript.slice(lastLenRef.current).trim();
    if (!delta) return;
    lastLenRef.current = transcript.length;
    
    console.log('[VOICE] 음성 인식 결과:', delta);
    console.log('[VOICE] 현재 flow:', flow);
    
    // 온보딩 플로우 처리 (우선)
    if (flow === 'onboard') {
      console.log('[VOICE] 온보딩 플로우 처리 시도');
      if (handleOnboard(delta)) {
        console.log('[VOICE] 온보딩 처리 완료, 마이크 중지');
        stop(true); // 즉시 마이크 중지 (abort로 강제 종료)
        return;
      }
    }
    
    // 로그인/가입 페이지에서 온 경우 우선 처리
    if (from === "login" || from === "signup") {
      const loginRoute = getVoicePageLoginRoute(delta, from, next);
      if (loginRoute) {
        console.log('[VOICE] auth page command:', delta, '->', loginRoute);
        stop(true); // 즉시 마이크 중지
        nav(loginRoute);
        return;
      }
    }
    
    // 일반 로그인 의도 체크
    const loginRoute = getLoginRoute(delta);
    if (loginRoute) {
      console.log('[VOICE] route ->', loginRoute);
      stop(true); // 즉시 마이크 중지
      nav(loginRoute);
      return;
    }
    
    // 기존 에이전트 처리
    agent.handle(delta);
  }, [transcript, agent, nav, from, next, flow, handleOnboard]);

  // 스페이스바로 음성 시작/중지 (개발용)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isListening) { e.preventDefault(); start(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && isListening) { e.preventDefault(); stop(); }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [isListening, start, stop]);

  const onToggle = async () => {
    if (isListening) {
      stop(false);
      cancel();
    } else {
      start();
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">음성으로 검색</h1>
        <button onClick={() => nav(-1)} className="rounded-lg border px-3 py-1.5">뒤로</button>
      </div>

      {/* 상태 카드 */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 text-sm text-gray-500">
          {supported ? (isListening ? "듣는 중..." : "대기 중") : "브라우저에서 음성 인식을 지원하지 않습니다"}
        </div>
        
        {/* 권한 상태 표시 */}
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <div>마이크 권한 상태: <span id="permission-status">확인 중...</span></div>
          <div>마이크 AudioContext: <span id="audiocontext-status">확인 중...</span></div>
          <div>현재 TTS 상태: <span className={isSpeaking ? "text-blue-600 font-medium" : "text-gray-600"}>
            {isSpeaking ? "말하는 중..." : "대기 중"}
          </span></div>
        </div>

        {/* 마이크 버튼 */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            disabled={isListening}
            className={`rounded-full px-6 py-3 text-white font-medium shadow transition disabled:opacity-50 disabled:cursor-not-allowed
              ${isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isListening ? "중지" : "시작"}
          </button>
          <button 
            onClick={() => stop(false)} 
            disabled={!isListening}
            className="rounded-lg border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            중지
          </button>
          <button onClick={reset} className="rounded-lg border px-4 py-2">
            초기화
          </button>
        </div>

        {/* 실시간/최종 텍스트 */}
        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 min-h-24">
          {transcript && <p className="whitespace-pre-wrap">{transcript}</p>}
          {partial && <p className="whitespace-pre-wrap opacity-60">{partial}</p>}
          {!transcript && !partial && <span className="text-gray-400">음성 인식 텍스트가 여기에 표시됩니다</span>}
        </div>
      </div>

      {/* 팁 */}
      <ul className="mt-4 list-disc pl-5 text-xs text-gray-500 space-y-1">
        <li>처음 사용 시 **마이크 권한**을 허용해 주세요</li>
        <li>크롬/엣지를 권장합니다. 모바일 사파리는 제한적입니다</li>
      </ul>
    </div>
  );
}