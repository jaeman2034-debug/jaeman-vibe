import { useModal } from "./ModalHost";

export default function FloatingMic() {
  const { open } = useModal();
  return (
    <button
      aria-label="음성 열기"
      onClick={() => open("voice:asr")}
      className="fixed bottom-20 md:bottom-6 right-4 z-50 rounded-full border shadow-lg px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-700"
    >
      <IconMic />
    </button>
  );
}

function IconMic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
  );
} 