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
                    color: '#9ca3af'
                  }}>
                    📷
                  </div>
                )}
              </div>
              
              <div style={{ padding: 16 }}>
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.title}
                </h3>
                
                <p style={{ 
                  fontSize: 18, 
                  fontWeight: 700, 
                  color: '#2563eb',
                  marginBottom: 8
                }}>
                  {item.price.toLocaleString()}원
                </p>
                
                <p style={{ 
                  fontSize: 14, 
                  color: '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.description}
                </p>
                
                <div style={{ 
                  fontSize: 12, 
                  color: '#9ca3af',
                  marginTop: 12
                }}>
                  {item.createdAt?.toDate?.() ? 
                    item.createdAt.toDate().toLocaleDateString() : 
                    '방금 전'
                  }
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 