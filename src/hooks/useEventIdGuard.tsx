import { useParams } from "react-router-dom";
import { Navigate } from "react-router-dom";

// 잘못된 링크 자동 방어 훅
export function useEventIdGuard() {
  const { id } = useParams();
  const bad = !id || /^(<id>|<ID>)$/i.test(id) || /%3Cid%3E/i.test(id);
  if (bad) {
    return <Navigate to="/events" replace />;
  }
  return id!;
}
