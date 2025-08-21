import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import SearchBox from '../../components/search/SearchBox';
import FavoriteButton from '../../components/favorite/FavoriteButton';
import StatusBadge from '../../components/market/StatusBadge';
import DistanceBadge from '../../components/market/DistanceBadge';
import { getUserLocation } from '@/lib/location';
import { getUid } from '@/lib/auth';

interface MarketItem {
  id: string;
  title: string;
  price: number;
  description: string;
  images: string[];
  sellerId: string; // ownerId → sellerId로 변경
  createdAt: any;
  status: 'active' | 'reserved' | 'sold'; // ItemStatus 타입과 일치
  geo?: { lat: number; lng: number; geohash: string; accuracy?: number; ts?: number } | null;
  ai?: {
    category?: string;
    condition?: string;
    tags?: string[];
    brand?: string;
    color?: string;
  };
}

export default function MarketList() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const navigate = useNavigate();
  const uid = getUid();

  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.log('사용자 위치를 가져올 수 없습니다:', error);
        // 위치 정보가 없어도 계속 진행
      }
    };

    loadUserLocation();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const marketItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketItem[];
      
      setItems(marketItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // AI 컨디션 배지 색상
  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'A': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'B': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'C': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      default: return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
    }
  };

  // 검색 결과 처리
  const handleSearchResults = (results: any[]) => {
    if (results.length > 0) {
      // 검색 결과가 있으면 검색 페이지로 이동
      navigate(`/search?q=${encodeURIComponent(results[0]?.title || '')}`);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: 32, 
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 16
        }}></div>
        <p style={{ fontSize: 18, color: '#666', margin: 0 }}>상품 목록을 불러오는 중...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>🛒 스포츠 마켓</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link 
            to={uid ? "/favorites" : "/login"}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ❤️ 찜한 상품
          </Link>
          <Link 
            to={uid ? "/my-items" : "/login"}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            📦 내 상품 관리
          </Link>
          <Link 
            to={uid ? "/market/new" : "/login"}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 600
            }}
          >
            + 상품 등록
          </Link>
        </div>
      </div>

      {/* 검색 박스 */}
      <div style={{ marginBottom: 24 }}>
        <SearchBox 
          onSearchResults={handleSearchResults}
          placeholder="상품명, 태그, 브랜드로 검색..."
        />
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <h3>등록된 상품이 없습니다</h3>
          <p>첫 번째 상품을 등록해보세요!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {items.map((item) => {
            // 디버깅: 이미지 배열 상태 확인
            console.log('[MARKET_LIST] Item:', item.id, 'Images:', item.images?.length || 0, 'First image type:', typeof item.images?.[0]);
            
            return (
            <Link 
              key={item.id} 
              to={`/market/${item.id}`}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ aspectRatio: '4/3', backgroundColor: '#f3f4f6', position: 'relative' }}>
                {item.images && item.images.length > 0 && item.images[0] ? (
                  <img 
                    src={item.images[0]} 
                    alt={item.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.warn('[MARKET_LIST] Image load failed for item:', item.id, 'src:', item.images[0]);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                    }}
                  />
                ) : null}
                
                {/* 이미지가 없거나 로드 실패 시 표시 */}
                {(!item.images || item.images.length === 0 || !item.images[0]) && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    color: '#9ca3af',
                    fontSize: 14,
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ fontSize: 24 }}>📷</div>
                    <div>이미지 없음</div>
                  </div>
                )}

                {/* AI 컨디션 배지 */}
                {item.ai?.condition && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    ...getConditionColor(item.ai.condition)
                  }}>
                    {item.ai.condition}급
                  </div>
                )}

                                 {/* AI 브랜드 배지 */}
                 {item.ai?.brand && item.ai.brand !== 'unknown' && (
                   <div style={{
                     position: 'absolute',
                     top: 8,
                     left: 8,
                     padding: '4px 8px',
                     backgroundColor: 'rgba(0,0,0,0.7)',
                     color: 'white',
                     borderRadius: 12,
                     fontSize: 12,
                     fontWeight: 600
                   }}>
                     {item.ai.brand}
                   </div>
                 )}

                 {/* 거리 표시 */}
                 {item.geo && userLocation && (
                   <div style={{
                     position: 'absolute',
                     top: 8,
                     left: item.ai?.brand && item.ai.brand !== 'unknown' ? 80 : 8,
                     zIndex: 10
                   }}>
                                            <DistanceBadge
                         itemGeo={item.geo}
                         userLocation={userLocation}
                         showIcon={false}
                       />
                   </div>
                 )}

                 {/* 상태 배지 (좌하단) */}
                 <div style={{
                   position: 'absolute',
                   bottom: 8,
                   left: 8,
                   zIndex: 10
                 }}>
                   <StatusBadge status={item.status} size="sm" />
                 </div>

                 {/* 찜하기 버튼 (우상단) */}
                 <div style={{
                   position: 'absolute',
                   top: 8,
                   right: 8,
                   zIndex: 10
                 }}>
                   <FavoriteButton itemId={item.id} size="sm" />
                 </div>
               </div>

              <div style={{ padding: 16 }}>
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 8,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.title}
                </h3>

                <p style={{ 
                  color: '#6b7280', 
                  fontSize: 14, 
                  marginBottom: 12,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.description}
                </p>

                {/* AI 태그 */}
                {item.ai?.tags && item.ai.tags.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.ai.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '2px 6px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 500
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {item.ai.tags.length > 3 && (
                        <span style={{
                          padding: '2px 6px',
                          backgroundColor: '#e5e7eb',
                          color: '#6b7280',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 500
                        }}>
                          +{item.ai.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#2563eb' }}>
                    {item.price.toLocaleString()}원
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {item.createdAt?.toDate ? 
                      item.createdAt.toDate().toLocaleDateString('ko-KR') : 
                      '날짜 정보 없음'
                    }
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
        </div>
      )}
    </div>
  );
} 