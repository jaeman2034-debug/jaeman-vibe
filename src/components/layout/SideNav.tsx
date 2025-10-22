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
          // NavLink??queryê¹Œì???active ê³„ì‚°??ëª??˜ë?ë¡?ì§ì ‘ ë³´ì •
          isActive || tab === key ? "bg-blue-100 text-blue-700" : "hover:bg-gray-50"
        }`
      }
      // NavLink ê¸°ë³¸ ?™ì‘ ?ˆìš© - preventDefault ?œê±°
    >
      {label}
    </NavLink>
  );

  return (
    <nav className="p-2 space-y-1">
      {item("overview", "ê°œìš”")}
      {item("market", "ë§ˆì¼“")}
      {item("clubs", "ëª¨ì„")}
      {item("jobs", "êµ¬ì¸Â·êµ¬ì§")}
      {item("events", "?´ë²¤???ˆìŠ¨")}
      {item("facilities", "?œì„¤")}
      {/* ?´ì˜?€?œë³´?œëŠ” ì¹´í…Œê³ ë¦¬ ë°??¼ìš°?¸ë¡œ */}
      <NavLink
        to="/admin/categories"
        className="block px-3 py-2 rounded-lg hover:bg-gray-50"
        // NavLink ê¸°ë³¸ ?™ì‘ ?ˆìš© - preventDefault ?œê±°
      >
        ?´ì˜?€?œë³´??
      </NavLink>
    </nav>
  );
}
