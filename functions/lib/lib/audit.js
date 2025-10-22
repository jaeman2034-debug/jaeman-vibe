"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
exports.logAuditEvent = logAuditEvent;
exports.logSecurityEvent = logSecurityEvent;
exports.logBusinessEvent = logBusinessEvent;
exports.logErrorEvent = logErrorEvent;
exports.trackUserAction = trackUserAction;
exports.logSystemEvent = logSystemEvent;
exports.logPerformanceMetric = logPerformanceMetric;
const admin = __importStar(require("firebase-admin"));
/**
 * 감사 로그 생성
 */
function createAuditLog(event, options = {}) {
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
async function logAuditEvent(event, userId, metadata) {
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
    }
    catch (error) {
        console.error('Failed to log audit event:', error);
    }
}
/**
 * 보안 이벤트 로깅
 */
async function logSecurityEvent(event, userId, details = {}) {
    await logAuditEvent(event, userId, {
        ...details,
        severity: 'warn'
    });
}
/**
 * 비즈니스 이벤트 로깅
 */
async function logBusinessEvent(event, userId, targetType, targetId, details = {}) {
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
async function logErrorEvent(event, error, context = {}) {
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
async function trackUserAction(action, userId, resource, resourceId, details = {}) {
    await logBusinessEvent(`user.${action}`, userId, resource, resourceId, details);
}
/**
 * 시스템 이벤트 로깅
 */
async function logSystemEvent(event, details = {}) {
    await logAuditEvent(`system.${event}`, undefined, {
        ...details,
        severity: 'info'
    });
}
/**
 * 성능 메트릭 로깅
 */
async function logPerformanceMetric(metric, value, unit, context = {}) {
    await logAuditEvent(`performance.${metric}`, undefined, {
        value,
        unit,
        ...context,
        severity: 'info'
    });
}
