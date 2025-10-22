/**
 * UI 유틸리티 함수들
 */

/**
 * 한국 원화 포맷팅
 * @param amount - 금액 (숫자)
 * @returns 포맷된 문자열 (예: "₩15,000")
 */
export function formatKRW(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₩0';
  }
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/**
 * 날짜 포맷팅
 * @param timestamp - 타임스탬프 (ms)
 * @param options - 포맷 옵션
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  if (!timestamp) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Date(timestamp).toLocaleString('ko-KR', defaultOptions);
}

/**
 * 상대 시간 포맷팅 (예: "2시간 전", "3일 후")
 * @param timestamp - 타임스탬프 (ms)
 * @returns 상대 시간 문자열
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return diff > 0 ? `${days}일 후` : `${days}일 전`;
  } else if (hours > 0) {
    return diff > 0 ? `${hours}시간 후` : `${hours}시간 전`;
  } else if (minutes > 0) {
    return diff > 0 ? `${minutes}분 후` : `${minutes}분 전`;
  } else {
    return diff > 0 ? '곧' : '방금 전';
  }
}

/**
 * 티켓 상태 한글 표시
 * @param state - 티켓 상태
 * @returns 한글 상태 문자열
 */
export function formatTicketState(state: string): string {
  const stateMap: Record<string, string> = {
    'pending': '결제 대기',
    'paid': '발급 완료',
    'checkedIn': '체크인 완료',
    'cancelled': '취소됨',
    'waitlisted': '대기열 등록'
  };
  
  return stateMap[state] || state;
}

/**
 * 티켓 상태 색상 클래스
 * @param state - 티켓 상태
 * @returns Tailwind CSS 클래스
 */
export function getTicketStateColor(state: string): string {
  const colorMap: Record<string, string> = {
    'pending': 'text-yellow-600 bg-yellow-100',
    'paid': 'text-green-600 bg-green-100',
    'checkedIn': 'text-blue-600 bg-blue-100',
    'cancelled': 'text-red-600 bg-red-100',
    'waitlisted': 'text-purple-600 bg-purple-100'
  };
  
  return colorMap[state] || 'text-gray-600 bg-gray-100';
}

/**
 * 취소 가능 여부 확인
 * @param ticket - 티켓 객체
 * @returns 취소 가능 여부
 */
export function canCancelTicket(ticket: any): boolean {
  if (!ticket) return false;
  
  // 이미 체크인되거나 취소된 티켓은 취소 불가
  if (ticket.state === 'checkedIn' || ticket.state === 'cancelled') {
    return false;
  }
  
  // 이벤트 시작 시간 확인 (1시간 전까지 취소 가능)
  if (!ticket.eventStart) return true;
  
  const now = Date.now();
  const eventStart = ticket.eventStart;
  const gapHours = (eventStart - now) / (1000 * 60 * 60);
  
  return gapHours >= 1; // 1시간 전까지 취소 가능
}

/**
 * 취소 사유 옵션
 */
export const CANCEL_REASONS = [
  { value: 'schedule_conflict', label: '일정 변경' },
  { value: 'weather', label: '날씨' },
  { value: 'injury', label: '부상/질병' },
  { value: 'transportation', label: '교통 문제' },
  { value: 'other', label: '기타' }
] as const;

/**
 * 취소 사유 한글 표시
 * @param reason - 취소 사유 코드
 * @returns 한글 사유 문자열
 */
export function formatCancelReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    'schedule_conflict': '일정 변경',
    'weather': '날씨',
    'injury': '부상/질병',
    'transportation': '교통 문제',
    'other': '기타',
    'user cancel': '사용자 취소',
    'admin cancel': '관리자 취소'
  };
  
  return reasonMap[reason] || reason;
}

/**
 * 공유 또는 복사 기능
 * @param data - 공유할 데이터 (title, url 등)
 */
export async function shareOrCopy(data: { title: string; url: string }) {
  const shareData = {
    title: data.title,
    url: data.url
  };

  // Web Share API 지원 확인
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      // 사용자가 취소한 경우는 에러가 아님
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Web Share API 실패:', error);
      } else {
        return; // 취소된 경우
      }
    }
  }

  // 폴백: URL 복사
  try {
    await navigator.clipboard.writeText(data.url);
    // 토스트 메시지 표시 (간단한 알림)
    const toast = document.createElement('div');
    toast.textContent = '링크가 복사되었습니다!';
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2000);
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    
    // 최후의 폴백: prompt로 URL 표시
    const fallbackUrl = prompt('링크를 복사하세요:', data.url);
    if (fallbackUrl) {
      // 사용자가 수동으로 복사했을 가능성
    }
  }
}