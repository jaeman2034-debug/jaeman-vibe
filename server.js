import express from 'express';
const app = express();

// 가장 먼저 간단 헬스 라우트 배치 (다른 미들웨어/라우터보다 위!)
app.get('/api/health', (_req, res) => {
  res.setHeader('content-type', 'application/json');
  res.status(200).end('{"ok":true,"ts":' + Date.now() + '}'); // 직렬화 이슈 원천봉쇄
});

// 미들웨어는 헬스 라우트 이후에
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  // TODO: OpenAI 연동 전 임시 응답
  res.json({ reply: `echo: ${message}` });
});

// 맨 마지막에 에러 핸들러
app.use((err, _req, res, _next) => {
  console.error('[API ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'internal' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[API] listening on ${PORT}`)); 