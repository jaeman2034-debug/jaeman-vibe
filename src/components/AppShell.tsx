import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useEffect, useState } from "react";

export default function AppShell() {
  const [healthInfo, setHealthInfo] = useState({ version: '1.0.0', buildTime: Date.now() });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const h = await (await fetch('/api/health')).json();
        setHealthInfo({ version: h.version, buildTime: h.buildTime });
      } catch (error) {
        console.error('Failed to fetch health info:', error);
      }
    };
    
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-sm text-slate-500">
          © {new Date().getFullYear()} YAGO SPORTS · All rights reserved.
          <span className="ml-4 text-xs text-gray-400">
            v{healthInfo.version} • {new Date(healthInfo.buildTime).toLocaleString()}
          </span>
        </div>
      </footer>
    </div>
  );
}