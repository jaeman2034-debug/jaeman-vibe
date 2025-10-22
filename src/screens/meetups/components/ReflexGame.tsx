import { useEffect, useRef, useState } from 'react';

export default function ReflexGame({ meetupId }:{ meetupId:string }){
  const [state, setState] = useState<'idle'|'wait'|'tap'|'result'>('idle');
  const [ms, setMs] = useState<number>(0);
  const startAt = useRef<number>(0);
  const timer = useRef<any>();

  const start = () => {
    setState('wait'); 
    setMs(0);
    const delay = 1000 + Math.random()*2000;
    timer.current = setTimeout(()=>{ 
      setState('tap'); 
      startAt.current = performance.now(); 
    }, delay);
  };
  
  const onTap = () => {
    if (state==='tap') { 
      setMs(Math.round(performance.now()-startAt.current)); 
      setState('result'); 
    }
  };
  
  useEffect(()=>()=> clearTimeout(timer.current),[]);

  return (
    <div className="select-none text-center" onClick={onTap}>
      <div className="text-sm text-gray-500 mb-1">리플렉스 탭</div>
      {state==='idle' && <button className="btn-primary" onClick={start}>시작</button>}
      {state==='wait' && <div className="p-6 bg-gray-50 rounded">화면이 바뀌면 탭!</div>}
      {state==='tap' && <div className="p-6 bg-green-50 rounded">지금!</div>}
      {state==='result' && (
        <div className="p-4">
          <div className="text-2xl font-bold">{ms} ms</div>
          <button className="btn mt-2" onClick={()=>setState('idle')}>다시</button>
        </div>
      )}
    </div>
  );
}
