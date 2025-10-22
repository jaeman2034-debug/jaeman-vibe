/**
 * 텔레메트리 및 분석 데이터 수집
 */

import { logAuditEvent } from '../functions/lib/audit';

export interface TelemetryEvent {
  event: string;
  userId?: string;
  sessionId: string;
  timestamp: number;
  properties?: Record<string, any>;
  context?: {
    userAgent: string;
    url: string;
    referrer?: string;
    viewport: {
      width: number;
      height: number;
    };
    screen: {
      width: number;
      height: number;
    };
  };
}

/**
 * 텔레메트리 클래스
 */
class Telemetry {
  private sessionId: string;
  private userId?: string;
  private eventQueue: TelemetryEvent[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5초
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startBatchFlush();
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 사용자 ID 설정
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * 사용자 ID 제거
   */
  clearUserId() {
    this.userId = undefined;
  }

  /**
   * 이벤트 추적
   */
  track(event: string, properties?: Record<string, any>) {
    const telemetryEvent: TelemetryEvent = {
      event,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      properties,
      context: this.getContext()
    };

    this.eventQueue.push(telemetryEvent);

    // 배치 크기에 도달하면 즉시 전송
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * 페이지 뷰 추적
   */
  trackPageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page,
      ...properties
    });
  }

  /**
   * 사용자 액션 추적
   */
  trackUserAction(action: string, target?: string, properties?: Record<string, any>) {
    this.track('user_action', {
      action,
      target,
      ...properties
    });
  }

  /**
   * 비즈니스 이벤트 추적
   */
  trackBusinessEvent(event: string, properties?: Record<string, any>) {
    this.track('business_event', {
      event,
      ...properties
    });
  }

  /**
   * 에러 추적
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context
    });
  }

  /**
   * 성능 메트릭 추적
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.track('performance', {
      metric,
      value,
      unit
    });
  }

  /**
   * API 호출 추적
   */
  trackApiCall(method: string, url: string, status: number, duration: number) {
    this.track('api_call', {
      method,
      url,
      status,
      duration
    });
  }

  /**
   * 컨텍스트 정보 수집
   */
  private getContext() {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height
      }
    };
  }

  /**
   * 배치 전송 시작
   */
  private startBatchFlush() {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * 이벤트 배치 전송
   */
  private async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Firestore에 저장
      await this.sendToFirestore(events);
      
      // 외부 분석 서비스로 전송 (선택적)
      await this.sendToAnalytics(events);
      
    } catch (error) {
      console.error('Failed to send telemetry events:', error);
      // 실패한 이벤트들을 다시 큐에 추가
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Firestore에 이벤트 저장
   */
  private async sendToFirestore(events: TelemetryEvent[]) {
    // 실제 구현에서는 Firebase Functions를 통해 저장
    // 여기서는 시뮬레이션
    console.log('Sending telemetry events to Firestore:', events.length);
  }

  /**
   * 외부 분석 서비스로 전송
   */
  private async sendToAnalytics(events: TelemetryEvent[]) {
    // Google Analytics, Mixpanel 등으로 전송
    console.log('Sending telemetry events to analytics:', events.length);
  }

  /**
   * 수동으로 이벤트 전송
   */
  async flushNow() {
    await this.flush();
  }

  /**
   * 정리
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushNow();
  }
}

// 싱글톤 인스턴스
export const telemetry = new Telemetry();

/**
 * React Hook for telemetry
 */
export function useTelemetry() {
  return {
    track: telemetry.track.bind(telemetry),
    trackPageView: telemetry.trackPageView.bind(telemetry),
    trackUserAction: telemetry.trackUserAction.bind(telemetry),
    trackBusinessEvent: telemetry.trackBusinessEvent.bind(telemetry),
    trackError: telemetry.trackError.bind(telemetry),
    trackPerformance: telemetry.trackPerformance.bind(telemetry),
    trackApiCall: telemetry.trackApiCall.bind(telemetry),
    setUserId: telemetry.setUserId.bind(telemetry),
    clearUserId: telemetry.clearUserId.bind(telemetry)
  };
}

/**
 * 성능 모니터링
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.then(value => {
      const duration = performance.now() - start;
      telemetry.trackPerformance(name, duration);
      return value;
    });
  } else {
    const duration = performance.now() - start;
    telemetry.trackPerformance(name, duration);
    return result;
  }
}

/**
 * API 호출 래퍼
 */
export async function trackApiCall<T>(
  method: string,
  url: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    
    telemetry.trackApiCall(method, url, 200, duration);
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    const status = error instanceof Error && 'status' in error ? 
      (error as any).status : 500;
    
    telemetry.trackApiCall(method, url, status, duration);
    telemetry.trackError(error as Error, { method, url });
    
    throw error;
  }
}

// 페이지 언로드 시 이벤트 전송
window.addEventListener('beforeunload', () => {
  telemetry.flushNow();
});

// 에러 전역 캐치
window.addEventListener('error', (event) => {
  telemetry.trackError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Promise rejection 캐치
window.addEventListener('unhandledrejection', (event) => {
  telemetry.trackError(new Error(event.reason), {
    type: 'unhandled_promise_rejection'
  });
});