import * as admin from 'firebase-admin';

/**
 * 구조화된 로깅 및 감사 추적
 */

export interface AuditLog {
  event: string;
  userId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  severity: 'info' | 'warn' | 'error';
}

/**
 * 감사 로그 생성
 */
export function createAuditLog(
  event: string,
  options: {
    userId?: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, any>;
    severity?: 'info' | 'warn' | 'error';
  } = {}
): AuditLog {
  return {
    event,
    userId: options.userId,
    targetType: options.targetType,
    targetId: options.targetId,
    metadata: options.metadata,
    timestamp: new Date().toISOString(),
    severity: options.severity || 'info'
  };
}

/**
 * 감사 로그 저장
 */
export async function logAuditEvent(
  event: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const auditLog = createAuditLog(event, {
      userId,
      metadata,
      severity: 'info'
    });
    
    // 콘솔에 구조화된 로그 출력
    console.log(JSON.stringify(auditLog));
    
    // Firestore에 저장 (선택적)
    if (process.env.NODE_ENV === 'production') {
      await admin.firestore().collection('audit_logs').add(auditLog);
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * 보안 이벤트 로깅
 */
export async function logSecurityEvent(
  event: string,
  userId: string,
  details: Record<string, any> = {}
): Promise<void> {
  await logAuditEvent(event, userId, {
    ...details,
    severity: 'warn'
  });
}

/**
 * 비즈니스 이벤트 로깅
 */
export async function logBusinessEvent(
  event: string,
  userId: string,
  targetType: string,
  targetId: string,
  details: Record<string, any> = {}
): Promise<void> {
  await logAuditEvent(event, userId, {
    targetType,
    targetId,
    ...details,
    severity: 'info'
  });
}

/**
 * 에러 이벤트 로깅
 */
export async function logErrorEvent(
  event: string,
  error: Error,
  context: Record<string, any> = {}
): Promise<void> {
  await logAuditEvent(event, undefined, {
    error: error.message,
    stack: error.stack,
    ...context,
    severity: 'error'
  });
}

/**
 * 사용자 액션 추적
 */
export async function trackUserAction(
  action: string,
  userId: string,
  resource: string,
  resourceId: string,
  details: Record<string, any> = {}
): Promise<void> {
  await logBusinessEvent(`user.${action}`, userId, resource, resourceId, details);
}

/**
 * 시스템 이벤트 로깅
 */
export async function logSystemEvent(
  event: string,
  details: Record<string, any> = {}
): Promise<void> {
  await logAuditEvent(`system.${event}`, undefined, {
    ...details,
    severity: 'info'
  });
}

/**
 * 성능 메트릭 로깅
 */
export async function logPerformanceMetric(
  metric: string,
  value: number,
  unit: string,
  context: Record<string, any> = {}
): Promise<void> {
  await logAuditEvent(`performance.${metric}`, undefined, {
    value,
    unit,
    ...context,
    severity: 'info'
  });
}
