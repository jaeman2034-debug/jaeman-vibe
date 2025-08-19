// server.cjs (통복)
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.setHeader('content-type', 'application/json');
  res.status(200).end('{"ok":true,"ts":' + Date.now() + '}');
});

// 에러 핸들러 (맨 마지막)
app.use((err, _req, res, _next) => {
  console.error('[API ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'internal' });
});

const PORT = process.env.PORT || 3000;
// 바인드 주소를 명시하면 방화벽/로컬 정책 이슈를 피하기 좋습니다.
app.listen(PORT, '127.0.0.1', () => console.log(`[API] listening on http://127.0.0.1:${PORT}`)); 