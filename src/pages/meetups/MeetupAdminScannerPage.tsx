import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { getManageToken, setManageToken, getManageHeaders } from '@/utils/manage';

interface ScanResult {
  ok: boolean;
  text: string;
  ts: number;
}

let ZXING: any = null;

export default function MeetupAdminScannerPage() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  
  // 브라우저가 BarcodeDetector를 지원하는지 확인
  const hasBarcode = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    (async () => {
      // 최초 진입 시 관리 토큰 체크
      const token = getManageToken();
      if (!token) {
        const v = prompt('관리 코드를 입력하세요 (운영자 전용)');
        if (v) setManageToken(v);
      }
      
      if (!hasBarcode || !id) return; // 폴백 경로 사용
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setRunning(true);
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        
        const tick = async () => {
          if (!running || !videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes[0]) {
              const text = barcodes[0].rawValue as string;
              handleScan(text);
            }
          } catch {}
          requestAnimationFrame(tick);
        };
        tick();
      } catch (e: any) { 
        setError(e.message || '카메라 접근 실패'); 
      }
    })();
    
    return () => {
      setRunning(false);
      const s = videoRef.current?.srcObject as MediaStream | undefined;
      s?.getTracks().forEach(t => t.stop());
    };
  }, [hasBarcode, id, running]);

  function parseTicket(url: string) {
    try { 
      const u = new URL(url); 
      return { 
        id: u.searchParams.get('id') || '', 
        sig: u.searchParams.get('sig') || '' 
      }; 
    } catch { 
      return { id: '', sig: '' }; 
    }
  }

  async function handleScan(text: string) {
    setRunning(false);
    const { id: rid, sig } = parseTicket(text);
    if (!rid || !sig) { 
      setResult({ ok: false, text: '유효하지 않은 QR', ts: Date.now() }); 
      setTimeout(() => setRunning(true), 600);
      return; 
    }
    
    try {
      const resp = await fetch(`/checkin?id=${encodeURIComponent(rid)}&sig=${encodeURIComponent(sig)}`);
      const data = await resp.json();
      if (resp.ok) {
        const msg = data?.state === 'already_checked_in' ? `이미 체크인됨: ${rid}` : `체크인 완료: ${rid}`;
        setResult({ ok: true, text: msg, ts: Date.now() });
        // 체크인 성공 시 간단한 사운드 재생
        try {
          new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAABAAA=').play().catch(() => {});
        } catch {}
      } else {
        setResult({ ok: false, text: data?.error || '실패', ts: Date.now() });
      }
    } catch (e: any) { 
      setResult({ ok: false, text: e.message, ts: Date.now() }); 
    } finally { 
      setTimeout(() => setRunning(true), 600); 
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; 
    if (!file) return;
    
    try {
      // 동적 import (@zxing/library)
      if (!ZXING) ZXING = await import('@zxing/library');
      const reader = new ZXING.BrowserQRCodeReader();
      const url = URL.createObjectURL(file);
      const res = await reader.decodeFromImageUrl(url);
      handleScan(res.getText());
    } catch (err: any) {
      setResult({ 
        ok: false, 
        text: '스캔 실패: ' + (err?.message || 'unknown'), 
        ts: Date.now() 
      });
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl p-4 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">체크인 스캐너</h1>
            <div className="text-sm text-zinc-500">모임 ID: {id}</div>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => {
                const v = prompt('관리 코드 재설정');
                if (v) setManageToken(v);
              }}
            >
              관리코드
            </button>
            <a 
              className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              href={`/manage/meetups/${id}/attendees.csv?token=${encodeURIComponent(getManageToken())}`}
              download
            >
              CSV 다운로드
            </a>
            <label className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              파일로 스캔
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={onFile} 
              />
            </label>
          </div>
        </header>

        <div className="grid gap-3">
          <div className="rounded-2xl overflow-hidden border">
            {hasBarcode ? (
              <video 
                ref={videoRef} 
                className="w-full aspect-video bg-black" 
                muted 
                playsInline 
                autoPlay
              />
            ) : (
              <div className="p-6 text-sm text-zinc-500 text-center">
                이 브라우저는 카메라 QR 스캔을 지원하지 않습니다. 파일 업로드를 사용하세요.
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-500 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          
          {result && (
            <div className={`rounded-xl p-3 text-sm ${
              result.ok 
                ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
            }`}>
              {new Date(result.ts).toLocaleTimeString()} — {result.text}
            </div>
          )}
          
          {/* 캔버스는 파일 스캔용 (숨김) */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="text-xs text-zinc-500 space-y-1">
          <p>• QR 코드를 카메라에 비춰주세요</p>
          <p>• 지원되지 않는 브라우저에서는 파일 업로드를 사용하세요</p>
          <p>• 체크인 완료 시 자동으로 다음 QR을 스캔할 준비가 됩니다</p>
        </div>
      </div>
    </AppLayout>
  );
}
