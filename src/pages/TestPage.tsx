import { useModal } from '../components/ModalHost';
import { Link } from 'react-router-dom';

export default function TestPage() {
  const { open } = useModal();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">테스트 페이지</h1>
      <p className="opacity-70">이 페이지에서 모달 시스템이 동작하는지 테스트합니다.</p>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">모달 테스트</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            className="btn"
            onClick={() => open("voice:vad")}
          >
            음성VAD 테스트모달
          </button>
          <button 
            className="btn"
            onClick={() => open("voice:asr")}
          >
            음성 ASR 테스트모달
          </button>
          <button 
            className="btn"
            onClick={() => open("voice:signup")}
          >
            음성 원샷 가입모달
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">단축키</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm opacity-70 mb-2">브라우저 어디든 사용 가능</p>
          <div className="space-y-1 text-sm">
            <div><kbd className="bg-white px-2 py-1 rounded border">Ctrl + Shift + V</kbd> 음성VAD 테스트</div>
            <div><kbd className="bg-white px-2 py-1 rounded border">Ctrl + Shift + A</kbd> 음성 ASR 테스트</div>
            <div><kbd className="bg-white px-2 py-1 rounded border">Ctrl + Shift + S</kbd> 음성 원샷 가입</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">라우트 테스트</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/voice" className="btn">/voice 인덱스</Link>
          <Link to="/voice/vad" className="btn">/voice/vad</Link>
          <Link to="/voice/asr" className="btn">/voice/asr</Link>
          <Link to="/voice/one-shot-signup" className="btn">/voice/one-shot-signup</Link>
        </div>
      </div>
    </div>
  );
}