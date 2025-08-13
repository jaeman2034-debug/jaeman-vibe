import React from "react";
import { useNavigate } from "react-router-dom";
import "./startscreen.css";

export default function StartScreen() {
  const navigate = useNavigate();

  return (
    <div className="start-root">
      <div className="start-card">
        <div className="start-logo">Logo</div>

        <h1 className="start-title">YAGO SPORTS</h1>
        <p className="start-subtitle">AI Platform for Sports Enthusiasts</p>

        <p className="start-desc">
          스코어와 기록, AI로 채워지는 커뮤니티. 정답, 요약까지! 지금 원하는 팀/리그로
          시작해보세요.
        </p>

        <button className="start-btn" onClick={() => navigate("/signup")}>
          시작하기
        </button>

        <div className="start-login">
          이미 계정이 있나요?
          <a href="/login" className="start-login-link">로그인</a>
        </div>
      </div>
    </div>
  );
}
