import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmTossAndReserveFromUrl } from "@/lib/toss";
import { useToast } from "@/components/common/Toast";

export default function TossSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const toast = useToast();
  
  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');
  
  useEffect(() => {
    if (!orderId || !paymentKey || !amount) {
      setError("ê²°ì œ ?•ë³´ê°€ ?„ë½?˜ì—ˆ?µë‹ˆ??");
      return;
    }
    
    // ?ë™?¼ë¡œ ê²°ì œ ?•ì¸ ë°??ˆì•½ ?„ë£Œ
    handlePaymentConfirmation();
  }, [orderId, paymentKey, amount]);
  
  const handlePaymentConfirmation = async () => {
    if (!orderId || !paymentKey || !amount) return;
    
    setLoading(true);
    try {
      const result = await confirmTossAndReserveFromUrl();
      
      if (result.success) {
        setSuccess(true);
        setReservationId(result.reservationId || null);
        toast("? ìŠ¤?˜ì´ë¨¼ì¸  ?¬ì „ê²°ì œ ?ˆì•½???„ë£Œ?˜ì—ˆ?µë‹ˆ??");
        
        // 3ì´????ˆì•½ ëª©ë¡?¼ë¡œ ?´ë™
        setTimeout(() => {
          navigate("/my-reservations");
        }, 3000);
      } else {
        setError(result.error || "ê²°ì œ ?•ì¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
      }
    } catch (error: any) {
      console.error("? ìŠ¤?˜ì´ë¨¼ì¸  ê²°ì œ ?•ì¸ ?¤íŒ¨:", error);
      setError(error.message || "ê²°ì œ ?•ì¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">??/div>
          <div className="text-xl font-semibold text-gray-800 mb-4">ê²°ì œ ?•ì¸ ?¤íŒ¨</div>
          <div className="text-gray-600 mb-6">{error}</div>
          <div className="space-y-3">
            <button 
              onClick={() => navigate("/")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ?ˆìœ¼ë¡??Œì•„ê°€ê¸?
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ?¤ì‹œ ?œë„
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-green-500 text-6xl mb-4">??/div>
          <div className="text-2xl font-bold text-gray-800 mb-4">ê²°ì œ ë°??ˆì•½ ?„ë£Œ!</div>
          <div className="text-gray-600 mb-4">
            ? ìŠ¤?˜ì´ë¨¼ì¸  ?¬ì „ê²°ì œ ?ˆì•½???±ê³µ?ìœ¼ë¡??„ë£Œ?˜ì—ˆ?µë‹ˆ??
          </div>
          {reservationId && (
            <div className="bg-white border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">?ˆì•½ ë²ˆí˜¸</div>
              <div className="font-mono text-lg font-semibold text-green-600">{reservationId}</div>
            </div>
          )}
          <div className="text-sm text-gray-500 mb-6">
            ? ì‹œ ???ˆì•½ ëª©ë¡?¼ë¡œ ?´ë™?©ë‹ˆ??..
          </div>
          <div className="animate-pulse">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-blue-500 text-6xl mb-4">?”„</div>
        <div className="text-2xl font-bold text-gray-800 mb-4">ê²°ì œ ?•ì¸ ì¤?..</div>
        <div className="text-gray-600 mb-6">? ì‹œë§?ê¸°ë‹¤?¤ì£¼?¸ìš”</div>
        
        {loading && (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <div className="text-sm text-gray-500">? ìŠ¤?˜ì´ë¨¼ì¸  ê²°ì œ ?•ì¸ ì¤?..</div>
          </div>
        )}
        
        {/* ê²°ì œ ?•ë³´ ?œì‹œ */}
        <div className="mt-6 bg-white border border-blue-200 rounded-lg p-4 text-left">
          <div className="text-sm font-medium text-gray-700 mb-2">ê²°ì œ ?•ë³´</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ì£¼ë¬¸ë²ˆí˜¸:</span>
              <span className="font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ê²°ì œ??</span>
              <span className="font-mono text-xs">{paymentKey}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ê²°ì œê¸ˆì•¡:</span>
              <span className="font-semibold">{amount ? `${parseInt(amount).toLocaleString()}?? : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
