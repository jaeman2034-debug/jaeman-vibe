import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
const ThemeCtx = createContext(null);
function applyTheme(t) { const root = document.documentElement; const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; const wantsDark = t === "dark" || (t === "system" && systemDark); root.classList.toggle("dark", wantsDark); root.style.colorScheme = wantsDark ? "dark" : "light"; }
export function ThemeProvider({ children }) { const [theme, setThemeState] = useState(() => localStorage.getItem("theme") || "system"); useEffect(() => { applyTheme(theme); localStorage.setItem("theme", theme); const mq = window.matchMedia("(prefers-color-scheme: dark)"); const onChange = () => theme === "system" && applyTheme("system"); mq.addEventListener?.("change", onChange); return () => mq.removeEventListener?.("change", onChange); }, [theme]); const value = useMemo(() => ({ theme, setTheme: (t) => setThemeState(t), toggle: () => setThemeState((p) => (p === "dark" ? "light" : "dark")) }), [theme]); return _jsx(ThemeCtx.Provider, { value: value, children: children }); }
export function useTheme() { const v = useContext(ThemeCtx); if (!v)
    throw new Error("useTheme must be used within ThemeProvider"); return v; }
