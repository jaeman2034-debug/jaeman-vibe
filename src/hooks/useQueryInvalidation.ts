import { useCallback } from 'react';

// 쿼리 무효화를 위한 커스텀 훅
// React Query를 사용하지 않는 경우에도 일관된 인터페이스 제공
export function useQueryInvalidation() {
  const invalidateQueries = useCallback((queryKey: string | string[]) => {
    // React Query를 사용하지 않는 경우, 커스텀 이벤트를 발생시켜
    // 컴포넌트들이 스스로 데이터를 갱신하도록 함
    const event = new CustomEvent('query-invalidate', { 
      detail: { queryKey } 
    });
    window.dispatchEvent(event);
    
    console.log('[Query Invalidation]', queryKey);
  }, []);

  return { invalidateQueries };
}
