import { useEffect, useRef, useState } from 'react';
import { geocode } from '../../api/geo';
import { loadKakao } from '../../lib/kakao';

export type AddressValue = {
  address: string;
  lat: number;   // y
  lng: number;   // x
  region?: any;
};

export default function AddressField({
  value,
  onChange,
  placeholder = '주소를 입력하세요',
  label = '거래 위치'
}: {
  value?: AddressValue | null;
  onChange: (v: AddressValue | null) => void;
  placeholder?: string;
  label?: string;
}) {
  const [addr, setAddr] = useState(value?.address || '');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoRef = useRef<any>(null);
  const mapObjRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      kakaoRef.current = await loadKakao();
      if (mapRef.current && !mapObjRef.current) {
        mapObjRef.current = new kakaoRef.current.maps.Map(mapRef.current, {
          center: new kakaoRef.current.maps.LatLng(37.5665, 126.9780),
          level: 5,
        });
      }
      if (value?.lat && value?.lng) {
        const pos = new kakaoRef.current.maps.LatLng(value.lat, value.lng);
        markerRef.current = new kakaoRef.current.maps.Marker({ map: mapObjRef.current, position: pos });
        mapObjRef.current.setCenter(pos);
      }
    })().catch(console.error);
  }, []);

  const search = async () => {
    if (!addr) return onChange(null);
    setLoading(true);
    try {
      const r = await geocode(addr);
      if (!r.ok) throw new Error('지오코딩 실패');
      const v: AddressValue = { address: r.address, lat: r.y, lng: r.x, region: r.region };
      onChange(v);
      if (kakaoRef.current && mapObjRef.current) {
        const pos = new kakaoRef.current.maps.LatLng(v.lat, v.lng);
        if (!markerRef.current) markerRef.current = new kakaoRef.current.maps.Marker({ map: mapObjRef.current, position: pos });
        else markerRef.current.setPosition(pos);
        mapObjRef.current.setCenter(pos);
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display:'grid', gap:8}}>
      <label style={{fontWeight:600}}>{label}</label>
      <div style={{display:'flex', gap:8}}>
        <input value={addr} onChange={e=>setAddr(e.target.value)} placeholder={placeholder} style={{flex:1, padding:'8px 12px'}} />
        <button onClick={search} disabled={loading} style={{padding:'8px 12px'}}>{loading?'검색중...':'검색'}</button>
      </div>
      <div ref={mapRef} style={{width:'100%', height:300, border:'1px solid #e5e7eb', borderRadius:8}} />
      {value && (
        <small>선택됨: {value.address} (lat {value.lat.toFixed(6)}, lng {value.lng.toFixed(6)})</small>
      )}
    </div>
  );
}
