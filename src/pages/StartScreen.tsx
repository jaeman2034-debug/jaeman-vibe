import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./startscreen.css";

export default function StartScreen() {
  const navigate = useNavigate();

  return (
    <div className="start-root">
      <main className="start-card">
        <div className="logo">Logo</div>

        <h1 className="brand">YAGO SPORTS</h1>
        <p className="tagline">스코어와 기록, AI로 채워지는 커뮤니티.</p>
        <p className="tagline">정답, 요약까지! 지금 원하는 팀/리그로 시작해보세요.</p>

        {/* 작은 점 토글 (디자인용) */}
        <div className="tiny-toggle" aria-hidden="true">
          <span className="dot active" />
          <span className="dot" />
        </div>

        <button
          type="button"
          className="primary"
          onClick={() => navigate("/signup/voice")}
          style={{ position: "relative", zIndex: 10, pointerEvents: "auto" }}
        >
          시작하기
        </button>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Link to="/signup/voice"><button className="btn btn-primary">음성 회원가입(단계별)</button></Link>
          <Link to="/natural-signup"><button className="btn">자연어 한 번에(베타)</button></Link>
        </div>

        <div className="login-row">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </div>
      </main>
    </div>
  );
}
