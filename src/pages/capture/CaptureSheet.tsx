import { useCameraCapture } from '@/lib/useCameraCapture';
import { useState } from 'react';

export default function CaptureSheet({ onShot }: { onShot:(dataUrl:string)=>void }) {
  const { videoRef, canvasRef, start, stop, takeShot, quality } = useCameraCapture();
  const [running, setRunning] = useState(false);

  return (
    <div style={{padding:16}}>
      <h3>AI 촬영(베타)</h3>
      <video ref={videoRef} style={{ width:'100%', borderRadius:12, background:'#000' }} />
      <canvas ref={canvasRef} style={{ display:'none' }} />
      <div style={{display:'flex', gap:8, marginTop:12}}>
        {!running
          ? <button onClick={async()=>{await start(); setRunning(true);}}>카메라 켜기</button>
          : <button onClick={()=>{stop(); setRunning(false);}}>끄기</button>}
        <button disabled={!running} onClick={()=>{
          const data = takeShot();
          if (data) onShot(data);
        }}>촬영</button>
        <div>품질점수: {(quality*100|0)}%</div>
      </div>
    </div>
  );
} 