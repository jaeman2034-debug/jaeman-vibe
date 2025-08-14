// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import StartScreen from "./pages/StartScreen";
import VoiceSignUpFull from "./pages/VoiceSignUpFull";
import NaturalSignupLab from "./pages/NaturalSignupLab";

// 임시 로그인 페이지 (없으면 라우터 에러 방지용)
function LoginPage() {
  return (
    <div style={{ padding: 24 }}>
      <h2>로그인</h2>
      <p>나중에 실제 로그인 폼으로 교체하세요.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 공통 레이아웃 */}
        <Route element={<App />}>
          {/* 홈: 시작 카드 */}
          <Route index element={<StartScreen />} />
          {/* 음성 회원가입 마법사 */}
          <Route path="signup/voice" element={<VoiceSignUpFull />} />
          {/* 자연어 회원가입 베타 */}
          <Route path="natural-signup" element={<NaturalSignupLab />} />
          {/* 로그인 */}
          <Route path="login" element={<LoginPage />} />
          {/* 그 외는 홈으로 */}
          <Route path="*" element={<StartScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
