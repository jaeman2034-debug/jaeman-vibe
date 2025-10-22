// src/components/KakaoMapBadge.tsx
import React, { useEffect, useRef, useState } from 'react';
import { LatLng, geocodePlaceName, loadKakao } from '@/lib/kakao';

type Props = {
  placeName?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export default function KakaoMapBadge({ placeName, lat, lng }: Props){
  const [pos, setPos] = useState<LatLng | null>(lat && lng ? { lat, lng } : null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // 지오코딩(좌표가 없고 장소명이 있을 때)
  useEffect(() => { (async () => {
    if (!pos && placeName) {
      const p = await geocodePlaceName(placeName);
      if (p) setPos(p);
    }
  })(); }, [placeName]);

  // 열릴 때 지도 렌더
  useEffect(() => { (async () => {
    if (!open || !pos || !ref.current) return;
    const kakao = await loadKakao();
    const map = new kakao.maps.Map(ref.current, { center: new kakao.maps.LatLng(pos.lat, pos.lng), level: 3 });
    new kakao.maps.Marker({ position: new kakao.maps.LatLng(pos.lat, pos.lng), map });
  })(); }, [open, pos]);

  if (!placeName && !pos) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <button onClick={() => setOpen(v => !v)} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
        {placeName || '지도'}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="w-[90vw] max-w-xl h-[60vh] bg-white rounded-2xl overflow-hidden shadow" onClick={e => e.stopPropagation()}>
            <div className="p-2 flex items-center gap-2 border-b">
              <div className="font-semibold text-sm">{placeName || '지도'}</div>
              <button className="ml-auto text-sm" onClick={()=>setOpen(false)}>닫기</button>
            </div>
            <div ref={ref} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
