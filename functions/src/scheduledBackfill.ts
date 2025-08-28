import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// 스케줄된 행정동 백필
export const scheduledBackfill = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const batch = db.batch();
    let processedCount = 0;
    
    try {
      // 상품 백필
      const productsSnapshot = await db.collection('products')
        .where('dong', '==', null)
        .where('loc', '!=', null)
        .limit(100)
        .get();
      
      for (const doc of productsSnapshot.docs) {
        const product = doc.data();
        if (product.loc) {
          try {
            // 카카오 API로 행정동 정보 가져오기
            const dong = await getDongFromLocation(product.loc.latitude, product.loc.longitude);
            if (dong) {
              batch.update(doc.ref, { dong, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
              processedCount++;
            }
            
            // API 제한 고려하여 딜레이
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`상품 ${doc.id} 백필 실패:`, error);
          }
        }
      }
      
      // 모임 백필
      const groupsSnapshot = await db.collection('groups')
        .where('dong', '==', null)
        .where('loc', '!=', null)
        .limit(100)
        .get();
      
      for (const doc of groupsSnapshot.docs) {
        const group = doc.data();
        if (group.loc) {
          try {
            const dong = await getDongFromLocation(group.loc.latitude, group.loc.longitude);
            if (dong) {
              batch.update(doc.ref, { dong, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
              processedCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`모임 ${doc.id} 백필 실패:`, error);
          }
        }
      }
      
      // 구직 백필
      const jobsSnapshot = await db.collection('jobs')
        .where('dong', '==', null)
        .where('loc', '!=', null)
        .limit(100)
        .get();
      
      for (const doc of jobsSnapshot.docs) {
        const job = doc.data();
        if (job.loc) {
          try {
            const dong = await getDongFromLocation(job.loc.latitude, job.loc.longitude);
            if (dong) {
              batch.update(doc.ref, { dong, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
              processedCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`구직 ${doc.id} 백필 실패:`, error);
          }
        }
      }
      
      // 배치 커밋
      if (processedCount > 0) {
        await batch.commit();
        console.log(`${processedCount}개 항목 행정동 백필 완료`);
      }
      
      return { success: true, processedCount };
      
    } catch (error) {
      console.error('스케줄 백필 실패:', error);
      return { success: false, error: error.message };
    }
  });

// 카카오 API로 좌표를 행정동으로 변환
async function getDongFromLocation(lat: number, lng: number): Promise<string | null> {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) {
    console.warn('KAKAO_API_KEY 환경변수가 설정되지 않았습니다.');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Kakao API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      return data.documents[0].region_3depth_name || data.documents[0].region_2depth_name;
    }
    
    return null;
  } catch (error) {
    console.error('카카오 API 호출 실패:', error);
    return null;
  }
}
