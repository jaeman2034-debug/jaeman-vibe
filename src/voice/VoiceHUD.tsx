import { useVoice } from './VoiceContext';

export default function VoiceHUD() {
  const { supported, listening, lastText, interimText, toggle } = useVoice();
  if (!supported) return null;
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000, display: 'grid', gap: 8, maxWidth: 360 }}>
      <button onClick={toggle} style={{ padding: '10px 14px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', background: listening ? '#d32' : '#222', color: '#fff' }}>
        🎤 {listening ? '듣는 중… (클릭하여 중지)' : '음성 시작'}
      </button>
      {(interimText || lastText) && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 12, fontSize: 12, color: '#333' }}>
          <div style={{ opacity: 0.6 }}>명령</div>
          <div><b>{interimText || lastText}</b></div>
        </div>
      )}
    </div>
  );
}
