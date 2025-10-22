import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function StartFab() {
  const nav = useNavigate();
  const { search } = useLocation();

  const open = useCallback(() => {
    const sp = new URLSearchParams(search);
    sp.set("start", "1");
    nav({ search: `?${sp.toString()}` }, { replace: true });
  }, [search, nav]);

  return (
    <button
      onClick={open}
      className="fixed bottom-5 right-5 z-[2147483646] rounded-full bg-black px-4 py-2 text-white shadow-lg"
      aria-label="스타트 스크린 열기"
      title="스타트 스크린"
    >
      시작
    </button>
  );
}

export default StartFab;
