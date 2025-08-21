import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Item = {
  id: string;
  title: string;
  price: number;
  address: string;
  lat: number;
  lng: number;
  distanceM: number;
  thumbnail?: string|null;
};

export default function NearProductsPage() {
  const [pos, setPos] = useState<{lat:number;lng:number}|null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(2000); // meters
  const [sort, setSort] = useState<'distance'|'latest'>('distance');
  const [useRegion, setUseRegion] = useState(false);
  const [region, setRegion] = useState<{b_code:string,label:string}|null>(null);

  useEffect(() => {
    // 현재 위치 시도, 실패시 서울시청 좌표로
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setPos({ lat: 37.5665, lng: 126.9780 })
    );
  }, []);

  // 현재 위치 잡힌 뒤 regioncode 호출
  useEffect(() => {
    if (!pos) return;
    (async () => {
      const r = await fetch(`/api/regioncode?lat=${pos.lat}&lng=${pos.lng}`);
      const j = await r.json();
      if (j.ok) {
        const label = `${j.region_1depth_name} ${j.region_2depth_name} ${j.region_3depth_name}`;
        setRegion({ b_code: j.b_code, label });
      }
    })();
  }, [pos]);

  // 목록 fetch 로직 분기
  useEffect(() => {
    if (!pos) return;
    (async () => {
      setLoading(true);
      try {
        let url = '';
        if (useRegion && region?.b_code) {
          const level = 8; // 읍면동 단위
          url = `/api/products/region?b=${region.b_code}&level=${level}`;
        } else {
          url = `/api/products/near?lat=${pos.lat}&lng=${pos.lng}&radius=${radius}&sort=${sort}`;
        }
        const r = await fetch(url);
        const j = await r.json();
        let items = j.items ?? [];
        // 거리순 정렬이 필요한데 /region 호출엔 distanceM이 없을 수 있어, 클라에서 계산:
        if (useRegion && items.length && pos) {
          const R = 6371;
          const toRad = (v:number)=>v*Math.PI/180;
          items = items.map((it:any)=> {
            if (it.lat && it.lng) {
              const dLat = toRad(it.lat - pos.lat);
              const dLng = toRad(it.lng - pos.lng);
              const a = Math.sin(dLat/2)**2 + Math.cos(toRad(pos.lat))*Math.cos(toRad(it.lat))*Math.sin(dLng/2)**2;
              const distM = Math.round(2*R*Math.asin(Math.sqrt(a))*1000);
              return { ...it, distanceM: distM };
            }
            return it;
          });
          if (sort === 'distance') items.sort((a:any,b:any)=>(a.distanceM||9e9)-(b.distanceM||9e9));
          else items.sort((a:any,b:any)=>(b.createdAt||0)-(a.createdAt||0));
        }
        setItems(items);
      } finally {
        setLoading(false);
      }
    })();
  }, [pos, useRegion, region?.b_code, radius, sort]);

  const openMap = (it: Item) => {
    // 카카오맵 링크 (지도 보기)
    window.open(`https://map.kakao.com/link/map/${encodeURIComponent(it.title||'상품')},${it.lat},${it.lng}`, '_blank');
  };
  const openRoute = (it: Item) => {
    // 카카오맵 길찾기 링크 (to: 목적지)
    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(it.title||'상품')},${it.lat},${it.lng}`, '_blank');
  };

  return (
    <div style={{maxWidth:900, margin:'24px auto', padding:'0 12px'}}>
      <h2>근처 {(radius/1000).toFixed(1)}km 상품</h2>
      <p style={{opacity:.7}}>기준 좌표: {pos ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : '확인 중...'}</p>
      
      <div style={{display:'flex', gap:12, alignItems:'center', margin:'12px 0'}}>
        <label>반경: {(radius/1000).toFixed(1)}km</label>
        <input type="range" min={500} max={5000} step={500}
          value={radius} onChange={e=>setRadius(Number(e.target.value))} />
        <select value={sort} onChange={e=>setSort(e.target.value as any)}>
          <option value="distance">거리순</option>
          <option value="latest">최신순</option>
        </select>
        <label style={{display:'flex', alignItems:'center', gap:6}}>
          <input type="checkbox" checked={useRegion} onChange={e=>setUseRegion(e.target.checked)} />
          동네만 {region?.label ? `(${region.label})` : ''}
        </label>
      </div>
      
      {loading && <p>불러오는 중...</p>}
      <div style={{display:'grid', gap:12}}>
        {items.map(it => (
          <div key={it.id} style={{display:'grid', gridTemplateColumns:'80px 1fr auto', gap:12, padding:12, border:'1px solid #e5e7eb', borderRadius:8}}>
            <div style={{width:80, height:80, background:'#f3f4f6', borderRadius:8, overflow:'hidden'}}>
              {it.thumbnail ? <img src={it.thumbnail} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
            </div>
            <div>
              <div style={{fontWeight:700}}>
                <Link to={`/products/${it.id}`} style={{textDecoration:'none'}}>{it.title}</Link>
              </div>
              <div style={{opacity:.8}}>{it.address}</div>
              <div style={{marginTop:4}}>{it.price?.toLocaleString?.() ?? ''}원 · {Math.round(it.distanceM)}m</div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <button onClick={()=>openMap(it)} style={{padding:'6px 10px'}}>지도</button>
              <button onClick={()=>openRoute(it)} style={{padding:'6px 10px'}}>길찾기</button>
            </div>
          </div>
        ))}
        {!loading && items.length===0 && <p>근처에 상품이 없습니다.</p>}
      </div>
    </div>
  );
}
