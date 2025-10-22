import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

function parseId(id: string) { // R{round}_{idx}
  const m = /^R(\d+)_(\d+)$/.exec(id);
  if (!m) return null;
  return { round: Number(m[1]), idx: Number(m[2]) };
}

function nextId(cur: { round: number, idx: number }) { 
  return { round: cur.round + 1, idx: Math.ceil(cur.idx / 2) }; 
}

function slotFor(cur: { round: number, idx: number }) { 
  return (cur.idx % 2) === 1 ? 'A' : 'B'; 
}

export const onBracketMatchDone = onDocumentWritten(
  'events/{eventId}/matches/{matchId}',
  async (event) => {
    const { eventId, matchId } = event.params;
    const after = event.data?.after?.data();
    if (!after || after.phase !== 'bracket') return;
    
    const meta = parseId(matchId);
    if (!meta) return;

    // 승자 확정일 때만
    if (after.status !== 'done' || !after.winner) return;

    // 다음 라운드 경기 만들고 슬롯 채우기
    const nxt = nextId(meta);
    const slot = slotFor(meta);
    const nextDocId = `R${nxt.round}_${nxt.idx}`;
    const nextRef = db.doc(`events/${eventId}/matches/${nextDocId}`);

    await db.runTransaction(async tx => {
      const ex = await tx.get(nextRef);
      if (!ex.exists) {
        tx.set(nextRef, {
          phase: 'bracket',
          round: nxt.round,
          order: 100 * nxt.round + nxt.idx,
          status: 'pending',
          createdAt: now()
        }, { merge: true });
      }
      tx.set(nextRef, { [`team${slot}`]: after.winner }, { merge: true });
    });

    // 라운드 종료 감지 → 결승까지 자동 이어짐
    const roundSnap = await db.collection(`events/${eventId}/matches`)
      .where('phase', '==', 'bracket')
      .where('round', '==', meta.round)
      .get();
    const allDone = roundSnap.docs.every(d => (d.data() as any).status === 'done');
    
    if (allDone) {
      // 다음 라운드의 모든 매치가 단 하나뿐이고 그 한 경기까지 끝나면 우승 확정
      const nextSnap = await db.collection(`events/${eventId}/matches`)
        .where('phase', '==', 'bracket')
        .where('round', '==', nxt.round)
        .get();
      if (nextSnap.size === 1) {
        const only = nextSnap.docs[0];
        const onlyData = only.data() as any;
        if (onlyData.status === 'done' && onlyData.winner) {
          await db.doc(`events/${eventId}`).set({ 
            champion: onlyData.winner, 
            championAt: now() 
          }, { merge: true });
        }
      }
    }
  }
);
