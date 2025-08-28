import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useEffect, useState } from "react";
export default function AppShell() {
    const [healthInfo, setHealthInfo] = useState({ version: '1.0.0', buildTime: Date.now() });
    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const h = await (await fetch('/api/health')).json();
                setHealthInfo({ version: h.version, buildTime: h.buildTime });
            }
            catch (error) {
                console.error('Failed to fetch health info:', error);
            }
        };
        fetchHealth();
    }, []);
    return (_jsxs("div", { className: "min-h-screen flex flex-col", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex flex-col", children: _jsx(Outlet, {}) }), _jsx("footer", { className: "border-t bg-white", children: _jsxs("div", { className: "mx-auto max-w-6xl px-4 md:px-6 py-6 text-sm text-slate-500", children: ["\u00A9 ", new Date().getFullYear(), " YAGO SPORTS \u00B7 All rights reserved.", _jsxs("span", { className: "ml-4 text-xs text-gray-400", children: ["v", healthInfo.version, " \u2022 ", new Date(healthInfo.buildTime).toLocaleString()] })] }) })] }));
}
