// 기존 데이터에 thumbUrl 필드 추가 (백필 스크립트)
// 브라우저 콘솔에서 실행하세요

async function backfillThumbUrl() {
  try {
    // Firebase 모듈이 전역에 노출되어 있다고 가정
    if (!window.fs || !window.db) {
      console.error('Firebase 모듈이 전역에 노출되지 않았습니다.');
      console.log('다음과 같이 설정하세요:');
      console.log('window.fs = firebase/firestore 모듈');
      console.log('window.db = firebase db 인스턴스');
      return;
    }

    const { collection, getDocs, updateDoc } = window.fs;
    
    console.log('기존 데이터 백필 시작...');
    
    const snap = await getDocs(collection(window.db, 'market_items'));
    const tasks = [];

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (!d.thumbUrl && d.images?.[0]?.url) {
        console.log(`문서 ${docSnap.id}에 thumbUrl 추가:`, d.images[0].url);
        tasks.push(updateDoc(docSnap.ref, { thumbUrl: d.images[0].url }));
      }
    });

    if (tasks.length === 0) {
      console.log('백필할 데이터가 없습니다.');
      return;
    }

    await Promise.all(tasks);
    console.log(`[backfill] 완료: ${tasks.length}개 문서 업데이트됨`);
    
  } catch (error) {
    console.error('백필 실패:', error);
  }
}

// 실행
backfillThumbUrl();
