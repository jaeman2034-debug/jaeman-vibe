import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import type { ProductDoc } from "@/types/product";
import { kakaoMapLink, googleMapLink } from "@/features/location/locationService";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState<(ProductDoc & {id:string}) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (!snap.exists()) { 
          setLoading(false); 
          return; 
        }
        setItem({ id: snap.id, ...(snap.data() as any) });
      } catch (error) {
        console.error("상품 정보 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const mainImage = useMemo(() => item?.images?.[0] ?? "/img/placeholder.svg", [item]);

  if (loading) return (
    <div style={{padding:24, textAlign: 'center'}}>
      <div style={{fontSize: 18, color: '#666'}}>불러오는 중…</div>
    </div>
  );
  
  if (!item) return (
    <div style={{padding:24, textAlign: 'center'}}>
      <div style={{fontSize: 18, color: '#666', marginBottom: 16}}>존재하지 않는 상품입니다.</div>
      <button 
        onClick={()=>nav(-1)}
        style={{
          padding: '8px 16px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer'
        }}
      >
        뒤로 가기
      </button>
    </div>
  );

  // GeoPoint에서 좌표 추출 (Firestore GeoPoint는 .latitude, .longitude 속성)
  const lat = item.location?.latitude;
  const lng = item.location?.longitude;

  return (
    <div style={{ maxWidth: 840, margin:"0 auto", padding:16 }}>
      {/* 뒤로 가기 버튼 */}
      <button 
        onClick={()=>nav(-1)}
        style={{
          padding: '8px 12px',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        ← 뒤로
      </button>

      {/* 메인 이미지 */}
      <img 
        src={mainImage} 
        alt={item.title}
        style={{ 
          width:"100%", 
          height:360, 
          objectFit:"cover", 
          borderRadius:12, 
          background:"#f4f4f5", 
          marginTop:16,
          border: '1px solid #e9ecef'
        }} 
      />

      {/* 상품 정보 */}
      <div style={{marginTop: 20}}>
        <h1 style={{margin:"0 0 12px 0", fontSize: 24, fontWeight: 700, lineHeight: 1.3}}>
          {item.title}
        </h1>
        
        <div style={{fontSize: 24, fontWeight: 700, color: '#212529', marginBottom: 16}}>
          {item.price.toLocaleString()}원 
          {item.status === "sold" && (
            <span style={{color:"#ef4444", marginLeft: 12, fontSize: 18, fontWeight: 600}}>
              [판매완료]
            </span>
          )}
        </div>

        {/* 상품 설명 */}
        {item.description && (
          <div style={{
            whiteSpace:"pre-wrap", 
            lineHeight:1.6, 
            marginTop: 16,
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: 8,
            border: '1px solid #e9ecef',
            fontSize: 15,
            color: '#495057'
          }}>
            {item.description}
          </div>
        )}

        {/* 위치 정보 */}
        <div style={{ 
          padding: 16, 
          background:"#f8f9fa", 
          borderRadius: 12, 
          marginTop: 20,
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 16, color: '#495057' }}>
            📍 위치 정보
          </div>
          <div style={{ color:"#6c757d", fontSize: 15, marginBottom: 12 }}>
            {item.region?.full ? (
              <span style={{color: '#28a745', fontWeight: 500}}>{item.region.full}</span>
            ) : lat && lng ? (
              `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            ) : (
              "위치 정보 없음"
            )}
          </div>

          {/* 지도 링크 */}
          {lat && lng && (
            <div style={{ display:"flex", gap: 12, marginTop: 12 }}>
              <a 
                href={kakaoMapLink(item.title, {lat, lng})} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  padding: '8px 16px',
                  background: '#fee500',
                  color: '#000',
                  textDecoration: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1px solid #fdd835'
                }}
              >
                🗺️ 카카오맵 열기
              </a>
              <a 
                href={googleMapLink({lat, lng})} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  padding: '8px 16px',
                  background: '#4285f4',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1px solid #3367d6'
                }}
              >
                🌍 구글맵 열기
              </a>
            </div>
          )}
        </div>

        {/* 추가 이미지들 */}
        {item.images && item.images.length > 1 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#495057'}}>
              추가 이미지 ({item.images.length - 1}개)
            </h3>
            <div style={{ 
              display:"grid", 
              gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))", 
              gap: 12 
            }}>
              {item.images.slice(1).map((u,i)=>(
                <img 
                  key={i} 
                  src={u} 
                  alt={`${item.title} 이미지 ${i + 2}`}
                  style={{ 
                    width:"100%", 
                    height: 120, 
                    objectFit:"cover", 
                    borderRadius: 8,
                    border: '1px solid #e9ecef',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(u, '_blank')}
                />
              ))}
            </div>
          </div>
        )}

        {/* 상품 메타 정보 */}
        <div style={{ 
          marginTop: 24, 
          padding: '16px', 
          background: '#f8f9fa', 
          borderRadius: 8,
          border: '1px solid #e9ecef',
          fontSize: 14,
          color: '#6c757d'
        }}>
          <div style={{marginBottom: 8}}>
            <strong>상품 ID:</strong> {item.id}
          </div>
          {item.createdAt && (
            <div style={{marginBottom: 8}}>
              <strong>등록일:</strong> {item.createdAt.toDate?.()?.toLocaleDateString() || '알 수 없음'}
            </div>
          )}
          {item.region?.provider && (
            <div>
              <strong>위치 정보 제공:</strong> {item.region.provider === 'kakao' ? '카카오' : item.region.provider}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 