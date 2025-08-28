export async function sendChat(message, opts) { const retries = opts?.retries ?? 2; const timeoutMs = opts?.timeoutMs ?? 15000; let err; for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort("timeout"), timeoutMs);
    try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, userId: 'anonymous' }) });
    }
    finally { }
} } // ?�요???�제 ?�용??ID�?변�?        }),        signal: ctrl.signal      });            clearTimeout(to);            if (!res.ok) {        const errorData = await res.json().catch(() => ({}));        throw new Error(errorData.error || `Chat API failed: ${res.status}`);      }            const json = await res.json();      if (!json?.reply) throw new Error("empty reply");            return json as ChatResponse;          } catch (e) {      clearTimeout(to);            // ?�?�아???�류?��? ?�인      if (e.name === 'AbortError' && e.message === 'timeout') {        err = new Error(`?�청 ?�간 초과 (${timeoutMs}ms)`);      } else {        err = e;      }            // 마�?�??�도가 ?�니�??�시??      if (i < retries) {        const delay = 300 * (i + 1); // 짧�? 백오?? 300ms, 600ms, 900ms        console.log(`[ChatAPI] ?�시??${i + 1}/${retries + 1} (${delay}ms ?? - ${err.message}`);        await new Promise(r => setTimeout(r, delay));      }    }  }    // 모든 ?�시???�패  console.error(`[ChatAPI] ${retries + 1}�??�도 모두 ?�패:`, err);  throw err;} 
