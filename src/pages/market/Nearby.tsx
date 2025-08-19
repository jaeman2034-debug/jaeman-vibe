import { useEffect, useState } from 'react';
import { searchNearby } from '@/lib/geoQuery';
import { Link } from 'react-router-dom';

export default function Nearby() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          setLoading(true);
          const res = await searchNearby(p.coords.latitude, p.coords.longitude, 5000);
          setItems(res);
        } catch (error) {
          setErr('근처 상품 검색에 실패했습니다.');
        } finally {
          setLoading(false);
        }
      },
      (e) => {
        setErr(e.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <div>위치 정보를 가져오는 중...</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: 8 }}>
          정확한 위치를 위해 GPS를 활성화해주세요
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ color: '#e53e3e', marginBottom: 8 }}>
          위치 권한이 필요합니다: {err}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          브라우저 설정에서 위치 권한을 허용해주세요
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 16, color: '#2d3748' }}>
        🗺️ 내 주변 상품 (5km)
      </h3>
      
      {items.length > 0 ? (
        <div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: 16,
            padding: '8px 12px',
            backgroundColor: '#f7fafc',
            borderRadius: 6,
            border: '1px solid #e2e8f0'
          }}>
            총 {items.length}개의 상품을 찾았습니다
          </div>
          
          {items.map((it) => (
            <Link
              key={it.id}
              to={`/market/${it.id}`}
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: 8,
                backgroundColor: '#ffffff',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#2d3748',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f7fafc';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: 4 }}>
                    {it.title}
                  </div>
                  {it.price > 0 && (
                    <div style={{ fontSize: '14px', color: '#38a169' }}>
                      {it.price.toLocaleString()}원
                    </div>
                  )}
                  {it.category && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      marginTop: 4
                    }}>
                      📂 {it.category}
                    </div>
                  )}
                </div>
                <div style={{ 
                  textAlign: 'right',
                  color: '#3182ce',
                  fontWeight: '600'
                }}>
                  {(it._dist | 0)}m
                </div>
              </div>
              
              {/* AI 분석 결과가 있으면 표시 */}
              {it.ai && (
                <div style={{ 
                  marginTop: 8,
                  padding: '6px 8px',
                  backgroundColor: '#f0fff4',
                  borderRadius: 4,
                  fontSize: '12px',
                  color: '#22543d'
                }}>
                  🤖 AI: {it.ai.condition || 'N/A'} 등급 • {it.ai.brand || '브랜드 미상'}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px 16px',
          color: '#666'
        }}>
          <div style={{ fontSize: '18px', marginBottom: 8 }}>
            주변에 상품이 없습니다 😔
          </div>
          <div style={{ fontSize: '14px' }}>
            5km 반경 내에 등록된 상품이 없습니다
          </div>
        </div>
      )}
    </div>
  );
} 