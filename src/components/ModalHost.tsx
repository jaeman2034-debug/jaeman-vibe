import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * ModalHost v2 — Portal + Z-Index + ScrollLock
 * - 포털로 body에 렌더 → 부모 transform/overflow 영향 제거 (겹침/클리핑 해결)
 * - z-index 상향 (z-[2000])
 * - 중복 open 가드 + 200ms 쓰로틀
 * - ESC/백드롭 닫기 + 스크롤 잠금
 */

type Registry = Record<string, (props: any) => React.ReactNode>;

type Ctx = {
  open: (key: string, props?: any) => void;
  close: () => void;
  active: { key: string; props?: any } | null;
};

const ModalCtx = createContext<Ctx | null>(null);

export function useModal() {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

export function ModalProvider({ registry, children }: { registry: Registry; children: React.ReactNode }) {
  const [active, setActive] = useState<{ key: string; props?: any } | null>(null);
  const lastRef = useRef<{ key: string; t: number } | null>(null);

  const open = useCallback((key: string, props?: any) => {
    const now = Date.now();
    if (lastRef.current && lastRef.current.key === key && now - lastRef.current.t < 200) return; // 쓰로틀
    lastRef.current = { key, t: now };
    setActive((prev) => (prev?.key === key ? prev : { key, props }));
  }, []);

  const close = useCallback(() => setActive(null), []);

  // ESC 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // 스크롤 잠금
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);

  // 포털 타겟 준비
  const portalEl = useMemo(() => {
    let el = document.getElementById("modal-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "modal-root";
      document.body.appendChild(el);
    }
    return el;
  }, []);

  // 백드롭 + 컨텐츠 렌더
  const node = useMemo(() => {
    if (!active) return null;
    const Comp = registry[active.key];
    if (!Comp) return null;
    return (
      <div className="fixed inset-0 z-[2000]">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={close}
          aria-label="BackDrop"
        />
        <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none">
          <div className="pointer-events-auto max-h-[90dvh] w-full max-w-[720px]">
            {Comp({ ...(active.props || {}), onClose: close })}
          </div>
        </div>
      </div>
    );
  }, [active, registry, close]);

  return (
    <ModalCtx.Provider value={{ open, close, active }}>
      {children}
      {portalEl ? createPortal(node, portalEl) : null}
    </ModalCtx.Provider>
  );
} 