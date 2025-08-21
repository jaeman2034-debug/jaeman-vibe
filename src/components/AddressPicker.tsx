import { useEffect, useRef, useState } from 'react';
import { geocode } from '../api/geo';
import { loadKakao } from '../lib/kakao';
import { db } from '../firebase';
import { doc, setDoc, GeoPoint, serverTimestamp } from 'firebase/firestore';

export default function AddressPicker() {
  const [addr, setAddr] = useState('서울 중구 태평로1가 31'); // 샘플
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
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
    })().catch(console.error);
  }, []);

  const onSearch = async () => {
    try {
      const r = await geocode(addr);
      setResult(r);
      if (!kakaoRef.current || !mapObjRef.current) return;
      const pos = new kakaoRef.current.maps.LatLng(r.y, r.x);
      if (!markerRef.current) markerRef.current = new kakaoRef.current.maps.Marker({ map: mapObjRef.current, position: pos });
      else markerRef.current.setPosition(pos);
      mapObjRef.current.setCenter(pos);
    } catch (e:any) {
      alert('지오코딩 실패: ' + e.message);
    }
  };

  const onSave = async () => {
    if (!result?.ok) return alert('먼저 주소를 검색하세요.');
    const productId = prompt('저장할 productId 입력'); // 데모용. 실제 UI에 맞게 교체 가능
    if (!productId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'products', productId), {
        address: result.address,
        location: new GeoPoint(result.y, result.x), // (lat, lng)
        region: result.region ?? null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      alert('저장 완료');
    } catch (e:any) {
      alert('저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{display:'grid', gap:12, maxWidth:720, margin:'24px auto'}}>
      <h2>주소 → 좌표 변환 & 지도 표시</h2>
      <div style={{display:'flex', gap:8}}>
        <input
          value={addr}
          onChange={e=>setAddr(e.target.value)}
          placeholder="주소를 입력하세요"
          style={{flex:1, padding:'8px 12px'}}
        />
        <button onClick={onSearch} style={{padding:'8px 12px'}}>검색</button>
        <button onClick={onSave} disabled={saving || !result?.ok} style={{padding:'8px 12px'}}>
          {saving ? '저장중...' : 'Firestore 저장'}
        </button>
      </div>
      <div ref={mapRef} style={{width:'100%', height:380, border:'1px solid #e5e7eb', borderRadius:8}} />
      {result?.ok && (
        <pre style={{background:'#0b1020', color:'#cde3ff', padding:12, borderRadius:8, overflow:'auto'}}>
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
