// 🚀 Slack 승인 시스템 프론트엔드 연동
import { useState, useEffect } from 'react';

interface ApprovalRequest {
  channel?: string;
  type: string;
  refId: string;
  title: string;
  summary?: string;
  url?: string;
  image?: string;
  payload?: any;
  required?: number;
  ttlMinutes?: number;
  approverAllowlist?: string[];
  stages?: Array<{
    name: string;
    required: number;
    approverAllowlist?: string[];
  }>;
  maxResubmits?: number;
}

interface ApprovalResponse {
  ok: boolean;
  docId?: string;
  channel?: string;
  ts?: string;
  reused?: boolean;
  error?: string;
  rate_limited?: boolean;
  retry_after_seconds?: number;
}

/**
 * Slack 승인 요청을 전송합니다.
 * @param item 승인할 아이템 정보
 * @returns 승인 요청 결과
 */
export async function requestApproval(item: ApprovalRequest): Promise<ApprovalResponse> {
  try {
    const response = await fetch('/slack/internal/approval/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': import.meta.env.VITE_INTERNAL_KEY,
      },
      body: JSON.stringify({
        channel: item.channel || import.meta.env.VITE_SLACK_APPROVER_CHANNEL,
        type: item.type,
        refId: item.refId,
        title: item.title,
        summary: item.summary,
        url: item.url || `${location.origin}/${item.type}/${item.refId}`,
        image: item.image,
        payload: item.payload,
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('승인 요청 실패:', error);
    throw error;
  }
}

/**
 * 마켓 상품 승인 요청
 */
export async function requestMarketApproval(product: any, options?: { 
  required?: number; 
  ttlMinutes?: number; 
  approverAllowlist?: string[];
  stages?: Array<{ name: string; required: number; approverAllowlist?: string[]; }>;
  maxResubmits?: number;
}): Promise<ApprovalResponse> {
  return requestApproval({
    type: 'market',
    refId: product.id,
    title: product.title,
    summary: `가격 ${product.price?.toLocaleString()}원 • ${product.region} • 카테고리: ${product.category}`,
    url: `${location.origin}/market/${product.id}`,
    image: product.images?.[0],
    payload: product,
    required: options?.required,
    ttlMinutes: options?.ttlMinutes,
    approverAllowlist: options?.approverAllowlist,
    stages: options?.stages,
    maxResubmits: options?.maxResubmits,
  });
}

/**
 * 모임 승인 요청
 */
export async function requestMeetupApproval(meetup: any, options?: { 
  required?: number; 
  ttlMinutes?: number; 
  approverAllowlist?: string[];
  stages?: Array<{ name: string; required: number; approverAllowlist?: string[]; }>;
  maxResubmits?: number;
}): Promise<ApprovalResponse> {
  return requestApproval({
    type: 'meetup',
    refId: meetup.id,
    title: meetup.title,
    summary: `${meetup.date} • ${meetup.location} • ${meetup.participants?.length || 0}명 참여`,
    url: `${location.origin}/meetup/${meetup.id}`,
    image: meetup.image,
    payload: meetup,
    required: options?.required,
    ttlMinutes: options?.ttlMinutes,
    approverAllowlist: options?.approverAllowlist,
    stages: options?.stages,
    maxResubmits: options?.maxResubmits,
  });
}

/**
 * 구인구직 승인 요청
 */
export async function requestJobApproval(job: any, options?: { 
  required?: number; 
  ttlMinutes?: number; 
  approverAllowlist?: string[];
  stages?: Array<{ name: string; required: number; approverAllowlist?: string[]; }>;
  maxResubmits?: number;
}): Promise<ApprovalResponse> {
  return requestApproval({
    type: 'job',
    refId: job.id,
    title: job.title,
    summary: `${job.company} • ${job.location} • ${job.type} • ${job.salary}`,
    url: `${location.origin}/jobs/${job.id}`,
    image: job.image,
    payload: job,
    required: options?.required,
    ttlMinutes: options?.ttlMinutes,
    approverAllowlist: options?.approverAllowlist,
    stages: options?.stages,
    maxResubmits: options?.maxResubmits,
  });
}

/**
 * 이벤트 승인 요청
 */
export async function requestEventApproval(event: any, options?: { 
  required?: number; 
  ttlMinutes?: number; 
  approverAllowlist?: string[];
  stages?: Array<{ name: string; required: number; approverAllowlist?: string[]; }>;
  maxResubmits?: number;
}): Promise<ApprovalResponse> {
  return requestApproval({
    type: 'event',
    refId: event.id,
    title: event.title,
    summary: `${event.date} • ${event.location} • ${event.capacity}명 정원`,
    url: `${location.origin}/events/${event.id}`,
    image: event.image,
    payload: event,
    required: options?.required,
    ttlMinutes: options?.ttlMinutes,
    approverAllowlist: options?.approverAllowlist,
    stages: options?.stages,
    maxResubmits: options?.maxResubmits,
  });
}

/**
 * Slack 승인 상태를 확인합니다.
 */
export async function checkApprovalStatus(docId: string): Promise<any> {
  try {
    const response = await fetch(`/api/approvals/${docId}`, {
      method: 'GET',
      headers: {
        'x-internal-key': import.meta.env.VITE_INTERNAL_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('승인 상태 확인 실패:', error);
    throw error;
  }
}

/**
 * Slack 시스템 헬스체크
 */
export async function checkSlackHealth(): Promise<any> {
  try {
    const response = await fetch('/slack/health');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('헬스체크 실패:', error);
    throw error;
  }
}

/**
 * 승인 요청 상태를 추적하는 훅
 */
export function useApprovalStatus(docId: string | null) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) return;

    const checkStatus = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await checkApprovalStatus(docId);
        setStatus(result.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    
    // 5초마다 상태 확인
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [docId]);

  return { status, loading, error };
}

// React 컴포넌트에서 사용할 수 있는 승인 버튼
export function ApprovalButton({ 
  item, 
  onSuccess, 
  onError 
}: { 
  item: any; 
  onSuccess?: (result: ApprovalResponse) => void;
  onError?: (error: Error) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleApproval = async () => {
    if (loading || approved) return;

    setLoading(true);
    
    try {
      let result: ApprovalResponse;
      
      switch (item.type) {
        case 'market':
          result = await requestMarketApproval(item);
          break;
        case 'meetup':
          result = await requestMeetupApproval(item);
          break;
        case 'job':
          result = await requestJobApproval(item);
          break;
        case 'event':
          result = await requestEventApproval(item);
          break;
        default:
          result = await requestApproval(item);
      }

      if (result.ok) {
        setApproved(true);
        onSuccess?.(result);
      } else {
        throw new Error(result.error || '승인 요청 실패');
      }
    } catch (error) {
      console.error('승인 요청 실패:', error);
      onError?.(error instanceof Error ? error : new Error('알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  };

  if (approved) {
    return (
      <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
        ✅ 승인 요청됨
      </div>
    );
  }

  return (
    <button
      onClick={handleApproval}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? '승인 요청 중...' : '승인 요청'}
    </button>
  );
}

// 승인 상태 표시 컴포넌트
export function ApprovalStatus({ docId }: { docId: string | null }) {
  const { status, loading, error } = useApprovalStatus(docId);

  if (loading) {
    return (
      <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
        상태 확인 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm">
        오류: {error}
      </div>
    );
  }

  switch (status) {
    case 'pending':
      return (
        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
          ⏳ 승인 대기 중
        </div>
      );
    case 'approved':
      return (
        <div className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
          ✅ 승인됨
        </div>
      );
    case 'rejected':
      return (
        <div className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">
          ❌ 반려됨
        </div>
      );
    default:
      return (
        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
          상태 불명
        </div>
      );
  }
}
