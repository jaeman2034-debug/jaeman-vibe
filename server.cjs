// server.cjs  (CommonJS)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// 개발 중엔 널널하게 CORS 허용 (배포에선 좁히세요)
app.use(cors({ origin: true, credentials: true }));

// 내 서버 식별용 헤더 + 라우트 목록 출력
function logRoutes() {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).map(s => s.toUpperCase()).join(',');
      routes.push(`${methods} ${m.route.path}`);
    } else if (m.name === 'router' && m.handle?.stack) {
      m.handle.stack.forEach((h) => {
        if (h.route && h.route.path) {
          const methods = Object.keys(h.route.methods).map(s => s.toUpperCase()).join(',');
          routes.push(`${methods} ${h.route.path}`);
        }
      });
    }
  });
  console.log('[server] routes ->\n' + routes.map(r => '  ' + r).join('\n'));
}

// ✅ 반드시 먼저 등록
app.get('/api/ping', (req, res) => {
  res.setHeader('x-app', 'jaeman-vibe');
  res.sendStatus(204);
});

// ✅ 추가
app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store'); // 항상 최신
  res.json({
    ok: true,
    ts: Date.now(),
    pid: process.pid,
    version: process.env.APP_VERSION || process.env.npm_package_version || 'dev',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  });
});

// ⚠️ SPA 등 다른 라우트/정적 서빙은 여기에 추가 (필요 시)

// ✅ 맨 마지막: 404 핸들러 (우리 서버 확인용)
app.use((req, res) => {
  res.setHeader('x-app', 'jaeman-vibe');
  res.status(404).send(`not found (jaeman-vibe): ${req.method} ${req.url}`);
});

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, HOST, () => {
  console.log(`[server] listening at http://${HOST}:${PORT}`);
  logRoutes(); // 등록된 라우트 목록 확인용
});