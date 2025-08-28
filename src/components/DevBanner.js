import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { isDevBuild, canAccessDev } from "../lib/devMode";
import { getUid } from "../lib/auth";
export default function DevBanner() { const uid = getUid(); const show = isDevBuild() && canAccessDev({ uid }); if (!show)
    return null; return (_jsxs("div", { className: "fixed top-3 right-3 z-[1000] select-none", children: ["      ", _jsx("span", { className: "px-2 py-1 rounded-md text-xs font-semibold bg-amber-500 text-black shadow", children: "DEV" }), "    "] })); }
