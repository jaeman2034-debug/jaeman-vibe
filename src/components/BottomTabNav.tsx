// ??src/components/BottomTabNav.tsx
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  PlusSquare,
  BookText,
  Building2,
  Users,
} from "lucide-react";

export default function BottomTabNav() {
  const location = useLocation();

  const tabs = [
    { to: "/", icon: <Home size={22} />, label: "?? },
    { to: "/market", icon: <ShoppingBag size={22} />, label: "마켓" },
    { to: "/market/new", icon: <PlusSquare size={22} />, label: "?�품?�록" },
    { to: "/blogs", icon: <BookText size={22} />, label: "블로�? },
    { to: "/facilities", icon: <Building2 size={22} />, label: "?�설" },
    { to: "/meetups", icon: <Users size={22} />, label: "모임" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-sm flex justify-around items-center py-2 z-50">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center text-sm transition-colors ${
              isActive ? "text-blue-500" : "text-gray-500 hover:text-blue-400"
            }`}
          >
            {tab.icon}
            <span className="text-[12px] mt-1">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
