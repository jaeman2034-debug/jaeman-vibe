// src/pages/VoicePage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeech } from '@/hooks/useSpeech';

export default function VoicePage() {
  const nav = useNavigate();
  const s = useSpeech('ko-KR');

  // 진입 시 자동 시작, 이탈 시 정지
  useEffect(() => {
    s.start();
    return () => s.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status =
    !s.supported
      ? '이 브라우저는 음성 인식을 지원하지 않아요.'
      : s.permission === 'denied'
      ? '마이크 권한이 거부되어 있어요.'
      : s.listening
      ? '듣는 중…'
      : '대기 중';

  // Tailwind가 잠시 죽어도 보이게 인라인 폴백 포함
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 2147483000,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '16px', background: 'rgba(0,0,0,0.6)',
  };
  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 480, background: '#fff',
    borderRadius: 16, boxShadow: '0 12px 30px rgba(0,0,0,.18)', padding: 20,
  };

  return (
    <div style={overlayStyle} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div style={cardStyle} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 space-y-4">
        <div className="text-center text-sm text-gray-500">{status}</div>

        <button
          onClick={s.listening ? s.stop : s.start}
          className={`w-full h-14 rounded-2xl text-white font-semibold focus:outline-none
                      ${s.listening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {s.listening ? '중지' : '말하기 시작'}
        </button>

        <div className="text-left bg-gray-50 rounded-xl p-3 h-32 overflow-auto">
          <div className="text-xs text-gray-400">실시간</div>
          <div className="text-base min-h-[1.5rem]">{s.interim}</div>
          <div className="text-xs text-gray-400 mt-3">누적</div>
          <div className="text-sm whitespace-pre-wrap">{s.finalText}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          {['야고, 최신 경기 알려줘','두산 경기 일정','내 팀 뉴스'].map((ex) => (
            <button key={ex}
              onClick={() => { s.reset(); alert(`예시: ${ex}`); }}
              className="px-3 py-1.5 rounded-full border hover:bg-gray-50">
              {ex}
            </button>
          ))}
        </div>

        <button onClick={() => nav(-1)} className="w-full h-10 rounded-xl border text-sm hover:bg-gray-50">
          돌아가기
        </button>
      </div>
    </div>
  );
}
