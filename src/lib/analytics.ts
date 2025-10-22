// src/lib/analytics.ts
import { getAuth } from 'firebase/auth';

const SESSION_EVENT_URL = import.meta.env.VITE_FN_SESSION_EVENT || 'https://us-central1-jaeman-vibe-platform.cloudfunctions.net/ingestSessionEvent';

export async function sendSessionStarted(country: string) {
  await sendEvent('session_started', { country });
}

export async function sendEvent(type: string, meta: Record<string, any> = {}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const idToken = user ? await user.getIdToken() : undefined;

    await fetch(SESSION_EVENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ 
        type, 
        ts: Date.now(), 
        meta: {
          ...meta,
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      }),
      keepalive: true,
    });
  } catch (error) {
    console.warn('Failed to send analytics event:', error);
  }
}

// 이벤트 타입별 헬퍼 함수들
export const analytics = {
  pageView: (page: string) => sendEvent('page_view', { page }),
  click: (element: string, context?: string) => sendEvent('click', { element, context }),
  search: (query: string, results?: number) => sendEvent('search', { query, results }),
  purchase: (amount: number, currency: string = 'KRW') => sendEvent('purchase', { amount, currency }),
  voiceIntent: (intent: string, success: boolean) => sendEvent('voice_intent', { intent, success }),
  meetupCreate: (meetupId: string) => sendEvent('meetup_create', { meetupId }),
  jobApply: (jobId: string) => sendEvent('job_apply', { jobId }),
  marketView: (itemId: string) => sendEvent('market_view', { itemId }),
  reportCreate: (refType: string, refId: string) => sendEvent('report_create', { refType, refId }),
};
