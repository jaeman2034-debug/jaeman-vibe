import React from 'react';
import { useMarket } from '@/hooks/useMarket';

interface MarketListProps {
  district: string;
  category?: string;
  status?: 'selling' | 'reserved' | 'sold';
  pageSize?: number;
}

export function MarketList({ 
  district, 
  category, 
  status = 'selling', 
  pageSize = 10 
}: MarketListProps) {
  const { items, loading, error } = useMarket({
    district,
    category,
    status,
    pageSize
  });

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류: {error.message}</div>;
  }

  return (
    <div>
      <h2>마켓 목록 ({items.length}개)</h2>
      <div style={{ display: 'grid', gap: '12px' }}>
        {items.map((item) => (
          <div 
            key={item.id} 
            style={{ 
              border: '1px solid #ccc', 
              padding: '12px', 
              borderRadius: '8px' 
            }}
          >
            <h3>{item.title}</h3>
            <p>카테고리: {item.category}</p>
            <p>가격: {item.price.toLocaleString()}원</p>
            <p>지역: {item.district}</p>
            <p>상태: {item.status}</p>
            <p>판매자: {item.sellerUid}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
