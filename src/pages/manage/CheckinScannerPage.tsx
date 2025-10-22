import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';

export default function CheckinScannerPage() {
  const clubId = location.pathname.split('/')[2];
  const meetId = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('ready');
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (error) {
        console.error('Camera access error:', error);
        setStatus('camera_error');
      }
    })();
  }, []);

  async function tick() {
    const v = videoRef.current!;
    const c = canvasRef.current!;
    if (!v || !c) return;
    
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (w === 0 || h === 0) return requestAnimationFrame(tick);
    
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(v, 0, 0, w, h);
    
    const img = ctx.getImageData(0, 0, w, h);
    const code = jsQR(img.data, w, h, { inversionAttempts: 'attemptBoth' });
    
    if (code?.data) {
      onCode(code.data);
    }
    
    requestAnimationFrame(tick);
  }

  async function onCode(data: string) {
    try {
      if (!data.includes('/checkin')) return;
      
      const url = new URL(data);
      const id = url.searchParams.get('id');
      const sig = url.searchParams.get('sig');
      if (!id || !sig) return;
      
      setStatus('processing');
      
      const payload = { 
        id, 
        sig, 
        meetupId: meetId, 
        scannerId: user?.uid 
      };
      
      if (navigator.onLine) {
        const r = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const j = await r.json();
        setStatus(r.ok ? 'ok' : ('fail:' + (j?.error || 'error')));
      } else {
        // offline → 큐에 적재
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ 
          type: 'QUEUE_CHECKIN', 
          id: id + ':' + Date.now(), 
          payload 
        });
        setStatus('queued');
      }
    } catch (e: any) {
      setStatus('fail');
    }
  }

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'coach', 'staff']}>
      <div className="p-4 space-y-3">
        <h1 className="text-2xl font-bold">체크인 스캐너</h1>
        <div className="text-sm text-zinc-500">
          모임: {meetId} · 네트워크: {online ? '온라인' : '오프라인(큐 저장)'}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl overflow-hidden border bg-black">
            <video 
              ref={videoRef} 
              className="w-full h-auto" 
              muted 
              playsInline
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="text-sm">
          상태: <span className={`font-medium ${
            status === 'ok' ? 'text-green-600' :
            status === 'queued' ? 'text-yellow-600' :
            status.startsWith('fail') ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {status}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          QR 코드를 카메라에 비춰주세요. 오프라인 상태에서는 자동으로 큐에 저장됩니다.
        </div>
      </div>
    </RequireRole>
  );
}
