// PTTTestPage.tsx - PTT만 사용하는 테스트 페이지
import React from "react";
import { useSpeech } from "../features/voice/useSpeech";

export default function PTTTestPage() {
  const { isListening, startPTT, stopPTT, sttSupport } = useSpeech();

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24, color: "#333" }}>🎙️ PTT 전용 테스트</h1>
      
      <div style={{ 
        padding: 16, 
        background: "#f8f9fa", 
        borderRadius: 8, 
        border: "1px solid #e9ecef",
        marginBottom: 24
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>📋 PTT 사용법</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          <li><strong>PTT (Push-to-Talk)</strong>: 버튼을 누르고 있는 동안만 음성 인식</li>
          <li><strong>자동 재시도</strong>: 음성 인식이 끊겨도 자동으로 다시 시작</li>
          <li><strong>VAD 비활성화</strong>: 이 페이지에서는 VAD를 사용하지 않음</li>
        </ul>
      </div>

      {!sttSupport.ok ? (
        <div style={{ 
          padding: 16, 
          background: "#fff3cd", 
          border: "1px solid #ffeaa7", 
          borderRadius: 8, 
          color: "#856404",
          fontSize: 14
        }}>
          {sttSupport.reason === "NEED_HTTPS" 
            ? "HTTPS 환경이 필요합니다. https://localhost 또는 배포 URL로 접속해 주세요."
            : "이 브라우저는 Web Speech(음성 인식)를 제공하지 않습니다."
          }
        </div>
      ) : (
        <>
          {/* PTT 버튼 */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button
              onPointerDown={startPTT}
              onPointerUp={stopPTT}
              onPointerCancel={stopPTT}
              onPointerLeave={stopPTT}
              style={{
                padding: "24px 48px",
                borderRadius: 16,
                border: "none",
                background: isListening ? "#dc2626" : "#2563eb",
                color: "white",
                fontSize: 20,
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
                transition: "all 0.2s ease",
                boxShadow: isListening ? "0 4px 12px rgba(220, 38, 38, 0.4)" : "0 4px 12px rgba(37, 99, 235, 0.4)"
              }}
            >
              {isListening ? "🎙️ 말하는 중... (놓으세요)" : "🎤 길게 눌러 말하기"}
            </button>
          </div>

          {/* 상태 표시 */}
          <div style={{ 
            padding: 16, 
            background: "#f0f9ff", 
            border: "1px solid #bae6fd", 
            borderRadius: 8, 
            textAlign: "center"
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              상태: {isListening ? "🎙️ 듣는 중" : "⏸️ 대기 중"}
            </div>
            <div style={{ fontSize: 14, color: "#0369a1" }}>
              {isListening 
                ? "버튼을 놓으면 음성 인식이 중지됩니다"
                : "버튼을 길게 누르고 말해보세요"
              }
            </div>
          </div>

          {/* 환경 팁 */}
          <div style={{ 
            marginTop: 24, 
            padding: 16, 
            background: "#fef3c7", 
            border: "1px solid #f59e0b", 
            borderRadius: 8, 
            fontSize: 14,
            color: "#92400e"
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>🎯 환경 팁</div>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.5 }}>
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