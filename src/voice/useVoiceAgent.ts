import { useEffect, useRef, useState } from 'react';

export function useVoiceAgent(lang: string = 'ko-KR') {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const recRef = useRef<any>();
  
  useEffect(()=>{
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang; 
    rec.continuous = true; 
    rec.interimResults = true;
    rec.onresult = (e:any)=>{ 
      for (let i=e.resultIndex;i<e.results.length;i++){ 
        const r=e.results[i]; 
        if (r.isFinal) setText(t=> (t+' '+r[0].transcript).trim()); 
      } 
    };
    rec.onerror = ()=> setListening(false);
    rec.onend = ()=> setListening(false);
    recRef.current = rec;
  }, [lang]);
  
  const start = ()=>{ try{ recRef.current?.start(); setListening(true);}catch{} };
  const stop  = ()=>{ try{ recRef.current?.stop();  setListening(false);}catch{} };
  
  return { listening, text, setText, start, stop };
}
