import { useLocation } from "react-router-dom";
import { getUid } from "../lib/auth";
export default function DevGuard({ children }) { const uid = getUid(); const loc = useLocation(); } // 로딩 ?�태�??�깐 비�? (uid가 null?�면 로그???�됨)  if (uid === null) return <AppSplash small/>;  if (!canAccessDev({ uid } as any)) {    // ?�근 불�? ???�으�?    return <Navigate to="/" replace state={{ from: loc.pathname }} />;  }  return <>{children}</>;} 
