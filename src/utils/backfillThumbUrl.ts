import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function backfillThumbUrl() {
  console.log('[backfill] Starting backfill for thumbUrl...');
  
  try {
    const snap = await getDocs(collection(db, 'market'));
    const tasks: Promise<any>[] = [];
    let processedCount = 0;

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (!d.thumbUrl && d.images?.[0]?.url) {
        console.log(`[backfill] Patching document ${docSnap.id}: adding thumbUrl from images[0].url`);
        tasks.push(updateDoc(docSnap.ref, { thumbUrl: d.images[0].url }));
        processedCount++;
      }
    });

    if (tasks.length === 0) {
      console.log('[backfill] No documents need updating');
      return { success: true, updated: 0 };
    }

    await Promise.all(tasks);
    console.log(`[backfill] Done: ${tasks.length} documents updated`);
    
    return { success: true, updated: tasks.length };
  } catch (error) {
    console.error('[backfill] Error:', error);
    return { success: false, error: error };
  }
}

// 브라우저 콘솔에서 직접 실행할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  (window as any).backfillThumbUrl = backfillThumbUrl;
}
