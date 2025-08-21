import { Link, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useModal } from "../../components/ModalHost";
import { useNoIndex } from "../../hooks/useNoIndex";
import AppSplash from "../../components/AppSplash";

// 지연 로딩으로 번들 최적화
const VADTestPage = lazy(() => import("./pages/VADTestPage"));
const ASRTestPage = lazy(() => import("./pages/ASRTestPage"));
const OneShotSignupTestPage = lazy(() => import("./pages/OneShotSignupTestPage"));

export default function VoiceRoutes() {
  useNoIndex(); // /voice/* 색인 방지
  return (
    <Routes>
      <Route index element={<VoiceIndex />} />
      <Route
        path="vad"
        element={
          <Suspense fallback={<AppSplash small/>}>
            <VADTestPage />
          </Suspense>
        }
      />
      <Route
        path="asr"
        element={
          <Suspense fallback={<AppSplash small/>}>
            <ASRTestPage />
          </Suspense>
        }
      />
      <Route
        path="one-shot-signup"
        element={
          <Suspense fallback={<AppSplash small/>}>
            <OneShotSignupTestPage />
          </Suspense>
        }
      />
    </Routes>
  );
}

function VoiceIndex() {
  const { open } = useModal();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voice Dev Suite</h1>
        <p className="opacity-70">/voice/* 하위에 테스트 도구가 정리되어 있습니다.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DevCard title="VAD Test (Page)" to="/voice/vad" desc="페이지로 이동" />
        <DevCard title="ASR Test (Page)" to="/voice/asr" desc="페이지로 이동" />
        <DevCard title="One‑Shot Signup (Page)" to="/voice/one-shot-signup" desc="페이지로 이동" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">빠른 실행(Modal)</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => open("voice:vad")}>VAD Modal</button>
          <button type="button" className="btn" onClick={() => open("voice:asr")}>ASR Modal</button>
          <button type="button" className="btn" onClick={() => open("voice:signup")}>One‑Shot Signup Modal</button>
        </div>
      </div>
    </div>
  );
}

function DevCard({ title, to, desc }: { title: string; to: string; desc?: string }) {
  return (
    <Link to={to} className="block rounded-2xl border p-4 hover:shadow-md transition">
      <div className="font-semibold">{title}</div>
      {desc ? <div className="text-sm opacity-70 mt-1">{desc}</div> : null}
    </Link>
  );
} 