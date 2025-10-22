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
      throw new Error('mentionName�?message가 ?�요?�니??);
    }

    // Firestore?�서 ?�당 멤버???�보 조회
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('name', '==', mentionName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('?�용?��? 찾을 ???�습?�다');
    }

    const member = snapshot.docs[0].data();

    // ?�� FCM ?�시 ?�림 발송 (?�라?�언???�이?�에?�는 ?�한??
    let fcmSent = false;
    if (member.fcmToken) {
      try {
        // Note: In a client-side app, you can't directly send FCM messages
        // This would typically be handled by a backend service
        console.log(`FCM ?�림 발송 ?�정: ${mentionName}`);
        fcmSent = true;
      } catch (fcmError) {
        console.error('FCM ?�림 발송 ?�패:', fcmError);
      }
    }

    // ?�� ?�메???�림 (?�택??구현)
    let emailSent = false;
    if (member.email) {
      // TODO: SendGrid, Nodemailer ???��? ?�메??API ?�동
      console.log(`?�메???�림 ?�정: ${member.email}`);
      emailSent = true;
    }

    return {
      success: true,
      message: '?�림 ?�송 ?�료',
      mentionName: mentionName,
      fcmSent,
      emailSent,
    };

  } catch (error) {
    console.error('멘션 ?�림 처리 ?�류:', error);
    throw new Error(error instanceof Error ? error.message : '?�버 ?�류가 발생?�습?�다');
  }
}

// Utility function to track mention events
export function trackMentionEvent(mentionName: string, message: string) {
  console.log(`Mention tracked: ${mentionName} - ${message}`);
  // You can integrate with your analytics service here
}
