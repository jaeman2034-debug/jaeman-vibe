import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderBy, where, collection, query } from 'firebase/firestore';
import { useColQueryRT } from '@/lib/useColQueryRT';
import { db } from '@/lib/firebase';
import SearchBox from '../../components/search/SearchBox';
import FavoriteButton from '../../components/favorite/FavoriteButton';
import StatusBadge from '../../components/market/StatusBadge';
import DistanceBadge from '../../components/market/DistanceBadge';
import Thumbnail from '../../components/ui/Thumbnail';
import { getUserLocation } from '@/lib/location';
import { useAuth } from '@/lib/auth';
import { getFirstImageUrl } from '@/lib/images';

type MarketSort = 'latest'|'priceAsc'|'priceDesc'|'distance';

interface MarketItem {
  id: string;
  title: string;
  price: number;
  description: string;
  images: string[];
  sellerId: string; // ownerId 또는 sellerId로 변경
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
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [collectionType, setCollectionType] = useState<'market_items' | 'market'>('market_items');
  const [sort, setSort] = useState<MarketSort>('latest');
  const navigate = useNavigate();
  const uid = user?.uid;

  // 무한 루프 방지
  useEffect(() => {
    console.log("[MarketList] MOUNT");
    return () => console.log("[MarketList] UNMOUNT");
  }, []);

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

  // 쿼리를 useMemo로 고정
  const q = useMemo(() => {
    // 정렬 필드와 방향 결정
    let orderByField = 'createdAt';
    let orderDirection: 'asc' | 'desc' = 'desc';
    
    if (sort === 'priceAsc') {
      orderByField = 'price';
      orderDirection = 'asc';
    } else if (sort === 'priceDesc') {
      orderByField = 'price';
      orderDirection = 'desc';
    } else if (sort === 'distance') {
      // 거리 정렬은 클라이언트에서 처리 (Firestore에서는 지원하지 않음)
      orderByField = 'createdAt';
      orderDirection = 'desc';
    }
    
    const baseQuery = query(
      collection(db, collectionType),
      orderBy(orderByField, orderDirection)
    );
    
    // market_items 컬렉션인 경우 필터 추가
    if (collectionType === 'market_items') {
      return query(
        collection(db, collectionType),
        where('deleted', '==', false),
        where('isSold', '==', false),
        orderBy(orderByField, orderDirection)
      );
    }
    
    return baseQuery;
  }, [collectionType, sort]);

  const { data: rawItems, loading, error } = useColQueryRT(q);

  // 거리 정렬을 위한 처리된 아이템
  const items = useMemo(() => {
    if (sort !== 'distance' || !userLocation || !rawItems) {
      return rawItems || [];
    }

    // 거리 계산 및 정렬
    const itemsWithDistance = rawItems.map(item => {
      let distance = Infinity;
      if (item.geo && userLocation) {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (item.geo.lat - userLocation.lat) * Math.PI / 180;
        const dLng = (item.geo.lng - userLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(item.geo.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }
      return { ...item, distance };
    });

    return itemsWithDistance.sort((a, b) => a.distance - b.distance);
  }, [rawItems, sort, userLocation]);

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

  // 에러 UI
  if (error) return <div className="p-4 text-red-600">목록 로딩 실패</div>;
  if (loading) return <div className="p-4">로딩 중...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>전체 스포츠마켓</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* 컬렉션 타입 버튼 */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: '#f3f4f6', 
            borderRadius: 8, 
            padding: 4,
            gap: 4
          }}>
            <button
              onClick={() => setCollectionType('products')}
              style={{
                padding: '8px 16px',
                backgroundColor: collectionType === 'products' ? '#2563eb' : 'transparent',
                color: collectionType === 'products' ? 'white' : '#374151',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Products
            </button>
            <button
              onClick={() => setCollectionType('market')}
              style={{
                padding: '8px 16px',
                backgroundColor: collectionType === 'market' ? '#2563eb' : 'transparent',
                color: collectionType === 'market' ? 'white' : '#374151',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Market
            </button>
          </div>
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
            to={uid ? "/app/market/new" : "/login"}
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

      {/* 검색박스 */}
      <div style={{ marginBottom: 24 }}>
        <SearchBox 
          onSearchResults={handleSearchResults}
          placeholder="상품명, 브랜드로 검색..."
        />
      </div>

      {/* 정렬 컨트롤 */}
      <div className="flex gap-2">
        <select 
          className="px-3 py-2 rounded-xl border"
          value={sort} 
          onChange={e=>setSort(e.target.value as MarketSort)}
        >
          <option value="latest">최신순</option>
          <option value="priceAsc">가격↑</option>
          <option value="priceDesc">가격↓</option>
          <option value="distance">거리</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <h3>등록된 상품이 없습니다</h3>
          <p>첫 번째 상품을 등록해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => {
            // 서버에서 이미지 배열 형태 확인
            console.log('[MARKET_LIST] Item:', item.id, 'Images:', item.images?.length || 0, 'First image type:', typeof item.images?.[0]);
            
            return (
              <li key={item.id} className="rounded-xl overflow-hidden border bg-white hover:shadow-md transition-shadow">
                <Link
                  to={`/app/market/${item.id}`}
                  className="block"
                >
                  {/* 고정 비율 썸네일(정사각형) */}
                  <div className="relative aspect-square bg-slate-50">
                    <img
                      src={getFirstImageUrl(item)}
                      alt={item.title ?? '상품 썸네일'}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/img/placeholder.svg";
                      }}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                    
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
                    
                    {/* 정보 메뉴 버튼 (우상단, 찜하기 아래) */}
                    <div style={{
                      position: 'absolute',
                      top: 44,
                      right: 8,
                      zIndex: 10
                    }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('정보 메뉴:', item.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm border"
                        title="정보"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="19" cy="12" r="1"/>
                          <circle cx="5" cy="12" r="1"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* 메인 정보 */}
                  <div className="p-3">
                    <div className="text-sm font-semibold truncate text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{Number(item.price).toLocaleString()}원</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}