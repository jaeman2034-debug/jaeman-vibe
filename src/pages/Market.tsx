import { useEffect, useState } from 'react';
import FIREBASE from '@/lib/firebase';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

type Item = {
  id: string;
  title?: string;
  price?: number;
  cover?: string; // 썸네일 URL
  createdAt?: any;
};

export default function Market() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(FIREBASE.db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>스포츠 마켓</h1>
      <button onClick={() => (window.location.hash = '/start')}>← 시작으로</button>

      {loading && <div style={{ marginTop: 16 }}>로딩 중…</div>}

      {!loading && items.length === 0 && (
        <div style={{ marginTop: 16, color: '#888' }}>상품이 없습니다. (업로드는 다음 단계에서 붙입니다)</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 220px)', gap: 16, marginTop: 16 }}>
        {items.map((it) => (
          <div key={it.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
            <div
              style={{
                width: '100%',
                height: 140,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: 6,
              }}
            >
              {it.cover ? (
                <img src={it.cover} style={{ width: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#aaa', fontSize: 12 }}>이미지 없음</span>
              )}
            </div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>{it.title ?? '제목 없음'}</div>
            <div style={{ marginTop: 4 }}>{it.price ? `${it.price.toLocaleString()}원` : '가격 미정'}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 