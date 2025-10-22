/**
 * ?㏏ Storage ?먮룞 ?뺣━ ?쒖뒪?? * 
 * Firestore 臾몄꽌媛 ??젣?????곌???Storage ?대?吏瑜??먮룞?쇰줈 ??젣?⑸땲??
 * ?대? ?듯빐 遺덊븘?뷀븳 Storage ?꾩쟻??諛⑹??섍퀬 鍮꾩슜???덇컧?⑸땲??
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const bucket = admin.storage().bucket();

/**
 * ?㏏ 留덉폆 ?곹뭹 ??젣 ???대?吏 ?먮룞 ?뺣━
 * 
 * Firestore: marketItems/{itemId} 臾몄꽌 ??젣 ?? * ??Storage: imagePath ?꾨뱶???뚯씪 ?먮룞 ??젣
 */
export const cleanUpMarketImages = functions.firestore
  .document("marketItems/{itemId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data();
    const itemId = context.params.itemId;

    console.log(`?㏏ ?곹뭹 ??젣 媛먯?: ${itemId}`);

    // imagePath ?먮뒗 imageUrl ?꾨뱶 ?뺤씤
    let storagePath = data.imagePath;

    // imagePath媛 ?놁쑝硫?imageUrl?먯꽌 異붿텧 ?쒕룄
    if (!storagePath && data.imageUrl) {
      try {
        const urlMatch = data.imageUrl.match(/o\/(.*?)\?/);
        if (urlMatch) {
          storagePath = decodeURIComponent(urlMatch[1]);
        }
      } catch (error) {
        console.warn("?좑툘 imageUrl?먯꽌 寃쎈줈 異붿텧 ?ㅽ뙣:", error);
      }
    }

    if (!storagePath) {
      console.log("?뱄툘 ??젣???대?吏 寃쎈줈媛 ?놁뒿?덈떎 (imagePath ?먮뒗 imageUrl ?놁쓬)");
      return null;
    }

    try {
      // Storage?먯꽌 ?뚯씪 ??젣
      await bucket.file(storagePath).delete();
      console.log(`??Storage ?대?吏 ??젣 ?꾨즺: ${storagePath}`);
      return { success: true, path: storagePath };
    } catch (error: any) {
      // ?뚯씪???대? ??젣?섏뿀嫄곕굹 議댁옱?섏? ?딅뒗 寃쎌슦
      if (error.code === 404) {
        console.log(`?뱄툘 Storage ?뚯씪???대? ??젣?섏뿀嫄곕굹 議댁옱?섏? ?딆뒿?덈떎: ${storagePath}`);
        return { success: true, message: "Already deleted or not found" };
      }

      // 湲고? ?먮윭
      console.error(`??Storage ?대?吏 ??젣 ?ㅽ뙣: ${storagePath}`, error);
      return { success: false, error: error.message };
    }
  });

/**
 * ?㏏ ?ъ슜????젣 ???꾨줈???대?吏 ?먮룞 ?뺣━ (?좏깮 ?ы빆)
 * 
 * Firestore: users/{userId} 臾몄꽌 ??젣 ?? * ??Storage: photoURL ?꾨뱶???뚯씪 ?먮룞 ??젣
 */
export const cleanUpUserImages = functions.firestore
  .document("users/{userId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data();
    const userId = context.params.userId;

    console.log(`?㏏ ?ъ슜????젣 媛먯?: ${userId}`);

    let storagePath = data.photoPath;

    if (!storagePath && data.photoURL) {
      try {
        const urlMatch = data.photoURL.match(/o\/(.*?)\?/);
        if (urlMatch) {
          storagePath = decodeURIComponent(urlMatch[1]);
        }
      } catch (error) {
        console.warn("?좑툘 photoURL?먯꽌 寃쎈줈 異붿텧 ?ㅽ뙣:", error);
      }
    }

    if (!storagePath) {
      console.log("?뱄툘 ??젣???꾨줈???대?吏 寃쎈줈媛 ?놁뒿?덈떎");
      return null;
    }

    try {
      await bucket.file(storagePath).delete();
      console.log(`???꾨줈???대?吏 ??젣 ?꾨즺: ${storagePath}`);
      return { success: true, path: storagePath };
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`?뱄툘 ?꾨줈???대?吏媛 ?대? ??젣?섏뿀嫄곕굹 議댁옱?섏? ?딆뒿?덈떎: ${storagePath}`);
        return { success: true, message: "Already deleted or not found" };
      }

      console.error(`???꾨줈???대?吏 ??젣 ?ㅽ뙣: ${storagePath}`, error);
      return { success: false, error: error.message };
    }
  });

