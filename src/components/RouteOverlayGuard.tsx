import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteOverlayGuard() {
  const loc = useLocation();
  
  useEffect(() => {
    // Radix 포털의 열린 오버레이가 있으면 닫히도록
    document.querySelectorAll('[data-radix-portal] [data-state="open"]')
      .forEach(el => (el as HTMLElement).click?.()); // 닫기 버튼이 클릭된 것처럼 처리하여 닫힘
    
    // 모든 pointer-events를 전역적으로 해제
    document.querySelectorAll('[data-radix-portal] [data-state="open"], .fixed.inset-0')
      .forEach(el => (el as HTMLElement).style.pointerEvents = '');
      
    if (import.meta.env.DEV) {
      console.log('[RouteOverlayGuard] Route changed, overlays cleared:', loc.pathname);
    }
  }, [loc.pathname]);
  
  return null;
}