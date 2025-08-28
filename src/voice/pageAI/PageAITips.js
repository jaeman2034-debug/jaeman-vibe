import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { getActiveExamples } from "./registry";
export default function PageAITips() { const [tips, setTips] = useState([]); useEffect(() => { setTips(getActiveExamples()); }, []); if (!tips.length)
    return null; return (_jsxs("div", { className: "my-3 flex flex-wrap gap-2", children: ["      ", tips.map((t, i) => (_jsx("span", { className: "text-xs px-2 py-1 rounded-full border bg-white/60 dark:bg-zinc-950/50", children: t }, i))), "    "] })); }
