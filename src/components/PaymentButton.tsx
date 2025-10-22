/**
 * ?’³ ê²°ì œ ë²„íŠ¼ ì»´í¬?ŒíŠ¸ (ë¹„í™œ??ê³¨ê²©)
 * 
 * ?”´ ?„ì¬ ?íƒœ: ?ŒìŠ¤??ëª¨ë“œ
 * ???œì„±?? Functions?ì„œ ?¤í‚¤ ?¤ì • ??ì¦‰ì‹œ ?¬ìš© ê°€?? */

import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentButtonProps {
  productId: string;
  productTitle: string;
  price: number;
  sellerId: string;
  disabled?: boolean;
}

export default function PaymentButton({
  productId,
  productTitle,
  price,
  sellerId,
  disabled = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // ë¡œê·¸???•ì¸
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
        return;
      }

      // ë³¸ì¸ ?í’ˆ ì²´í¬
      if (user.uid === sellerId) {
        alert("ë³¸ì¸???í’ˆ?€ êµ¬ë§¤?????†ìŠµ?ˆë‹¤.");
        return;
      }

      // createPayment Cloud Function ?¸ì¶œ
      const functions = getFunctions();
      const createPayment = httpsCallable(functions, "createPayment");

      console.log("?’³ ê²°ì œ ?”ì²­ ?œì‘:", { productId, buyerId: user.uid });

      const result = await createPayment({
        productId,
        buyerId: user.uid,
      });

      const data = result.data as any;

      console.log("??ê²°ì œ ?ì„± ?„ë£Œ:", data);

      // ê²°ì œ URLë¡?ë¦¬ë‹¤?´ë ‰??      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("ê²°ì œ URL???ì„±?????†ìŠµ?ˆë‹¤.");
      }
    } catch (err: any) {
      console.error("??ê²°ì œ ?¤ë¥˜:", err);
      
      // ?¬ìš©??ì¹œí™”?ì¸ ?ëŸ¬ ë©”ì‹œì§€
      let errorMessage = "ê²°ì œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.";
      
      if (err.code === "unauthenticated") {
        errorMessage = "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??";
      } else if (err.code === "not-found") {
        errorMessage = "?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤.";
      } else if (err.code === "failed-precondition") {
        errorMessage = err.message || "ê²°ì œ ì¡°ê±´??ì¶©ì¡±?˜ì? ?Šì•˜?µë‹ˆ??";
      }

      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className={`
          w-full flex items-center justify-center gap-2
          px-6 py-3 rounded-xl font-semibold text-white
          transition-all duration-200
          ${
            disabled || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>ê²°ì œ ì¤€ë¹?ì¤?..</span>
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>ê²°ì œ?˜ê¸° ({price.toLocaleString()}??</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {/* ?ŒìŠ¤??ëª¨ë“œ ?ˆë‚´ */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800 text-center">
          ?”´ <strong>?ŒìŠ¤??ëª¨ë“œ</strong> - ?¤ì œ ì²?µ¬ ?†ìŒ
        </p>
        <p className="text-xs text-yellow-600 text-center mt-1">
          ?¤ê±°???„í™˜ ??Functions ?˜ê²½ ë³€?˜ë§Œ ë³€ê²½í•˜ë©??©ë‹ˆ??
        </p>
      </div>
    </div>
  );
}

