/**
 * 🧹 YAGO VIBE - Market Storage Auto Cleanup
 * 
 * Firestore 문서가 삭제될 때 Storage 이미지를 자동으로 정리합니다.
 * 
 * 설치 방법:
 * 1. 이 파일을 functions/src/index.ts 또는 functions/index.js에 추가
 * 2. firebase deploy --only functions:cleanUpMarketImages
 * 
 * 작동 방식:
 * - Firestore: marketItems/{itemId} 문서 삭제 감지
 * - Storage: imagePath 필드의 이미지 파일 자동 삭제
 * 
 * @requires firebase-functions v2
 * @requires firebase-admin
 */

const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { getStorage } = require("firebase-admin/storage");
const admin = require("firebase-admin");

// Firebase Admin 초기화 (프로젝트에 이미 있으면 생략)
if (!admin.apps.length) {
  admin.initializeApp();
}

const bucket = getStorage().bucket();

/**
 * 🧹 상품 삭제 시 이미지 자동 정리
 * 
 * Trigger: marketItems/{itemId} 문서 삭제 시
 * Action: Storage에서 imagePath 필드의 이미지 파일 삭제
 */
exports.cleanUpMarketImages = onDocumentDeleted(
  "marketItems/{itemId}",
  async (event) => {
    const itemId = event.params.itemId;
    const data = event.data?.data();

    console.log(`🧹 상품 삭제 감지: ${itemId}`);

    // imagePath 필드 확인
    if (!data?.imagePath) {
      console.log("ℹ️ imagePath 필드가 없습니다. Storage 정리 스킵.");
      return null;
    }

    const imagePath = data.imagePath;

    try {
      // Storage에서 파일 삭제
      await bucket.file(imagePath).delete();
      console.log(`✅ Storage 이미지 삭제 완료: ${imagePath}`);
      
      return {
        success: true,
        itemId,
        imagePath,
        message: "Image deleted successfully",
      };
    } catch (error) {
      // 파일이 이미 삭제되었거나 존재하지 않는 경우
      if (error.code === 404) {
        console.log(`ℹ️ Storage 파일이 이미 삭제되었거나 존재하지 않습니다: ${imagePath}`);
        return {
          success: true,
          itemId,
          imagePath,
          message: "Image already deleted or not found",
        };
      }

      // 기타 에러
      console.error(`❌ Storage 이미지 삭제 실패: ${imagePath}`, error);
      return {
        success: false,
        itemId,
        imagePath,
        error: error.message,
      };
    }
  }
);

/**
 * 🧹 사용자 삭제 시 프로필 이미지 자동 정리 (선택 사항)
 * 
 * Trigger: users/{userId} 문서 삭제 시
 * Action: Storage에서 photoPath 필드의 이미지 파일 삭제
 */
exports.cleanUpUserImages = onDocumentDeleted(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const data = event.data?.data();

    console.log(`🧹 사용자 삭제 감지: ${userId}`);

    if (!data?.photoPath) {
      console.log("ℹ️ photoPath 필드가 없습니다. Storage 정리 스킵.");
      return null;
    }

    const photoPath = data.photoPath;

    try {
      await bucket.file(photoPath).delete();
      console.log(`✅ 프로필 이미지 삭제 완료: ${photoPath}`);
      return { success: true, userId, photoPath };
    } catch (error) {
      if (error.code === 404) {
        console.log(`ℹ️ 프로필 이미지가 이미 삭제되었거나 존재하지 않습니다: ${photoPath}`);
        return { success: true, userId, photoPath };
      }

      console.error(`❌ 프로필 이미지 삭제 실패: ${photoPath}`, error);
      return { success: false, userId, photoPath, error: error.message };
    }
  }
);

/**
 * 🧹 채팅방 삭제 시 첨부 파일 자동 정리 (선택 사항)
 * 
 * Trigger: chatRooms/{roomId} 문서 삭제 시
 * Action: Storage에서 chatRooms/{roomId}/* 폴더 전체 삭제
 */
exports.cleanUpChatAttachments = onDocumentDeleted(
  "chatRooms/{roomId}",
  async (event) => {
    const roomId = event.params.roomId;
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
      return { success: true, roomId, deletedCount: files.length };
    } catch (error) {
      console.error(`❌ 채팅방 첨부 파일 삭제 실패: ${chatFolderPath}`, error);
      return { success: false, roomId, error: error.message };
    }
  }
);

