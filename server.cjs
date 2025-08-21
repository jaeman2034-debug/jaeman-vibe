// server.cjs
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const os = require('os');

// (A) 서비스 계정 JSON을 환경변수로 받는 경우 자동 파일화
if (process.env.FIREBASE_ADMIN_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const out = path.join(os.tmpdir(), 'firebase-admin.json');
  fs.writeFileSync(out, process.env.FIREBASE_ADMIN_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = out;
}

const express = require('express');
const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // GOOGLE_APPLICATION_CREDENTIALS 사용
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const app = express();
const PORT = process.env.PORT || 3001;

// (B) CORS (테스트용 전부 허용 → 운영 시 도메인 restrict)
const cors = require('cors');
app.use(cors({ origin: true }));

// 헬스체크
app.get('/healthz', (_, res) => res.send('ok'));

// 지오코딩 캐시 + 백오프
const geoCache = new Map(); // key: normalized addr, value: { data, exp }

function normalizeAddr(s=''){ return s.trim().replace(/\s+/g,' '); }
function getCache(k){ const v = geoCache.get(k); if(!v) return null; if(Date.now()>v.exp){ geoCache.delete(k); return null;} return v.data; }
function setCache(k, data, ttlMs=24*60*60*1000){ geoCache.set(k, { data, exp: Date.now()+ttlMs }); }

// 1) Firebase 진단 엔드포인트 (getProjectId 대신 app().options 사용)
app.get('/api/firebase-check', async (_req, res) => {
  try {
    const project =
      admin.app().options?.projectId ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GCLOUD_PROJECT;

    // 실제로 권한도 점검하고 싶다면 간단히 Firestore/Storage에 접근해봄
    await admin.firestore().listCollections(); // 접근 가능하면 에러 없이 통과
    const bucketName = admin.storage().bucket().name;

    res.json({ ok: true, project, bucket: bucketName });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const { geohashQueryBounds, distanceBetween } = require('geofire-common');

// 2) 카카오 지오코딩 프록시 (GET /api/geocode?q=주소)
app.get('/api/geocode', async (req, res) => {
  try {
    const qRaw = String(req.query.q || '');
    const q = normalizeAddr(qRaw);
    if (!q) return res.status(400).json({ ok: false, error: 'missing q' });

    const cached = getCache(q);
    if (cached) return res.json(cached);

    let attempt = 0;
    async function callKakao(){
      attempt++;
      const r = await fetch('https://dapi.kakao.com/v2/local/search/address.json?query='+encodeURIComponent(q), {
        headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` }
      });
      if (r.status === 429 && attempt < 3) {
        const wait = 300 * attempt; // 300ms, 600ms
        await new Promise(rs=>setTimeout(rs, wait));
        return callKakao();
      }
      return r;
    }

    const r = await callKakao();
    const json = await r.json();
    const d = json.documents?.[0];
    if (!d) return res.status(404).json({ ok: false, error: 'not_found' });

    const address = d.road_address?.address_name || d.address?.address_name || d.address_name;
    const payload = {
      ok: true,
      address,
      x: Number(d.x), // lng
      y: Number(d.y), // lat
      region: {
        b_code: d.address?.b_code ?? d.road_address?.b_code ?? null,
        region_1depth_name: d.address?.region_1depth_name ?? d.road_address?.region_1depth_name ?? null,
        region_2depth_name: d.address?.region_2depth_name ?? d.road_address?.region_2depth_name ?? null,
      }
    };
    
    setCache(q, payload);
    res.json(payload);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// 3) 근처 상품 검색 API (GET /api/products/near?lat=..&lng=..&radius=2000&limit=50)
app.get('/api/products/near', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 2000); // meters
    const limit = Number(req.query.limit || 50);
    const sort = String(req.query.sort || 'distance'); // 'distance' | 'latest'

    if (!isFinite(lat) || !isFinite(lng)) {
      return res.status(400).json({ ok: false, error: 'lat/lng required' });
    }

    const center = [lat, lng];
    const bounds = geohashQueryBounds(center, radius);
    const db = admin.firestore();

    // bounds 각각에 대해 geohash range 쿼리 실행
    const snaps = await Promise.all(
      bounds.map(([start, end]) =>
        db.collection('products')
          .orderBy('geohash')
          .startAt(start)
          .endAt(end)
          .get()
      )
    );

    // 결과 병합 + 실제 거리 계산
    const seen = new Set();
    const results = [];
    for (const snap of snaps) {
      snap.forEach(doc => {
        if (seen.has(doc.id)) return;
        seen.add(doc.id);
        const d = doc.data();
        const gp = d.location; // GeoPoint
        if (!gp || typeof gp.latitude !== 'number') return;
        const distKm = distanceBetween(center, [gp.latitude, gp.longitude]);
        const distM = distKm * 1000;
        if (distM <= radius) {
          results.push({
            id: doc.id,
            title: d.title,
            price: d.price,
            address: d.address,
            lat: gp.latitude,
            lng: gp.longitude,
            distanceM: Math.round(distM),
            createdAt: d.createdAt?.toMillis?.() ?? null,
            thumbnail: d.thumbnail ?? null,
          });
        }
      });
    }

    // 정렬 후 제한
    if (sort === 'latest') {
      results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else {
      results.sort((a, b) => a.distanceM - b.distanceM);
    }
    res.json({ ok: true, count: results.length, items: results.slice(0, limit) });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// 4) 현재 좌표 → 동네코드 API (GET /api/regioncode?lat=..&lng=..)
app.get('/api/regioncode', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!isFinite(lat) || !isFinite(lng)) {
      return res.status(400).json({ ok:false, error:'lat/lng required' });
    }
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` } }
    );
    const j = await r.json();
    const d = j.documents?.[0];
    if (!d) return res.status(404).json({ ok:false, error:'not_found' });
    res.json({
      ok:true,
      b_code: d.code, // 법정동 10자리
      region_1depth_name: d.region_1depth_name,
      region_2depth_name: d.region_2depth_name,
      region_3depth_name: d.region_3depth_name,
    });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e) });
  }
});

// 5) 동네코드(prefix)로 상품 조회 API (GET /api/products/region?b=..&level=8&limit=50)
app.get('/api/products/region', async (req, res) => {
  try {
    const prefix = String(req.query.b || '').trim();
    const level = Number(req.query.level || 8); // 5:시군구, 8:읍면동 권장
    const limit = Number(req.query.limit || 50);
    if (!prefix) return res.status(400).json({ ok:false, error:'b required' });

    const key = prefix.slice(0, level);
    const start = key;
    const end = key + '\uf8ff';

    const db = admin.firestore();
    const snap = await db.collection('products')
      .orderBy('region.b_code')
      .startAt(start)
      .endAt(end)
      .limit(limit)
      .get();

    const items = snap.docs.map(doc => {
      const d = doc.data();
      const gp = d.location;
      return {
        id: doc.id,
        title: d.title,
        price: d.price,
        address: d.address,
        lat: gp?.latitude ?? null,
        lng: gp?.longitude ?? null,
        createdAt: d.createdAt?.toMillis?.() ?? null,
        thumbnail: d.thumbnail ?? null,
        b_code: d.region?.b_code ?? null,
      };
    });
    res.json({ ok:true, count: items.length, items });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e) });
  }
});

const DEFAULT_PORT = Number(process.env.PORT) || 3001;

function start(port) {
  const srv = app.listen(port, () => {
    console.log(`✅ Server listening on http://localhost:${port}`);
  });
  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const next = port + 1;
      console.warn(`⚠️ Port ${port} in use, trying ${next}...`);
      setTimeout(() => start(next), 200);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
}
if (require.main === module) start(DEFAULT_PORT);