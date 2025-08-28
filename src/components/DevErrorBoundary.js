import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export default class DevErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { err: undefined };
    }
    static getDerivedStateFromError(err) { return { err }; }
    componentDidCatch(err, info) { console.error('[ErrorBoundary]', err, info); }
    render() { if (this.state.err) {
        return (_jsxs("div", { style: { padding: 16 }, children: ["          ", _jsxs("h3", { children: ["?\uFFFD\uB958\uAC00 \uBC1C\uC0DD?\uFFFD\uC5B4??/h3>          ", _jsx("pre", { style: { whiteSpace: 'pre-wrap' }, children: String(this.state.err?.message || this.state.err) }), "        "] })] }));
    } return this.props.children; }
}
