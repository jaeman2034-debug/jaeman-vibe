import React from "react";

type P = { children: React.ReactNode };
type S = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<P, S> {
  state: S = { hasError: false };

  static getDerivedStateFromError(error: any): S {
    return { hasError: true, message: String(error?.message ?? error) };
  }
  componentDidCatch(error: any, info: any) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>문제가 발생했습니다 😥</h2>
          <p style={{ color: "#666" }}>{this.state.message}</p>
          <button onClick={() => location.reload()} style={{ marginTop: 12 }}>
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}