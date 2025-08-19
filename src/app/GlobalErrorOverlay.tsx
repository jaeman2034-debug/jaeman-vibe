import { useEffect, useState } from "react";

export default function GlobalErrorOverlay() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const onErr = (e: ErrorEvent) => setMsg(e.message || String(e.error || e));
    const onRej = (e: PromiseRejectionEvent) => setMsg(String(e.reason));
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => { window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onRej); };
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed bottom-3 right-3 z-[1000] max-w-sm rounded-xl border bg-rose-50 text-rose-900 p-3 shadow">
      <div className="text-xs font-mono break-all">{msg}</div>
      <button className="mt-2 text-xs underline" onClick={() => setMsg(null)}>닫기</button>
    </div>
  );
} 