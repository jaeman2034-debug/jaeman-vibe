import { db } from "./firebase";
import { doc, setDoc, collection, addDoc, updateDoc, increment } from "firebase/firestore";

// ???Œë¦¼ êµ¬ì¡° ?¸í„°?˜ì´??export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'message' | 'comment' | 'system' | 'market';
  read: boolean;
  createdAt: Date;
  data?: any; // ì¶”ê? ?°ì´??(?? ?í’ˆ ID, ì±„íŒ…ë°?ID ??
}

export interface NotificationMetadata {
  count: number;
  lastUpdate: Date;
  unreadCount: number;
}

// ?????Œë¦¼ ?ì„± (?ŒìŠ¤?¸ìš©)
export async function createTestNotification(
  userId: string, 
  title: string, 
  body: string, 
  type: NotificationItem['type'] = 'system',
  data?: any
) {
  try {
    console.log("?“ ?ŒìŠ¤???Œë¦¼ ?ì„± ì¤?..", { userId, title, type });

    // 1. ?Œë¦¼ ?„ì´?œì„ items ?œë¸Œì»¬ë ‰?˜ì— ì¶”ê?
    const itemsRef = collection(db, "notifications", userId, "items");
    const newNotifRef = await addDoc(itemsRef, {
      title,
      body,
      type,
      read: false,
      createdAt: new Date(),
      data: data || {}
    });

    console.log("???Œë¦¼ ?„ì´???ì„±??", newNotifRef.id);

    // 2. ë©”í??°ì´???…ë°?´íŠ¸ (ì¹´ìš´??ì¦ê?)
    const metadataRef = doc(db, "notifications", userId);
    await updateDoc(metadataRef, {
      "metadata.count": increment(1),
      "metadata.unreadCount": increment(1),
      "metadata.lastUpdate": new Date()
    }).catch(async () => {
      // ë©”í??°ì´??ë¬¸ì„œê°€ ?†ìœ¼ë©??ˆë¡œ ?ì„±
      await setDoc(metadataRef, {
        metadata: {
          count: 1,
          unreadCount: 1,
          lastUpdate: new Date()
        }
      });
    });

    console.log("???Œë¦¼ ë©”í??°ì´???…ë°?´íŠ¸ ?„ë£Œ");
    return newNotifRef.id;

  } catch (error) {
    console.error("???Œë¦¼ ?ì„± ?¤íŒ¨:", error);
    throw error;
  }
}

// ???Œë¦¼???½ìŒ?¼ë¡œ ?œì‹œ
export async function markNotificationAsRead(userId: string, notificationId: string) {
  try {
    const notifRef = doc(db, "notifications", userId, "items", notificationId);
    await updateDoc(notifRef, { read: true });

    // ë©”í??°ì´?°ì˜ unreadCount ê°ì†Œ
    const metadataRef = doc(db, "notifications", userId);
    await updateDoc(metadataRef, {
      "metadata.unreadCount": increment(-1),
      "metadata.lastUpdate": new Date()
    });

    console.log("???Œë¦¼ ?½ìŒ ì²˜ë¦¬ ?„ë£Œ:", notificationId);
  } catch (error) {
    console.error("???Œë¦¼ ?½ìŒ ì²˜ë¦¬ ?¤íŒ¨:", error);
  }
}

// ??ëª¨ë“  ?Œë¦¼???½ìŒ?¼ë¡œ ?œì‹œ
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { getDocs, query, where, updateDoc, increment } = await import("firebase/firestore");
    
    // ?½ì? ?Šì? ëª¨ë“  ?Œë¦¼ ì°¾ê¸°
    const itemsRef = collection(db, "notifications", userId, "items");
    const unreadQuery = query(itemsRef, where("read", "==", false));
    const unreadSnap = await getDocs(unreadQuery);

    // ëª¨ë“  ?½ì? ?Šì? ?Œë¦¼???½ìŒ?¼ë¡œ ?œì‹œ
    const batch = [];
    for (const docSnap of unreadSnap.docs) {
      batch.push(updateDoc(docSnap.ref, { read: true }));
    }

    await Promise.all(batch);

    // ë©”í??°ì´???…ë°?´íŠ¸
    const metadataRef = doc(db, "notifications", userId);
    await updateDoc(metadataRef, {
      "metadata.unreadCount": 0,
      "metadata.lastUpdate": new Date()
    });

    console.log("??ëª¨ë“  ?Œë¦¼ ?½ìŒ ì²˜ë¦¬ ?„ë£Œ");
  } catch (error) {
    console.error("??ëª¨ë“  ?Œë¦¼ ?½ìŒ ì²˜ë¦¬ ?¤íŒ¨:", error);
  }
}

