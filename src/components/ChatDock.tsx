import { useEffect, useMemo, useState } from 'react';
import { speak, isCurrentlyListening } from '@/lib/tts';
type Missing = ('email'|'phone'|'password')[];

export default function ChatDock({
  missing, pwStatus, onAsk
}: { missing: Missing; pwStatus: 'ok'|'weak'|'missing'; onAsk: (text:string)=>void }) {
  const nextQ = useMemo(() => {
    if (missing.includes('email')) {
      return '이메일을 다시 한번 또박또박 말해 주세요. "아이디 골뱅이 지메일 점 컴" 형식이 좋아요.';
    }
    if (missing.includes('phone')) {
      return '전화번호는 010부터 숫자만 이어서 말해 주세요. 예: "공일공 1234 5678".';
    }
    if (missing.includes('password') || pwStatus !== 'ok') {
      return '비밀번호는 "비밀번호는 ..." 뒤에 한 글자씩 말씀해 주세요. 예: "에이. 비. 씨. 1 2 3 4".';
    }
    return '';
  }, [missing, pwStatus]);

  useEffect(() => {
    if (!nextQ) return;
    speak(nextQ); // ✅ TTS 가드 사용
    // 텔레메트리: chat.ask_missing_field
    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schema:1, events:[{ type:'chat.ask_missing_field', data:{ nextQ } }]})
    }).catch(() => {}); // 실패해도 앱 진행 방해 금지
  }, [nextQ]);

  if (!nextQ) return null;
  return (
    <div className="fixed bottom-4 right-4 max-w-md rounded-xl border bg-white/85 p-3 shadow">
      <div className="font-semibold mb-2">도움말</div>
      <div className="text-sm leading-5">{nextQ}</div>
      <div className="mt-2 flex gap-2">
        <button className="px-3 py-1.5 rounded bg-black text-white"
          onClick={()=>onAsk(nextQ)}>텍스트로 보기</button>
        <button className="px-3 py-1.5 rounded border"
          onClick={()=>speak(nextQ)} // ✅ TTS 가드 사용
          disabled={isCurrentlyListening()}>다시 듣기</button>
      </div>
    </div>
  );
}