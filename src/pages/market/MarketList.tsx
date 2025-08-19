import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

interface MarketItem {
  id: string;
  title: string;
  price: number;
  description: string;
  images: string[];
  ownerId: string;
  createdAt: any;
  status: string;
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

  useEffect(() => {
    const q = query(collection(db, 'market_items'), orderBy('createdAt', 'desc'));
    
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

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        상품을 불러오는 중...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>🛒 스포츠 마켓</h1>
        <Link 
          to="/market/new"
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

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#666' }}>
          <h3>등록된 상품이 없습니다</h3>
          <p>첫 번째 상품을 등록해보세요!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {items.map((item) => (
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
                {item.images && item.images.length > 0 ? (
                  <img 
                    src={item.images[0]} 
                    alt={item.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    color: '#9ca3af',
                    fontSize: 14
                  }}>
                    이미지 없음
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
          ))}
        </div>
      )}
    </div>
  );
} 