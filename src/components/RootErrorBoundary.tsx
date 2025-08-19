import React from "react";

export default class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { err?: any }
> {
  state = { err: undefined as any };
  
  static getDerivedStateFromError(err: any) { 
    return { err }; 
  }
  
  componentDidCatch(err: any, info: any) { 
    console.error("UI Error:", err, info);
    
    // 추가 에러 정보 로깅
    if (err.stack) {
      console.error("Error Stack:", err.stack);
    }
    if (info.componentStack) {
      console.error("Component Stack:", info.componentStack);
    }
  }

  render() {
    if (!this.state.err) return this.props.children;
    
    return (
      <div style={{
        fontFamily: "system-ui", 
        padding: 24, 
        maxWidth: "800px", 
        margin: "0 auto",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb"
      }}>
        <h2 style={{ 
          color: "#dc2626", 
          marginBottom: "16px",
          fontSize: "24px",
          fontWeight: "600"
        }}>
          ⚠️ 화면 렌더링 오류
        </h2>
        
        <div style={{ 
          marginBottom: "16px",
          padding: "12px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          color: "#991b1b"
        }}>
          <strong>오류 내용:</strong> {String(this.state.err?.message || this.state.err)}
        </div>
        
        <details style={{ marginBottom: "16px" }}>
          <summary style={{ 
            cursor: "pointer", 
            padding: "8px 0",
            fontWeight: "500",
            color: "#374151"
          }}>
            🔍 자세한 오류 정보 보기
          </summary>
          <pre style={{
            whiteSpace: "pre-wrap",
            background: "#f6f7fb",
            padding: "16px",
            borderRadius: "8px",
            fontSize: "14px",
            lineHeight: "1.5",
            border: "1px solid #e5e7eb",
            overflow: "auto",
            maxHeight: "300px"
          }}>
            {String(this.state.err?.stack || this.state.err)}
          </pre>
        </details>
        
        <div style={{ 
          display: "flex", 
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <button 
            onClick={() => location.reload()} 
            style={{
              padding: "12px 20px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px"
            }}
          >
            🔄 새로고침
          </button>
          
          <button 
            onClick={() => this.setState({ err: undefined })} 
            style={{
              padding: "12px 20px",
              background: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px"
            }}
          >
            🚫 오류 무시하고 계속
          </button>
          
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              location.reload();
            }} 
            style={{
              padding: "12px 20px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px"
            }}
          >
            🗑️ 캐시 초기화 후 새로고침
          </button>
        </div>
        
        <div style={{ 
          marginTop: "16px",
          padding: "12px",
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "8px",
          fontSize: "14px",
          color: "#0c4a6e"
        }}>
          <strong>💡 해결 방법:</strong>
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            <li>새로고침을 시도해보세요</li>
            <li>브라우저를 완전히 닫고 다시 열어보세요</li>
            <li>캐시 초기화 후 새로고침을 시도해보세요</li>
            <li>문제가 지속되면 개발자에게 문의하세요</li>
          </ul>
        </div>
      </div>
    );
  }
} 