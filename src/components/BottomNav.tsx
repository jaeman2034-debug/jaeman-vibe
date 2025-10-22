// ???�단 ?�비게이??�?컴포?�트
import { NavLink } from "react-router-dom";
import { Home, ShoppingCart, Users, Mic } from "lucide-react";

export default function BottomNav() {
  const navItems = [
    { path: "/dashboard", icon: <Home size={22} />, label: "?? },
    { path: "/market", icon: <ShoppingCart size={22} />, label: "마켓" },
    { path: "/yago-assistant", icon: <Mic size={22} />, label: "AI비서" },
    { path: "/login", icon: <Users size={22} />, label: "로그?? },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center px-2 py-1 rounded-lg transition-colors ${
              isActive 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-500 hover:text-gray-700"
            }`
          }
        >
          {item.icon}
          <span className="text-xs mt-1 font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
