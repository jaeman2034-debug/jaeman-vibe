import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { enqueueScan, flushScans, getPendingCount } from '@/lib/offlineQueue';
import { useIsStaff } from '@/hooks/useIsStaff';
import StaffBadge from '@/components/common/StaffBadge';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';

export default function Scan(){
  const { id: eventId } = useParams();
  const isStaff = useIsStaff(eventId);
  const [status,setStatus]=useState<string>('대기 중');
  const [color,setColor]=useState<string>('gray');
  const [busy,setBusy] = useState(false);
  const [offline,setOffline]=useState(!navigator.onLine);
  const [pendingCount,setPendingCount]=useState(0);
  const [locked, setLocked] = useState(false);
  const [camReady, setCamReady] = useState<'checking'|'ok'|'denied'>('checking');
  const [fmt, setFmt] = useState<'qr'|'aztec'|'auto'>('auto');
  const [low, setLow] = useState<boolean>(false);
  const [torch, setTorch] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const readerRef = useRef<BrowserMultiFormatReader|null>(null);

  useEffect(()=>{
    if(!eventId) return;
    setLocked(!!sessionStorage.getItem(`kiosk:${eventId}:locked`));
    
    const checkCam = async ()=>{
      try{
        // 권한 API 우선
        const p = (navigator as any).permissions?.query ? 
          await (navigator as any).permissions.query({ name: 'camera' }) : null;
        if (p && p.state === 'denied') return setCamReady('denied');
        
        // 실제 getUserMedia로 최종 확인(오류 시 denied)
        const s = await navigator.mediaDevices.getUserMedia({ video:true });
        s.getTracks().forEach(t=>t.stop());
        setCamReady('ok');
      }catch{ 
        setCamReady('denied'); 
      }
    };
    checkCam();
  },[eventId]);

  useEffect(()=>{
    const online = async ()=>{ 
      setOffline(false); 
      const result = await flushScans();
      if (result.sent > 0) {
        setStatus(`${result.sent}개 스캔 동기화 완료`);
        setColor('green');
        setTimeout(() => { setStatus('대기 중'); setColor('gray'); }, 2000);
      }
      updatePendingCount();
    };
    const offline = ()=> setOffline(true);
    
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    
    // 진입 시 한번 플러시 시도
    flushScans().then(updatePendingCount);
    
    return ()=>{ 
      window.removeEventListener('online', online); 
      window.removeEventListener('offline', offline); 
    };
  },[]);

  useEffect(() => { // torch 토글 반영
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    try { 
      (track as any).applyConstraints({ advanced: [{ torch }] }); 
    } catch {}
  }, [torch]);

  useEffect(() => { // 시작/정리
    (async () => {
      try { 
        await startCam(); 
        setCamReady('ok');
      } catch {
        setCamReady('denied');
      }
    })();
    return () => stopCam();
  }, []);

  // ZXing 세팅
  useEffect(() => {
    if (camReady !== 'ok') return;
    
    const hints = new Map();
    if (fmt === 'qr') hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    else if (fmt === 'aztec') hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.AZTEC]);
    else hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE, BarcodeFormat.AZTEC]);

    const r = new BrowserMultiFormatReader(hints, 500); // 500ms 간격
    readerRef.current = r;

    let cancelled = false;
    const loop = async () => {
      while (!cancelled && videoRef.current) {
        try {
          const res = await r.decodeFromVideoDevice(undefined, videoRef.current);
          if (res?.text) { 
            await onScan(res.text); 
          } // ← 기존 onScan 재사용(오프라인 큐 포함)
        } catch {}
      }
    };
    loop();
    return () => { 
      cancelled = true; 
      r.reset(); 
    };
    // eslint-disable-next-line
  }, [fmt, camReady]);

  // 핫키 시스템
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      // 재시도(포커스/비프/상태 리셋)
      if (e.code === 'Space') { 
        e.preventDefault(); 
        setStatus('대기 중'); 
        setColor('gray'); 
        setBusy(false);
      }
      
      // 손전등 토글
      if (e.key === 't' || e.key === 'T') { 
        setTorch(v => !v); 
      }
      
      // 저조도 필터
      if (e.key === 'l' || e.key === 'L') { 
        setLow(v => !v); 
      }
      
      // 포맷 전환
      if (e.key === 'q' || e.key === 'Q') {
        setFmt(f => f === 'auto' ? 'qr' : f === 'qr' ? 'aztec' : 'auto');
      }
    };
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const updatePendingCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  const startCam = async () => {
    // 해상도는 환경에 맞게 조정 가능
    const constraints: MediaStreamConstraints = { 
      video: { 
        facingMode: 'environment', 
        width: { ideal: 1280 }, 
        height: { ideal: 720 }, 
        advanced: [{ torch }] 
      } as any, 
      audio: false 
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = stream;
    if (videoRef.current) { 
      videoRef.current.srcObject = stream; 
      await videoRef.current.play(); 
    }
  };

  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    readerRef.current?.reset();
  };

  const beep = (ok=true)=>{
    try{
      const a = new (window.AudioContext|| (window as any).webkitAudioContext)();
      const o = a.createOscillator(); const g = a.createGain();
      o.type = ok?'sine':'square'; o.frequency.value = ok?880:220;
      o.connect(g); g.connect(a.destination); o.start();
      setTimeout(()=>{ o.stop(); a.close(); }, ok?120:200);
    }catch{}
  };

  const onScan = async (text?: string) => {
    if(!text || !eventId || busy) return;
    setBusy(true);
    
    // 스캔 순간 타임스탬프/위치 확보
    const scannedAt = Date.now();
    let geo: any; 
    try {
      const pos = await new Promise<GeolocationPosition>((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:3000}));
      geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    try{
      const fn = httpsCallable(getFunctions(), 'staffConsumeUserPass');
      const { data }: any = await fn({ eventId, token: text, geo, scannedAt });
      setStatus(`체크인 완료: ${data.uid}`); setColor('green'); beep(true);
    }catch(e:any){
      // 네트워크/서버 다운이면 오프라인 큐에 저장
      const msg = String(e?.message||'');
      if (!navigator.onLine || /deadline|unavailable|network/i.test(msg)) {
        await enqueueScan({ 
          id: `${eventId}_${scannedAt}_${Math.random().toString(36).slice(2,6)}`, 
          eventId, 
          token: text, 
          scannedAt, 
          geo 
        });
        setStatus('오프라인 저장됨(재연결 시 자동 전송)'); setColor('yellow');
        updatePendingCount();
      } else {
        setStatus(msg || '실패'); setColor('red'); beep(false);
      }
    }finally{
      setTimeout(()=>{ setStatus('대기 중'); setColor('gray'); setBusy(false); }, 1200);
    }
  };

  if(!isStaff) return (
    <div className="p-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">권한이 없습니다</h1>
        <p className="text-gray-600">스태프 전용 페이지입니다.</p>
      </div>
    </div>
  );

  if(locked) return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">스태프 스캐너</h1>
        <StaffBadge eventId={eventId!}/>
      </div>
      <div className="rounded-xl border p-4 bg-yellow-50 text-yellow-800">
        잠금 상태입니다. 배지의 "잠금 해제"를 눌러 PIN을 입력하세요.
      </div>
    </div>
  );

  if(camReady==='denied') return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">스태프 스캐너</h1>
        <StaffBadge eventId={eventId!}/>
      </div>
      <div className="rounded-xl border p-4 bg-red-50 text-red-700">
        카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용한 뒤 다시 시도하세요.
      </div>
      <button 
        onClick={()=>location.reload()} 
        className="px-3 py-2 rounded-xl border hover:bg-gray-50"
      >
        다시 시도
      </button>
    </div>
  );

  return (
    <div className="max-w-sm mx-auto p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">스태프 스캐너</h1>
        <div className="flex items-center gap-2">
          <Link to={`/events/${eventId}/counter`} className="px-3 py-2 rounded-lg border text-sm">
            카운터 보드
          </Link>
          <StaffBadge eventId={eventId!}/>
        </div>
      </div>
      
      {offline && (
        <div className="text-xs px-2 py-1 rounded-md bg-yellow-50 text-yellow-800 border">
          오프라인 모드 — 스캔은 저장되고, 온라인 복귀 시 전송됩니다.
        </div>
      )}
      
      {pendingCount > 0 && (
        <div className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-800 border">
          대기 중인 스캔: {pendingCount}개
        </div>
      )}
      
      <div className="rounded-xl overflow-hidden border relative">
        <video 
          ref={videoRef} 
          className={`w-full aspect-[4/3] object-cover ${low ? '[filter:brightness(1.35)_contrast(1.25)_saturate(1.15)]' : ''}`} 
          playsInline 
          muted 
        />
        {/* 가이드 프레임 */}
        <div className="pointer-events-none absolute inset-0 border-[3px] border-white/70 mix-blend-difference rounded-xl"></div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select 
          value={fmt} 
          onChange={e => setFmt(e.target.value as any)} 
          className="border rounded-lg p-2 text-sm"
        >
          <option value="auto">AUTO (Q)</option>
          <option value="qr">QR (Q)</option>
          <option value="aztec">AZTEC (Q)</option>
        </select>
        <button 
          onClick={() => setLow(s => !s)} 
          className={`px-3 py-2 rounded-lg border text-sm ${low ? 'bg-black text-white' : ''}`}
        >
          저조도 (L)
        </button>
        <button 
          onClick={() => setTorch(t => !t)} 
          className="px-3 py-2 rounded-lg border text-sm"
        >
          손전등 (T)
        </button>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        핫키: Space(리셋) | T(손전등) | L(저조도) | Q(포맷)
      </div>
      
      <div className={`text-sm px-3 py-2 rounded-xl border text-${color}-700 bg-${color}-50`}>{status}</div>
    </div>
  );
}
