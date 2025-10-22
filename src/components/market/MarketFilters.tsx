import { useSearchParams } from "react-router-dom";

const CATS = ["전체", "축구화", "유니폼", "공", "기타"];

const STATUS_TABS = [
  { key: "all", label: "전체" },
  { key: "selling", label: "판매중" },
  { key: "reserved", label: "예약중" },
  { key: "sold", label: "판매완료" },
];

export default function MarketFilters() {
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") ?? "전체";
  const status = params.get("status") ?? "selling"; // 기본값: 판매중

  const setCat = (c: string) => {
    if (c === "전체") {
      params.delete("cat");
    } else {
      params.set("cat", c);
    }
    setParams(params, { replace: true });
  };

  const setStatus = (key: string) => {
    const next = new URLSearchParams(params);
    if (key === "selling") next.delete("status"); // 기본값이므로 삭제
    else next.set("status", key);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-3">
      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        {CATS.map((c) => {
          const active = c === cat;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={[
                "px-3 h-9 rounded-full border transition-colors shrink-0",
                active
                  ? "bg-black text-white border-black"
                  : "bg-white hover:bg-muted",
              ].join(" ")}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map(t => {
          const active = status === t.key || (t.key === "selling" && status == null);
          return (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-3 h-9 rounded-full border text-sm transition-colors shrink-0 ${
                active ? "bg-black text-white border-black" : "hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}