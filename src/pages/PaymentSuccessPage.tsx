import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmCheckoutAndReserve } from "@/lib/payment";
import { useToast } from "@/components/common/Toast";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const toast = useToast();
  
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    if (!sessionId) {
      setError("ê²°ì œ ?¸ì…˜ ?•ë³´ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
      return;
    }
    
    // ?ë™?¼ë¡œ ê²°ì œ ?•ì¸ ë°??ˆì•½ ?„ë£Œ
    handlePaymentConfirmation();
  }, [sessionId]);
  
  const handlePaymentConfirmation = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const result = await confirmCheckoutAndReserve(sessionId);
      
      if (result.success) {
        setSuccess(true);
        toast("?¬ì „ê²°ì œ ?ˆì•½???„ë£Œ?˜ì—ˆ?µë‹ˆ??");
        
        // 3ì´????ˆì•½ ëª©ë¡?¼ë¡œ ?´ë™
        setTimeout(() => {
          navigate("/my-reservations");
        }, 3000);
      }
    } catch (error: any) {
      console.error("ê²°ì œ ?•ì¸ ?¤íŒ¨:", error);
      setError(error.message || "ê²°ì œ ?•ì¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">??{error}</div>
          <button 
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ?ˆìœ¼ë¡??Œì•„ê°€ê¸?
          </button>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">??/div>
          <div className="text-2xl font-bold mb-4">ê²°ì œ ë°??ˆì•½ ?„ë£Œ!</div>
          <div className="text-gray-600 mb-6">
            ?¬ì „ê²°ì œ ?ˆì•½???±ê³µ?ìœ¼ë¡??„ë£Œ?˜ì—ˆ?µë‹ˆ??
          </div>
          <div className="text-sm text-gray-500">
            ? ì‹œ ???ˆì•½ ëª©ë¡?¼ë¡œ ?´ë™?©ë‹ˆ??..
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">?”„ ê²°ì œ ?•ì¸ ì¤?..</div>
        <div className="text-gray-500">? ì‹œë§?ê¸°ë‹¤?¤ì£¼?¸ìš”</div>
        {loading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}
