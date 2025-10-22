import { useNavigate } from "react-router-dom";

export default function FacilityPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-lg p-12 text-center">
        <div className="text-8xl mb-6">?���?/div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          체육?�설 ?�약
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          ?�동??�?구장 ?�약 ?�스?�을 준�?중입?�다.
        </p>
        <div className="space-y-3 text-sm text-gray-500 mb-8">
          <p>?�� ?�설 ?�약 캘린??/p>
          <p>?���??�시�??�약 ?�황</p>
          <p>?�� ?�라??결제</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
        >
          ?�으�??�아가�?        </button>
      </div>
    </div>
  );
}
