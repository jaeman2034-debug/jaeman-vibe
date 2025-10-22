import { isInAppBrowser } from "@/utils/inapp";

export default function DebugUA() {
  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>User Agent 디버그 정보</h2>
      <pre style={{ 
        whiteSpace: "pre-wrap", 
        padding: "16px", 
        background: "#f5f5f5", 
        borderRadius: "8px",
        fontSize: "14px",
        lineHeight: "1.5"
      }}>
        UA: {navigator.userAgent}
        {"\n"}Platform: {navigator.platform}
        {"\n"}Language: {navigator.language}
        {"\n"}InAppBrowser: {String(isInAppBrowser())}
      </pre>
      
      <div style={{ marginTop: "20px" }}>
        <h3>테스트 방법:</h3>
        <ol>
          <li>일반 브라우저에서 접속 → InAppBrowser: false</li>
          <li>카카오톡 내 브라우저에서 접속 → InAppBrowser: true</li>
          <li>인스타그램 내 브라우저에서 접속 → InAppBrowser: true</li>
          <li>네이버 앱 내 브라우저에서 접속 → InAppBrowser: true</li>
        </ol>
      </div>
    </div>
  );
}
