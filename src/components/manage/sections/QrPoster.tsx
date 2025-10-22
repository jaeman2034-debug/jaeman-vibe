import React, { useRef } from 'react';
import QRCode from 'qrcode';

export default function QrPoster({ eventId, title, when, place }: {
  eventId: string; 
  title: string; 
  when: string; 
  place?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  const gen = async () => {
    const w = 1240, h = 1754, pad = 64; // A3 비율 근사(픽셀)
    const canvas = document.createElement('canvas'); 
    canvas.width = w; 
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    
    // 배경
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, w, h);

    // 타이틀
    ctx.fillStyle = '#111827'; 
    ctx.font = 'bold 56px system-ui'; 
    wrapText(ctx, title, pad, pad + 40, w - pad * 2, 64);

    // 서브(일시/장소)
    ctx.font = '24px system-ui'; 
    ctx.fillStyle = '#374151';
    ctx.fillText(when, pad, 260);
    if (place) ctx.fillText(place, pad, 300);

    // QR (이벤트 상세 URL)
    const url = `${location.origin}/events/${eventId}`;
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, url, { margin: 1, width: 720 });
    ctx.drawImage(qrCanvas, (w - 720) / 2, 420);

    // 하단 문구
    ctx.font = '20px system-ui'; 
    ctx.fillStyle = '#6b7280';
    ctx.fillText('스캔하여 참여/공지 확인 · 아리 커뮤니티', pad, h - pad);

    // 다운로드
    const a = document.createElement('a'); 
    a.href = canvas.toDataURL('image/png'); 
    a.download = `poster_${eventId}.png`; 
    a.click();
  };

  return (
    <section className="rounded-xl border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">QR 포스터</h3>
        <button 
          onClick={gen} 
          className="px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          PNG 다운로드
        </button>
      </div>
      <p className="text-xs text-gray-500">
        A3 비율 PNG. 프린트해서 현장에 부착하세요.
      </p>
      <canvas ref={ref} className="hidden" />
    </section>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  maxW: number, 
  lineH: number
) {
  const words = text.split(' '); 
  let line = ''; 
  let yy = y;
  
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > maxW && n > 0) { 
      ctx.fillText(line, x, yy); 
      line = words[n] + ' '; 
      yy += lineH; 
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}
