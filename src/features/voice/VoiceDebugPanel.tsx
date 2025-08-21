// VoiceDebugPanel.tsx
import React from "react";
import { useSpeech } from "./useSpeech";
import UnifiedMicButton from "./UnifiedMicButton"; // 앞서 준 PTT/토글 겸용 버튼

export default function VoiceDebugPanel() {
  const { isListening, thresholds, meter, sttSupport } = useSpeech();

  const barWidth = Math.min(100, Math.round((meter.rms / (thresholds?.start || 0.02)) * 100));

  return (
    <div style={{
      padding: 12, border: "1px solid #eee", borderRadius: 12, maxWidth: 420, fontFamily: "system-ui",
    }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          background: isListening ? "#1db954" : "#bbb"
        }} />
        <b>{isListening ? "Listening" : "Idle"}</b>
      </div>

      <div style={{ marginBottom: 8, fontSize: 14 }}>
        <div>RMS: {meter.rms.toFixed(4)} &nbsp;|&nbsp; dBFS: {Number.isFinite(meter.db) ? meter.db.toFixed(1) : "-∞"}</div>
        <div>start≥ {thresholds?.start?.toFixed(4) ?? "—"} / stop≥ {thresholds?.stop?.toFixed(4) ?? "—"}</div>
      </div>

      <div style={{ height: 8, background: "#f2f2f2", borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ width: `${barWidth}%`, height: "100%" }} />
      </div>

      {!sttSupport.ok ? (
        <div style={{ 
          padding: 12, 
          background: "#fff3cd", 
          border: "1px solid #ffeaa7", 
          borderRadius: 8, 
          color: "#856404",
          fontSize: 14
        }}>
          {sttSupport.reason === "NEED_HTTPS" 
            ? "HTTPS 환경이 필요합니다. https://localhost 또는 배포 URL로 접속해 주세요."
            : "이 브라우저는 Web Speech(음성 인식)를 제공하지 않습니다. 키보드로 입력해 주세요."
          }
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            {/* 토글 모드 */}
            <UnifiedMicButton mode="toggle" />
            {/* 길게 눌러 말하기(PTT) */}
            <UnifiedMicButton mode="ptt" />
          </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        • 토글: 클릭으로 켜고/끄기 &nbsp;• PTT: 누르는 동안만 듣기
      </div>
      
      {/* 환경 팁 */}
      <div style={{ 
        marginTop: 12, 
        padding: 12, 
        background: "#f0f9ff", 
        border: "1px solid #bae6fd", 
        borderRadius: 8, 
        fontSize: 12,
        color: "#0369a1"
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>🎯 환경 팁</div>
        <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.4 }}>
          <li>마이크 입력 레벨을 70~90%로 올려보세요</li>
          <li>마이크에 좀 더 가까이 말해보세요</li>
          <li>시크릿 창에서 확장 프로그램 없이 테스트</li>
          <li>localhost 또는 HTTPS로 접속 (LAN IP는 품질 저하)</li>
        </ul>
      </div>
        </>
      )}
    </div>
  );
} 