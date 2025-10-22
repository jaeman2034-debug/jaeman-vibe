import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./layout/AppHeader";
import { useEffect, useState } from "react";
import { RouteOverlayGuard } from "./RouteOverlayGuard";

export default function AppShell() {
  const loc = useLocation();
  // FAB ?��? 조건: /start, /login, /signup, /voice?�서 ?��? (마이???�이콘과 중복 방�?)
  const hideFab = ["/start", "/login", "/signup", "/voice"].includes(loc.pathname);
  const [healthInfo, setHealthInfo] = useState({ version: '1.0.0', buildTime: Date.now() });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        // 개발 모드?�서???�스체크 ?�킵
        if (import.meta.env.DEV) {
          setHealthInfo({ version: 'dev', buildTime: Date.now() });
          return;
        }
        
        const response = await fetch('/api/health');
        if (!response.ok) {
          console.warn('Health check failed:', response.status);
          return;
        }
        
        const text = await response.text();
        if (!text) {
          console.warn('Empty health response');
          return;
        }
        
        const health = JSON.parse(text);
        setHealthInfo({ version: health.version || 'unknown', buildTime: health.buildTime || Date.now() });
      } catch (error) {
        console.warn('Health check error (non-critical):', error);
        // ?�러가 ?�어???��? 계속 ?�작
      }
    };
    
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <RouteOverlayGuard />
      <AppHeader />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-sm text-slate-500">
          © {new Date().getFullYear()} YAGO SPORTS · All rights reserved.
          <span className="ml-4 text-xs text-gray-400">
            v{healthInfo.version} ??{new Date(healthInfo.buildTime).toLocaleString()}
          </span>
        </div>
      </footer>
    </div>
  );
}
