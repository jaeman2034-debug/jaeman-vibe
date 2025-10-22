import { useState, useEffect } from 'react';
import { listenMarket, getMarketItems, MarketItem, MarketFilters } from '@/lib/marketService';

/**
 * 마켓 데이터를 실시간으로 구독하는 React 훅
 */
export function useMarket(filters: MarketFilters) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsub = listenMarket(filters, (newItems) => {
      setItems(newItems);
      setLoading(false);
    });

    // 에러 처리
    const handleError = (err: Error) => {
      setError(err);
      setLoading(false);
    };

    // 구독 해제 함수
    return () => {
      unsub();
    };
  }, [filters.district, filters.category, filters.status, filters.pageSize]);

  return { items, loading, error };
}

/**
 * 마켓 데이터를 한 번만 가져오는 React 훅
 */
export function useMarketOnce(filters: MarketFilters) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMarketItems(filters);
        setItems(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [filters.district, filters.category, filters.status, filters.pageSize]);

  return { items, loading, error };
}
