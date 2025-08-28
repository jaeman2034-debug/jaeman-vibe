import React from 'react';

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode }, { err: any }
> {
  state = { err: null };
  static getDerivedStateFromError(err: any) { return { err }; }
  componentDidCatch(err: any, info: any) { console.error('[EB]', err, info); }
  render() {
    if (this.state.err) {
      return (
        <div className="p-4 text-center text-sm text-red-600">
          문제가 발생했어요. 새로고침해 보세요.
        </div>
      );
    }
    return this.props.children;
  }
}
