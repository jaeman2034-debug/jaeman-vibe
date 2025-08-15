// --- src/lib/telemetry.ts ---

// HMAC-SHA256 (브라우저 Web Crypto 사용)
async function hmacHex(key: string, msg: string) {
    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
    return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  // ====== PII 마스킹 유틸 ======
  export const EMAIL_RE = /([A-Za-z0-9._%+\-]+)@([A-Za-z0-9.\-]+\.[A-Za-z]{2,})/gi;
  export const PHONE_RE = /0[1-9][0-9\- ]{7,12}[0-9]/g;
  
  const DOMAIN_ALLOW = new Set([
    "gmail.com","naver.com","daum.net","kakao.com","hotmail.com","outlook.com"
  ]);
  
  export async function maskEmailForLogs(email: string, salt: string) {
    const m = email.match(EMAIL_RE);
    if (!m) return null;
    const [local, domain] = m[0].toLowerCase().split("@");
    const localHash = await hmacHex(salt, local);
    const safeDomain = DOMAIN_ALLOW.has(domain) ? domain : await hmacHex(salt, domain);
    return `<EMAIL:${localHash.slice(0,12)}@${safeDomain}>`;
  }
  
  export async function sanitizeRawForLogs(text: string, salt: string) {
    let t = text;
  
    // 이메일 마스킹
    for (const m of t.matchAll(EMAIL_RE)) {
      const masked = await maskEmailForLogs(m[0], salt);
      if (masked) t = t.replace(m[0], masked);
    }
  
    // 전화 마스킹: 끝 2자리만 남김
    t = t.replace(PHONE_RE, (m) => {
      const digits = m.replace(/\D/g, "");
      if (digits.length < 8) return "<PHONE:short>";
      return `<PHONE:***REMOVED***${digits.slice(-2)}>`;
    });
  
    // 비밀번호 구간 제거(최대 20자)
    t = t.replace(
      /(비\s*밀\s*번\s*호|비\s*번|비\s*본|암호|password|pass\s*word|pw)[:\s]*.{0,20}/gi,
      "$1:<REDACTED>"
    );
  
    return t;
  }
  
  // ====== 텔레메트리 큐 ======
  type TelemetryEvent =
    | { type: "stt_result"; data: any }
    | { type: "parse_result"; data: any }
    | { type: "submit"; data: any };
  
  export class Telemetry {
    private queue: TelemetryEvent[] = [];
    // 일 단위 salt(복원 불가 익명화)
    private salt = new Date().toISOString().slice(0,10);
  
    constructor(private endpoint = "/api/telemetry") {}
  
    getSalt() { return this.salt; }
  
    push(ev: TelemetryEvent) {
      this.queue.push(ev);
    }
  
    async flush() {
      if (!this.queue.length) return;
      
      // 텔레메트리 envelope 추가
      const sessionId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now());
      const body = JSON.stringify({
        schema: 1,
        parserVersion: '1.1.0',
        sessionId,
        events: this.queue,
        ts: Date.now()
      });
      
      this.queue = [];
      try {
        await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        });
      } catch {
        // 네트워크 실패 시 그냥 드랍(간단 운영). 필요하면 localStorage 재시도 로직 추가.
      }
    }
  }
  