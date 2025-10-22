import { db } from "./firebase";
import { doc, setDoc, collection, addDoc, updateDoc, increment } from "firebase/firestore";

// ???�림 구조 ?�터?�이??export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'message' | 'comment' | 'system' | 'market';
  read: boolean;
  createdAt: Date;
  data?: any; // 추�? ?�이??(?? ?�품 ID, 채팅�?ID ??
}

export interface NotificationMetadata {
  count: number;
  lastUpdate: Date;
  unreadCount: number;
}

// ?????�림 ?�성 (?�스?�용)
export async function createTestNotification(
  userId: string, 
  title: string, 
  body: string, 
  type: NotificationItem['type'] = 'system',
  data?: any
) {
  try {
    console.log("?�� ?�스???�림 ?�성 �?..", { userId, title, type });

    // 1. ?�림 ?�이?�을 items ?�브컬렉?�에 추�?
    const itemsRef = collection(db, "notifications", userId, "items");
    const newNotifRef = await addDoc(itemsRef, {
      title,
      body,
      type,
      read: false,
      createdAt: new Date(),
      data: data || {}
    });

    console.log("???�림 ?�이???�성??", newNotifRef.id);

    // 2. 메�??�이???�데?�트 (카운??증�?)
    const metadataRef = doc(db, "notifications", userId);
    await updateDoc(metadataRef, {
      "metadata.count": increment(1),
      "metadata.unreadCount": increment(1),
      "metadata.lastUpdate": new Date()
    }).catch(async () => {
      // 메�??�이??문서가 ?�으�??�로 ?�성
      await setDoc(metadataRef, {
        metadata: {
          count: 1,
          unreadCount: 1,
          lastUpdate: new Date()
        }
      });
    });

    console.log("???�림 메�??�이???�데?�트 ?�료");
    return newNotifRef.id;

  } catch (error) {
    console.error("???�림 ?�성 ?�패:", error);
    throw error;
  }
}

// ???�림???�음?�로 ?�시
export async function markNotificationAsRead(userId: string, notificationId: string) {
  try {
    const notifRef = doc(db, "notifications", userId, "items", notificationId);
    await updateDoc(notifRef, { read: true });

    // 메�??�이?�의 unreadCount 감소
    const metadataRef = doc(db, "notifications", userId);
    await updateDoc(metadataRef, {
      "metadata.unreadCount": increment(-1),
      "metadata.lastUpdate": new Date()
    });

    console.log("???�림 ?�음 처리 ?�료:", notificationId);
  } catch (error) {
    console.error("???�림 ?�음 처리 ?�패:", error);
  }
}

// ??모든 ?�림???�음?�로 ?�시
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { getDocs, query, where, updateDoc, increment } = await import("firebase/firestore");
    
    // ?��? ?��? 모든 ?�림 찾기
    const itemsRef = collection(db, "notifications", userId, "items");
    const unreadQuery = query(itemsRef, where("read", "==", false));
    const unreadSnap = await getDocs(unreadQuery);

    // 모든 ?��? ?��? ?�림???�음?�로 ?�시
    const batch = [];
    for (const docSnap of unreadSnap.docs) {
      batch.push(updateDoc(docSnap.ref, { read: true }));
    }

    await Promise.all(batch);

    // 메�??�이???�데?�트
    const metadataRef = doc(db, "notifications", userId);
    await updateDoc(metadataRef, {
      "metadata.unreadCount": 0,
      "metadata.lastUpdate": new Date()
    });

    console.log("??모든 ?�림 ?�음 처리 ?�료");
  } catch (error) {
    console.error("??모든 ?�림 ?�음 처리 ?�패:", error);
  }
}