// ???ŒìŠ¤?¸ìš© ?Œë¦¼ ?ì„± ?¨ìˆ˜??export const createTestNotifications = {
  // ??ë©”ì‹œì§€ ?Œë¦¼
  newMessage: (userId: string, senderName: string) => 
    createTestNotification(
      userId, 
      "?’¬ ??ë©”ì‹œì§€ ?„ì°©", 
      `${senderName}?˜ì´ ë©”ì‹œì§€ë¥?ë³´ëƒˆ?µë‹ˆ??,
      'message',
      { senderName }
    ),

  // ???“ê? ?Œë¦¼
  newComment: (userId: string, postTitle: string) => 
    createTestNotification(
      userId, 
      "?’­ ???“ê? ?±ë¡", 
      `${postTitle}?????“ê????¬ë ¸?µë‹ˆ??,
      'comment',
      { postTitle }
    ),

  // ?í’ˆ ê´€???Œë¦¼
  marketUpdate: (userId: string, itemTitle: string, action: string) => 
    createTestNotification(
      userId, 
      "?›’ ?í’ˆ ?…ë°?´íŠ¸", 
      `${itemTitle} ?í’ˆ??${action}?˜ì—ˆ?µë‹ˆ??,
      'market',
      { itemTitle, action }
    ),

  // ?œìŠ¤???Œë¦¼
  systemMessage: (userId: string, message: string) => 
    createTestNotification(
      userId, 
      "?”” ?œìŠ¤???Œë¦¼", 
      message,
      'system'
    ),

  // FCM ?¸ì‹œ ?Œë¦¼ (?œë??ˆì´??
  fcmPush: (userId: string, title: string, body: string) => 
    createTestNotification(
      userId, 
      title, 
      body,
      'fcm',
      { channel: 'FCM' }
    ),

  // Slack ?Œë¦¼ (?œë??ˆì´??
  slackNotification: (userId: string, channel: string, message: string) => 
    createTestNotification(
      userId, 
      "?“¢ Slack ?Œë¦¼", 
      `#${channel}: ${message}`,
      'slack',
      { channel, message }
    ),

  // Kakao ?Œë¦¼ (?œë??ˆì´??
  kakaoNotification: (userId: string, template: string, content: string) => 
    createTestNotification(
      userId, 
      "?’Œ Kakao ?Œë¦¼", 
      `${template}: ${content}`,
      'kakao',
      { template, content }
    ),

  // ?€???ŒìŠ¤???°ì´???ì„±
  createBulkTestData: async (userId: string, count: number = 10) => {
    const types = ['message', 'comment', 'market', 'system', 'fcm', 'slack', 'kakao'];
    const senders = ['ê¹€ì² ìˆ˜', '?´ì˜??, 'ë°•ë???, 'ìµœì???, '?•ìš°ì§?];
    const posts = ['ì¶•êµ¬ ëª¨ì„ ê²Œì‹œ??, '?êµ¬ ?™í˜¸??, 'ë°°ë“œë¯¼í„´ ?´ëŸ½', '?Œë‹ˆ??ëª¨ì„'];
    const items = ['?˜ì´??ì¶•êµ¬??, '?„ë””?¤ìŠ¤ ?êµ¬??, '?”ë„¥??ë°°ë“œë¯¼í„´ ?¼ì¼“', '?ŒìŠ¨ ?Œë‹ˆ???¼ì¼“'];

    console.log(`?“ ?€???ŒìŠ¤???°ì´???ì„± ì¤?.. (${count}ê°?`);

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      
      switch (type) {
        case 'message':
          await createTestNotification(
            userId, 
            "?’¬ ??ë©”ì‹œì§€", 
            `${senders[Math.floor(Math.random() * senders.length)]}?˜ì´ ë©”ì‹œì§€ë¥?ë³´ëƒˆ?µë‹ˆ??,
            'message',
            { sender: senders[Math.floor(Math.random() * senders.length)] }
          );
          break;
        case 'comment':
          await createTestNotification(
            userId, 
            "?’­ ???“ê?", 
            `${posts[Math.floor(Math.random() * posts.length)]}?????“ê????¬ë ¸?µë‹ˆ??,
            'comment',
            { post: posts[Math.floor(Math.random() * posts.length)] }
          );
          break;
        case 'market':
          await createTestNotification(
            userId, 
            "?›’ ?í’ˆ ?…ë°?´íŠ¸", 
            `${items[Math.floor(Math.random() * items.length)]} ?í’ˆ???ë§¤?„ë£Œ?˜ì—ˆ?µë‹ˆ??,
            'market',
            { item: items[Math.floor(Math.random() * items.length)] }
          );
          break;
        case 'fcm':
          await createTestNotification(
            userId, 
            "?“± FCM ?¸ì‹œ", 
            "?ˆë¡œ???Œë¦¼???„ì°©?ˆìŠµ?ˆë‹¤",
            'fcm',
            { channel: 'FCM' }
          );
          break;
        case 'slack':
          await createTestNotification(
            userId, 
            "?“¢ Slack ?Œë¦¼", 
            "#general: ?ˆë¡œ??ê³µì??¬í•­???ˆìŠµ?ˆë‹¤",
            'slack',
            { channel: 'general' }
          );
          break;
        case 'kakao':
          await createTestNotification(
            userId, 
            "?’Œ Kakao ?Œë¦¼", 
            "ì¹œêµ¬ ?”ì²­???„ì°©?ˆìŠµ?ˆë‹¤",
            'kakao',
            { template: 'friend_request' }
          );
          break;
        default:
          await createTestNotification(
            userId, 
            "?”” ?œìŠ¤???Œë¦¼", 
            "?œìŠ¤???ê????„ë£Œ?˜ì—ˆ?µë‹ˆ??,
            'system'
          );
      }

      // ?Œë¦¼ ê°?ê°„ê²© (?¤ì œ ?˜ê²½ ?œë??ˆì´??
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`???€???ŒìŠ¤???°ì´???ì„± ?„ë£Œ (${count}ê°?`);
  }
};

// ??ê°œë°œ???„êµ¬???¨ìˆ˜ (ê°œë°œ ëª¨ë“œ?ì„œë§?
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).createTestNotification = createTestNotification;
  (window as any).createTestNotifications = createTestNotifications;
  (window as any).markNotificationAsRead = markNotificationAsRead;
  (window as any).markAllNotificationsAsRead = markAllNotificationsAsRead;
}
