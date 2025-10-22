// posts 컬렉션의 thumbnailUrl 문제 해결 스크립트
// 브라우저 콘솔에서 실행하세요

async function fixPostsThumbnails() {
  try {
    console.log('🔧 posts 컬렉션 썸네일 수정 시작...');
    
    // Firebase 모듈 확인
    if (typeof window.fs === 'undefined' || typeof window.db === 'undefined') {
      console.error('❌ Firebase 모듈이 전역에 노출되지 않았습니다.');
      console.log('Firebase Console에서 다음을 실행하세요:');
      console.log('window.fs = firebase.firestore();');
      console.log('window.db = firebase.firestore().database;');
      return;
    }

    const { collection, getDocs, updateDoc, doc } = window.fs;
    
    // posts 컬렉션 조회
    const postsSnapshot = await getDocs(collection(window.db, 'posts'));
    console.log(`📊 총 ${postsSnapshot.docs.length}개 포스트 발견`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const docSnap of postsSnapshot.docs) {
      try {
        const data = docSnap.data();
        const postId = docSnap.id;
        
        console.log(`\n📝 포스트 [${postId}] 검사 중:`, {
          title: data.title,
          thumbnailUrl: data.thumbnailUrl,
          imageUrl: data.imageUrl
        });
        
        // URL 오타 수정 및 안전한 URL 생성
        let newThumbnailUrl = data.thumbnailUrl || data.imageUrl;
        
        if (newThumbnailUrl && typeof newThumbnailUrl === 'string') {
          // URL 오타 수정
          newThumbnailUrl = newThumbnailUrl.replace('placekiten.com', 'placekitten.com');
          newThumbnailUrl = newThumbnailUrl.replace('via.placeholder.com', 'placehold.co');
          
          // URL이 수정되었거나 기존에 없었다면 업데이트
          if (newThumbnailUrl !== data.thumbnailUrl) {
            await updateDoc(doc(window.db, 'posts', postId), {
              thumbnailUrl: newThumbnailUrl,
              updatedAt: new Date().toISOString()
            });
            
            console.log(`✅ 수정 완료: ${data.thumbnailUrl || 'undefined'} → ${newThumbnailUrl}`);
            fixedCount++;
          } else {
            console.log(`⏭️ 변경 없음: 이미 올바른 URL`);
            skippedCount++;
          }
        } else {
          // thumbnailUrl이 없는 경우 기본 이미지 생성
          const defaultImage = `https://picsum.photos/400/300?random=${postId}`;
          
          await updateDoc(doc(window.db, 'posts', postId), {
            thumbnailUrl: defaultImage,
            updatedAt: new Date().toISOString()
          });
          
          console.log(`🆕 기본 이미지 추가: ${defaultImage}`);
          fixedCount++;
        }
        
      } catch (error) {
        console.error(`❌ 포스트 [${docSnap.id}] 처리 실패:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 백필 완료!`);
    console.log(`✅ 수정된 포스트: ${fixedCount}개`);
    console.log(`⏭️ 변경 없음: ${skippedCount}개`);
    console.log(`❌ 오류 발생: ${errorCount}개`);
    
  } catch (error) {
    console.error('❌ 백필 스크립트 실행 실패:', error);
  }
}

// 실행
console.log('🚀 posts 컬렉션 썸네일 수정 스크립트 준비 완료');
console.log('fixPostsThumbnails() 함수를 실행하세요');

// 자동 실행 (선택사항)
// fixPostsThumbnails();