/**
 * ?㏏ 梨꾪똿諛???젣 ??泥⑤? ?뚯씪 ?먮룞 ?뺣━ (?좏깮 ?ы빆)
 * 
 * Firestore: chatRooms/{roomId} 臾몄꽌 ??젣 ?? * ??Storage: chatRooms/{roomId}/* ?대뜑 ?꾩껜 ??젣
 */
export const cleanUpChatAttachments = functions.firestore
  .document("chatRooms/{roomId}")
  .onDelete(async (snapshot, context) => {
    const roomId = context.params.roomId;
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
      return { success: true, deletedCount: files.length };
    } catch (error: any) {
      console.error(`??梨꾪똿諛?泥⑤? ?뚯씪 ??젣 ?ㅽ뙣: ${chatFolderPath}`, error);
      return { success: false, error: error.message };
    }
  });

/**
 * ?㏏ ?섎룞 Storage ?뺣━ ?⑥닔 (愿由ъ옄 ?꾩슜)
 * 
 * Firestore???녿뒗 怨좎븘 ?뚯씪(orphan files)??李얠븘????젣?⑸땲??
 * 
 * ?ъ슜踰?
 * ```typescript
 * const cleanOrphans = httpsCallable(functions, 'cleanOrphanFiles');
 * const result = await cleanOrphans({ dryRun: true });
 * ```
 */
export const cleanOrphanFiles = functions.https.onCall(async (data, context) => {
  // 愿由ъ옄 沅뚰븳 泥댄겕
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??");
  }

  // TODO: 愿由ъ옄 沅뚰븳 泥댄겕 (custom claims ?먮뒗 ?뱀젙 UID 泥댄겕)
  // if (!context.auth.token.admin) {
  //   throw new functions.https.HttpsError("permission-denied", "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??");
  // }

  const dryRun = data.dryRun ?? true; // 湲곕낯媛? ?ㅼ젣 ??젣 ????(?덉쟾 紐⑤뱶)
  const prefix = data.prefix || "market-images/"; // 寃?ы븷 ?대뜑

  try {
    console.log(`?㏏ 怨좎븘 ?뚯씪 寃???쒖옉 (dryRun: ${dryRun})`);

    // Storage ?뚯씪 紐⑸줉 議고쉶
    const [files] = await bucket.getFiles({ prefix });
    console.log(`?뱞 Storage ?뚯씪 珥?${files.length}媛?諛쒓껄`);

    // Firestore marketItems ?꾩껜 議고쉶
    const db = admin.firestore();
    const itemsSnapshot = await db.collection("marketItems").get();
    
    const activeImageUrls = new Set<string>();
    const activeImagePaths = new Set<string>();

    itemsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.imageUrl) activeImageUrls.add(data.imageUrl);
      if (data.imagePath) activeImagePaths.add(data.imagePath);
    });

    console.log(`?뱤 Firestore ?쒖꽦 ?대?吏: ${activeImagePaths.size}媛?);

    // 怨좎븘 ?뚯씪 李얘린
    const orphanFiles: string[] = [];
    for (const file of files) {
      const filePath = file.name;
      
      // Firestore???대떦 寃쎈줈媛 ?놁쑝硫?怨좎븘 ?뚯씪
      if (!activeImagePaths.has(filePath)) {
        // imageUrl?먮룄 ?ы븿?섏? ?딅뒗吏 ?뺤씤
        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        if (!activeImageUrls.has(fileUrl)) {
          orphanFiles.push(filePath);
        }
      }
    }

    console.log(`?뿊截?怨좎븘 ?뚯씪 ${orphanFiles.length}媛?諛쒓껄`);

    // ?ㅼ젣 ??젣 (dryRun??false???뚮쭔)
    if (!dryRun && orphanFiles.length > 0) {
      const deletePromises = orphanFiles.map((path) => bucket.file(path).delete());
      await Promise.all(deletePromises);
      console.log(`??怨좎븘 ?뚯씪 ${orphanFiles.length}媛???젣 ?꾨즺`);
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
  } catch (error: any) {
    console.error("??怨좎븘 ?뚯씪 ?뺣━ ?ㅽ뙣:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

