import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface MarketItem {
  id: string;
  title: string;
  category: string;
  price: number;
  published: boolean;
  status: 'selling' | 'reserved' | 'sold';
  district: string;
  dongCode: string;
  createdAt: any;
  sellerUid: string;
}

export interface MarketFilters {
  district: string;
  category?: string;
  status?: 'selling' | 'reserved' | 'sold';
  pageSize?: number;
}

/**
 * 마켓 데이터를 실시간으로 구독하는 함수
 * @param filters 필터 조건
 * @param cb 데이터 변경 시 호출될 콜백 함수
 * @returns 구독 해제 함수
 */
export function listenMarket(filters: MarketFilters, cb: (items: MarketItem[]) => void) {
  const { district, category, status = 'selling', pageSize = 10 } = filters;
  
  const conds = [
    where('published', '==', true),
    where('district', '==', district),
    where('status', '==', status),
  ];
  
  if (category) {
    conds.push(where('category', '==', category));
  }

  const q = query(
    collection(db, 'market'),
    ...conds,
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  // 구독 시작
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem));
    cb(items);
  });

  return unsub; // 언마운트 시에 호출
}

/**
 * 마켓 데이터를 한 번만 가져오는 함수
 * @param filters 필터 조건
 * @returns Promise<MarketItem[]>
 */
export async function getMarketItems(filters: MarketFilters): Promise<MarketItem[]> {
  const { district, category, status = 'selling', pageSize = 10 } = filters;
  
  const conds = [
    where('published', '==', true),
    where('district', '==', district),
    where('status', '==', status),
  ];
  
  if (category) {
    conds.push(where('category', '==', category));
  }

  const q = query(
    collection(db, 'market'),
    ...conds,
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem));
}
