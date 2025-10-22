import { Link, useLocation } from "react-router-dom";

const steps = [
  { path: "/app/market", label: "모임으로" },
  { path: "/app/group",  label: "일자리로" },
  { path: "/app/jobs",   label: "끝내기"  },
];

export default function FlowNext() {
  const { pathname } = useLocation();
  const i = steps.findIndex(s => s.path === pathname);

  if (i === -1) return null;

  const isLast = i === steps.length - 1;
  const nextPath = isLast ? "/app/market" : steps[i + 1].path;
  const label    = isLast ? "시작 화면 완료 (마켓으로)" : steps[i + 1].label;

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: "white" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "12px 16px" }}>
        <Link
          to={nextPath}
          style={{
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            textDecoration: "none",
            color: "#111827",
            background: "#f9fafb",
          }}
        >
          ➜ {label}
        </Link>
      </div>
    </div>
  );
}
