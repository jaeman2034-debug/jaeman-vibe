// src/pages/LoginPage.tsx
import React from "react";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import { isInAppBrowser } from "@/utils/inapp";
import InAppBlocked from "@/components/InAppBlocked";

export default function LoginPage() {
  // 인앱 브라우저 감지 시 차단 화면 표시
  if (isInAppBrowser()) {
    return <InAppBlocked />;
  }

  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from?.pathname || "/app";

  // 리다이렉트 로그인 결과 처리
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("[Login] redirect success:", result.user.uid);
        nav(from, { replace: true });
      }
    }).catch((error) => {
      console.error("[Login] redirect failed:", error);
    });
  }, [nav, from]);

  const onGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      await signInWithPopup(auth, provider);
      nav(from, { replace: true }); // 로그인 후 돌아가기
    } catch (e: any) {
      console.error("[Login] failed:", e?.code || e);
      
      if (e?.code === 'auth/popup-closed-by-user') {
        alert('로그인 팝업이 닫혔습니다.\n\n팝업이 차단되었을 수 있습니다.\n브라우저 주소창 옆의 팝업 차단 아이콘을 클릭하여 팝업을 허용하고 다시 시도해주세요.');
      } else if (e?.code === 'auth/popup-blocked') {
        alert('팝업이 차단되었습니다.\n\n브라우저 설정에서 팝업을 허용하고 다시 시도해주세요.');
      } else {
        alert(`로그인 실패: ${e?.message || e?.code || '알 수 없는 오류'}`);
      }
    }
  };

  const onGoogleRedirect = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      await signInWithRedirect(auth, provider);
      // 리다이렉트 후 페이지가 새로고침되므로 여기서는 아무것도 하지 않음
    } catch (e: any) {
      console.error("[Login] redirect failed:", e?.code || e);
      alert(`리다이렉트 로그인 실패: ${e?.message || e?.code || '알 수 없는 오류'}`);
    }
  };

  return (
    <div style={{ 
      padding: 24, 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white"
    }}>
      <div style={{
        background: "white",
        color: "black",
        padding: "32px",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%"
      }}>
        <h1 style={{ marginBottom: "24px", fontSize: "24px", fontWeight: "bold" }}>
          재만 바이브에 오신 것을 환영합니다!
        </h1>
        <p style={{ marginBottom: "24px", color: "#666" }}>
          Google 계정으로 로그인하여 시작하세요
        </p>
        <button 
          onClick={onGoogle}
          style={{
            background: "#4285f4",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            width: "100%",
            transition: "background 0.2s",
            marginBottom: "8px"
          }}
          onMouseOver={(e) => e.target.style.background = "#3367d6"}
          onMouseOut={(e) => e.target.style.background = "#4285f4"}
        >
          🔑 Google로 로그인 (팝업)
        </button>
        
        <button 
          onClick={onGoogleRedirect}
          style={{
            background: "#34a853",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            width: "100%",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.target.style.background = "#2d8f47"}
          onMouseOut={(e) => e.target.style.background = "#34a853"}
        >
          🔄 Google로 로그인 (리다이렉트)
        </button>
        <p style={{ 
          marginTop: "16px", 
          fontSize: "12px", 
          color: "#999",
          lineHeight: "1.4"
        }}>
          팝업이 차단된 경우, 브라우저 주소창 옆의 팝업 차단 아이콘을 클릭하여 허용해주세요.
        </p>
      </div>
    </div>
  );
}