// ???�스?�용 ?�림 ?�성 ?�수??export const createTestNotifications = {
  // ??메시지 ?�림
  newMessage: (userId: string, senderName: string) => 
    createTestNotification(
      userId, 
      "?�� ??메시지 ?�착", 
      `${senderName}?�이 메시지�?보냈?�니??,
      'message',
      { senderName }
    ),

  // ???��? ?�림
  newComment: (userId: string, postTitle: string) => 
    createTestNotification(
      userId, 
      "?�� ???��? ?�록", 
      `${postTitle}?????��????�렸?�니??,
      'comment',
      { postTitle }
    ),

  // ?�품 관???�림
  marketUpdate: (userId: string, itemTitle: string, action: string) => 
    createTestNotification(
      userId, 
      "?�� ?�품 ?�데?�트", 
      `${itemTitle} ?�품??${action}?�었?�니??,
      'market',
      { itemTitle, action }
    ),

  // ?�스???�림
  systemMessage: (userId: string, message: string) => 
    createTestNotification(
      userId, 
      "?�� ?�스???�림", 
      message,
      'system'
    ),

  // FCM ?�시 ?�림 (?��??�이??
  fcmPush: (userId: string, title: string, body: string) => 
    createTestNotification(
      userId, 
      title, 
      body,
      'fcm',
      { channel: 'FCM' }
    ),

  // Slack ?�림 (?��??�이??
  slackNotification: (userId: string, channel: string, message: string) => 
    createTestNotification(
      userId, 
      "?�� Slack ?�림", 
      `#${channel}: ${message}`,
      'slack',
      { channel, message }
    ),

  // Kakao ?�림 (?��??�이??
  kakaoNotification: (userId: string, template: string, content: string) => 
    createTestNotification(
      userId, 
      "?�� Kakao ?�림", 
      `${template}: ${content}`,
      'kakao',
      { template, content }
    ),

  // ?�???�스???�이???�성
  createBulkTestData: async (userId: string, count: number = 10) => {
    const types = ['message', 'comment', 'market', 'system', 'fcm', 'slack', 'kakao'];
    const senders = ['김철수', '?�영??, '박�???, '최�???, '?�우�?];
    const posts = ['축구 모임 게시??, '?�구 ?�호??, '배드민턴 ?�럽', '?�니??모임'];
    const items = ['?�이??축구??, '?�디?�스 ?�구??, '?�넥??배드민턴 ?�켓', '?�슨 ?�니???�켓'];

    console.log(`?�� ?�???�스???�이???�성 �?.. (${count}�?`);

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      
      switch (type) {
        case 'message':
          await createTestNotification(
            userId, 
            "?�� ??메시지", 
            `${senders[Math.floor(Math.random() * senders.length)]}?�이 메시지�?보냈?�니??,
            'message',
            { sender: senders[Math.floor(Math.random() * senders.length)] }
          );
          break;
        case 'comment':
          await createTestNotification(
            userId, 
            "?�� ???��?", 
            `${posts[Math.floor(Math.random() * posts.length)]}?????��????�렸?�니??,
            'comment',
            { post: posts[Math.floor(Math.random() * posts.length)] }
          );
          break;
        case 'market':
          await createTestNotification(
            userId, 
            "?�� ?�품 ?�데?�트", 
            `${items[Math.floor(Math.random() * items.length)]} ?�품???�매?�료?�었?�니??,
            'market',
            { item: items[Math.floor(Math.random() * items.length)] }
          );
          break;
        case 'fcm':
          await createTestNotification(
            userId, 
            "?�� FCM ?�시", 
            "?�로???�림???�착?�습?�다",
            'fcm',
            { channel: 'FCM' }
          );
          break;
        case 'slack':
          await createTestNotification(
            userId, 
            "?�� Slack ?�림", 
            "#general: ?�로??공�??�항???�습?�다",
            'slack',
            { channel: 'general' }
          );
          break;
        case 'kakao':
          await createTestNotification(
            userId, 
            "?�� Kakao ?�림", 
            "친구 ?�청???�착?�습?�다",
            'kakao',
            { template: 'friend_request' }
          );
          break;
        default:
          await createTestNotification(
            userId, 
            "?�� ?�스???�림", 
            "?�스???��????�료?�었?�니??,
            'system'
          );
      }

      // ?�림 �?간격 (?�제 ?�경 ?��??�이??
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`???�???�스???�이???�성 ?�료 (${count}�?`);
  }
};

// ??개발???�구???�수 (개발 모드?�서�?
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).createTestNotification = createTestNotification;
  (window as any).createTestNotifications = createTestNotifications;
  (window as any).markNotificationAsRead = markNotificationAsRead;
  (window as any).markAllNotificationsAsRead = markAllNotificationsAsRead;
}
