import { useEffect, useMemo } from 'react';
import { speak } from '@/lib/tts';
export default function ChatDock({ missing, pwStatus, onAsk }) { const nextQ = useMemo(() => { if (missing.includes('email')) {
    return '?�메?�을 ?�시 ?�번 ?�박?�박 말해 주세?? "?�이??골뱅??지메일 ??�? ?�식??좋아??';
} if (missing.includes('phone')) {
    return '?�화번호??010부???�자�??�어??말해 주세?? ?? "공일�?1234 5678".';
} if (missing.includes('password') || pwStatus !== 'ok') {
    return '비�?번호??"비�?번호??..." ?�에 ??글?�씩 말�???주세?? ?? "?�이. �? ?? 1 2 3 4".';
} return ''; }, [missing, pwStatus]); useEffect(() => { if (!nextQ)
    return; speak(nextQ); }); } // ??TTS 가???�용    // ?�레메트�? chat.ask_missing_field    fetch("/api/telemetry", {      method: "POST",      headers: { "Content-Type": "application/json" },      body: JSON.stringify({ schema:1, events:[{ type:'chat.ask_missing_field', data:{ nextQ } }]})    }).catch(() => {}); // ?�패?�도 ??진행 방해 금�?  }, [nextQ]);  if (!nextQ) return null;  return (    <div className="fixed bottom-4 right-4 max-w-md rounded-xl border bg-white/85 p-3 shadow">      <div className="font-semibold mb-2">?��?�?/div>      <div className="text-sm leading-5">{nextQ}</div>      <div className="mt-2 flex gap-2">        <button className="px-3 py-1.5 rounded bg-black text-white"          onClick={()=>onAsk(nextQ)}>?�스?�로 보기</button>        <button className="px-3 py-1.5 rounded border"          onClick={()=>speak(nextQ)} // ??TTS 가???�용          disabled={isCurrentlyListening()}>?�시 ?�기</button>      </div>    </div>  );}
