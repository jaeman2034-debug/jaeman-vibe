import { useModal } from '../components/ModalHost';

export default function TestPage() {
  const { open } = useModal();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔧 테스트 페이지</h1>
      <p className="opacity-70">이 페이지에서 모달 시스템이 작동하는지 테스트합니다.</p>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">모달 테스트</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            className="btn"
            onClick={() => open("voice:vad")}
          >
            🎙️ VAD 테스트 모달
          </button>
          <button 
            className="btn"
            onClick={() => open("voice:asr")}
          >
            🎤 ASR 테스트 모달
          </button>
          <button 
            className="btn"
            onClick={() => open("voice:signup")}
          >
            📱 원샷 가입 모달
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">전역 단축키</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm opacity-70 mb-2">브라우저 어디서든 사용 가능:</p>
          <div className="space-y-1 text-sm">
            <div><kbd className="bg-white px-2 py-1 rounded border">Ctrl + Shift + V</kbd> → VAD 테스트</div>
            <div><kbd className="bg-white px-2 py-1 rounded border">Ctrl + Shift + A</kbd> → ASR 테스트</div>
            <div><kbd className="bg-white px-2 py-1 rounded border">Ctrl + Shift + S</kbd> → 원샷 가입</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">라우트 테스트</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/voice" className="btn">/voice 인덱스</a>
          <a href="/voice/vad" className="btn">/voice/vad</a>
          <a href="/voice/asr" className="btn">/voice/asr</a>
          <a href="/voice/one-shot-signup" className="btn">/voice/one-shot-signup</a>
        </div>
      </div>
    </div>
  );
} 