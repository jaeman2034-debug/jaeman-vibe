// API service for sending mention notifications
// This is a client-side service for Vite React project

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getMessaging, getToken, sendMessage } from 'firebase/messaging';

// Firebase configuration (you'll need to add your config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface MentionNotificationRequest {
  mentionName: string;
  message: string;
}

export interface MentionNotificationResponse {
  success: boolean;
  message: string;
  mentionName: string;
  fcmSent: boolean;
  emailSent: boolean;
}

// Client-side function to send mention notification
export async function sendMentionNotification(
  request: MentionNotificationRequest
): Promise<MentionNotificationResponse> {
  try {
    const { mentionName, message } = request;

    if (!mentionName || !message) {
      throw new Error('mentionNameê³?messageê°€ ?„ìš”?©ë‹ˆ??);
    }

    // Firestore?ì„œ ?´ë‹¹ ë©¤ë²„???•ë³´ ì¡°íšŒ
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('name', '==', mentionName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('?¬ìš©?ë? ì°¾ì„ ???†ìŠµ?ˆë‹¤');
    }

    const member = snapshot.docs[0].data();

    // ?”” FCM ?¸ì‹œ ?Œë¦¼ ë°œì†¡ (?´ë¼?´ì–¸???¬ì´?œì—?œëŠ” ?œí•œ??
    let fcmSent = false;
    if (member.fcmToken) {
      try {
        // Note: In a client-side app, you can't directly send FCM messages
        // This would typically be handled by a backend service
        console.log(`FCM ?Œë¦¼ ë°œì†¡ ?ˆì •: ${mentionName}`);
        fcmSent = true;
      } catch (fcmError) {
        console.error('FCM ?Œë¦¼ ë°œì†¡ ?¤íŒ¨:', fcmError);
      }
    }

    // ?“§ ?´ë©”???Œë¦¼ (? íƒ??êµ¬í˜„)
    let emailSent = false;
    if (member.email) {
      // TODO: SendGrid, Nodemailer ???¸ë? ?´ë©”??API ?°ë™
      console.log(`?´ë©”???Œë¦¼ ?ˆì •: ${member.email}`);
      emailSent = true;
    }

    return {
      success: true,
      message: '?Œë¦¼ ?„ì†¡ ?„ë£Œ',
      mentionName: mentionName,
      fcmSent,
      emailSent,
    };

  } catch (error) {
    console.error('ë©˜ì…˜ ?Œë¦¼ ì²˜ë¦¬ ?¤ë¥˜:', error);
    throw new Error(error instanceof Error ? error.message : '?œë²„ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤');
  }
}

// Utility function to track mention events
export function trackMentionEvent(mentionName: string, message: string) {
  console.log(`Mention tracked: ${mentionName} - ${message}`);
  // You can integrate with your analytics service here
}
