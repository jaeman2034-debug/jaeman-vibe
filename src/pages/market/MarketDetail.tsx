import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
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

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MarketItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const docRef = doc(db, 'market_items', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as MarketItem);
        } else {
          console.log('상품을 찾을 수 없습니다');
        }
      } catch (error) {
        console.error('상품 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        상품을 불러오는 중...
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>상품을 찾을 수 없습니다</h2>
        <Link to="/market" style={{ color: '#2563eb' }}>
          마켓으로 돌아가기
        </Link>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (item.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (item.images?.length || 1) - 1 : prev - 1
    );
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      {/* 뒤로가기 버튼 */}
      <Link 
        to="/market"
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8,
          padding: '8px 16px',
          color: '#6b7280',
          textDecoration: 'none',
          marginBottom: 24
        }}
      >
        ← 마켓으로 돌아가기
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* 이미지 섹션 */}
        <div>
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
            {item.images && item.images.length > 0 ? (
              <>
                <img 
                  src={item.images[currentImageIndex]} 
                  alt={`${item.title} - ${currentImageIndex + 1}`}
                  style={{ 
                    width: '100%', 
                    aspectRatio: '1/1',
                    objectFit: 'cover'
                  }} 
                />
                
                {/* 이미지 네비게이션 버튼 */}
                {item.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImage}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{ 
                width: '100%', 
                aspectRatio: '1/1',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: 48
              }}>
                📷
              </div>
            )}
          </div>

          {/* 썸네일 이미지들 */}
          {item.images && item.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {item.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    width: 60,
                    height: 60,
                    border: index === currentImageIndex ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'none'
                  }}
                >
                  <img 
                    src={image} 
                    alt={`썸네일 ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 섹션 */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
            {item.title}
          </h1>
          
          <div style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', marginBottom: 24 }}>
            {item.price.toLocaleString()}원
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>상품 설명</h3>
            <p style={{ 
              fontSize: 16, 
              lineHeight: 1.6, 
              color: '#374151',
              whiteSpace: 'pre-wrap'
            }}>
              {item.description}
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>판매자 정보</h3>
            <div style={{ 
              padding: 16, 
              backgroundColor: '#f9fafb', 
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                판매자 ID: {item.ownerId}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                등록일: {item.createdAt?.toDate?.() ? 
                  item.createdAt.toDate().toLocaleDateString() : 
                  '날짜 정보 없음'
                }
              </div>
            </div>
          </div>

          {/* 문의 버튼 */}
          <button
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 16
            }}
            onClick={() => alert('문의 기능은 추후 구현 예정입니다.')}
          >
            💬 판매자에게 문의하기
          </button>

          {/* 추가 액션 버튼들 */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: 'white',
                color: '#2563eb',
                border: '1px solid #2563eb',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => alert('찜하기 기능은 추후 구현 예정입니다.')}
            >
              ❤️ 찜하기
            </button>
            <button
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: 'white',
                color: '#2563eb',
                border: '1px solid #2563eb',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => alert('공유 기능은 추후 구현 예정입니다.')}
            >
              📤 공유하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 