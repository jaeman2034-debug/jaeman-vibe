export function toKoMessage(code, fallback) { switch (code) {
    case "auth/email-already-in-use": return "?��? ?�용 중인 ?�메?�입?�다.";
    case "auth/invalid-email": return "?�메???�식???�바르�? ?�습?�다.";
    case "auth/weak-password": return "비�?번호가 ?�무 ?�합?�다.";
    case "auth/operation-not-allowed": return "?�메??비번 가?�이 비활?�화?�어 ?�습?�다.";
    default: return fallback ?? "?�청??처리?��? 못했?�니??";
} }
