/**
 * 🧹 Storage 자동 정리 시스템
 *
 * Firestore 문서가 삭제될 때 연관된 Storage 이미지를 자동으로 삭제합니다.
 * 이를 통해 불필요한 Storage 누적을 방지하고 비용을 절감합니다.
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const bucket = admin.storage().bucket();
/**
 * 🧹 마켓 상품 삭제 시 이미지 자동 정리
 *
 * Firestore: marketItems/{itemId} 문서 삭제 시
 * → Storage: imagePath 필드의 파일 자동 삭제
 */
export const cleanUpMarketImages = functions.firestore
    .document("marketItems/{itemId}")
    .onDelete(async (snapshot, context) => {
    const data = snapshot.data();
    const itemId = context.params.itemId;
    console.log(`🧹 상품 삭제 감지: ${itemId}`);
    // imagePath 또는 imageUrl 필드 확인
    let storagePath = data.imagePath;
    // imagePath가 없으면 imageUrl에서 추출 시도
    if (!storagePath && data.imageUrl) {
        try {
            const urlMatch = data.imageUrl.match(/o\/(.*?)\?/);
            if (urlMatch) {
                storagePath = decodeURIComponent(urlMatch[1]);
            }
        }
        catch (error) {
            console.warn("⚠️ imageUrl에서 경로 추출 실패:", error);
        }
    }
    if (!storagePath) {
        console.log("ℹ️ 삭제할 이미지 경로가 없습니다 (imagePath 또는 imageUrl 없음)");
        return null;
    }
    try {
        // Storage에서 파일 삭제
        await bucket.file(storagePath).delete();
        console.log(`✅ Storage 이미지 삭제 완료: ${storagePath}`);
        return { success: true, path: storagePath };
    }
    catch (error) {
        // 파일이 이미 삭제되었거나 존재하지 않는 경우
        if (error.code === 404) {
            console.log(`ℹ️ Storage 파일이 이미 삭제되었거나 존재하지 않습니다: ${storagePath}`);
            return { success: true, message: "Already deleted or not found" };
        }
        // 기타 에러
        console.error(`❌ Storage 이미지 삭제 실패: ${storagePath}`, error);
        return { success: false, error: error.message };
    }
});
/**
 * 🧹 사용자 삭제 시 프로필 이미지 자동 정리 (선택 사항)
 *
 * Firestore: users/{userId} 문서 삭제 시
 * → Storage: photoURL 필드의 파일 자동 삭제
 */
export const cleanUpUserImages = functions.firestore
    .document("users/{userId}")
    .onDelete(async (snapshot, context) => {
    const data = snapshot.data();
    const userId = context.params.userId;
    console.log(`🧹 사용자 삭제 감지: ${userId}`);
    let storagePath = data.photoPath;
    if (!storagePath && data.photoURL) {
        try {
            const urlMatch = data.photoURL.match(/o\/(.*?)\?/);
            if (urlMatch) {
                storagePath = decodeURIComponent(urlMatch[1]);
            }
        }
        catch (error) {
            console.warn("⚠️ photoURL에서 경로 추출 실패:", error);
        }
    }
    if (!storagePath) {
        console.log("ℹ️ 삭제할 프로필 이미지 경로가 없습니다");
        return null;
    }
    try {
        await bucket.file(storagePath).delete();
        console.log(`✅ 프로필 이미지 삭제 완료: ${storagePath}`);
        return { success: true, path: storagePath };
    }
    catch (error) {
        if (error.code === 404) {
            console.log(`ℹ️ 프로필 이미지가 이미 삭제되었거나 존재하지 않습니다: ${storagePath}`);
            return { success: true, message: "Already deleted or not found" };
        }
        console.error(`❌ 프로필 이미지 삭제 실패: ${storagePath}`, error);
        return { success: false, error: error.message };
    }
});
/**
 * 🧹 채팅방 삭제 시 첨부 파일 자동 정리 (선택 사항)
 *
 * Firestore: chatRooms/{roomId} 문서 삭제 시
 * → Storage: chatRooms/{roomId}/* 폴더 전체 삭제
 */
