// src/pages/StartScreen.tsx
import React from "react";
import "./start-screen.css";
import logo from "../assets/logo.png"; // ✅ GitHub 경로 그대로 사용!

type Props = {
  onStart?: () => void;
  onLogin?: () => void;
};

export default function StartScreen({ onStart, onLogin }: Props) {
  return (
    <div className="ys-wrap">
      <div className="ys-card">
        {/* 로고 */}
        <div className="ys-logo">
          <img src={logo} alt="YAGO SPORTS" />
        </div>

        {/* 타이틀/슬로건 */}
        <h1 className="ys-title">YAGO SPORTS</h1>
        <p className="ys-sub">AI Platform for Sports Enthusiasts</p>

        {/* 카피 */}
        <div className="ys-copy">
          <h2>스포츠의 시작, 야고</h2>
          <p>
            체육인 커뮤니티, 장터, 모임까지<br />
            지금 위치를 선택하고 시작해보세요!
          </p>
        </div>

        {/* 로케일 (샘플) */}
        <button className="ys-locale" type="button">
          <span>🌐</span> KR 대한민국 <span className="ys-caret">▾</span>
        </button>

        {/* CTA */}
        <button className="ys-cta" onClick={onStart}>시작하기</button>

        {/* 로그인 링크 */}
        <div className="ys-login">
          이미 계정이 있나요?{" "}
          <button className="ys-login-link" onClick={onLogin}>로그인</button>
        </div>
      </div>
    </div>
  );
}
