export interface ChatResponse {
  reply: string;
  model?: string;
  timestamp?: string;
  error?: string;
}

export async function sendChat(message: string, opts?: { retries?: number; timeoutMs?: number }): Promise<ChatResponse> {
  const retries = opts?.retries ?? 2;
  const timeoutMs = opts?.timeoutMs ?? 15000;
  let err: any;
  
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort("timeout"), timeoutMs);
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message,
          userId: 'anonymous' // 필요시 실제 사용자 ID로 변경
        }),
        signal: ctrl.signal
      });
      
      clearTimeout(to);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Chat API failed: ${res.status}`);
      }
      
      const json = await res.json();
      if (!json?.reply) throw new Error("empty reply");
      
      return json as ChatResponse;
      
    } catch (e) {
      clearTimeout(to);
      
      // 타임아웃 오류인지 확인
      if (e.name === 'AbortError' && e.message === 'timeout') {
        err = new Error(`요청 시간 초과 (${timeoutMs}ms)`);
      } else {
        err = e;
      }
      
      // 마지막 시도가 아니면 재시도
      if (i < retries) {
        const delay = 300 * (i + 1); // 짧은 백오프: 300ms, 600ms, 900ms
        console.log(`[ChatAPI] 재시도 ${i + 1}/${retries + 1} (${delay}ms 후) - ${err.message}`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  // 모든 재시도 실패
  console.error(`[ChatAPI] ${retries + 1}번 시도 모두 실패:`, err);
  throw err;
} 