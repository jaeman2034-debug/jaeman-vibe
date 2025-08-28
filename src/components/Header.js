import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import FIREBASE from "@/lib/firebase";
import { useRegion } from "@/hooks/useRegion";
export default function Header() {
    const navigate = useNavigate();
    const { region } = useRegion();
    const handleLogoClick = () => {
        console.log('[Header] 로고 클릭 - 시작 페이지(/start)로 이동');
        navigate('/start');
    };
    return (_jsx("header", { className: "sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6", children: [_jsxs("button", { onClick: handleLogoClick, className: "flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 text-xl", children: "+" }), _jsx("span", { className: "text-xl font-extrabold", children: "YAGO SPORTS" }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Region: ", region] })] }), _jsxs("nav", { className: "hidden gap-2 md:flex", children: [_jsx(Link, { to: "/market", className: "btn-ghost", children: "\uC2A4\uD3EC\uCE20\uB9C8\uCF13" }), _jsx(Link, { to: "/chat", className: "btn-ghost", children: "\uCC44\uD305" }), _jsx(Link, { to: "/jobs", className: "btn-ghost", children: "\uAD6C\uC778\u00B7\uAD6C\uC9C1" }), _jsx(Link, { to: "/groups", className: "btn-ghost", children: "\uBAA8\uC784" }), FIREBASE.auth.currentUser && (_jsx(Link, { to: "/my/products", className: "btn-ghost", children: "\uB0B4\uC0C1\uD488" }))] })] }) }));
}
