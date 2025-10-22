import { Outlet, useLocation, matchPath } from "react-router-dom";
import { useEffect } from "react";

export default function MarketLayout() {
  const location = useLocation();

  // 상세 페이지나 새 글 페이지에서는 리다이렉트 방지
  useEffect(() => {
    const isMarketDetail = !!matchPath("/market/:id", location.pathname);
    const isMarketNew = location.pathname === "/market/new";
    const isMarketEdit = !!matchPath("/market/:id/edit", location.pathname);
    
    if (isMarketDetail || isMarketNew || isMarketEdit) {
      // 상세/새글/수정 페이지에서는 리다이렉트 하지 않음
      return;
    }
    
    // 필요한 경우에만 제한적으로 리다이렉트 로직 추가
  }, [location]);

  return (
    <main className="flex-1 flex flex-col">
      <Outlet />
    </main>
  );
}
