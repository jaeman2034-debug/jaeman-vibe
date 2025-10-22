"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocale = getLocale;
exports.t = t;
exports.getAvailableLocales = getAvailableLocales;
exports.isValidLocale = isValidLocale;
const locales = {
    ko: {
        code: 'ko',
        name: '한국어',
        messages: {
            'approval.request': '승인 요청',
            'approval.approve': '승인',
            'approval.reject': '반려',
            'approval.approved': '승인됨',
            'approval.rejected': '반려됨',
            'approval.pending': '대기중',
            'approval.progress': '진행중',
            'approval.required': '필요 승인',
            'approval.approvers': '승인자',
            'approval.expires': '만료',
            'approval.reason': '반려 사유',
            'approval.enter_reason': '반려 사유를 입력하세요',
            'approval.by': 'by',
            'approval.completed': '완료',
            'approval.in_progress': '진행중',
            'approval.waiting': '대기중',
            'approval.expired': '만료됨',
            'approval.auto_resubmit': '자동 재상신',
            'approval.manual_test': '수동 테스트',
            'approval.by_user': 'by @{user}',
            'approval.at_time': '• <!date^{timestamp}^{date_num} {time_secs}|now>',
            'approval.dm_notification': '[승인요청] {title}\n\n새로운 승인 요청이 있습니다.\n승인이 필요합니다.',
            'approval.dm_stage': '[승인요청] {title}\n\n새로운 승인 단계가 시작되었습니다: {stage}\n승인이 필요합니다.',
            'approval.reject_modal_title': '반려 사유 입력',
            'approval.reject_modal_submit': '저장',
            'approval.reject_modal_cancel': '취소',
            'approval.reject_modal_placeholder': '반려 사유를 입력하세요',
            'approval.reject_modal_label': '사유',
            'approval.health_ok': '정상',
            'approval.health_error': '오류',
            'approval.health_region': '리전',
            'approval.health_slack': 'Slack',
            'approval.health_signing': '서명',
            'approval.health_rate': '레이트',
            'approval.health_queues': '큐',
            'approval.health_available': '사용 가능',
            'approval.health_seconds': '초 후'
        }
    },
    en: {
        code: 'en',
        name: 'English',
        messages: {
            'approval.request': 'Approval Request',
            'approval.approve': 'Approve',
            'approval.reject': 'Reject',
            'approval.approved': 'Approved',
            'approval.rejected': 'Rejected',
            'approval.pending': 'Pending',
            'approval.progress': 'In Progress',
            'approval.required': 'Required',
            'approval.approvers': 'Approvers',
            'approval.expires': 'Expires',
            'approval.reason': 'Rejection Reason',
            'approval.enter_reason': 'Enter rejection reason',
            'approval.by': 'by',
            'approval.completed': 'Completed',
            'approval.in_progress': 'In Progress',
            'approval.waiting': 'Waiting',
            'approval.expired': 'Expired',
            'approval.auto_resubmit': 'Auto Resubmit',
            'approval.manual_test': 'Manual Test',
            'approval.by_user': 'by @{user}',
            'approval.at_time': '• <!date^{timestamp}^{date_num} {time_secs}|now>',
            'approval.dm_notification': '[Approval Request] {title}\n\nNew approval request available.\nApproval required.',
            'approval.dm_stage': '[Approval Request] {title}\n\nNew approval stage started: {stage}\nApproval required.',
            'approval.reject_modal_title': 'Enter Rejection Reason',
            'approval.reject_modal_submit': 'Save',
            'approval.reject_modal_cancel': 'Cancel',
            'approval.reject_modal_placeholder': 'Enter rejection reason',
            'approval.reject_modal_label': 'Reason',
            'approval.health_ok': 'OK',
            'approval.health_error': 'Error',
            'approval.health_region': 'Region',
            'approval.health_slack': 'Slack',
            'approval.health_signing': 'Signing',
            'approval.health_rate': 'Rate',
            'approval.health_queues': 'Queues',
            'approval.health_available': 'Available',
            'approval.health_seconds': 'seconds'
        }
    }
};
function getLocale(teamId) {
    // 팀별 로케일 설정 (기본값: ko)
    return process.env[`SLACK_LOCALE_${teamId}`] || 'ko';
}
function t(key, teamId, params = {}) {
    const locale = getLocale(teamId);
    const messages = locales[locale]?.messages || locales.ko.messages;
    let message = messages[key] || key;
    // 파라미터 치환
    Object.entries(params).forEach(([param, value]) => {
        message = message.replace(new RegExp(`{${param}}`, 'g'), String(value));
    });
    return message;
}
function getAvailableLocales() {
    return Object.values(locales);
}
function isValidLocale(locale) {
    return locale in locales;
}
exports.default = {
    getLocale,
    t,
    getAvailableLocales,
    isValidLocale
};
