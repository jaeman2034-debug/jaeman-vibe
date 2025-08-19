// sttSupport.ts
export type SttSupport =
  | { ok: true }
  | { ok: false; reason: "NO_API" | "NEED_HTTPS" };

export function detectSttSupport(): SttSupport {
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";
  const needsHttps = !window.isSecureContext && !isLocalhost;

  if (!SR) return { ok: false, reason: "NO_API" };
  if (needsHttps) return { ok: false, reason: "NEED_HTTPS" };
  return { ok: true };
} 