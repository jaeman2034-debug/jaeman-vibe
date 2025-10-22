import { Link } from "react-router-dom";
import { useModal } from "../../components/ModalHost";
import { useNoIndex } from "../../hooks/useNoIndex";

export default function VoiceRoutes() {
  useNoIndex(); // /voice/* ?�근 방�?
  return <VoiceIndex />;
}

function VoiceIndex() {
  const { open } = useModal();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voice Dev Suite</h1>
        <p className="opacity-70">/voice/* ?�위 ?�스?��? 별도�?구현?�어 ?�습?�다.</p>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">빠른 ?�행(Modal)</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => open("voice:vad")}>
            VAD Modal
          </button>
          <button type="button" className="btn" onClick={() => open("voice:asr")}>
            ASR Modal
          </button>
          <button type="button" className="btn" onClick={() => open("voice:signup")}>
            One-Shot Signup Modal
          </button>
        </div>
      </div>
    </div>
  );
} 
