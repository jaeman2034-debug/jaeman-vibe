import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export default class ErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { err: null };
    }
    static getDerivedStateFromError(err) { return { err }; }
    componentDidCatch(err, info) { console.error('[EB]', err, info); }
    render() {
        if (this.state.err) {
            return (_jsx("div", { className: "p-4 text-center text-sm text-red-600", children: "\uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694. \uC0C8\uB85C\uACE0\uCE68\uD574 \uBCF4\uC138\uC694." }));
        }
        return this.props.children;
    }
}
