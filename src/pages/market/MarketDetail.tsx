import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MarketItem {
  id: string;
  title: string;
  price: number;
  category: string;
  status: 'selling' | 'reserved' | 'soldout';
  dongCode: string;
  description: string;
  images: string[];  // 공개 URL 배열
  photos: Array<{ url: string; path: string; name: string; size: number }>;
  sellerUid: string;
  createdAt: any;
  updatedAt: any;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
};

const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MarketItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'market', id),
      (snap) => {
        if (snap.exists()) {
          setItem({ id: snap.id, ...snap.data() } as MarketItem);
        } else {
          setItem(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching item:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <HeaderBar id={id} />
        <div className="mt-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <HeaderBar id={id} />
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-gray-600">상품을 찾을 수 없습니다</h1>
          <p className="mt-2 text-gray-500">삭제되었거나 존재하지 않는 상품입니다.</p>
          <Link to="/app/market" className="mt-4 inline-block px-4 py-2 bg-black text-white rounded-lg">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { title, price, category, status, description, photos, images } = item;
  const imageUrls = images || photos?.map(p => p.url) || [];

  return (
    <div className="mx-auto max-w-4xl p-4">
      <HeaderBar id={id} />

      {/* 제목과 가격 */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <div className="text-xl font-semibold">{formatPrice(price)}</div>
      </div>

      {/* 카테고리와 상태 */}
      <div className="mt-2 flex gap-2">
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
          {category}
        </span>
        <span className={`px-2 py-1 rounded text-sm ${
          status === 'selling' ? 'bg-green-100 text-green-700' :
          status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {status === 'selling' ? '판매중' : status === 'reserved' ? '예약중' : '판매완료'}
        </span>
      </div>

      {/* 이미지 갤러리 */}
      <div className="mt-4">
        {imageUrls.length > 0 ? (
          <div>
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border">
              <img
                src={imageUrls[activeIdx]}
                alt={`${title} 이미지 ${activeIdx + 1}`}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            {imageUrls.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {imageUrls.map((url: string, i: number) => (
                  <button
                    key={url + i}
                    onClick={() => setActiveIdx(i)}
                    className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border ${
                      i === activeIdx ? 'ring-2 ring-black' : 'opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`썸네일 ${i + 1}`}
                  >
                    <img src={url} alt={`thumb-${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] w-full rounded-2xl border grid place-items-center text-gray-400">
            이미지가 없습니다
          </div>
        )}
      </div>

      {/* 설명 */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">상품 설명</h2>
        <p className="mt-2 whitespace-pre-wrap text-gray-700">
          {description || '설명이 없습니다.'}
        </p>
      </section>

      {/* 액션 바 */}
      <div className="sticky bottom-3 mt-8 flex items-center gap-2 rounded-2xl border bg-white/90 p-3 shadow backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <Link to="/app/market" className="btn btn-outline px-4 py-2 rounded-xl border">
          목록
        </Link>
        <ShareButton id={id!} title={title} />
        <div className="ml-auto" />
        <button className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90">
          채팅하기(예시)
        </button>
      </div>
    </div>
  );
};

export default MarketDetail;

// ---------------------- 보조 컴포넌트 ----------------------
const HeaderBar: React.FC<{ id?: string }> = ({ id }) => (
  <div className="flex items-center gap-3">
    <Link to="/app/market" className="text-sm text-blue-600 underline">
      ← 마켓으로
    </Link>
    {id && <span className="text-xs text-gray-400">ID: {id}</span>}
  </div>
);

const ShareButton: React.FC<{ id: string; title?: string }> = ({ id, title }) => {
  const href = typeof window !== 'undefined' ? `${window.location.origin}/app/market/${id}` : '';
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title || '상품', url: href });
      } else {
        await navigator.clipboard.writeText(href);
        alert('링크가 복사되었습니다.');
      }
    } catch {}
  };
  return (
    <button onClick={share} className="px-4 py-2 rounded-xl border hover:bg-gray-50">
      공유하기
    </button>
  );
};