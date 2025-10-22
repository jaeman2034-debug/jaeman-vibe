// src/pages/FirestoreConsole.tsx
import { useState } from 'react';
import { ensureFirebase } from '@/lib/firebaseStandalone';

const { db, fs } = ensureFirebase();

export default function FirestoreConsole() {
  const [out, setOut] = useState('');

  // 1) 통계 확인 (최근 5개)
  async function handleStats() {
    try {
      const q = fs.query(
        fs.collection(db, 'market'),                // ← 실제 사용하는 컬렉션명
        fs.orderBy('createdAt', 'desc'),
        fs.limit(5)
      );
      const snap = await fs.getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOut(JSON.stringify(rows, null, 2));
    } catch (error) {
      setOut(`오류: ${error}`);
    }
  }

  // 2) 단일 문서 테스트 (썸네일 백필 예시)
  async function handleOneDoc(id: string) {
    if (!id) return setOut('문서 ID를 입력하세요.');
    
    try {
      const ref = fs.doc(db, 'market_items', id);
      const doc = await fs.getDoc(ref);
      if (!doc.exists()) return setOut('문서가 없습니다.');

      const data: any = doc.data();
      // thumbUrl이 없으면 images의 첫 이미지를 복사
      const first = Array.isArray(data.images) ? data.images[0] : undefined;
      const candidate = typeof first === 'string' ? first : first?.url;

      if (!data.thumbUrl && candidate) {
        await fs.updateDoc(ref, {
          thumbUrl: candidate,
          isSold: data.isSold ?? false,
          deleted: data.deleted ?? false,
          status: data.status ?? 'selling',
          updatedAt: fs.serverTimestamp(),
        });
        setOut(`✅ thumbUrl 백필 완료: ${id}\n새 thumbUrl: ${candidate}`);
      } else {
        setOut(`⏭️ 변경 없음\n- thumbUrl: ${data.thumbUrl || '없음'}\n- images: ${data.images?.length || 0}개`);
      }
    } catch (error) {
      setOut(`오류: ${error}`);
    }
  }

  // 3) 전체 보정 실행 (예: 최근 100개 스캔 후 누락 시 채우기)
  async function handleFixAll() {
    try {
      const q = fs.query(
        fs.collection(db, 'market'),
        fs.orderBy('createdAt', 'desc'),
        fs.limit(100)
      );
      const snap = await fs.getDocs(q);

      let fixed = 0;
      let skipped = 0;
      let errors = 0;

      for (const d of snap.docs) {
        try {
          const v: any = d.data();
          if (!v.thumbUrl) {
            const first = Array.isArray(v.images) ? v.images[0] : undefined;
            const candidate = typeof first === 'string' ? first : first?.url;
            if (candidate) {
              await fs.updateDoc(fs.doc(db, 'market_items', d.id), {
                thumbUrl: candidate,
                isSold: v.isSold ?? false,
                deleted: v.deleted ?? false,
                status: v.status ?? 'selling',
                createdAt: v.createdAt ?? fs.serverTimestamp(),
                updatedAt: fs.serverTimestamp(),
              });
              fixed++;
            } else {
              skipped++;
            }
          } else {
            skipped++;
          }
        } catch (error) {
          errors++;
          console.error(`문서 ${d.id} 처리 실패:`, error);
        }
      }
      
      setOut(`🎉 보정 완료!\n- 업데이트: ${fixed}건\n- 스킵: ${skipped}건\n- 오류: ${errors}건`);
    } catch (error) {
      setOut(`오류: ${error}`);
    }
  }

  // 4) 컬렉션 전체 통계
  async function handleFullStats() {
    try {
      const q = fs.query(fs.collection(db, 'market'));
      const snap = await fs.getDocs(q);
      
      let total = 0;
      let withThumbUrl = 0;
      let withImages = 0;
      let withIsSold = 0;
      let withDeleted = 0;
      let withStatus = 0;
      let noImage = 0;

      snap.docs.forEach(doc => {
        const data = doc.data();
        total++;
        
        if (data.thumbUrl) withThumbUrl++;
        if (data.images?.[0]?.url) withImages++;
        if (data.isSold !== undefined) withIsSold++;
        if (data.deleted !== undefined) withDeleted++;
        if (data.status) withStatus++;
        if (!data.thumbUrl && !data.images?.[0]?.url) noImage++;
      });

      setOut(`📊 market_items 컬렉션 통계:
- 총 문서 수: ${total}
- thumbUrl 있는 문서: ${withThumbUrl} (${Math.round(withThumbUrl/total*100)}%)
- images[0].url 있는 문서: ${withImages} (${Math.round(withImages/total*100)}%)
- isSold 필드 있는 문서: ${withIsSold} (${Math.round(withIsSold/total*100)}%)
- deleted 필드 있는 문서: ${withDeleted} (${Math.round(withDeleted/total*100)}%)
- status 필드 있는 문서: ${withStatus} (${Math.round(withStatus/total*100)}%)
- 이미지 없는 문서: ${noImage} (${Math.round(noImage/total*100)}%)`);
    } catch (error) {
      setOut(`오류: ${error}`);
    }
  }

  const [docId, setDocId] = useState('');

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Firestore 테스트 콘솔</h1>

      <section style={{ marginTop: 24 }}>
        <h3>1. 컬렉션 통계 확인 (최근 5개)</h3>
        <button onClick={handleStats} style={{ padding: '8px 16px', marginRight: 8 }}>
          최근 5개 조회
        </button>
        <button onClick={handleFullStats} style={{ padding: '8px 16px' }}>
          전체 통계
        </button>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>2. 단일 문서 테스트</h3>
        <input
          placeholder="문서 ID 입력"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
          style={{ width: 360, marginRight: 8, padding: '8px 12px' }}
        />
        <button onClick={() => handleOneDoc(docId)} style={{ padding: '8px 16px' }}>
          단일 문서 테스트
        </button>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>3. 전체 문서 보정</h3>
        <button onClick={handleFixAll} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 4 }}>
          전체 보정 실행 (최근 100개)
        </button>
      </section>

      <pre style={{ 
        marginTop: 24, 
        background: '#111', 
        color: '#0f0', 
        padding: 16, 
        borderRadius: 8,
        fontSize: 14,
        lineHeight: 1.4,
        overflow: 'auto',
        maxHeight: 400
      }}>
        {out || '결과 출력...'}
      </pre>
    </div>
  );
}
