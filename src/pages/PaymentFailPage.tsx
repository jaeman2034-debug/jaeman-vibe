/**
 * ??ê²°ì œ ?¤íŒ¨ ?˜ì´ì§€
 */

import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, Home, RefreshCw } from "lucide-react";

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentId = searchParams.get("paymentId");
  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* ?¤íŒ¨ ?„ì´ì½?*/}
        <div className="text-center mb-6">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ê²°ì œ ?¤íŒ¨</h1>
          <p className="text-gray-600">ê²°ì œê°€ ?•ìƒ?ìœ¼ë¡?ì²˜ë¦¬?˜ì? ?Šì•˜?µë‹ˆ??</p>
        </div>

        {/* ?¤ë¥˜ ?•ë³´ */}
        {(errorCode || errorMessage) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            {errorCode && (
              <p className="text-sm text-red-800 mb-1">
                <strong>?¤ë¥˜ ì½”ë“œ:</strong> {errorCode}
              </p>
            )}
            {errorMessage && (
              <p className="text-sm text-red-600">
                {decodeURIComponent(errorMessage)}
              </p>
            )}
          </div>
        )}

        {/* ?¼ë°˜?ì¸ ?¤íŒ¨ ?ì¸ */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">?¼ë°˜?ì¸ ?ì¸</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>??ì¹´ë“œ ?•ë³´ê°€ ?¬ë°”ë¥´ì? ?ŠìŒ</li>
            <li>???”ì•¡ ?ëŠ” ?œë„ ë¶€ì¡?/li>
            <li>??ê²°ì œ ?œê°„ ì´ˆê³¼</li>
            <li>???¬ìš©?ê? ê²°ì œë¥?ì·¨ì†Œ??/li>
          </ul>
        </div>

        {/* ?ˆë‚´ ë©”ì‹œì§€ */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            ?’¡ ?¤ì‹œ ?œë„?˜ì‹œê±°ë‚˜ ?¤ë¥¸ ê²°ì œ ?˜ë‹¨???´ìš©?´ì£¼?¸ìš”.
          </p>
        </div>

        {/* ?¡ì…˜ ë²„íŠ¼ */}
        <div className="space-y-3">
          <button
            onClick={() => {
              if (paymentId) {
                // ?í’ˆ ?˜ì´ì§€ë¡??Œì•„ê°€???¤ì‹œ ê²°ì œ ?œë„
                navigate(-1);
              } else {
                navigate("/market");
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            ?¤ì‹œ ?œë„?˜ê¸°
          </button>
          
          <button
            onClick={() => navigate("/market")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?          </button>
        </div>

        {/* ì§€???ˆë‚´ */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ë¬¸ì œê°€ ê³„ì†?˜ë©´{" "}
            <a href="/support" className="text-blue-600 hover:underline">
              ê³ ê°?¼í„°
            </a>
            ë¡?ë¬¸ì˜?´ì£¼?¸ìš”.
          </p>
        </div>
      </div>
    </div>
  );
}