export const cleanUpChatAttachments = functions.firestore
    .document("chatRooms/{roomId}")
    .onDelete(async (snapshot, context) => {
    const roomId = context.params.roomId;
    const chatFolderPath = `chatRooms/${roomId}/`;
    console.log(`🧹 채팅방 삭제 감지: ${roomId}`);
    try {
        // 폴더 내 모든 파일 조회
        const [files] = await bucket.getFiles({ prefix: chatFolderPath });
        if (files.length === 0) {
            console.log(`ℹ️ 삭제할 첨부 파일이 없습니다: ${chatFolderPath}`);
            return null;
        }
        // 모든 파일 삭제
        const deletePromises = files.map((file) => file.delete());
        await Promise.all(deletePromises);
        console.log(`✅ 채팅방 첨부 파일 ${files.length}개 삭제 완료: ${chatFolderPath}`);
        return { success: true, deletedCount: files.length };
    }
    catch (error) {
        console.error(`❌ 채팅방 첨부 파일 삭제 실패: ${chatFolderPath}`, error);
        return { success: false, error: error.message };
    }
});
/**
 * 🧹 수동 Storage 정리 함수 (관리자 전용)
 *
 * Firestore에 없는 고아 파일(orphan files)을 찾아서 삭제합니다.
 *
 * 사용법:
 * ```typescript
 * const cleanOrphans = httpsCallable(functions, 'cleanOrphanFiles');
 * const result = await cleanOrphans({ dryRun: true });
 * ```
 */
export const cleanOrphanFiles = functions.https.onCall(async (data, context) => {
    var _a;
    // 관리자 권한 체크
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }
    // TODO: 관리자 권한 체크 (custom claims 또는 특정 UID 체크)
    // if (!context.auth.token.admin) {
    //   throw new functions.https.HttpsError("permission-denied", "관리자 권한이 필요합니다.");
    // }
    const dryRun = (_a = data.dryRun) !== null && _a !== void 0 ? _a : true; // 기본값: 실제 삭제 안 함 (안전 모드)
    const prefix = data.prefix || "market-images/"; // 검사할 폴더
    try {
        console.log(`🧹 고아 파일 검색 시작 (dryRun: ${dryRun})`);
        // Storage 파일 목록 조회
        const [files] = await bucket.getFiles({ prefix });
        console.log(`📄 Storage 파일 총 ${files.length}개 발견`);
        // Firestore marketItems 전체 조회
        const db = admin.firestore();
        const itemsSnapshot = await db.collection("marketItems").get();
        const activeImageUrls = new Set();
        const activeImagePaths = new Set();
        itemsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.imageUrl)
                activeImageUrls.add(data.imageUrl);
            if (data.imagePath)
                activeImagePaths.add(data.imagePath);
        });
        console.log(`📊 Firestore 활성 이미지: ${activeImagePaths.size}개`);
        // 고아 파일 찾기
        const orphanFiles = [];
        for (const file of files) {
            const filePath = file.name;
            // Firestore에 해당 경로가 없으면 고아 파일
            if (!activeImagePaths.has(filePath)) {
                // imageUrl에도 포함되지 않는지 확인
                const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
                if (!activeImageUrls.has(fileUrl)) {
                    orphanFiles.push(filePath);
                }
            }
        }
        console.log(`🗑️ 고아 파일 ${orphanFiles.length}개 발견`);
        // 실제 삭제 (dryRun이 false일 때만)
        if (!dryRun && orphanFiles.length > 0) {
            const deletePromises = orphanFiles.map((path) => bucket.file(path).delete());
            await Promise.all(deletePromises);
            console.log(`✅ 고아 파일 ${orphanFiles.length}개 삭제 완료`);
        }
        return {
            success: true,
            dryRun,
            totalFiles: files.length,
            activeFiles: activeImagePaths.size,
            orphanFiles: orphanFiles.length,
            deletedFiles: dryRun ? 0 : orphanFiles.length,
            orphanList: dryRun ? orphanFiles : [],
        };
    }
    catch (error) {
        console.error("❌ 고아 파일 정리 실패:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
//# sourceMappingURL=storageCleanup.js.map