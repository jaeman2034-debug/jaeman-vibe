// npm i express better-sqlite3 zod dotenv
import 'dotenv/config';
import { readFileSync } from 'fs';

// 환경변수 파일 직접 로드 (dotenv가 작동하지 않는 경우)
try {
  const envFile = readFileSync('./market-service.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  });
} catch (error) {
  console.log('market-service.env 파일을 찾을 수 없습니다. 기본 환경변수를 사용합니다.');
}
import express from 'express';
import Database from 'better-sqlite3';
import { z } from 'zod';

const app = express();
app.use(express.json({ limit: '1mb' })); // JSON 파서

// 1) DB 초기화
const db = new Database(process.env.DB_PATH ?? './market.db');
db.exec(`
CREATE TABLE IF NOT EXISTS market_events (
  id           TEXT PRIMARY KEY,
  status       TEXT,
  created_at   TEXT,
  received_key TEXT,
  expected_key TEXT,
  header_ok    INTEGER,
  raw_json     TEXT
);
`);
const upsert = db.prepare(`
INSERT INTO market_events (id, status, created_at, received_key, expected_key, header_ok, raw_json)
VALUES (@id, @status, @created_at, @received_key, @expected_key, @header_ok, @raw_json)
ON CONFLICT(id) DO UPDATE SET
  status=excluded.status,
  created_at=excluded.created_at,
  received_key=excluded.received_key,
  expected_key=excluded.expected_key,
  header_ok=excluded.header_ok,
  raw_json=excluded.raw_json
`);

// 2) 요청 스키마(바디 유효성 검사)
const Body = z.object({
  id: z.string().min(1),
  status: z.string().default('pending')
});

// 3) 웹훅 엔드포인트
app.post('/webhook/market-created', (req, res) => {
  const receivedKey = req.header('x-internal-key') ?? '';
  const expectedKey = process.env.INTERNAL_KEY ?? '';
  const header_ok = receivedKey === expectedKey ? 1 : 0;

  // JSON 파싱 오류 대비
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      ok: false, error: 'invalid body', issues: parsed.error.issues
    });
  }
  const { id, status } = parsed.data;

  if (!header_ok) {
    // 실패 응답은 항상 같은 포맷
    return res.status(401).json({
      ok: false,
      error: 'invalid internal key',
      receivedKey,
      expectedKey,
      match: false,
      id
    });
  }

  // 4) 성공: DB 저장(UPSERT) + 응답
  const created_at = new Date().toISOString();
  const payload = {
    id, status, created_at,
    received_key: receivedKey,
    expected_key: expectedKey,
    header_ok,
    raw_json: JSON.stringify(req.body)
  };
  upsert.run(payload);

  return res.status(200).json({
    ok: true,
    id,
    status,
    receivedKey,
    expectedKey,
    match: header_ok === 1,
    saved: true
  });
});

// 헬스체크
app.get('/healthz', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT ?? 5678;
app.listen(port, () => console.log(`market service on http://localhost:${port}`));
