import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { requestAndSaveFCMToken, setupForegroundPushListener } from "../lib/fcmNotifications";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AdminPWA() {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [latest, setLatest] = useState<any[]>([]);
  const [stats, setStats] = useState({ pos: 0, neu: 0, neg: 0, total: 0 });
  const [online, setOnline] = useState(navigator.onLine);

  // PWA ?¤ì¹˜ ?„ë¡¬?„íŠ¸ ìºì¹˜
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      console.log("?“± PWA ?¤ì¹˜ ?„ë¡¬?„íŠ¸ ì¤€ë¹„ë¨");
      setInstallEvt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ?¨ë¼???¤í”„?¼ì¸ ê°ì?
  useEffect(() => {
    const onlineHandler = () => {
      console.log("???¨ë¼??ë³µê?");
      setOnline(true);
    };
    const offlineHandler = () => {
      console.log("?“´ ?¤í”„?¼ì¸");
      setOnline(false);
    };
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  // ?”” FCM ?¸ì‹œ ?Œë¦¼ ?¤ì •
  useEffect(() => {
    const setupFCM = async () => {
      try {
        // FCM ? í° ?”ì²­ ë°?Firestore ?€??        const token = await requestAndSaveFCMToken();
        if (token) {
          console.log("??FCM ?¤ì • ?„ë£Œ");
        }

        // ?¬ê·¸?¼ìš´???¸ì‹œ ë¦¬ìŠ¤???œì„±??        setupForegroundPushListener();
      } catch (error) {
        console.error("??FCM ?¤ì • ?¤ë¥˜:", error);
      }
    };

    // 1ì´???FCM ?¤ì • (PWA ì´ˆê¸°????
    const timer = setTimeout(setupFCM, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ìµœê·¼ ?”ì•½ 50ê°?+ ê°ì • ì§‘ê³„
  useEffect(() => {
    const q = query(
      collection(db, "chat_summaries"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setLatest(data.slice(0, 5));
        
        const count = { pos: 0, neu: 0, neg: 0, total: data.length };
        data.forEach((s: any) => {
          const sentiment = (s.sentiment || s.emotion || "neutral").toLowerCase();
          if (sentiment.includes("positive") || sentiment === "ê¸ì •") count.pos++;
          else if (sentiment.includes("negative") || sentiment === "ë¶€??) count.neg++;
          else count.neu++;
        });
        setStats(count);
        console.log("?“Š ?µê³„ ?…ë°?´íŠ¸:", count);
      },
      (error) => {
        console.error("??Firestore êµ¬ë… ?¤ë¥˜:", error);
      }
    );
    
    return () => unsub();
  }, []);

  const handleInstall = async () => {
    if (!installEvt) {
      alert("?¤ì¹˜ê°€ ?´ë? ?„ë£Œ?˜ì—ˆê±°ë‚˜ ì§€?ë˜ì§€ ?ŠëŠ” ?˜ê²½?…ë‹ˆ??");
      return;
    }
    
    try {
      await installEvt.prompt();
      const choice = await installEvt.userChoice;
      console.log("?“± PWA ?¤ì¹˜ ? íƒ:", choice.outcome);
      
      if (choice.outcome === 'accepted') {
        console.log("??PWA ?¤ì¹˜??);
      }
      
      setInstallEvt(null);
    } catch (error) {
      console.error("??PWA ?¤ì¹˜ ?¤ë¥˜:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20">
      <div className="p-4 max-w-xl mx-auto">
        {/* ?¤ë” */}
        <motion.header 
          className="text-center mb-6 pt-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <img 
              src="/images/yago-logo.png" 
              alt="YAGO" 
              className="w-12 h-12 rounded-xl shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="text-3xl font-bold text-gray-900">YAGO VIBE</h1>
          </div>
          <p className="text-sm text-gray-600">Admin Dashboard</p>
          
          {/* ?¨ë¼???¤í”„?¼ì¸ ?íƒœ */}
          <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs ${
            online 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              online ? "bg-green-500" : "bg-red-500"
            } animate-pulse`}></span>
            {online ? "?¨ë¼?? : "?¤í”„?¼ì¸"}
          </div>
        </motion.header>

        {/* PWA ?¤ì¹˜ ë°°ë„ˆ */}
        {installEvt && (
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-4 mb-6 shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="text-4xl">?“±</div>
              <div className="flex-1">
                <p className="font-semibold mb-1">?±ìœ¼ë¡??¤ì¹˜?˜ê¸°</p>
                <p className="text-xs opacity-90">???”ë©´??ì¶”ê??˜ë©´ ??ë¹ ë¥´ê²??‘ê·¼?????ˆì–´??</p>
              </div>
              <button 
                onClick={handleInstall}
                className="px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm"
              >
                ?¤ì¹˜
              </button>
            </div>
          </motion.div>
        )}

        {/* ê°ì • ?”ì•½ ì¹´ë“œ */}
        <motion.div 
          className="grid grid-cols-3 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl p-4 shadow-md text-center hover:shadow-lg transition-shadow">
            <p className="text-xs text-gray-500 mb-1">ê¸ì •</p>
            <p className="text-3xl font-bold text-green-600 mb-1">{stats.pos}</p>
            <p className="text-xs text-gray-400">
              {stats.total > 0 ? ((stats.pos / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center hover:shadow-lg transition-shadow">
            <p className="text-xs text-gray-500 mb-1">ì¤‘ë¦½</p>
            <p className="text-3xl font-bold text-blue-600 mb-1">{stats.neu}</p>
            <p className="text-xs text-gray-400">
              {stats.total > 0 ? ((stats.neu / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center hover:shadow-lg transition-shadow">
            <p className="text-xs text-gray-500 mb-1">ë¶€??/p>
            <p className="text-3xl font-bold text-red-600 mb-1">{stats.neg}</p>
            <p className="text-xs text-gray-400">
              {stats.total > 0 ? ((stats.neg / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </motion.div>

        {/* ë¹ ë¥¸ ?´ë™ */}
        <motion.div 
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link 
            to="/admin/calendar" 
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:bg-gradient-to-br hover:from-sky-50 hover:to-sky-100 transition-all active:scale-95"
          >
            <div className="text-3xl mb-2">?“…</div>
            <p className="font-semibold text-gray-900 mb-1">?¼ì • ìº˜ë¦°??/p>
            <p className="text-xs text-gray-500">?€ ?ˆë ¨ / ê²½ê¸° ?¼ì •</p>
          </Link>
          
          <Link 
            to="/admin/chat-report" 
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all active:scale-95"
          >
            <div className="text-3xl mb-2">?“Š</div>
            <p className="font-semibold text-gray-900 mb-1">AI ë¦¬í¬??/p>
            <p className="text-xs text-gray-500">ê°ì • ë¹„ìœ¨ / ìµœê·¼ ?”ì•½</p>
          </Link>
          
          <Link 
            to="/admin/teams" 
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 transition-all active:scale-95"
          >
            <div className="text-3xl mb-2">??/div>
            <p className="font-semibold text-gray-900 mb-1">?€ë³?ë¹„êµ</p>
            <p className="text-xs text-gray-500">?Œí˜60/88/?„ì¹´?°ë?</p>
          </Link>
          
          <Link 
            to="/admin/reports/pdf" 
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 transition-all active:scale-95"
          >
            <div className="text-3xl mb-2">?“„</div>
            <p className="font-semibold text-gray-900 mb-1">PDF ?ì„±</p>
            <p className="text-xs text-gray-500">ì£¼ê°„/?”ê°„ ë¦¬í¬??/p>
          </Link>
          
          <Link 
            to="/admin/teams/pdf" 
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 transition-all active:scale-95"
          >
            <div className="text-3xl mb-2">?§¾</div>
            <p className="font-semibold text-gray-900 mb-1">?€ë³?PDF</p>
            <p className="text-xs text-gray-500">3?€ ë¹„êµ ë¦¬í¬??/p>
          </Link>
          
          <Link 
            to="/admin/reports/ai" 
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:bg-gradient-to-br hover:from-pink-50 hover:to-pink-100 transition-all active:scale-95"
          >
            <div className="text-3xl mb-2">?†</div>
            <p className="font-semibold text-gray-900 mb-1">AI ë¦¬í¬??/p>
            <p className="text-xs text-gray-500">?¼ì • ?µê³„ ?ë™ ?”ì•½</p>
          </Link>
        </motion.div>

        {/* ìµœê·¼ ?”ì•½ */}
        <motion.div 
          className="bg-white rounded-2xl p-5 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-900">?§  ìµœê·¼ ?”ì•½ TOP 5</p>
            <Link 
              to="/admin/chat-report" 
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              ?„ì²´ë³´ê¸° ??            </Link>
          </div>
          
          {latest.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {online ? "?”ì•½ ?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?.." : "?¤í”„?¼ì¸ ?íƒœ?…ë‹ˆ??"}
            </p>
          ) : (
            <ul className="space-y-3">
              {latest.map((s: any, i) => (
                <li 
                  key={s.id || i} 
                  className="border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 text-xs mt-0.5">??/span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {s.summary || "?”ì•½ ?†ìŒ"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          (s.sentiment || s.emotion || "").toLowerCase().includes("positive") || 
                          (s.sentiment || s.emotion) === "ê¸ì •"
                            ? "bg-green-100 text-green-700"
                            : (s.sentiment || s.emotion || "").toLowerCase().includes("negative") ||
                              (s.sentiment || s.emotion) === "ë¶€??
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {(s.sentiment || s.emotion || "neutral").toLowerCase().includes("positive") || 
                           (s.sentiment || s.emotion) === "ê¸ì •"
                            ? "ê¸ì •"
                            : (s.sentiment || s.emotion || "").toLowerCase().includes("negative") ||
                              (s.sentiment || s.emotion) === "ë¶€??
                            ? "ë¶€??
                            : "ì¤‘ë¦½"}
                        </span>
                        {s.createdAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(s.createdAt.toDate()).toLocaleDateString("ko-KR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* ?¸í„° */}
        <div className="text-center mt-8 text-xs text-gray-400">
          <p>YAGO VIBE Admin v1.0</p>
          <p className="mt-1">Powered by AI & Firebase</p>
        </div>
      </div>
    </div>
  );
}

