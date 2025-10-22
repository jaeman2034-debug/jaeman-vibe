#!/usr/bin/env npx ts-node
"use strict";
/**
 * Firebase Firestore 초기화 스크립트 (TypeScript)
 * Emulator 환경에서 posts 컬렉션을 완전히 초기화합니다.
 *
 * 사용법:
 * npx ts-node scripts/resetFirestore.ts
 *
 * 또는 package.json 스크립트로:
 * npm run reset:firestore
 */
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
// Firebase Emulator 설정
const firebaseConfig = {
    apiKey: "demo-key",
    authDomain: "localhost",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};
async function resetFirestore() {
    console.log('🔥 Firestore 초기화 시작...');
    try {
        // 기존 앱 정리
        const existingApps = (0, app_1.getApps)();
        for (const app of existingApps) {
            await (0, app_1.deleteApp)(app);
        }
        // Firebase 앱 초기화
        const app = (0, app_1.initializeApp)(firebaseConfig);
        const db = (0, firestore_1.getFirestore)(app);
        // Firestore Emulator 연결
        try {
            (0, firestore_1.connectFirestoreEmulator)(db, 'localhost', 8080);
            console.log('✅ Firestore Emulator 연결됨 (localhost:8080)');
        }
        catch (error) {
            console.log('⚠️  Emulator 연결 실패 (이미 연결되었거나 Emulator가 실행 중이지 않음)');
        }
        // 네트워크 활성화
        await (0, firestore_1.enableNetwork)(db);
        // posts 컬렉션 조회
        console.log('📋 posts 컬렉션 조회 중...');
        const postsRef = (0, firestore_1.collection)(db, "posts");
        const snapshot = await (0, firestore_1.getDocs)(postsRef);
        console.log(`📊 발견된 문서: ${snapshot.size}개`);
        // 모든 문서 삭제
        if (snapshot.size > 0) {
            console.log('🗑️  문서 삭제 시작...');
            for (const document of snapshot.docs) {
                try {
                    await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(db, "posts", document.id));
                    console.log(`   ✅ 삭제됨: posts/${document.id}`);
                }
                catch (error) {
                    console.error(`   ❌ 삭제 실패: posts/${document.id}`, error);
                }
            }
            console.log(`🎉 총 ${snapshot.size}개 문서 삭제 완료!`);
        }
        else {
            console.log('ℹ️  삭제할 문서가 없습니다.');
        }
        // comments 서브컬렉션도 정리 (선택사항)
        console.log('📋 comments 서브컬렉션 정리 중...');
        // posts 컬렉션의 각 문서에 대해 comments 서브컬렉션 확인
        const postsSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(db, "posts"));
        if (postsSnapshot.size > 0) {
            for (const postDoc of postsSnapshot.docs) {
                const commentsRef = (0, firestore_1.collection)(db, "posts", postDoc.id, "comments");
                const commentsSnapshot = await (0, firestore_1.getDocs)(commentsRef);
                if (commentsSnapshot.size > 0) {
                    console.log(`🗑️  post/${postDoc.id}/comments 컬렉션 정리 중...`);
                    for (const commentDoc of commentsSnapshot.docs) {
                        try {
                            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(db, "posts", postDoc.id, "comments", commentDoc.id));
                            console.log(`   ✅ 댓글 삭제됨: posts/${postDoc.id}/comments/${commentDoc.id}`);
                        }
                        catch (error) {
                            console.error(`   ❌ 댓글 삭제 실패: posts/${postDoc.id}/comments/${commentDoc.id}`, error);
                        }
                    }
                }
            }
        }
        // 네트워크 비활성화
        await (0, firestore_1.disableNetwork)(db);
        // 앱 정리
        await (0, app_1.deleteApp)(app);
        console.log('✅ Firestore 초기화 완료!');
        console.log('');
        console.log('🚀 이제 Cypress 테스트를 실행할 수 있습니다:');
        console.log('   npm run cypress:simple');
        console.log('   npm run cypress:blog');
        console.log('');
    }
    catch (error) {
        console.error('❌ Firestore 초기화 중 오류 발생:', error);
        console.error('💡 Firestore Emulator가 실행 중인지 확인하세요:');
        console.error('   firebase emulators:start --only firestore');
        process.exit(1);
    }
}
// 스크립트 실행 (CommonJS 방식)
if (require.main === module) {
    resetFirestore()
        .then(() => {
        console.log('🎯 스크립트 실행 완료');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 스크립트 실행 실패:', error);
        process.exit(1);
    });
}
module.exports = { resetFirestore };
