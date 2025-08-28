import { jsx as _jsx } from "react/jsx-runtime";
// ErrorBoundary.tsx
import React from 'react';
class ErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { e: null };
    }
    componentDidCatch(e) {
        this.setState({ e });
        console.error(e);
    }
    render() {
        return this.state.e ? _jsx("div", { children: "\uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694." }) : this.props.children;
    }
}
export default ErrorBoundary;
