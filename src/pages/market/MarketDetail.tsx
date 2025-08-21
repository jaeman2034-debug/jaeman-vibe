import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { getUid } from '@/lib/auth';
import FavoriteButton from '../../components/favorite/FavoriteButton';
import StatusBadge from '../../components/market/StatusBadge';
import StatusChangeModal from '../../components/market/StatusChangeModal';
import type { ProductDoc } from '@/types/product';

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ProductDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const uid = getUid();

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const docRef = doc(db, 'products', id); // market_items → products로 변경
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as ProductDoc);
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
      prev === 0 ? (item.images?.length || 1) - 1 : prev + 1
    );
  };

  // 상태 변경 처리
  const handleStatusChange = (newStatus: "active" | "sold") => {
    if (item) {
      setItem(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '날짜 정보 없음';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR');
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
                  alt={item.title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                
                {/* 이미지 네비게이션 */}
                {item.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.7)',
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
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.7)',
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
                      →
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{ 
                aspectRatio: '4/3', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: 16
              }}>
                이미지 없음
              </div>
            )}
          </div>

          {/* 썸네일 */}
          {item.images && item.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {item.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    width: 60,
                    height: 60,
                    border: index === currentImageIndex ? '2px solid #2563eb' : '2px solid #e5e7eb',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <img
                    src={image}
                    alt={`${item.title} ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 섹션 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>
              {item.title}
            </h1>
            <div style={{ marginLeft: 16 }}>
              <FavoriteButton itemId={item.id} size="lg" />
            </div>
          </div>

          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginBottom: 24 }}>
            {formatPrice(item.price)}
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              상품 설명
            </h3>
            <p style={{ lineHeight: 1.6, color: '#6b7280' }}>
              {item.description}
            </p>
          </div>

          {/* 위치 정보 */}
          {item.region && item.region.provider !== 'none' && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                위치
              </h3>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                fontSize: '16px',
                color: '#374151'
              }}>
                📍 {item.region.full || `${item.region.si} ${item.region.gu} ${item.region.dong}`}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              등록 정보
            </h3>
            <div style={{ color: '#6b7280', fontSize: 14 }}>
              <div>등록일: {formatDate(item.createdAt)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <span>상태:</span>
                <StatusBadge status={item.status} size="md" />
                {uid === item.sellerId && (
                  <button
                    onClick={() => setIsStatusModalOpen(true)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      color: '#2563eb',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #dbeafe',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                  >
                    상태 변경
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI 분석 블록 */}
          {item.ai && (
            <div style={{ 
              marginTop: 24, 
              padding: 20, 
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
              borderRadius: 12,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 16,
                color: '#1e40af',
                fontSize: 18,
                fontWeight: 600
              }}>
                🤖 AI 분석 결과
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* 카테고리 */}
                {item.ai.category && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      카테고리
                    </div>
                    <div style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#dbeafe', 
                      color: '#1e40af',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500
                    }}>
                      {item.ai.category}
                    </div>
                  </div>
                )}

                {/* 상태 등급 */}
                {item.ai.condition && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      상태 등급
                    </div>
                    <div style={{ 
                      padding: '6px 12px', 
                      backgroundColor: item.ai.condition === 'A' ? '#dcfce7' : 
                                   item.ai.condition === 'B' ? '#fef3c7' : '#fee2e2',
                      color: item.ai.condition === 'A' ? '#166534' : 
                             item.ai.condition === 'B' ? '#92400e' : '#991b1b',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      {item.ai.condition}급
                    </div>
                  </div>
                )}

                {/* 브랜드 */}
                {item.ai.brand && item.ai.brand !== 'unknown' && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      브랜드
                    </div>
                    <div style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#f3f4f6', 
                      color: '#374151',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500
                    }}>
                      {item.ai.brand}
                    </div>
                  </div>
                )}

                {/* 색상 */}
                {item.ai.color && item.ai.color !== 'mixed' && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      색상
                    </div>
                    <div style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#f3f4f6', 
                      color: '#374151',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500
                    }}>
                      {item.ai.color}
                    </div>
                  </div>
                )}
              </div>

              {/* 태그 */}
              {item.ai.tags && item.ai.tags.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    AI 추천 태그
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {item.ai.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 제안 제목 */}
              {item.ai.title && item.ai.title !== item.title && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    AI 제안 제목
                  </div>
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#fef3c7', 
                    color: '#92400e',
                    borderRadius: 6,
                    fontSize: 14,
                    fontStyle: 'italic'
                  }}>
                    {item.ai.title}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 상태 변경 모달 */}
      {item && (
        <StatusChangeModal
          item={item}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
} 