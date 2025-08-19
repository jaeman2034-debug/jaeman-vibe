import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          maxWidth: '600px',
          margin: '40px auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          color: '#dc2626'
        }}>
          <h1 style={{ marginTop: 0, color: '#991b1b' }}>🚨 에러가 발생했습니다</h1>
          
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            padding: '16px',
            marginBottom: '16px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            <strong>에러 내용:</strong>
            <div style={{ 
              background: '#fee2e2', 
              padding: '12px', 
              borderRadius: '6px', 
              marginTop: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
            </div>
          </div>

          {this.state.errorInfo && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              padding: '16px',
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              <strong>스택 트레이스:</strong>
              <div style={{ 
                background: '#fee2e2', 
                padding: '12px', 
                borderRadius: '6px', 
                marginTop: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.errorInfo.componentStack}
              </div>
            </div>
          )}

          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #bae6fd', 
            borderRadius: '8px', 
            padding: '16px',
            marginBottom: '16px',
            color: '#0369a1'
          }}>
            <strong>💡 해결 방법:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>페이지를 새로고침해보세요 (F5 또는 Ctrl+R)</li>
              <li>브라우저를 완전히 닫고 다시 열어보세요</li>
              <li>개발자 도구 콘솔에서 더 자세한 에러를 확인하세요</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: '12px'
            }}
          >
            🔄 페이지 새로고침
          </button>

          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              padding: '12px 24px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            🚪 에러 무시하고 계속
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 