import { NavLink, useParams, useLocation } from "react-router-dom";

type TabKey = "overview" | "market" | "clubs" | "jobs" | "events" | "facilities";

export default function SideNav() {
  const { slug } = useParams(); // football ??
  const loc = useLocation();
  const search = new URLSearchParams(loc.search);
  const tab = (search.get("tab") as TabKey) || "overview";

  const item = (key: TabKey, label: string) => (
    <NavLink
      key={key}
      to={`/admin/category/${slug}?tab=${key}`}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg ${
          // NavLink??query까�???active 계산??�??��?�?직접 보정
          isActive || tab === key ? "bg-blue-100 text-blue-700" : "hover:bg-gray-50"
        }`
      }
      // NavLink 기본 ?�작 ?�용 - preventDefault ?�거
    >
      {label}
    </NavLink>
  );

  return (
    <nav className="p-2 space-y-1">
      {item("overview", "개요")}
      {item("market", "마켓")}
      {item("clubs", "모임")}
      {item("jobs", "구인·구직")}
      {item("events", "?�벤???�슨")}
      {item("facilities", "?�설")}
      {/* ?�영?�?�보?�는 카테고리 �??�우?�로 */}
      <NavLink
        to="/admin/categories"
        className="block px-3 py-2 rounded-lg hover:bg-gray-50"
        // NavLink 기본 ?�작 ?�용 - preventDefault ?�거
      >
        ?�영?�?�보??
      </NavLink>
    </nav>
  );
}
