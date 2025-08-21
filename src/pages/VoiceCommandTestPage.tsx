import React, { useState } from "react";
import { useVoiceAgent } from "../voice/useVoiceAgent";
import { nlu } from "../voice/nlu/simpleNlu";
import { routeCommand } from "../voice/commandRouter";

export default function VoiceCommandTestPage() {
  const [testInput, setTestInput] = useState("");
  const [lastResult, setLastResult] = useState<any>(null);
  const { handleTranscript, last, lastCmd } = useVoiceAgent();

  const testCommands = [
    "마켓으로 이동",
    "축구화 카테고리 보여줘",
    "상품 촬영 시작",
    "6만5천원에 상품 등록해",
    "상품 AI 분석해줘",
    "내 주변 2km 매물 보여줘",
    "도움말",
    "취소",
  ];

  const handleTest = async (command: string) => {
    setTestInput(command);
    const cmd = nlu(command);
    setLastResult(cmd);
    if (cmd) {
      try {
        await routeCommand(cmd);
      } catch (error) {
        console.error("Command execution failed:", error);
      }
    }
  };

  const handleManualTest = async () => {
    if (!testInput.trim()) return;
    await handleTest(testInput);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🎤 음성 명령 테스트</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          한국어 음성 명령으로 모든 기능을 제어해보세요
        </p>
      </div>

      {/* 실시간 음성 입력 결과 */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-4">🎙️ 실시간 음성 입력</h2>
        <div className="space-y-3">
          <div>
            <span className="font-medium">마지막 음성:</span>
            <span className="ml-2 text-zinc-600 dark:text-zinc-400">
              {last || "아직 음성 입력이 없습니다"}
            </span>
          </div>
          <div>
            <span className="font-medium">인식된 명령:</span>
            <pre className="ml-2 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 overflow-auto">
              {lastCmd ? JSON.stringify(lastCmd, null, 2) : "명령이 인식되지 않았습니다"}
            </pre>
          </div>
        </div>
      </div>

      {/* 수동 테스트 */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-4">🧪 수동 명령 테스트</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="음성 명령을 입력하세요 (예: 마켓으로 이동)"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={handleManualTest}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            테스트
          </button>
        </div>
        
        {lastResult && (
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
            <h3 className="font-medium mb-2">명령 분석 결과:</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(lastResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* 빠른 테스트 버튼들 */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-4">⚡ 빠른 테스트</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => handleTest(cmd)}
              className="text-left p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              <div className="font-medium">{cmd}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {nlu(cmd)?.intent || "인식 안됨"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 음성 명령 가이드 */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-4">📚 음성 명령 가이드</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">🚀 네비게이션</h3>
            <ul className="space-y-1 text-sm">
              <li>• "마켓으로 이동" → 마켓 페이지</li>
              <li>• "모임 페이지 열어줘" → 모임 페이지</li>
              <li>• "축구화 카테고리 보여줘" → 마켓의 축구화 카테고리</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">📷 상품 관리</h3>
            <ul className="space-y-1 text-sm">
              <li>• "상품 촬영 시작" → 카메라 모달</li>
              <li>• "6만5천원에 등록해" → 상품 등록 모달</li>
              <li>• "상품 AI 분석해줘" → AI 분석 모달</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">📍 위치 기반</h3>
            <ul className="space-y-1 text-sm">
              <li>• "내 주변 2km 매물 보여줘" → 반경 검색</li>
              <li>• "근처 상품 찾아줘" → 기본 2km 반경</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🛠️ 기타</h3>
            <ul className="space-y-1 text-sm">
              <li>• "도움말" → 명령 가이드</li>
              <li>• "취소" / "닫아" → 현재 작업 취소</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 기술 정보 */}
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">🔧 기술 정보</h2>
        <div className="text-sm space-y-2">
          <p><strong>NLU 엔진:</strong> 규칙 기반 한국어 음성 명령 인식</p>
          <p><strong>지원 언어:</strong> 한국어 (ko-KR)</p>
          <p><strong>음성 입력:</strong> PTT (Push-to-Talk) 모드</p>
          <p><strong>연결 시스템:</strong> ModalProvider, React Router, Firestore</p>
          <p><strong>카메라:</strong> HTTPS 환경에서 카메라 접근</p>
          <p><strong>위치:</strong> Geolocation API + Firestore 반경 검색</p>
        </div>
      </div>
    </div>
  );
} 