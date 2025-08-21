// UnifiedMicButton.tsx
import React from "react";
import { useSpeech } from "./useSpeech"; // 앞서 만든 수동 STT 훅
import { usePttStt } from '../../hooks/usePttStt';
import { useVoiceAgent } from '../../voice/useVoiceAgent';

type Props = { mode?: "toggle" | "ptt"; className?: string };
export default function UnifiedMicButton({ mode = "toggle", className }: Props) {
  const { isListening, onMicClick, startSTT, stopSTT, startPTT, stopPTT, sttSupport } = useSpeech();
  const { handlers, finalText, snapshotAfterStop } = usePttStt();
  const { handleTranscript } = useVoiceAgent();

  // PTT 모드일 때는 onPointerDown/onPointerUp만 연결
  // 이렇게 하면 사용자가 누르고 말하는 동안 STT가 끊겨도 자동으로 다시 이어져요

  // PTT 모드에서 음성 명령 처리
  React.useEffect(() => {
    if (finalText && mode === "ptt") {
      console.log("[Voice] Processing transcript:", finalText);
      handleTranscript(finalText);
    }
  }, [finalText, mode, handleTranscript]);

  // PTT 모드에서 버튼 놓을 때 최종 결과 처리
  const handlePointerUp = React.useCallback((e: any) => {
    if (mode === "ptt") {
      const snapshot = snapshotAfterStop();
      if (snapshot.final) {
        console.log("[Voice] Final transcript:", snapshot.final);
        handleTranscript(snapshot.final);
      }
    }
  }, [mode, snapshotAfterStop, handleTranscript]);

  const label =
    mode === "toggle"
      ? isListening ? "🛑 Stop" : "🎤 Start"
      : isListening ? "🎙️ Listening… (hold)" : "🎤 Hold to talk";

  return (
    <button
      type="button"
      className={className}
      aria-pressed={isListening}
      disabled={!sttSupport.ok}
      onClick={mode === "toggle" ? onMicClick : undefined}
      onPointerDown={mode === "ptt" ? handlers.onPointerDown : undefined}
      onPointerUp={mode === "ptt" ? handlePointerUp : undefined}
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
        cursor: sttSupport.ok ? "pointer" : "not-allowed",
        userSelect: "none",
        opacity: sttSupport.ok ? 1 : 0.6,
      }}
    >
      {label}
    </button>
  );
} 