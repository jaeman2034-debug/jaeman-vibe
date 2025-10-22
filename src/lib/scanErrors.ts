export function humanizeScanError(e: any): string {
  const code = e?.details?.code || e?.code || '';
  switch (code) {
    case 'LOGIN_REQUIRED': return '로그인이 필요합니다.';
    case 'MISSING_TOKEN': return 'QR 데이터가 비어 있습니다.';
    case 'BAD_TOKEN_FORMAT': return 'QR 형식이 올바르지 않습니다.';
    case 'INVALID_SIGNATURE': return '유효하지 않은 QR입니다.';
    case 'TOKEN_EXPIRED': return 'QR 유효기간이 지났습니다. 재발급해 주세요.';
    case 'NOT_EVENT_STAFF': return '이 이벤트의 스태프 권한이 없습니다.';
    case 'REG_NOT_FOUND': return '등록 정보를 찾을 수 없습니다.';
    case 'UID_MISMATCH': return '티켓 소유자가 일치하지 않습니다.';
    case 'NOT_CONFIRMED': return '결제가 확정되지 않은 등록입니다.';
    case 'RATE_LIMITED': return '스캔이 너무 빠릅니다. 잠시 후 다시 시도하세요.';
    default: {
      const msg = String(e?.message || e || '');
      if (/Failed to fetch|network|unavailable|timeout/i.test(msg)) return '오프라인 감지: 저장 후 자동 전송합니다.';
      return `실패: ${code || msg}`;
    }
  }
}