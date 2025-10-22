import React from "react";
import LocationBadge from "./LocationBadge";
import AnalysisPanel from "./AnalysisPanel";

export type MarketDGItemData = {
  id: string;
  title: string;
  price?: number;
  description?: string; // 상품 설명 추가
  category?: string; // 카테고리 코드 추가
  images?: (string | { url: string; path: string; filename: string; size: number; type: string; uploadedAt: any })[];
  // 기존 ProductCard와 동일한 파일 구조
  location?: { lat: number; lng: number; placeName?: string };          // 위치 정보 (lat, lng, placeName)
  status?: "판매중" | "예약중" | "거래완료";
  sellerId?: string;  // 판매자ID 추가
  sellerStats?: { trades: number; starsSum: number; pos: number; neg: number }; // 판매자통계 추가
  address?: { sido: string; sigungu: string; dong: string; full: string }; // 지역정보 추가
  // 기존 로컬위치 및주소 코드
  loc?: { lat: number; lng: number };
  addr?: {
    bjd?: string;
    hjd?: string;
    hjdStatus?: 'pending' | 'ok' | 'fail';
    hjdSource?: 'kakao' | 'naver';
    hjdCheckedAt?: any;
  };
  chatCount?: number;
  likeCount?: number;
  viewCount?: number;
  createdAt?: Date | number;  // Date | ms
  analysis?: any;     // AI 분석 결과 (Analysis 컴포넌트에 전달 가능)
  source?: 'products' | 'market';  // 데이터출처 구분용
  thumbUrl?: string; // 추가: 목록용 썸네일 URL
};

function formatPrice(v?: number) {
  if (v == null) return "가격문의";
  if (v <= 0) return "가격미정";
  return v.toLocaleString("ko-KR") + "원";
}

function timeAgo(input?: Date | number) {
  if (!input) return "";
  const d = typeof input === "number" ? new Date(input) : input;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "방금전";
  if (diff < 3600) return Math.floor(diff / 60) + "분전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간전";
  return Math.floor(diff / 86400) + "일전";
}

type Props = { 
  item: MarketDGItemData; 
  onClick?: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;  // 사용자의 현재 위치
};

export default function MarketDGItem({ item, onClick, userLocation }: Props) {
  // 카드에서 커버 선택 (안전한 폴백 체인)
  const src =
    item.thumbUrl ??
    item.images?.[0]?.url ??
    '/placeholder.png';

  const counts = [
    item.chatCount ? `채팅 ${item.chatCount}` : "",
    item.likeCount ? `관심${item.likeCount}` : "",
    item.viewCount ? `조회 ${item.viewCount}` : "",
  ].filter(Boolean);

  // AI 분석 완료 콜백 (필요시 사용)
  const handleAnalysisComplete = (result: any) => {
    console.log('AI 분석 완료:', item.id, result);
    // TODO: 상위 컴포넌트에결과 전달
  };

  // AI 분석 패널 클릭 시 이벤트 버블링 방지
  const handleAnalysisClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <button
      className="dgi"
      onClick={() => onClick?.(item.id)}
      aria-label={item.title}
    >
      <div className="dgi-img">
        <img 
          src={src} 
          alt={item.title ?? '상품 이미지'} 
          className="block w-full h-40 object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {item.status && <span className="dgi-badge">{item.status}</span>}
      </div>
      <div className="dgi-body">
        <div className="dgi-title line-2">{item.title}</div>
        
        {/* 위치 정보 */}
        {item.location && (
          <div className="mb-2">
            <LocationBadge 
              my={userLocation || undefined}
              item={item.location}
            />
          </div>
        )}
        
        <div className="dgi-meta">
          {timeAgo(item.createdAt)}
        </div>
        
        <div className="dgi-price">{formatPrice(item.price)}</div>
        
        {/* AI 분석 패널 - 클릭 이벤트 버블링 방지 */}
        {src && src !== '/placeholder.svg' && (
          <div className="mt-3" onClick={handleAnalysisClick}>
            <AnalysisPanel
              imageUrl={src}
              productId={item.id}
            />
          </div>
        )}
        
        {counts.length > 0 && (
          <div className="dgi-counts">
            {counts.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}