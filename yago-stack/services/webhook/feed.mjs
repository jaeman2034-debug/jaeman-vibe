// 피드 엔드포인트 - Google Sites 미러용
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_PUBLIC = '/data/public';
const FEED_FILE = path.join(DATA_PUBLIC, 'feed.json');

// 샘플 데이터 (실제로는 데이터베이스에서 가져와야 함)
const samplePosts = [
  {
    id: 'demo-001',
    title: 'YAGO VIBE — 첫 포스트',
    summary: '서버 부트스트랩 + OG 자동생성 + SNS 연동',
    url: 'https://example.com/blog/demo-001',
    ogUrl: 'https://example.com/ogimg/og/demo-001.png',
    date: '2025-09-12',
    category: '공지사항'
  },
  {
    id: 'demo-002',
    title: '클럽 운영 가이드',
    summary: '효과적인 클럽 운영을 위한 팁과 노하우',
    url: 'https://example.com/blog/demo-002',
    ogUrl: 'https://example.com/ogimg/og/demo-002.png',
    date: '2025-09-11',
    category: '가이드'
  }
];

export function setupFeedEndpoint(app) {
  // 피드 JSON 엔드포인트
  app.get('/feed.json', async (req, res) => {
    try {
      // 실제 구현에서는 데이터베이스에서 최신 20개 포스트를 가져옴
      // 여기서는 샘플 데이터 사용
      res.json(samplePosts);
    } catch (err) {
      console.error('[FEED] error', err);
      res.status(500).json({ error: 'Feed generation failed' });
    }
  });

  // 피드 업데이트 (새 포스트 발행 시 호출)
  app.post('/feed/update', async (req, res) => {
    try {
      const { id, title, summary, url, ogUrl, category } = req.body;
      
      // 실제 구현에서는 데이터베이스에 저장
      console.log('[FEED] 새 포스트 추가:', { id, title });
      
      res.json({ success: true, message: 'Feed updated' });
    } catch (err) {
      console.error('[FEED] update error', err);
      res.status(500).json({ error: 'Feed update failed' });
    }
  });
}
