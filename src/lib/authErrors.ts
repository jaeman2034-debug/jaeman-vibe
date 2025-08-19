export function toKoMessage(code?: string, fallback?: string) {
  switch (code) {
    case "auth/email-already-in-use": return "이미 사용 중인 이메일입니다.";
    case "auth/invalid-email": return "이메일 형식이 올바르지 않습니다.";
    case "auth/weak-password": return "비밀번호가 너무 약합니다.";
    case "auth/operation-not-allowed": return "이메일/비번 가입이 비활성화되어 있습니다.";
    default: return fallback ?? "요청을 처리하지 못했습니다.";
  }
} 