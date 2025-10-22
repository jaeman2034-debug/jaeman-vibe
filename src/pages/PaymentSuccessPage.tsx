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
      setError("결제 ?�션 ?�보�?찾을 ???�습?�다.");
      return;
    }
    
    // ?�동?�로 결제 ?�인 �??�약 ?�료
    handlePaymentConfirmation();
  }, [sessionId]);
  
  const handlePaymentConfirmation = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const result = await confirmCheckoutAndReserve(sessionId);
      
      if (result.success) {
        setSuccess(true);
        toast("?�전결제 ?�약???�료?�었?�니??");
        
        // 3�????�약 목록?�로 ?�동
        setTimeout(() => {
          navigate("/my-reservations");
        }, 3000);
      }
    } catch (error: any) {
      console.error("결제 ?�인 ?�패:", error);
      setError(error.message || "결제 ?�인???�패?�습?�다.");
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
            ?�으�??�아가�?
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
          <div className="text-2xl font-bold mb-4">결제 �??�약 ?�료!</div>
          <div className="text-gray-600 mb-6">
            ?�전결제 ?�약???�공?�으�??�료?�었?�니??
          </div>
          <div className="text-sm text-gray-500">
            ?�시 ???�약 목록?�로 ?�동?�니??..
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">?�� 결제 ?�인 �?..</div>
        <div className="text-gray-500">?�시�?기다?�주?�요</div>
        {loading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}
