import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { oqAdd, oqCount } from '@/lib/offlineQueue';
import { flushCheckinsMax } from '@/lib/flushCheckins';
import { humanizeScanError } from '@/lib/scanErrors';

export default function StaffScanPage() {
  const { eventId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [message, setMessage] = useState<string>('카메라 준비 중...');
  const [ok, setOk] = useState<boolean | null>(null);
  const [queued, setQueued] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    const last = localStorage.getItem('yago.scan.deviceId');
    if (last) setDeviceId(last);
  }, []);
  useEffect(() => { if (deviceId) localStorage.setItem('yago.scan.deviceId', deviceId); }, [deviceId]);

  useEffect(() => {
    (async () => {
      if (!auth.currentUser) { setMessage('로그인이 필요합니다.'); return; }
      const snap = await getDoc(doc(db, `events/${eventId}/staff/${auth.currentUser.uid}`));
      if (!snap.exists()) { setMessage('스태프 권한이 없습니다.'); return; }
      setMessage('카메라 초기화 중...');
      const list = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
      setDevices(list);
      setDeviceId(prev => prev || list[0]?.deviceId || '');
      setQueued(await oqCount());
    })();
  }, [eventId]);

  useEffect(() => {
    async function doFlush(reason: string) {
      if (!auth.currentUser) return;
      setSyncing(true);
      const r = await flushCheckinsMax(5, 10);
      setQueued(r.left);
      setSyncing(false);
      if (r.left === 0 && reason) console.log(`[offline-queue] flushed by ${reason}`);
    }
    const onlineH = () => doFlush('online');
    const visH = () => { if (document.visibilityState === 'visible') doFlush('visible'); };
    window.addEventListener('online', onlineH);
    document.addEventListener('visibilitychange', visH);
    const msgH = (e: MessageEvent) => { if (e.data?.type === 'flush-queue') doFlush('sw-sync'); };
    navigator.serviceWorker?.addEventListener?.('message', msgH as any);
    return () => {
      window.removeEventListener('online', onlineH);
      document.removeEventListener('visibilitychange', visH);
      navigator.serviceWorker?.removeEventListener?.('message', msgH as any);
    };
  }, []);

  // 👉 공통 처리 핸들러로 분리
  const handleToken = async (token: string) => {
    const fn = httpsCallable(getFunctions(), 'scanCheckin');
    setMessage('검증 중...');
    try {
      await fn({ token });
      setOk(true); setMessage('체크인 완료!'); beep(440);
    } catch (e: any) {
      const m = humanizeScanError(e);
      if (m.startsWith('오프라인')) {
        await oqAdd(token, eventId, auth.currentUser?.uid || null);
        const n = await oqCount(); setQueued(n);
        setOk(null); setMessage(`${m} (${n}건 대기)`); beep(330);
        try { const reg = await navigator.serviceWorker?.ready;
          if (reg && 'sync' in reg) await (reg as any).sync.register('checkin-sync'); } catch {}
      } else {
        setOk(false); setMessage(m); beep(180);
      }
    }
  };

  // 🧪 DEV 전용 디버그 훅
  useEffect(() => {
    if (import.meta.env.DEV) {
      // @ts-ignore
      (window).__yagoDebugScan = (token: string) => handleToken(token);
      // @ts-ignore
      (window).__yagoFlush = async () => { const r = await flushCheckinsMax(6, 12); setQueued(r.left); return r; };
    }
  }, []);

  useEffect(() => {
    let reader: BrowserMultiFormatReader | null = null;
    let stop = false;

    (async () => {
      if (!deviceId || !videoRef.current) return;
      setMessage('스캔 대기 중...');
      reader = new BrowserMultiFormatReader();

      // 카메라 시작 & 줌/토치 초기화
      try {
        await reader.decodeFromVideoDevice(deviceId, videoRef.current, async (result, err) => {
          if (stop) return;
          if (result) {
            stop = true;
            const token = result.getText();
            await handleToken(token);
            setTimeout(() => { stop = false; }, 1200);
          }
        });
      } catch (e) {
        setMessage('카메라 시작 실패: ' + ((e as any)?.message || String(e)));
      }
    })();

    return () => { reader?.reset(); };
  }, [deviceId]);

  async function toggleTorch() {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()[0];
      // @ts-ignore
      if (track?.getCapabilities && track.applyConstraints) {
        // @ts-ignore
        const caps = track.getCapabilities();
        if ('torch' in caps) { await track.applyConstraints({ advanced: [{ torch: !torch }] }); setTorch(!torch); }
        else setMessage('이 카메라는 토치를 지원하지 않습니다.');
      }
    } catch (e:any) { setMessage('토치 전환 실패: ' + (e?.message || e)); }
  }
  async function applyZoom(v:number){
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()[0];
    // @ts-ignore
    const caps = track?.getCapabilities?.(); const s = Math.max(caps?.zoom?.min||1, Math.min(v, caps?.zoom?.max||1));
    try { /* @ts-ignore */ await track?.applyConstraints?.({ advanced:[{ zoom: s }] }); setZoom(s); } catch {}
  }
  function beep(freq: number) {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq;
    o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    setTimeout(() => o.stop(), 220);
  }
  async function manualFlush() {
    setSyncing(true);
    const r = await flushCheckinsMax(6, 12);
    setQueued(r.left); setSyncing(false);
    setMessage(r.left === 0 ? '대기 중인 체크인 없음' : `보류 ${r.left}건`);
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">스태프 스캐너</h1>

      <div className="flex gap-2 items-center">
        <label className="text-sm">카메라:</label>
        <select className="border rounded px-2 py-1" value={deviceId} onChange={e => setDeviceId(e.target.value)}>
          {devices.map(d => (<option key={d.deviceId} value={d.deviceId}>{d.label || `camera-${d.deviceId.slice(-4)}`}</option>))}
        </select>
        <button onClick={toggleTorch} className="px-3 py-1 rounded bg-neutral-900 text-white">{torch ? '토치 끄기' : '토치 켜기'}</button>
      </div>

      <video ref={videoRef} className="w-full max-w-md rounded-xl shadow" muted autoPlay playsInline />

      {/* 줌 컨트롤(지원기기에서만 효과) */}
      <div className="flex items-center gap-2">
        <span className="text-xs">줌</span>
        <input type="range" min={1} max={5} step={0.1} value={zoom} onChange={e=>applyZoom(Number(e.target.value))} />
      </div>

      <div className={`p-3 rounded ${ok==null?'bg-gray-100':ok?'bg-green-100':'bg-red-100'}`}>{message}</div>

      <div className="flex items-center gap-3 text-sm">
        <span className="px-2 py-1 rounded bg-yellow-100">대기: {queued}건</span>
        <button onClick={manualFlush} disabled={syncing} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50">
          {syncing ? '전송 중…' : '지금 전송'}
        </button>
      </div>

      <p className="text-xs text-gray-500">TIP: 오프라인에서도 스캔만 계속하세요. 온라인 복귀 시 자동 전송됩니다.</p>
    </div>
  );
}