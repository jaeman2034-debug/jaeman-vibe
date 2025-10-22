/**
 * 援ъ“?붾맂 濡쒓퉭 諛?媛먯궗 異붿쟻
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
 * 媛먯궗 濡쒓렇 ?앹꽦
 */
export declare function createAuditLog(event: string, options?: {
    userId?: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, any>;
    severity?: 'info' | 'warn' | 'error';
}): AuditLog;
/**
 * 媛먯궗 濡쒓렇 ??? */
export declare function logAuditEvent(event: string, userId?: string, metadata?: Record<string, any>): Promise<void>;
/**
 * 蹂댁븞 ?대깽??濡쒓퉭
 */
export declare function logSecurityEvent(event: string, userId: string, details?: Record<string, any>): Promise<void>;
/**
 * 鍮꾩쫰?덉뒪 ?대깽??濡쒓퉭
 */
export declare function logBusinessEvent(event: string, userId: string, targetType: string, targetId: string, details?: Record<string, any>): Promise<void>;
/**
 * ?먮윭 ?대깽??濡쒓퉭
 */
export declare function logErrorEvent(event: string, error: Error, context?: Record<string, any>): Promise<void>;
/**
 * ?ъ슜???≪뀡 異붿쟻
 */
export declare function trackUserAction(action: string, userId: string, resource: string, resourceId: string, details?: Record<string, any>): Promise<void>;
/**
 * ?쒖뒪???대깽??濡쒓퉭
 */
export declare function logSystemEvent(event: string, details?: Record<string, any>): Promise<void>;
/**
 * ?깅뒫 硫뷀듃由?濡쒓퉭
 */
export declare function logPerformanceMetric(metric: string, value: number, unit: string, context?: Record<string, any>): Promise<void>;
//# sourceMappingURL=audit.d.ts.map
