import { jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/health';
export default function AppFooter() {
    const [h, setH] = useState({});
    useEffect(() => { getHealth().then(setH).catch(console.error); }, []);
    return (_jsxs("footer", { className: "text-xs text-gray-500 dark:text-gray-400 text-center py-3", children: ["v", h.version ?? 'dev', " \u2022 ", h.buildTime ? new Date(h.buildTime).toLocaleString() : '-'] }));
}
