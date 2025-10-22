import axios from "axios";

const N8N_BASE = import.meta.env.VITE_N8N_URL || "http://localhost:5678";

/**
 * n8n webhook 호출 유틸리티
 * @param path webhook 이름 (예: chat-final-250927-z1)
 * @param payload 전달할 데이터
 */
export async function callN8NWebhook(path: string, payload: any) {
  try {
    const url = `${N8N_BASE}/webhook/${path}`;
    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: any) {
    console.error("n8n 호출 오류:", err.response?.data || err.message);
    throw err;
  }
}
