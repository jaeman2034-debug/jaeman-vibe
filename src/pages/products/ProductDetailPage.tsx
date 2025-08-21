import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { loadKakao } from '../../lib/kakao';

type Product = {
  title: string;
  price?: number;
  address?: string;
  location?: { latitude: number; longitude: number };
  thumbnail?: string|null;
  images?: string[];
  createdAt?: any;
};

export default function ProductDetailPage() {
  const { id } = useParams<{id: string}>();
  const [data, setData] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mainImg, setMainImg] = useState<string|null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoRef = useRef<any>(null);
  const mapObjRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'products', id));
      if (!snap.exists()) { setNotFound(true); return; }
      const d = snap.data() as any;
      const product: Product = {
        title: d.title,
        price: d.price,
        address: d.address,
        location: d.location ? { latitude: d.location.latitude, longitude: d.location.longitude } : undefined,
        thumbnail: d.thumbnail ?? null,
        images: Array.isArray(d.images) ? d.images : (d.thumbnail ? [d.thumbnail] : []),
        createdAt: d.createdAt,
      };
      setData(product);

      // 지도
      if (product.location && mapRef.current) {
        const kakao = await loadKakao();
        kakaoRef.current = kakao;
        const { latitude: lat, longitude: lng } = product.location;
        mapObjRef.current = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(lat, lng),
          level: 4,
        });
        markerRef.current = new kakao.maps.Marker({
          map: mapObjRef.current,
          position: new kakao.maps.LatLng(lat, lng),
        });
      }
    })().catch(console.error);
  }, [id]);

  // 메인 이미지 설정
  useEffect(() => {
    if (data?.images?.length) setMainImg(data.images[0]);
  }, [data]);

  if (notFound) return <div style={{maxWidth:900, margin:'24px auto', padding:'0 12px'}}>
    <h2>상품을 찾을 수 없습니다.</h2>
    <Link to="/products/near">근처 상품 보기</Link>
  </div>;

  if (!data) return <div style={{maxWidth:900, margin:'24px auto', padding:'0 12px'}}>불러오는 중…</div>;

  const priceText = typeof data.price === 'number' ? data.price.toLocaleString() + '원' : '';

  const openMap = () => {
    if (!data.location) return;
    const { latitude: lat, longitude: lng } = data.location;
    window.open(`https://map.kakao.com/link/map/${encodeURIComponent(data.title||'상품')},${lat},${lng}`, '_blank');
  };
  const openRoute = () => {
    if (!data.location) return;
    const { latitude: lat, longitude: lng } = data.location;
    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(data.title||'상품')},${lat},${lng}`, '_blank');
  };
  const share = async () => {
    const url = window.location.href;
    if ((navigator as any).share) {
      await (navigator as any).share({ title: data.title, text: data.address, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크를 클립보드에 복사했습니다.');
    }
  };

  return (
    <div style={{maxWidth:900, margin:'24px auto', padding:'0 12px', display:'grid', gap:16}}>
      <Link to="/products/near" style={{textDecoration:'none'}}>← 근처 상품</Link>

      {data.images?.length ? (
        <div style={{display:'grid', gap:8}}>
          <div style={{width:'100%', height:360, background:'#f3f4f6', borderRadius:8, overflow:'hidden'}}>
            {mainImg ? <img src={mainImg} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
          </div>
          <div style={{display:'flex', gap:8, overflowX:'auto'}}>
            {data.images.map((u,i)=>(
              <img key={i} src={u} onClick={()=>setMainImg(u)}
                   style={{width:72, height:72, objectFit:'cover', borderRadius:6, cursor:'pointer', border: mainImg===u?'2px solid #3b82f6':'1px solid #e5e7eb'}}/>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:16}}>
        <div style={{width:160, height:160, background:'#f3f4f6', borderRadius:8, overflow:'hidden'}}>
          {data.thumbnail ? <img src={data.thumbnail} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
        </div>
        <div>
          <h2 style={{margin:'4px 0'}}>{data.title}</h2>
          <div style={{fontSize:18, fontWeight:700}}>{priceText}</div>
          <div style={{opacity:.8, marginTop:4}}>{data.address ?? '주소 정보 없음'}</div>
          <div style={{display:'flex', gap:8, marginTop:10}}>
            <button onClick={openMap} style={{padding:'8px 12px'}}>지도</button>
            <button onClick={openRoute} style={{padding:'8px 12px'}}>길찾기</button>
            <button onClick={share} style={{padding:'8px 12px'}}>공유</button>
            <Link to={`/products/${id}/edit`} style={{padding:'8px 12px', background:'#3b82f6', color:'white', textDecoration:'none', borderRadius:4}}>수정</Link>
          </div>
        </div>
      </div>

      <div ref={mapRef} style={{width:'100%', height:320, border:'1px solid #e5e7eb', borderRadius:8}} />

      <div style={{opacity:.7, fontSize:12}}>
        문서ID: {id}
      </div>
    </div>
  );
}
