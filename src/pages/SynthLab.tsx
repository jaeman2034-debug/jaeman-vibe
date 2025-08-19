import { useRef, useState } from 'react';

type Case = { id:string; text:string; truth:{email?:string; phone?:string; password?:string}; tags:string[] };

const providers = ['gmail.com','naver.com','daum.net'];
function variants(id:number): Case[] {
  const base = { email:`jae.man.${id}@gmail.com`, phone:'010-5689-0800', password:'ABC12345' };
  const texts = [
    `안녕하세요. 이메일은 JAE. MAN. ${id} 골뱅이 지메일 점 컴. 전화는 공일공 오육팔구 영영공공. 비밀번호는 A. B. C. 1 2 3 4 5.`,
    `제 이메일 주소는 jae man ${id} @ gmail . com 입니다. 번호는 010 5689 0800, 비번은 ABC 12345.`,
    `이메일 jaeman${id} 골뱅이 gmail 점 com, 전화 공일공 5689 0800, 비밀번호 에이비씨 일이삼사오.`,
  ];
  return texts.map((t, i) => ({
    id:`c${id}-${i}`, text:t,
    truth:{ email:`jaeman${id}@gmail.com`, phone:'010-5689-0800', password:'ABC12345' },
    tags:['mix','ko-digit','dot','space']
  }));
}

export default function SynthLab(){
  const [cases,setCases] = useState<Case[]>(()=>Array.from({length:5},(_,k)=>variants(k+1)).flat());
  const idx = useRef(0);

  const playAll = async () => {
    for (idx.current=0; idx.current<cases.length; idx.current++){
      const c = cases[idx.current];
      speechSynthesis.speak(new SpeechSynthesisUtterance(c.text));
      // 텔레메트리: synth.queue
      fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema:1, events:[{ type:'synth.queue', data:{ id:c.id, tags:c.tags }}] })
      }).catch(() => {}); // 실패해도 앱 진행 방해 금지
      await new Promise(r=>setTimeout(r, 1400)); // 문장 길이에 맞게 조절
    }
  };

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-bold">합성 음성 테스트</h1>
      <p className="text-sm opacity-80">시스템 오디오를 입력으로 설정(Windows: 사운드 설정 → 입력 → "Stereo Mix" 또는 가상 케이블 선택).</p>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 rounded bg-black text-white" onClick={playAll}>모두 재생</button>
        <button className="px-3 py-1.5 rounded border" onClick={()=>speechSynthesis.cancel()}>정지</button>
      </div>
      <ul className="list-disc pl-5">
        {cases.map(c=><li key={c.id} className="text-sm">{c.id}: {c.text}</li>)}
      </ul>
    </div>
  );
}