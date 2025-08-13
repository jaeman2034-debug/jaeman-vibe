import React from "react";
import "./StartScreen.css";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../settings/SettingsContext";
import { ensureMicPermission } from "../utils/mic";

export default function StartScreen() {
  const navigate = useNavigate();
  const { locale, setLocale } = useSettings();

  // 시작 버튼 클릭 시 실행
  const handleStart = async () => {
    const ok = await ensureMicPermission();
    if (!ok) {
      alert("마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.");
      return;
    }
    navigate("/voice-signup"); // 음성 회원가입 페이지로 이동
  };

  return (
    <div className="ys-root">
      <div className="ys-container">
        {/* 로고 */}
        <div className="ys-logo" aria-label="Logo">Logo</div>

        <h1 className="ys-title">YAGO SPORTS</h1>
        <p className="ys-subtitle">AI Platform for Sports Enthusiasts</p>

        <div className="ys-desc">
          <p>스포츠의 시작, 야고</p>
          <p>체육인 커뮤니티, 장터, 모임까지</p>
          <p>지금 위치를 선택하고 시작해보세요!</p>
        </div>

        {/* 언어/지역 선택 */}
        <div className="ys-select-wrap">
          <span className="ys-select-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.93 9H17.5a15.7 15.7 0 0 0-1.23-5A8.03 8.03 0 0 1 19.93 11ZM15.9 11H8.1a14.3 14.3 0 0 1 1.3-4.9c.56-1.1 1.16-1.9 2.6-1.9s2.04.8 2.6 1.9c.53 1.03.97 2.22 1.3 3.9ZM6.73 6A15.7 15.7 0 0 0 5.5 11H4.07A8.03 8.03 0 0 1 6.73 6ZM4.07 13H5.5c.24 1.76.77 3.52 1.23 5A8.03 8.03 0 0 1 4.07 13Zm3.03 0h9.8a14.3 14.3 0 0 1-1.3 4.9c-.56 1.1-1.16 1.9-2.6 1.9s-2.04-.8-2.6-1.9A14.3 14.3 0 0 1 7.1 13Zm8.17 5c.46-1.48.99-3.24 1.23-5h2.43a8.03 8.03 0 0 1-2.66 5Z"/>
            </svg>
          </span>
          <select
            className="ys-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-label="언어 선택"
          >
            <option value="ko-KR">한국어 (대한민국)</option>
            <option value="en-US">English (US)</option>
            <option value="ja-JP">日本語</option>
            <option value="zh-CN">简体中文</option>
          </select>
          <span className="ys-caret" aria-hidden>▼</span>
        </div>

        {/* 시작 버튼 */}
        <button className="ys-button" onClick={handleStart}>시작하기</button>

        <p className="ys-login">
          이미 계정이 있나요? <a href="/login">로그인</a>
        </p>
      </div>
    </div>
  );
}
