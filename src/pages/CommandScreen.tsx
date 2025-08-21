// src/pages/CommandScreen.tsx
import React from "react";
import "./startscreen.css"; // ✅ 실제 파일명과 일치 (소문자, 하이픈 없음)

export default function CommandScreen() {
  return (
    <div className="start-root">
      <div className="start-card">
        <h2>Command Screen</h2>
        <p>디버그/커맨드 테스트 화면</p>
      </div>
    </div>
  );
}
