import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
type ToastKind = "info" | "success" | "warn" | "error";
export type Toast = { id: string; kind: ToastKind; msg: string; ttlMs?: number };

type Ctx = {
  show: (msg: string, kind?: ToastKind, ttlMs?: number) => string;
  info: (msg: string, ttlMs?: number) => string;
  success: (msg: string, ttlMs?: number) => string;
  warn: (msg: string, ttlMs?: number) => string;
  error: (msg: string, ttlMs?: number) => string;
  remove: (id: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const timers = useRef<Record<string, any>>({});

  const remove = useCallback((id: string) => {
    setList((xs) => xs.filter((t) => t.id !== id));
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  }, []);

  const push = useCallback((msg: string, kind: ToastKind = "info", ttlMs = 3000) => {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = { id, kind, msg, ttlMs };
    setList((xs) => [...xs, t]);
    if (ttlMs > 0) {
      timers.current[id] = setTimeout(() => remove(id), ttlMs);
    }
    return id;
  }, [remove]);

  const api = useMemo<Ctx>(() => ({
    show: push,
    info: (m, ttl) => push(m, "info", ttl),
    success: (m, ttl) => push(m, "success", ttl),
    warn: (m, ttl) => push(m, "warn", ttl),
    error: (m, ttl) => push(m, "error", ttl),
    remove,
  }), [push, remove]);

  // 전역 에러를 토스트로 출력(개발용 UX)
  useEffect(() => {
    const onErr = (e: ErrorEvent) => api.error(e.message ?? "예상치 못한 오류가 발생했습니다");
    const onRej = (e: PromiseRejectionEvent) => api.error((e.reason?.message || e.reason || "요청 처리에 실패했습니다").toString());
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, [api]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Toaster list={list} onClose={remove} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

function Toaster({ list, onClose }: { list: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[9999] flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-2 px-4">
        {list.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-md
              ${t.kind === "success" ? "border-green-300 bg-green-50 text-green-800" :
                 t.kind === "warn"    ? "border-yellow-300 bg-yellow-50 text-yellow-800" :
                 t.kind === "error"   ? "border-red-300 bg-red-50 text-red-800" :
                                        "border-gray-300 bg-white text-gray-800"}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 text-sm leading-5">{t.msg}</div>
              <button onClick={() => onClose(t.id)} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}