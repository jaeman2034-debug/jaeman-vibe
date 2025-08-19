// VoiceTestPage.tsx
import React from "react";
import VoiceDebugPanel from "../features/voice/VoiceDebugPanel";

export default function VoiceTestPage() {
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24, color: "#333" }}>🎤 음성 인식 테스트</h1>
      
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: "#666" }}>VAD & STT 디버그 패널</h2>
        <VoiceDebugPanel />
      </div>

      <div style={{ 
        padding: 16, 
        background: "#f8f9fa", 
        borderRadius: 8, 
        border: "1px solid #e9ecef",
        fontSize: 14,
        color: "#495057"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>📋 사용법</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>토글 모드</strong>: 클릭으로 음성 인식을 켜고 끄기</li>
          <li><strong>PTT 모드</strong>: 버튼을 누르고 있는 동안만 음성 인식</li>
          <li><strong>프로그레스 바</strong>: 현재 오디오 레벨을 시작 임계값 대비로 표시</li>
          <li><strong>임계값</strong>: VAD가 음성을 감지하는 기준값</li>
        </ul>
      </div>
    </div>
  );
} 