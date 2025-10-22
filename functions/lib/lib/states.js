"use strict";
/**
 * 거래 상태 머신 관리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.canTransition = canTransition;
exports.validateTransition = validateTransition;
exports.getStateDescription = getStateDescription;
exports.getAvailableActions = getAvailableActions;
exports.createStateHistory = createStateHistory;
exports.formatStateHistory = formatStateHistory;
// 허용된 상태 전이 정의
const ALLOWED_TRANSITIONS = new Map([
    ['listed', ['reserved', 'confirmed', 'closed']],
    ['reserved', ['confirmed', 'closed', 'listed']],
    ['confirmed', ['received', 'disputed']],
    ['received', ['closed', 'disputed']],
    ['disputed', ['closed']],
    ['closed', []] // 종료 상태에서는 더 이상 전이 불가
]);
/**
 * 상태 전이가 허용되는지 확인
 */
function canTransition(from, to) {
    const allowedStates = ALLOWED_TRANSITIONS.get(from) || [];
    return allowedStates.includes(to);
}
/**
 * 상태 전이 검증 및 실행
 */
function validateTransition(currentState, targetState, userId, userRole) {
    // 기본 상태 전이 검증
    if (!canTransition(currentState, targetState)) {
        return {
            valid: false,
            reason: `Invalid transition from ${currentState} to ${targetState}`
        };
    }
    // 특별한 권한이 필요한 전이들
    if (targetState === 'disputed' && userRole !== 'admin' && userRole !== 'moderator') {
        return {
            valid: false,
            reason: 'Only admins and moderators can create disputes'
        };
    }
    return { valid: true };
}
/**
 * 상태별 설명
 */
function getStateDescription(state) {
    const descriptions = {
        'listed': '등록됨 - 구매자 모집 중',
        'reserved': '예약됨 - 거래 진행 중',
        'confirmed': '확정됨 - 결제 완료',
        'received': '수령됨 - 거래 완료',
        'closed': '종료됨 - 거래 완료',
        'disputed': '분쟁 중 - 관리자 검토 필요'
    };
    return descriptions[state] || '알 수 없는 상태';
}
/**
 * 상태별 가능한 액션들
 */
function getAvailableActions(state, userRole) {
    const actions = {
        'listed': ['reserve', 'confirm', 'close'],
        'reserved': ['confirm', 'close', 'relist'],
        'confirmed': ['receive', 'dispute'],
        'received': ['close', 'dispute'],
        'disputed': ['close'],
        'closed': []
    };
    const baseActions = actions[state] || [];
    // 관리자/모더레이터 추가 액션
    if (userRole === 'admin' || userRole === 'moderator') {
        if (state === 'disputed') {
            baseActions.push('resolve', 'close');
        }
    }
    return baseActions;
}
/**
 * 상태 히스토리 생성
 */
function createStateHistory(from, to, by, reason) {
    return {
        from,
        to,
        by,
        at: new Date(), // Firestore에서 자동으로 Timestamp로 변환
        reason
    };
}
/**
 * 상태 전이 로그 포맷팅
 */
function formatStateHistory(history) {
    return history.map(transition => `${transition.from} → ${transition.to} (${transition.by}) ${transition.at}`).join('\n');
}
