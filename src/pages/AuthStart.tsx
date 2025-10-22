import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function AuthStart() {
  const location = useLocation();
  const nav = useNavigate();
  const [show, setShow] = useState(false);

  // ?show=1 이면 처음부터 표시
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get("show") === "1" || location.pathname === "/login") {
      setShow(true);
    }
  }, [location.search, location.pathname]);

  // 이미 로그인돼 있으면 바로 이동
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) nav("/clubs/select", { replace: true });
    });
    return () => unsub();
  }, [nav]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      nav("/clubs/select", { replace: true });
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      alert('Google 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleNaverLogin = () => {
    const base = "https://us-central1-jaeman-vibe-platform.cloudfunctions.net/naverLogin";
    const returnTo = encodeURIComponent(`${window.location.origin}/login/success`);
    window.location.href = `${base}?return_to=${returnTo}`;
  };

  const handleEmailLogin = () => {
    alert("이메일 로그인은 준비 중입니다.");
  };

  const handleRegister = () => {
    alert("회원가입은 Google/Naver 로그인을 이용해 주세요.");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#6a11cb] to-[#a16eff]">
      {/* 상단 로고/타이틀 */}
      <div className="pt-10 text-center text-white text-2xl font-extrabold tracking-wide">
        YAGO SPORTS
      </div>

      {/* 시작 버튼 : 화면 맨앞에 오도록 z-50 */}
      <button
        onClick={() => setShow(true)}
        className="fixed right-4 bottom-4 z-50 rounded-full bg-black/80 text-white px-5 py-3 text-sm hover:bg-black/90 transition-colors"
      >
        시작
      </button>

      {/* 로그인 박스 오버레이 (z-40) */}
      {show && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* 반투명 배경 눌러서 닫기 */}
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setShow(false)}
            aria-label="close"
          />
          <div className="relative z-50 w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-center text-lg font-semibold mb-1">Log in</h2>
            <p className="text-center text-gray-500 text-sm mb-4">
              Choose a method to continue
            </p>

            <div className="space-y-3">
              <button 
                onClick={handleGoogleLogin}
                className="w-full rounded-lg border px-4 py-3 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="google"
                  className="w-5 h-5"
                />
                Google로 로그인
              </button>
              <button 
                onClick={handleNaverLogin}
                className="w-full rounded-lg border px-4 py-3 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                Naver로 로그인
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
              </div>

              <button 
                onClick={handleEmailLogin}
                className="w-full rounded-lg border px-4 py-3 hover:bg-gray-50"
              >
                이메일로 로그인
              </button>
            </div>

            <div className="mt-5 text-center text-sm">
              <span className="text-gray-500 mr-2">Not registered yet?</span>
              <button 
                onClick={handleRegister}
                className="text-violet-600 font-medium hover:underline"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
