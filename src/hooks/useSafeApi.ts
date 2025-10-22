// src/hooks/useSafeApi.ts
import { useState, useCallback } from 'react';

interface UseSafeApiReturn<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  execute: (apiCall: () => Promise<T>) => Promise<void>;
  clearError: () => void;
}

export function useSafeApi<T = any>(): UseSafeApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.warn('[SafeAPI] ?ëŸ¬ ë°œìƒ:', errorMessage);
      // throw ?˜ì? ?ŠìŒ - ErrorBoundaryê¹Œì? ?¬ë¼ê°€ì§€ ?Šë„ë¡?    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { data, error, loading, execute, clearError };
}
