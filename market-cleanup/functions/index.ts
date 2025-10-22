/**
 * ?㏏ YAGO VIBE - Market Storage Auto Cleanup (TypeScript)
 * 
 * Firestore 臾몄꽌媛 ??젣????Storage ?대?吏瑜??먮룞?쇰줈 ?뺣━?⑸땲??
 * 
 * ?ㅼ튂 諛⑸쾿:
 * 1. ???뚯씪??functions/src/index.ts??異붽?
 * 2. npm install firebase-functions firebase-admin
 * 3. npm run build
 * 4. firebase deploy --only functions:cleanUpMarketImages
 * 
 * ?묐룞 諛⑹떇:
 * - Firestore: marketItems/{itemId} 臾몄꽌 ??젣 媛먯?
 * - Storage: imagePath ?꾨뱶???대?吏 ?뚯씪 ?먮룞 ??젣
 * 
 * @requires firebase-functions v2
 * @requires firebase-admin
 */

import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getStorage } from "firebase-admin/storage";
import * as admin from "firebase-admin";

// Firebase Admin 珥덇린??(?꾨줈?앺듃???대? ?덉쑝硫??앸왂)
if (!admin.apps.length) {
  admin.initializeApp();
}

const bucket = getStorage().bucket();

/**
 * ?㏏ ?곹뭹 ??젣 ???대?吏 ?먮룞 ?뺣━
 * 
 * Trigger: marketItems/{itemId} 臾몄꽌 ??젣 ?? * Action: Storage?먯꽌 imagePath ?꾨뱶???대?吏 ?뚯씪 ??젣
 */
export const cleanUpMarketImages = onDocumentDeleted(
  "marketItems/{itemId}",
  async (event) => {
    const itemId = event.params.itemId;
    const data = event.data?.data();

    console.log(`?㏏ ?곹뭹 ??젣 媛먯?: ${itemId}`);

    // imagePath ?꾨뱶 ?뺤씤
    if (!data?.imagePath) {
      console.log("?뱄툘 imagePath ?꾨뱶媛 ?놁뒿?덈떎. Storage ?뺣━ ?ㅽ궢.");
      return null;
    }

    const imagePath = data.imagePath as string;

    try {
      // Storage?먯꽌 ?뚯씪 ??젣
      await bucket.file(imagePath).delete();
      console.log(`??Storage ?대?吏 ??젣 ?꾨즺: ${imagePath}`);
      
      return {
        success: true,
        itemId,
        imagePath,
        message: "Image deleted successfully",
      };
    } catch (error: any) {
      // ?뚯씪???대? ??젣?섏뿀嫄곕굹 議댁옱?섏? ?딅뒗 寃쎌슦
      if (error.code === 404) {
        console.log(`?뱄툘 Storage ?뚯씪???대? ??젣?섏뿀嫄곕굹 議댁옱?섏? ?딆뒿?덈떎: ${imagePath}`);
        return {
          success: true,
          itemId,
          imagePath,
          message: "Image already deleted or not found",
        };
      }

      // 湲고? ?먮윭
      console.error(`??Storage ?대?吏 ??젣 ?ㅽ뙣: ${imagePath}`, error);
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
 * ?㏏ ?ъ슜????젣 ???꾨줈???대?吏 ?먮룞 ?뺣━ (?좏깮 ?ы빆)
 * 
 * Trigger: users/{userId} 臾몄꽌 ??젣 ?? * Action: Storage?먯꽌 photoPath ?꾨뱶???대?吏 ?뚯씪 ??젣
 */
export const cleanUpUserImages = onDocumentDeleted(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const data = event.data?.data();

    console.log(`?㏏ ?ъ슜????젣 媛먯?: ${userId}`);

    if (!data?.photoPath) {
      console.log("?뱄툘 photoPath ?꾨뱶媛 ?놁뒿?덈떎. Storage ?뺣━ ?ㅽ궢.");
      return null;
    }

    const photoPath = data.photoPath as string;

    try {
      await bucket.file(photoPath).delete();
      console.log(`???꾨줈???대?吏 ??젣 ?꾨즺: ${photoPath}`);
      return { success: true, userId, photoPath };
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`?뱄툘 ?꾨줈???대?吏媛 ?대? ??젣?섏뿀嫄곕굹 議댁옱?섏? ?딆뒿?덈떎: ${photoPath}`);
        return { success: true, userId, photoPath };
      }

      console.error(`???꾨줈???대?吏 ??젣 ?ㅽ뙣: ${photoPath}`, error);
      return { success: false, userId, photoPath, error: error.message };
    }
  }
);

/**
 * ?㏏ 梨꾪똿諛???젣 ??泥⑤? ?뚯씪 ?먮룞 ?뺣━ (?좏깮 ?ы빆)
 * 
 * Trigger: chatRooms/{roomId} 臾몄꽌 ??젣 ?? * Action: Storage?먯꽌 chatRooms/{roomId}/* ?대뜑 ?꾩껜 ??젣
 */
export const cleanUpChatAttachments = onDocumentDeleted(
  "chatRooms/{roomId}",
  async (event) => {
    const roomId = event.params.roomId;
    const chatFolderPath = `chatRooms/${roomId}/`;

    console.log(`?㏏ 梨꾪똿諛???젣 媛먯?: ${roomId}`);

    try {
      // ?대뜑 ??紐⑤뱺 ?뚯씪 議고쉶
      const [files] = await bucket.getFiles({ prefix: chatFolderPath });

      if (files.length === 0) {
        console.log(`?뱄툘 ??젣??泥⑤? ?뚯씪???놁뒿?덈떎: ${chatFolderPath}`);
        return null;
      }

      // 紐⑤뱺 ?뚯씪 ??젣
      const deletePromises = files.map((file) => file.delete());
      await Promise.all(deletePromises);

      console.log(`??梨꾪똿諛?泥⑤? ?뚯씪 ${files.length}媛???젣 ?꾨즺: ${chatFolderPath}`);
      return { success: true, roomId, deletedCount: files.length };
    } catch (error: any) {
      console.error(`??梨꾪똿諛?泥⑤? ?뚯씪 ??젣 ?ㅽ뙣: ${chatFolderPath}`, error);
      return { success: false, roomId, error: error.message };
    }
  }
);

