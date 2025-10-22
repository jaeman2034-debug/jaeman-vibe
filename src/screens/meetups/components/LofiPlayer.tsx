import { useEffect, useRef, useState } from 'react';

export default function LofiPlayer(){
  const [tracks, setTracks] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement|null>(null);

  useEffect(()=>{
    const t:string[]=[]; for (let i=1;i<=6;i++){ const p=`/audio/lofi${i}.mp3`; t.push(p); }
    setTracks(t);
  },[]);

  const play = (src?:string)=>{
    if (src) { 
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = src; 
      audioRef.current.loop = true; 
      audioRef.current.play(); 
      return; 
    }
    // fallback: oscillator
    try {
      const ctx = new (window.AudioContext|| (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(); 
      const g = ctx.createGain();
      o.type='sine'; 
      o.frequency.value = 432; 
      g.gain.value=0.02; 
      o.connect(g).connect(ctx.destination); 
      o.start();
      setTimeout(()=>{ o.stop(); ctx.close(); }, 60000);
    }catch{}
  };

  return (
    <div>
      <div className="text-sm text-gray-500 mb-1">러커비츠</div>
      <div className="flex flex-wrap gap-2">
        {tracks.map((t,i)=> (
          <button key={i} className="btn" onClick={()=>play(t)}>트랙 {i+1}</button>
        ))}
        <button className="btn" onClick={()=>audioRef.current?.pause()}>정지</button>
        <button className="btn" onClick={()=>play()}>톤 루프</button>
      </div>
    </div>
  );
}
