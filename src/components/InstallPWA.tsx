/**
 * ?�� PWA ?�치 ?�롬?�트 컴포?�트
 * 
 * ?�용?�에�????�면?????�치�?권유?�는 버튼???�시?�니??
 */

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // 브라?��? 기본 ?�치 배너 방�?
      e.preventDefault();
      setDeferredPrompt(e);
      
      // ?�치 가?�한 ?�태�?배너 ?�시
      setTimeout(() => setVisible(true), 3000); // 3�????�시
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // ?��? ?�치?�었거나 ?�치 불�??�한 경우
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("??PWA가 ?��? ?�치?�어 ?�습?�다");
      setVisible(false);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.warn("?�️ ?�치 ?�롬?�트�??�용?????�습?�다");
      return;
    }

    // ?�치 ?�롬?�트 ?�시
    deferredPrompt.prompt();

    // ?�용???�택 ?��?    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`?�� PWA ?�치 ${outcome === "accepted" ? "?�인" : "거�?"}`);

    if (outcome === "accepted") {
      setVisible(false);
    }

    // ?�롬?�트 초기??    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    // ?�루 ?�안 ?�시 ?�시 ????    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // ?�루 ?�내 dismiss??경우
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
        {/* ?�이�?*/}
        <div className="bg-white rounded-full p-3">
          <span className="text-3xl">??/span>
        </div>

        {/* ?�용 */}
        <div className="flex-1">
          <div className="font-bold text-lg mb-1">YAGO VIBE ?�치</div>
          <div className="text-sm text-blue-100">
            ???�면??추�??�고 ?�처???�용?�세??          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            <Download size={18} />
            <span>?�치</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="bg-blue-700 text-white p-2 rounded-xl hover:bg-blue-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* CSS ?�니메이??*/}
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

