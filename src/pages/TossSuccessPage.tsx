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
      setError("결제 ?�보가 ?�락?�었?�니??");
      return;
    }
    
    // ?�동?�로 결제 ?�인 �??�약 ?�료
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
        toast("?�스?�이먼츠 ?�전결제 ?�약???�료?�었?�니??");
        
        // 3�????�약 목록?�로 ?�동
        setTimeout(() => {
          navigate("/my-reservations");
        }, 3000);
      } else {
        setError(result.error || "결제 ?�인???�패?�습?�다.");
      }
    } catch (error: any) {
      console.error("?�스?�이먼츠 결제 ?�인 ?�패:", error);
      setError(error.message || "결제 ?�인???�패?�습?�다.");
    } finally {
      setLoading(false);
    }
  };
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">??/div>
          <div className="text-xl font-semibold text-gray-800 mb-4">결제 ?�인 ?�패</div>
          <div className="text-gray-600 mb-6">{error}</div>
          <div className="space-y-3">
            <button 
              onClick={() => navigate("/")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ?�으�??�아가�?
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ?�시 ?�도
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
          <div className="text-2xl font-bold text-gray-800 mb-4">결제 �??�약 ?�료!</div>
          <div className="text-gray-600 mb-4">
            ?�스?�이먼츠 ?�전결제 ?�약???�공?�으�??�료?�었?�니??
          </div>
          {reservationId && (
            <div className="bg-white border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">?�약 번호</div>
              <div className="font-mono text-lg font-semibold text-green-600">{reservationId}</div>
            </div>
          )}
          <div className="text-sm text-gray-500 mb-6">
            ?�시 ???�약 목록?�로 ?�동?�니??..
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
        <div className="text-blue-500 text-6xl mb-4">?��</div>
        <div className="text-2xl font-bold text-gray-800 mb-4">결제 ?�인 �?..</div>
        <div className="text-gray-600 mb-6">?�시�?기다?�주?�요</div>
        
        {loading && (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <div className="text-sm text-gray-500">?�스?�이먼츠 결제 ?�인 �?..</div>
          </div>
        )}
        
        {/* 결제 ?�보 ?�시 */}
        <div className="mt-6 bg-white border border-blue-200 rounded-lg p-4 text-left">
          <div className="text-sm font-medium text-gray-700 mb-2">결제 ?�보</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">주문번호:</span>
              <span className="font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제??</span>
              <span className="font-mono text-xs">{paymentKey}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제금액:</span>
              <span className="font-semibold">{amount ? `${parseInt(amount).toLocaleString()}?? : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
