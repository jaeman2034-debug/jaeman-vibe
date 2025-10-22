import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedAdminRoute({ children }: any) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">관리자 권한???�인?�는 �?..</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("?�� 관리자 ?�우?? 로그?�되지 ?�음, /login?�로 리다?�렉??);
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log("?�� 관리자 ?�우?? 관리자 권한 ?�음, ?�으�?리다?�렉??);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">?��</div>
          <h3 className="text-lg text-gray-600 mb-2">관리자 권한???�요?�니??/h3>
          <p className="text-sm text-gray-500 mb-6">
            ???�이지??관리자�??�근?????�습?�다.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ???�전 ?�이지�??�아가�?          </button>
        </div>
      </div>
    );
  }

  console.log("??관리자 ?�우?? ?�근 ?�용");
  return children;
}
