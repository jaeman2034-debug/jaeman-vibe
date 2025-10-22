/**
 * Firestore 규칙 유닛 테스트
 * 
 * 설치: npm i -D @firebase/rules-unit-testing typescript ts-node
 * 실행: npx ts-node functions/__tests__/rules.spec.ts
 */
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { join } from 'path';

(async () => {
  console.log('🧪 Firestore 규칙 테스트 시작...');
  
  const rules = readFileSync(join(__dirname, '../firestore.rules'), 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-vibe',
    firestore: { rules }
  });

  const authed = testEnv.authenticatedContext('userA').firestore();
  const admin = testEnv.unauthenticatedContext().firestore(); // rules 무시 아님 주의

  const eventId = 'E1', regId = 'R1';

  try {
    // 1. 본인 등록 생성 허용
    console.log('✅ 테스트 1: 본인 등록 생성 허용');
    await assertSucceeds(
      authed.doc(`events/${eventId}/registrations/${regId}`).set({ 
        uid: 'userA', 
        status: 'pending',
        email: 'userA@example.com'
      })
    );

    // 2. 클라이언트가 checkedInAt 변경 시도 → 거절
    console.log('✅ 테스트 2: checkedInAt 변경 거절');
    await assertFails(
      authed.doc(`events/${eventId}/registrations/${regId}`).update({ 
        checkedInAt: new Date() 
      })
    );

    // 3. staff 컬렉션 클라이언트 쓰기 금지
    console.log('✅ 테스트 3: staff 컬렉션 쓰기 거절');
    await assertFails(
      authed.doc(`events/${eventId}/staff/userA`).set({ 
        role: 'staff' 
      })
    );

    // 4. 다른 사용자 등록 수정 거절
    console.log('✅ 테스트 4: 다른 사용자 등록 수정 거절');
    await assertFails(
      authed.doc(`events/${eventId}/registrations/otherUser`).update({ 
        status: 'confirmed' 
      })
    );

    // 5. 본인 등록 상태 업데이트 허용
    console.log('✅ 테스트 5: 본인 등록 상태 업데이트 허용');
    await assertSucceeds(
      authed.doc(`events/${eventId}/registrations/${regId}`).update({ 
        status: 'confirmed' 
      })
    );

    // 6. 이벤트 문서 읽기 허용
    console.log('✅ 테스트 6: 이벤트 문서 읽기 허용');
    await assertSucceeds(
      authed.doc(`events/${eventId}`).get()
    );

    // 7. 등록 목록 읽기 허용
    console.log('✅ 테스트 7: 등록 목록 읽기 허용');
    await assertSucceeds(
      authed.collection(`events/${eventId}/registrations`).get()
    );

    console.log('🎉 모든 규칙 테스트 통과! ✅');
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  } finally {
    await testEnv.cleanup();
  }
})();
