import { Button } from "@/components/ui/button";
import { Link, NavLink } from "react-router-dom";

const items = [
  { to: "/market", label: "마켓" },
  { to: "/meet",   label: "모임" },
  { to: "/jobs",   label: "구인·구직" },
  { to: "/admin",  label: "?�영?�?�보?? },
];

export default function QuickNavButton() {
  return (
    <nav aria-label="빠른 ?�동" className="mb-4">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
        {items.map(i => (
          <Button key={i.to} variant="ghost" className="w-full justify-start" asChild>
            <NavLink 
              to={i.to}
              className={({ isActive }) =>
                isActive ? "font-semibold bg-muted" : ""
              }
            >
              {i.label}
            </NavLink>
          </Button>
        ))}
      </div>
    </nav>
  );
}
