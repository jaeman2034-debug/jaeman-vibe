import React from "react";
import { openExternalBrowser } from "../utils/inapp";

export default function InAppBlocked() {
  return (
    <div style={{padding: 24, maxWidth: 420, margin: "40px auto"}}>
      <h2 style={{marginBottom: 12}}>외부 브라우저에서 계속</h2>
      <p style={{lineHeight: 1.6, marginBottom: 16}}>
        현재 앱 내 브라우저에서는 Google 로그인이 차단됩니다.
        아래 버튼을 눌러 Chrome/Safari로 열어 주세요.
      </p>
      <button
        onClick={openExternalBrowser}
        style={{
          width: "100%", padding: "12px 16px",
          background: "#111827", color: "white",
          borderRadius: 8, fontWeight: 600,
        }}
      >
        외부 브라우저에서 열기
      </button>
      <div style={{fontSize: 12, opacity: .7, marginTop: 12}}>
        iOS(아이폰)는 오른쪽 상단 <b>공유 아이콘 → "Safari로 열기"</b>를 눌러도 됩니다.
      </div>
    </div>
  );
}
