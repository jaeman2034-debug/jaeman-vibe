import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNavigation() {
  const nav = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/app/market", label: "마켓", icon: "🛒" },
    { path: "/app/group", label: "모임", icon: "👥" },
    { path: "/app/jobs", label: "일자리", icon: "💼" },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around max-w-screen-sm mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => nav(tab.path)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive(tab.path)
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
