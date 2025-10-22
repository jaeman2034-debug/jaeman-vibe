import { Link } from "react-router-dom";
import RegionBadge from "./RegionBadge";

export default function TopNavQuickLinks() {
  return (
    <nav className="flex items-center gap-2">
      <Link to="/market/categories" className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100">카테고리</Link>
      <Link to="/meet" className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100">모임</Link>
      <Link to="/jobs" className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100">구인·구직</Link>
      <RegionBadge />
    </nav>
  );
}
