/**
 * ?�� 결제 버튼 컴포?�트 (비활??골격)
 * 
 * ?�� ?�재 ?�태: ?�스??모드
 * ???�성?? Functions?�서 ?�키 ?�정 ??즉시 ?�용 가?? */

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

      // 로그???�인
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("로그?�이 ?�요?�니??");
        return;
      }

      // 본인 ?�품 체크
      if (user.uid === sellerId) {
        alert("본인???�품?� 구매?????�습?�다.");
        return;
      }

      // createPayment Cloud Function ?�출
      const functions = getFunctions();
      const createPayment = httpsCallable(functions, "createPayment");

      console.log("?�� 결제 ?�청 ?�작:", { productId, buyerId: user.uid });

      const result = await createPayment({
        productId,
        buyerId: user.uid,
      });

      const data = result.data as any;

      console.log("??결제 ?�성 ?�료:", data);

      // 결제 URL�?리다?�렉??      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("결제 URL???�성?????�습?�다.");
      }
    } catch (err: any) {
      console.error("??결제 ?�류:", err);
      
      // ?�용??친화?�인 ?�러 메시지
      let errorMessage = "결제 �??�류가 발생?�습?�다.";
      
      if (err.code === "unauthenticated") {
        errorMessage = "로그?�이 ?�요?�니??";
      } else if (err.code === "not-found") {
        errorMessage = "?�품??찾을 ???�습?�다.";
      } else if (err.code === "failed-precondition") {
        errorMessage = err.message || "결제 조건??충족?��? ?�았?�니??";
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
            <span>결제 준�?�?..</span>
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>결제?�기 ({price.toLocaleString()}??</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {/* ?�스??모드 ?�내 */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800 text-center">
          ?�� <strong>?�스??모드</strong> - ?�제 �?�� ?�음
        </p>
        <p className="text-xs text-yellow-600 text-center mt-1">
          ?�거???�환 ??Functions ?�경 변?�만 변경하�??�니??
        </p>
      </div>
    </div>
  );
}

