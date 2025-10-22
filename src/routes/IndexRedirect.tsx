import { Navigate, useLocation } from "react-router-dom";
import { useMemo } from "react";

/**
 * / 진입 시:
 *  - startSeen 없으면  /start
 *  - 있으면            /app/market
 *  - ?resetStart=1 이면 플래그 지우고 /start
 */
export default function IndexRedirect() {
  const { search } = useLocation();

  const to = useMemo(() => {
    const params = new URLSearchParams(search);
    if (params.get("resetStart") === "1") {
      localStorage.removeItem("startSeen");
      return "/start";
    }
    const seen = localStorage.getItem("startSeen");
    return seen ? "/app/market" : "/start";
  }, [search]);

  return <Navigate to={to} replace />;
}
