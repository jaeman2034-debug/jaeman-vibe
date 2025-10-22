import React from "react";
import { isAndroid, isIOS } from "@/lib/ua";
import { openInExternalBrowser } from "@/lib/openExternal";

export default function OpenInBrowser() {
  return (
    <div style={{ maxWidth: 480, margin: "48px auto", padding: 16 }}>
      <h2>앱 내 브라우저에서는 Google 로그인이 차단됩니다</h2>
      <p>아래 버튼으로 <b>외부 브라우저</b>에서 다시 열어 로그인하세요.</p>

      <button 
        onClick={() => openInExternalBrowser()} 
        style={{ 
          padding: "12px 20px",
          background: "#1d4ed8",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "16px"
        }}
      >
        {isAndroid ? "Chrome/삼성인터넷으로 열기" : isIOS ? "Safari/Chrome에서 열기" : "브라우저에서 열기"}
      </button>

      <hr style={{ margin: "24px 0" }} />
      <p><b>바로 열리지 않으면</b> 우측 상단 … 메뉴에서 "브라우저에서 열기"를 눌러주세요.</p>

      <p>또는 아래 <b>대체 로그인</b>을 사용해 주세요.</p>
      {/* <EmailPasswordForm/> */}
    </div>
  );
}
