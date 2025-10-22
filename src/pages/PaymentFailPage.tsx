/**
 * ??결제 ?�패 ?�이지
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
        {/* ?�패 ?�이�?*/}
        <div className="text-center mb-6">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">결제 ?�패</h1>
          <p className="text-gray-600">결제가 ?�상?�으�?처리?��? ?�았?�니??</p>
        </div>

        {/* ?�류 ?�보 */}
        {(errorCode || errorMessage) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            {errorCode && (
              <p className="text-sm text-red-800 mb-1">
                <strong>?�류 코드:</strong> {errorCode}
              </p>
            )}
            {errorMessage && (
              <p className="text-sm text-red-600">
                {decodeURIComponent(errorMessage)}
              </p>
            )}
          </div>
        )}

        {/* ?�반?�인 ?�패 ?�인 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">?�반?�인 ?�인</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>??카드 ?�보가 ?�바르�? ?�음</li>
            <li>???�액 ?�는 ?�도 부�?/li>
            <li>??결제 ?�간 초과</li>
            <li>???�용?��? 결제�?취소??/li>
          </ul>
        </div>

        {/* ?�내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            ?�� ?�시 ?�도?�시거나 ?�른 결제 ?�단???�용?�주?�요.
          </p>
        </div>

        {/* ?�션 버튼 */}
        <div className="space-y-3">
          <button
            onClick={() => {
              if (paymentId) {
                // ?�품 ?�이지�??�아가???�시 결제 ?�도
                navigate(-1);
              } else {
                navigate("/market");
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            ?�시 ?�도?�기
          </button>
          
          <button
            onClick={() => navigate("/market")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            마켓?�로 ?�아가�?          </button>
        </div>

        {/* 지???�내 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            문제가 계속?�면{" "}
            <a href="/support" className="text-blue-600 hover:underline">
              고객?�터
            </a>
            �?문의?�주?�요.
          </p>
        </div>
      </div>
    </div>
  );
}

