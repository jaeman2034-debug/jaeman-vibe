// 🧪 Slack 리포트 테스트 페이지
import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export default function SlackTest() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 🔐 관리자 권한 확인
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">접근 권한 없음</h2>
          <p className="text-gray-600">이 페이지는 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const testSlackReport = async () => {
    try {
      setLoading(true);
      setResult(null);

      console.log("🧪 끝판왕 Slack 리포트 테스트 시작...");

      // Firebase Functions 호출 (끝판왕 버전)
      const generateReport = httpsCallable(functions, "generateEnhancedReport");
      const response = await generateReport({});

      console.log("✅ 끝판왕 테스트 리포트 전송 완료:", response.data);
      setResult(response.data);

    } catch (error) {
      console.error("❌ 끝판왕 테스트 리포트 실패:", error);
      setResult({
        success: false,
        error: error.message || "알 수 없는 오류가 발생했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔥 끝판왕 Slack 리포트 테스트
          </h1>
          <p className="text-gray-600">
            수동으로 끝판왕 버전(Slack + Google Sheets + 주간 요약) 리포트를 전송하여 설정을 테스트할 수 있습니다.
          </p>
        </div>

        {/* 테스트 버튼 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 일일 리포트 테스트</h2>
          
          <div className="mb-4">
            <button
              onClick={testSlackReport}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  테스트 리포트 전송 중...
                </>
              ) : (
                <>
                  📤 테스트 리포트 전송
                </>
              )}
            </button>
          </div>

          <div className="text-sm text-gray-500">
            <p>• 오늘 날짜의 채팅 통계를 계산하여 Slack으로 전송합니다</p>
            <p>• Google Sheets에 데이터를 누적 저장합니다</p>
            <p>• 7일 평균 통계를 자동 계산하여 포함합니다</p>
            <p>• 실제 자동 리포트와 동일한 형식으로 전송됩니다</p>
          </div>
        </div>

        {/* 결과 표시 */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {result.success ? "✅ 테스트 성공" : "❌ 테스트 실패"}
            </h2>

            {result.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">📊 전송된 통계</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">날짜:</span> {result.date}
                    </div>
                    <div>
                      <span className="font-medium">AI 응답:</span> {result.stats?.aiCount || 0}건
                    </div>
                    <div>
                      <span className="font-medium">판매자 응답:</span> {result.stats?.sellerCount || 0}건
                    </div>
                    <div>
                      <span className="font-medium">평균 응답시간:</span> {result.stats?.avgResponseTime || 0}분
                    </div>
                    <div>
                      <span className="font-medium">총 메시지:</span> {result.stats?.totalMessages || 0}건
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">💬 Slack 메시지 미리보기</h3>
                  <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                    🧪 테스트 리포트 ({result.date})<br/>
                    🤖 AI 응답: {result.stats?.aiCount || 0}건<br/>
                    👤 판매자 응답: {result.stats?.sellerCount || 0}건<br/>
                    ⏱ 평균 응답시간: {result.stats?.avgResponseTime || 0}분<br/>
                    📊 총 메시지: {result.stats?.totalMessages || 0}건
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">❌ 오류 발생</h3>
                <p className="text-red-700">{result.error}</p>
              </div>
            )}
          </div>
        )}

        {/* 설정 가이드 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ 설정 가이드</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">1️⃣ Slack 웹훅 설정</h3>
              <p className="text-gray-600">
                Slack 워크스페이스 → 앱 → Incoming Webhooks에서 웹훅 URL을 생성하세요.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">2️⃣ Firebase 환경 변수 설정</h3>
              <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                firebase functions:config:set slack.webhook_url="YOUR_WEBHOOK_URL"
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">3️⃣ Functions 배포</h3>
              <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                firebase deploy --only functions:dailyChatReport
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">4️⃣ 자동 실행</h3>
              <p className="text-gray-600">
                매일 밤 11시(한국시간)에 자동으로 Slack 리포트가 전송됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
