const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',').map(s => s.trim());

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    cb(null, ALLOWED.includes(origin));
  },
  credentials: true
}));
app.use(express.json({ limit: '256kb' }));

app.options('/api/telemetry', (req, res) => res.sendStatus(204));

app.post('/api/telemetry', (req, res) => {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const dir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    const line = JSON.stringify({
      ts: Date.now(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      ...(req.body || {})
    }) + '\n';
    fs.appendFileSync(path.join(dir, `telemetry-${day}.jsonl`), line);
    res.json({ ok: true });
  } catch (e) {
    console.error('[telemetry][error]', e);
    res.status(400).json({ ok: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[telemetry] listening on :${PORT}`)); 