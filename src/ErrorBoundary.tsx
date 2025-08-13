import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string; stack?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any): State {
    return { hasError: true, message: String(err?.message || err), stack: err?.stack };
  }

  componentDidCatch(error: any, info: any) {
    console.error("UI crash", error, info);
    window.dispatchEvent(new CustomEvent("app:crash", { detail: { error, info } }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#0b1320", color: "#fff", padding: 16 }}>
          <h2>앗! 화면이 멈췄어요 😵</h2>
          <p style={{ opacity: .9 }}>{this.state.message}</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.stack}</pre>
          <button onClick={() => this.setState({ hasError: false })}>다시 시도</button>
        </div>
      );
    }
    return this.props.children;
  }
} 