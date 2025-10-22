import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginSuccess() {
  const nav = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      // 혹시 인증이 늦게 붙을 수 있어 약간 지연 후 확인
      onAuthStateChanged(auth, (u) => {
        // 인증이 붙었든 안 붙었든 우선 클럽 선택으로 보냄
        nav("/clubs/select", { replace: true });
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border rounded-2xl shadow p-8 text-center">
        <div className="text-xl font-semibold">🎉 네이버 로그인 성공!</div>
        <div className="text-gray-500 mt-2">잠시 후 이동합니다…</div>
        <button
          onClick={() => nav("/clubs/select", { replace: true })}
          className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          지금 이동
        </button>
      </div>
    </div>
  );
}
