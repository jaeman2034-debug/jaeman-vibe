// === YAGO VIBE AI ?�고/조회/?�매 ?�림 ?�시?�턴??===
import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function VoiceReport() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // ?�� ?�성 출력 ?�수 (TTS)
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn("??브라?��????�성 ?�성??지?�하지 ?�습?�다.");
      return;
    }

    // ?�전 ?�성 중�?
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 1.5; // 최적 ?�도 ?�정
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      console.log("?�� AI 보고???�성 출력 ?�작:", text);
    };

    utterance.onend = () => {
      console.log("?�� AI 보고???�성 출력 ?�료");
    };

    utterance.onerror = (e) => {
      console.error("TTS ?�류:", e);
    };

    window.speechSynthesis.speak(utterance);
  };

  // ?�� AI 보고???�신 (n8n ?�훅)
  const fetchReport = async () => {
    setLoading(true);
    try {
      const proxyUrl = import.meta.env.VITE_OPENAI_PROXY_URL;
      
      if (!proxyUrl || proxyUrl.includes('your-n8n-server.com')) {
        // n8n ?�훅???�정?��? ?��? 경우 로컬 ?�이?�로 보고???�성
        console.log("n8n ?�훅???�정?��? ?�음, 로컬 ?�이?�로 보고???�성");
        await generateLocalReport();
        return;
      }

      // n8n ?�훅 ?�출
      const response = await fetch(`${proxyUrl.replace('ai-describe-tags-category-voice', 'voice-report')}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "daily-inventory-summary"
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n ?�훅 ?�류: ${response.status}`);
      }

      const data = await response.json();
      setReportData(data);
      
      if (data.message) {
        speak(data.message);
      } else {
        speak("?�로??리포?��? ?�습?�다.");
      }

    } catch (error) {
      console.error("보고??불러?�기 ?�패:", error);
      speak("AI 보고?��? 불러?��? 못했?�니?? 로컬 ?�이?�로 ?�성?�니??");
      await generateLocalReport();
    } finally {
      setLoading(false);
    }
  };

  // ?�� 로컬 ?�이?�로 보고???�성
  const generateLocalReport = async () => {
    try {
      // Firestore?�서 최근 ?�품 ?�이??조회
      const marketItemsRef = collection(db, "market_items");
      const q = query(marketItemsRef, orderBy("createdAt", "desc"), limit(20));
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 기본 ?�계 계산
      const totalItems = items.length;
      const activeItems = items.filter(item => item.status === "active").length;
      const soldItems = items.filter(item => item.status === "sold").length;
      const aiGeneratedItems = items.filter(item => item.aiGenerated === true).length;
      const voiceEnabledItems = items.filter(item => item.voiceEnabled === true).length;

      // 카테고리�??�계
      const categoryStats = items.reduce((acc, item) => {
        const category = item.category || "기�?";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 최고 ?�기 카테고리
      const topCategory = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b - a)[0];

      // 보고??메시지 ?�성
      const reportMessage = `?�님, ?�재 ?�록???�품?� �?${totalItems}개입?�다. 
      ?�성 ?�품?� ${activeItems}�? 거래 ?�료???�품?� ${soldItems}개입?�다. 
      AI가 ?�동 ?�성???�품?� ${aiGeneratedItems}�? ?�성?�로 ?�록???�품?� ${voiceEnabledItems}개입?�다. 
      ${topCategory ? `가???�기 ?�는 카테고리??${topCategory[0]}�?${topCategory[1]}개�? ?�록?�어 ?�습?�다.` : ''}`;

      const reportData = {
        message: reportMessage,
        stats: {
          totalItems,
          activeItems,
          soldItems,
          aiGeneratedItems,
          voiceEnabledItems,
          categoryStats
        },
        timestamp: new Date().toISOString()
      };

      setReportData(reportData);
      speak(reportMessage);
      setLastUpdate(new Date().toLocaleString('ko-KR'));

    } catch (error) {
      console.error("로컬 보고???�성 ?�패:", error);
      speak("?�이?��? 불러?�는 �??�류가 발생?�습?�다.");
    }
  };

  // ?�� ?�시�??�품 ?�태 조회
  const fetchRealTimeStats = async () => {
    try {
      const marketItemsRef = collection(db, "market_items");
      const q = query(marketItemsRef, where("status", "==", "active"));
      const snapshot = await getDocs(q);
      
      const activeItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 최근 24?�간 ???�록???�품
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentItems = activeItems.filter(item => {
        const createdAt = item.createdAt?.toDate();
        return createdAt && createdAt > yesterday;
      });

      const recentReport = `?�님, 최근 24?�간 ?�에 ${recentItems.length}개의 ???�품???�록?�었?�니?? 
      ?�재 ?�성 ?�품?� �?${activeItems.length}개입?�다.`;

      speak(recentReport);
      setLastUpdate(new Date().toLocaleString('ko-KR'));

    } catch (error) {
      console.error("?�시�??�계 조회 ?�패:", error);
      speak("?�시�??�이?��? 불러?�는 �??�류가 발생?�습?�다.");
    }
  };

  // ?�� ?�렌??분석 보고??  const generateTrendReport = async () => {
    try {
      const marketItemsRef = collection(db, "market_items");
      const q = query(marketItemsRef, orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ?�번 �?vs 지??�?비교
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const thisWeekItems = items.filter(item => {
        const createdAt = item.createdAt?.toDate();
        return createdAt && createdAt > weekAgo;
      });

      const lastWeekItems = items.filter(item => {
        const createdAt = item.createdAt?.toDate();
        return createdAt && createdAt > twoWeeksAgo && createdAt <= weekAgo;
      });

      const growthRate = lastWeekItems.length > 0 
        ? Math.round(((thisWeekItems.length - lastWeekItems.length) / lastWeekItems.length) * 100)
        : 0;

      const trendMessage = `?�님, ?�번 �??�록???�품?� ${thisWeekItems.length}개입?�다. 
      지??�??��?${growthRate > 0 ? `${growthRate}% 증�?` : growthRate < 0 ? `${Math.abs(growthRate)}% 감소` : '변???�음'}?�습?�다.`;

      speak(trendMessage);
      setLastUpdate(new Date().toLocaleString('ko-KR'));

    } catch (error) {
      console.error("?�렌??분석 ?�패:", error);
      speak("?�렌??분석 �??�류가 발생?�습?�다.");
    }
  };

  useEffect(() => {
    // 컴포?�트 마운?????�동?�로 보고???�성
    fetchReport();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">?���?YAGO VIBE AI ?�고 보고??/h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-center">
          AI가 최근 ?�이?��? 분석???�성?�로 ?�려?�립?�다.
        </p>
        {lastUpdate && (
          <p className="text-blue-600 text-sm text-center mt-2">
            마�?�??�데?�트: {lastUpdate}
          </p>
        )}
      </div>

      {/* 보고??버튼??*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={fetchReport}
          disabled={loading}
          className={`p-4 rounded-lg font-semibold ${
            loading 
              ? "bg-gray-300 cursor-not-allowed" 
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
          }`}
        >
          ?�� ?�체 ?�고 보고??        </button>
        
        <button
          onClick={fetchRealTimeStats}
          disabled={loading}
          className={`p-4 rounded-lg font-semibold ${
            loading 
              ? "bg-gray-300 cursor-not-allowed" 
              : "bg-gradient-to-r from-green-600 to-blue-600 text-white hover:opacity-90"
          }`}
        >
          ???�시�??�태 조회
        </button>
        
        <button
          onClick={generateTrendReport}
          disabled={loading}
          className={`p-4 rounded-lg font-semibold ${
            loading 
              ? "bg-gray-300 cursor-not-allowed" 
              : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
          }`}
        >
          ?�� ?�렌??분석 보고??        </button>
      </div>

      {/* 로딩 ?�태 */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">AI가 ?�이?��? 분석?�고 ?�습?�다...</p>
        </div>
      )}

      {/* 보고???�이???�시 */}
      {reportData && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">?�� AI 분석 결과</h2>
          
          {/* 메시지 */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">?���??�성 보고??/h3>
            <p className="text-gray-700">{reportData.message}</p>
          </div>

          {/* ?�계 ?�이??*/}
          {reportData.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.stats.totalItems}</div>
                <div className="text-sm text-gray-600">�??�품</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reportData.stats.activeItems}</div>
                <div className="text-sm text-gray-600">?�성 ?�품</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{reportData.stats.aiGeneratedItems}</div>
                <div className="text-sm text-gray-600">AI ?�성</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.stats.voiceEnabledItems}</div>
                <div className="text-sm text-gray-600">?�성 ?�록</div>
              </div>
            </div>
          )}

          {/* 카테고리�??�계 */}
          {reportData.stats?.categoryStats && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">?���?카테고리�??�계</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(reportData.stats.categoryStats).map(([category, count]) => (
                  <div key={category} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="font-semibold">{category}</div>
                    <div className="text-lg font-bold text-blue-600">{count}�?/div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ?�용 ?�내 */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">?�� ?�용 ?�내</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>??<strong>?�체 ?�고 보고??</strong> 모든 ?�품???�재 ?�태�?종합?�으�?분석</li>
          <li>??<strong>?�시�??�태 조회:</strong> 최근 24?�간 ???�록???�품�??�성 ?�품 ?�황</li>
          <li>??<strong>?�렌??분석 보고??</strong> ?�번 �?vs 지??�??�록 ?�렌??분석</li>
          <li>??모든 보고?�는 ?�성?�로 ?�동 ?�내?�니??/li>
        </ul>
      </div>
    </div>
  );
}
