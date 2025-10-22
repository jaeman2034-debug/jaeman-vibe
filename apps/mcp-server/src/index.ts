import 'dotenv/config';
import { request } from 'undici';
import { schemas, type ToolInput } from './tools.js';

const PORT = Number(process.env.PORT || 7331);
const N8N_TOKEN = process.env.N8N_TOKEN || '';
const WEBHOOKS = {
  meetup: process.env.N8N_WEBHOOK_MEETUP_CREATED!,
  market: process.env.N8N_WEBHOOK_MARKET_CREATED!,
  session: process.env.N8N_WEBHOOK_SESSION_EVENT!,
};

async function postJSON(url: string, body: any, headers: Record<string, string> = {}) {
  const r = await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await r.body.text();
  if (r.statusCode < 200 || r.statusCode >= 300) {
    throw new Error(`POST ${url} -> ${r.statusCode} ${text}`);
  }
  return text;
}

/** 툴 구현부 */
export const tools = {
  async create_meetup(input: ToolInput<'create_meetup'>) {
    const payload = { 
      title: input.title, 
      startAt: input.startAt, 
      location: input.location, 
      note: input.note 
    };
    await postJSON(WEBHOOKS.meetup, payload, { 'x-internal-key': N8N_TOKEN });
    return { ok: true, forwarded: 'meetup-created', payload };
  },

  async moderate_listing(input: ToolInput<'moderate_listing'>) {
    const payload = { 
      id: input.id, 
      title: input.title, 
      price: input.price, 
      category: input.category 
    };
    await postJSON(WEBHOOKS.market, payload, { 'x-internal-key': N8N_TOKEN });
    return { ok: true, forwarded: 'market-created', payload };
  },

  async send_kpi_report(input: ToolInput<'send_kpi_report'>) {
    const payload = { 
      type: 'kpi_request', 
      date: input.date || new Date().toISOString().slice(0, 10) 
    };
    await postJSON(WEBHOOKS.session, payload); // 내부 fan-out은 n8n에서 처리
    return { ok: true, forwarded: 'session-event', payload };
  },
};

/**
 * ————————————————————————————————————————————————
 * MCP 서버 어댑터 (간단 HTTP API)
 * 실제 MCP 프로토콜 서버로 바꿀 때는 @modelcontextprotocol/sdk의 서버 팩토리를 사용해
 * 아래 라우팅(툴 선언/호출)을 연결하면 됩니다.
 * ————————————————————————————————————————————————
 */
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/tools') {
      const list = Object.keys(schemas).map((name) => ({ name }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ tools: list }));
    }
    
    if (req.method === 'POST' && req.url === '/call') {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { name: string; input: unknown };

      if (!body?.name || !(body.name in schemas)) {
        throw new Error('invalid tool name');
      }
      
      // 입력 검증
      const schema = (schemas as any)[body.name] as any;
      const parsed = schema.parse(body.input);
      
      // 실행
      const out = await (tools as any)[body.name](parsed);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, result: out }));
    }

    res.writeHead(404); 
    res.end('not found');
  } catch (e: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
  }
});

server.listen(PORT, () => {
  console.log(`[MCP Bridge] HTTP listening on :${PORT}`);
  console.log(`[MCP Bridge] Tools: ${Object.keys(schemas).join(', ')}`);
  console.log(`[MCP Bridge] Webhooks: ${Object.keys(WEBHOOKS).join(', ')}`);
});
