import React, { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

type Action = { label: string; desc?: string; to?: string; onClick?: () => void };

const ACTIONS: Action[] = [
  { label: "클럽 만들기", desc: "새 클럽/팀 자동 세팅", to: "/clubs?new=1" },
  { label: "블로그 글쓰기", desc: "야고 플랫폼 블로그", to: "/blogs/new" },
  { label: "블로그 목록", desc: "전체 블로그 보기", to: "/blogs" },
  { label: "SEO 관리", desc: "사이트맵 & 검색엔진 최적화", to: "/sitemap" },
  { label: "마켓 글쓰기", desc: "중고/유니폼/공", to: "/market/new" },
  { label: "모임 만들기", desc: "번개/정기모임", to: "/meetups/new" },
  { label: "시설 대관 등록", desc: "구장/체육관", to: "/facilities/new" },
  { label: "내 티켓", desc: "결제/참가 내역", to: "/tickets" },
];

export default function StartScreen({ onClose }: { onClose?: () => void }) {
  const nav = useNavigate();
  const { search } = useLocation();
  const { user, login, logout } = useAuth();

  const sp = new URLSearchParams(search);
  const open = sp.get("start") === "1";

  const close = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      const next = new URLSearchParams(search);
      next.delete("start");
      nav({ search: `?${next.toString()}` }, { replace: true });
    }
  }, [search, nav, onClose]);

  const go = (to: string) => {
    close();
    nav(to);
  };

  // 동적 Auth 항목
  const dynamicItems = user
    ? [{ label: "로그아웃", desc: `${user.displayName ?? user.email ?? user.uid}`, onClick: logout }]
    : [{ label: "로그인", desc: "Google 계정으로 로그인", onClick: login }];

  // 새 창에서 시작
  const openNewWindow = () => {
    const base = window.location.origin + window.location.pathname; // 현재 페이지 루트
    window.open(`${base}?start=1`, "_blank", "noopener,noreferrer");
  };

  // 팝업 창으로 시작
  const openPopup = () => {
    const w = 420, h = 820;
    const left = window.screenX + window.outerWidth - w - 20;
    const top = window.screenY + 20;
    window.open(`${window.location.origin}/?start=1`, 'YAGO-Start',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  };

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      // Ctrl/Cmd + K 로도 열 수 있게 (다음 섹션의 FAB 없이도)
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={close}
        aria-hidden="true"
      />
      {/* 카드 */}
      <div className="relative w-[min(720px,92vw)] max-h-[86vh] overflow-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">스타트 스크린</h2>
          <button
            onClick={close}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
          >
            닫기(Esc)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...ACTIONS.map(a => ({...a, onClick: () => go(a.to!)})), ...dynamicItems].map((a) => (
            <button
              key={a.label}
              onClick={a.onClick ?? (() => {})}
              className="group rounded-xl border p-4 text-left hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="font-medium">{a.label}</div>
              {a.desc && (
                <div className="mt-0.5 text-xs text-gray-500">{a.desc}</div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={openPopup} 
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            팝업으로 시작
          </button>
          <button 
            onClick={openNewWindow} 
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            새 창에서 시작
          </button>
          <button
            onClick={close}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
          >
            닫기(Esc)
          </button>
        </div>

        <div className="mt-4 text-[12px] text-gray-500">
          • 주소 끝에 <code>?start=1</code> 을 붙여도 열립니다. • Esc로 닫기
        </div>
      </div>
    </div>
  );
}
