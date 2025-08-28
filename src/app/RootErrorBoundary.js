import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
export class RootErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: undefined }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error, info) { console.error("RootErrorBoundary", error, info); }
    render() { if (this.state.error) {
        return (_jsxs("div", { className: "min-h-dvh grid place-items-center p-6", children: ["          ", _jsxs("div", { className: "max-w-xl w-full rounded-2xl border p-6 bg-white dark:bg-zinc-900", children: ["            ", _jsx("h1", { className: "text-xl font-bold mb-2", children: "\uBB38\uC81C\uAC00 \uBC1C\uC0DD?\uFFFD\uC2B5?\uFFFD\uB2E4" }), "            ", _jsx("p", { className: "text-sm opacity-70 mb-3", children: "\uAC1C\uBC1C \uCF58\uC194(F12)?\uFFFD\uC11C ?\uFFFD\uB7EC\uFFFD??\uFFFD\uAED8 ?\uFFFD\uC778?\uFFFD\uC138??" }), "            ", _jsxs("pre", { className: "text-xs bg-zinc-100 dark:bg-zinc-800 rounded p-3 overflow-auto max-h-64", children: [String(this.state.error.stack || this.state.error.message), "            "] }), "            ", _jsx("button", { className: "mt-4 px-4 py-2 rounded bg-zinc-900 text-white", onClick: () => location.reload(), children: "?\uFFFD\uB85C\uACE0\uCE68" }), "          "] }), "        "] }));
    } return this.props.children; }
}
