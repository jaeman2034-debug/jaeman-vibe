/**
 * ?“² PWA ?¤ì¹˜ ?„ë¡¬?„íŠ¸ ì»´í¬?ŒíŠ¸
 * 
 * ?¬ìš©?ì—ê²????”ë©´?????¤ì¹˜ë¥?ê¶Œìœ ?˜ëŠ” ë²„íŠ¼???œì‹œ?©ë‹ˆ??
 */

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // ë¸Œë¼?°ì? ê¸°ë³¸ ?¤ì¹˜ ë°°ë„ˆ ë°©ì?
      e.preventDefault();
      setDeferredPrompt(e);
      
      // ?¤ì¹˜ ê°€?¥í•œ ?íƒœë©?ë°°ë„ˆ ?œì‹œ
      setTimeout(() => setVisible(true), 3000); // 3ì´????œì‹œ
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // ?´ë? ?¤ì¹˜?˜ì—ˆê±°ë‚˜ ?¤ì¹˜ ë¶ˆê??¥í•œ ê²½ìš°
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("??PWAê°€ ?´ë? ?¤ì¹˜?˜ì–´ ?ˆìŠµ?ˆë‹¤");
      setVisible(false);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.warn("? ï¸ ?¤ì¹˜ ?„ë¡¬?„íŠ¸ë¥??¬ìš©?????†ìŠµ?ˆë‹¤");
      return;
    }

    // ?¤ì¹˜ ?„ë¡¬?„íŠ¸ ?œì‹œ
    deferredPrompt.prompt();

    // ?¬ìš©??? íƒ ?€ê¸?    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`?“² PWA ?¤ì¹˜ ${outcome === "accepted" ? "?¹ì¸" : "ê±°ë?"}`);

    if (outcome === "accepted") {
      setVisible(false);
    }

    // ?„ë¡¬?„íŠ¸ ì´ˆê¸°??    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    // ?˜ë£¨ ?™ì•ˆ ?¤ì‹œ ?œì‹œ ????    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // ?˜ë£¨ ?´ë‚´ dismiss??ê²½ìš°
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (parseInt(dismissed) > dayAgo) {
        setVisible(false);
      }
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
        {/* ?„ì´ì½?*/}
        <div className="bg-white rounded-full p-3">
          <span className="text-3xl">??/span>
        </div>

        {/* ?´ìš© */}
        <div className="flex-1">
          <div className="font-bold text-lg mb-1">YAGO VIBE ?¤ì¹˜</div>
          <div className="text-sm text-blue-100">
            ???”ë©´??ì¶”ê??˜ê³  ?±ì²˜???¬ìš©?˜ì„¸??          </div>
        </div>

        {/* ë²„íŠ¼ */}
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            <Download size={18} />
            <span>?¤ì¹˜</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="bg-blue-700 text-white p-2 rounded-xl hover:bg-blue-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* CSS ? ë‹ˆë©”ì´??*/}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

