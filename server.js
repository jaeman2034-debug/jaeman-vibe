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

// 카카오 역지오코딩 API 프록시
app.get('/api/kakao/coord2region', async (req, res) => {
  try {
    const { x, y } = req.query; // x=lng, y=lat
    
    if (!x || !y) {
      return res.status(400).json({ error: 'x(lng) and y(lat) parameters required' });
    }

    // 환경변수 대신 직접 API 키 사용 (개발용)
    const key = '026b65be7c8c4c4c8c4c4c8c4c4c8c4c'; // 실제 API 키로 교체 필요
    
    if (!key) {
      return res.status(500).json({ error: 'Kakao API key not configured' });
    }

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${x}&y=${y}`,
      { 
        headers: { 
          'Authorization': `KakaoAK ${key}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    if (!response.ok) {
      throw new Error(`Kakao API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[KAKAO API ERROR]', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 맨 마지막에 에러 핸들러
app.use((err, _req, res, _next) => {
  console.error('[API ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'internal' });
});

const PORT = process.env.PORT || 3001; // 3000 → 3001로 변경
app.listen(PORT, () => console.log(`[API] listening on ${PORT}`)); 