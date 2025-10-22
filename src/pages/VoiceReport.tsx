// === YAGO VIBE AI ?¬ê³ /ì¡°íšŒ/?ë§¤ ?Œë¦¼ ?´ì‹œ?¤í„´??===
import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function VoiceReport() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // ?”Š ?Œì„± ì¶œë ¥ ?¨ìˆ˜ (TTS)
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn("??ë¸Œë¼?°ì????Œì„± ?©ì„±??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
      return;
    }

    // ?´ì „ ?Œì„± ì¤‘ì?
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 1.5; // ìµœì  ?ë„ ?¤ì •
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      console.log("?”Š AI ë³´ê³ ???Œì„± ì¶œë ¥ ?œì‘:", text);
    };

    utterance.onend = () => {
      console.log("?”Š AI ë³´ê³ ???Œì„± ì¶œë ¥ ?„ë£Œ");
    };

    utterance.onerror = (e) => {
      console.error("TTS ?¤ë¥˜:", e);
    };

    window.speechSynthesis.speak(utterance);
  };

  // ?” AI ë³´ê³ ???˜ì‹  (n8n ?¹í›…)
  const fetchReport = async () => {
    setLoading(true);
    try {
      const proxyUrl = import.meta.env.VITE_OPENAI_PROXY_URL;
      
      if (!proxyUrl || proxyUrl.includes('your-n8n-server.com')) {
        // n8n ?¹í›…???¤ì •?˜ì? ?Šì? ê²½ìš° ë¡œì»¬ ?°ì´?°ë¡œ ë³´ê³ ???ì„±
        console.log("n8n ?¹í›…???¤ì •?˜ì? ?ŠìŒ, ë¡œì»¬ ?°ì´?°ë¡œ ë³´ê³ ???ì„±");
        await generateLocalReport();
        return;
      }

      // n8n ?¹í›… ?¸ì¶œ
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
        throw new Error(`n8n ?¹í›… ?¤ë¥˜: ${response.status}`);
      }

      const data = await response.json();
      setReportData(data);
      
      if (data.message) {
        speak(data.message);
      } else {
        speak("?ˆë¡œ??ë¦¬í¬?¸ê? ?†ìŠµ?ˆë‹¤.");
      }

    } catch (error) {
      console.error("ë³´ê³ ??ë¶ˆëŸ¬?¤ê¸° ?¤íŒ¨:", error);
      speak("AI ë³´ê³ ?œë? ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ?? ë¡œì»¬ ?°ì´?°ë¡œ ?ì„±?©ë‹ˆ??");
      await generateLocalReport();
    } finally {
      setLoading(false);
    }
  };

  // ?“Š ë¡œì»¬ ?°ì´?°ë¡œ ë³´ê³ ???ì„±
  const generateLocalReport = async () => {
    try {
      // Firestore?ì„œ ìµœê·¼ ?í’ˆ ?°ì´??ì¡°íšŒ
      const marketItemsRef = collection(db, "market_items");
      const q = query(marketItemsRef, orderBy("createdAt", "desc"), limit(20));
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ê¸°ë³¸ ?µê³„ ê³„ì‚°
      const totalItems = items.length;
      const activeItems = items.filter(item => item.status === "active").length;
      const soldItems = items.filter(item => item.status === "sold").length;
      const aiGeneratedItems = items.filter(item => item.aiGenerated === true).length;
      const voiceEnabledItems = items.filter(item => item.voiceEnabled === true).length;

      // ì¹´í…Œê³ ë¦¬ë³??µê³„
      const categoryStats = items.reduce((acc, item) => {
        const category = item.category || "ê¸°í?";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // ìµœê³  ?¸ê¸° ì¹´í…Œê³ ë¦¬
      const topCategory = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b - a)[0];

      // ë³´ê³ ??ë©”ì‹œì§€ ?ì„±
      const reportMessage = `?•ë‹˜, ?„ì¬ ?±ë¡???í’ˆ?€ ì´?${totalItems}ê°œì…?ˆë‹¤. 
      ?œì„± ?í’ˆ?€ ${activeItems}ê°? ê±°ë˜ ?„ë£Œ???í’ˆ?€ ${soldItems}ê°œì…?ˆë‹¤. 
      AIê°€ ?ë™ ?ì„±???í’ˆ?€ ${aiGeneratedItems}ê°? ?Œì„±?¼ë¡œ ?±ë¡???í’ˆ?€ ${voiceEnabledItems}ê°œì…?ˆë‹¤. 
      ${topCategory ? `ê°€???¸ê¸° ?ˆëŠ” ì¹´í…Œê³ ë¦¬??${topCategory[0]}ë¡?${topCategory[1]}ê°œê? ?±ë¡?˜ì–´ ?ˆìŠµ?ˆë‹¤.` : ''}`;

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
      console.error("ë¡œì»¬ ë³´ê³ ???ì„± ?¤íŒ¨:", error);
      speak("?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ?“Š ?¤ì‹œê°??í’ˆ ?íƒœ ì¡°íšŒ
  const fetchRealTimeStats = async () => {
    try {
      const marketItemsRef = collection(db, "market_items");
      const q = query(marketItemsRef, where("status", "==", "active"));
      const snapshot = await getDocs(q);
      
      const activeItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ìµœê·¼ 24?œê°„ ???±ë¡???í’ˆ
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentItems = activeItems.filter(item => {
        const createdAt = item.createdAt?.toDate();
        return createdAt && createdAt > yesterday;
      });

      const recentReport = `?•ë‹˜, ìµœê·¼ 24?œê°„ ?´ì— ${recentItems.length}ê°œì˜ ???í’ˆ???±ë¡?˜ì—ˆ?µë‹ˆ?? 
      ?„ì¬ ?œì„± ?í’ˆ?€ ì´?${activeItems.length}ê°œì…?ˆë‹¤.`;

      speak(recentReport);
      setLastUpdate(new Date().toLocaleString('ko-KR'));

    } catch (error) {
      console.error("?¤ì‹œê°??µê³„ ì¡°íšŒ ?¤íŒ¨:", error);
      speak("?¤ì‹œê°??°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ?“ˆ ?¸ë Œ??ë¶„ì„ ë³´ê³ ??  const generateTrendReport = async () => {
    try {
      const marketItemsRef = collection(db, "market_items");
      const q = query(marketItemsRef, orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ?´ë²ˆ ì£?vs ì§€??ì£?ë¹„êµ
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

      const trendMessage = `?•ë‹˜, ?´ë²ˆ ì£??±ë¡???í’ˆ?€ ${thisWeekItems.length}ê°œì…?ˆë‹¤. 
      ì§€??ì£??€ë¹?${growthRate > 0 ? `${growthRate}% ì¦ê?` : growthRate < 0 ? `${Math.abs(growthRate)}% ê°ì†Œ` : 'ë³€???†ìŒ'}?ˆìŠµ?ˆë‹¤.`;

      speak(trendMessage);
      setLastUpdate(new Date().toLocaleString('ko-KR'));

    } catch (error) {
      console.error("?¸ë Œ??ë¶„ì„ ?¤íŒ¨:", error);
      speak("?¸ë Œ??ë¶„ì„ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  useEffect(() => {
    // ì»´í¬?ŒíŠ¸ ë§ˆìš´?????ë™?¼ë¡œ ë³´ê³ ???ì„±
    fetchReport();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">?™ï¸?YAGO VIBE AI ?¬ê³  ë³´ê³ ??/h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-center">
          AIê°€ ìµœê·¼ ?°ì´?°ë? ë¶„ì„???Œì„±?¼ë¡œ ?Œë ¤?œë¦½?ˆë‹¤.
        </p>
        {lastUpdate && (
          <p className="text-blue-600 text-sm text-center mt-2">
            ë§ˆì?ë§??…ë°?´íŠ¸: {lastUpdate}
          </p>
        )}
      </div>

      {/* ë³´ê³ ??ë²„íŠ¼??*/}
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
          ?“Š ?„ì²´ ?¬ê³  ë³´ê³ ??        </button>
        
        <button
          onClick={fetchRealTimeStats}
          disabled={loading}
          className={`p-4 rounded-lg font-semibold ${
            loading 
              ? "bg-gray-300 cursor-not-allowed" 
              : "bg-gradient-to-r from-green-600 to-blue-600 text-white hover:opacity-90"
          }`}
        >
          ???¤ì‹œê°??íƒœ ì¡°íšŒ
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
          ?“ˆ ?¸ë Œ??ë¶„ì„ ë³´ê³ ??        </button>
      </div>

      {/* ë¡œë”© ?íƒœ */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">AIê°€ ?°ì´?°ë? ë¶„ì„?˜ê³  ?ˆìŠµ?ˆë‹¤...</p>
        </div>
      )}

      {/* ë³´ê³ ???°ì´???œì‹œ */}
      {reportData && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">?“‹ AI ë¶„ì„ ê²°ê³¼</h2>
          
          {/* ë©”ì‹œì§€ */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">?™ï¸??Œì„± ë³´ê³ ??/h3>
            <p className="text-gray-700">{reportData.message}</p>
          </div>

          {/* ?µê³„ ?°ì´??*/}
          {reportData.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.stats.totalItems}</div>
                <div className="text-sm text-gray-600">ì´??í’ˆ</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reportData.stats.activeItems}</div>
                <div className="text-sm text-gray-600">?œì„± ?í’ˆ</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{reportData.stats.aiGeneratedItems}</div>
                <div className="text-sm text-gray-600">AI ?ì„±</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.stats.voiceEnabledItems}</div>
                <div className="text-sm text-gray-600">?Œì„± ?±ë¡</div>
              </div>
            </div>
          )}

          {/* ì¹´í…Œê³ ë¦¬ë³??µê³„ */}
          {reportData.stats?.categoryStats && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">?·ï¸?ì¹´í…Œê³ ë¦¬ë³??µê³„</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(reportData.stats.categoryStats).map(([category, count]) => (
                  <div key={category} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="font-semibold">{category}</div>
                    <div className="text-lg font-bold text-blue-600">{count}ê°?/div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ?¬ìš© ?ˆë‚´ */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">?’¡ ?¬ìš© ?ˆë‚´</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>??<strong>?„ì²´ ?¬ê³  ë³´ê³ ??</strong> ëª¨ë“  ?í’ˆ???„ì¬ ?íƒœë¥?ì¢…í•©?ìœ¼ë¡?ë¶„ì„</li>
          <li>??<strong>?¤ì‹œê°??íƒœ ì¡°íšŒ:</strong> ìµœê·¼ 24?œê°„ ???±ë¡???í’ˆê³??œì„± ?í’ˆ ?„í™©</li>
          <li>??<strong>?¸ë Œ??ë¶„ì„ ë³´ê³ ??</strong> ?´ë²ˆ ì£?vs ì§€??ì£??±ë¡ ?¸ë Œ??ë¶„ì„</li>
          <li>??ëª¨ë“  ë³´ê³ ?œëŠ” ?Œì„±?¼ë¡œ ?ë™ ?ˆë‚´?©ë‹ˆ??/li>
        </ul>
      </div>
    </div>
  );
}
