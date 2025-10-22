import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedAdminRoute({ children }: any) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">ê´€ë¦¬ì ê¶Œí•œ???•ì¸?˜ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("?š« ê´€ë¦¬ì ?¼ìš°?? ë¡œê·¸?¸ë˜ì§€ ?ŠìŒ, /login?¼ë¡œ ë¦¬ë‹¤?´ë ‰??);
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log("?š« ê´€ë¦¬ì ?¼ìš°?? ê´€ë¦¬ì ê¶Œí•œ ?†ìŒ, ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">?‘‘</div>
          <h3 className="text-lg text-gray-600 mb-2">ê´€ë¦¬ì ê¶Œí•œ???„ìš”?©ë‹ˆ??/h3>
          <p className="text-sm text-gray-500 mb-6">
            ???˜ì´ì§€??ê´€ë¦¬ìë§??‘ê·¼?????ˆìŠµ?ˆë‹¤.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ???´ì „ ?˜ì´ì§€ë¡??Œì•„ê°€ê¸?          </button>
        </div>
      </div>
    );
  }

  console.log("??ê´€ë¦¬ì ?¼ìš°?? ?‘ê·¼ ?ˆìš©");
  return children;
}
