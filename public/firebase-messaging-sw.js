/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js');

// Firebase 설정 (빌드 시 주입되거나 하드코딩)
const firebaseConfig = {
  apiKey: self._FB_API_KEY || "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: self._FB_AUTH_DOMAIN || "jaeman-vibe.firebaseapp.com",
  projectId: self._FB_PROJECT_ID || "jaeman-vibe",
  messagingSenderId: self._FB_MSG_SENDER_ID || "123456789012",
  appId: self._FB_APP_ID || "1:123456789012:web:abcdefghijklmnop"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload);
  
  const notification = payload.notification || {};
  const data = payload.data || {};
  
  const notificationOptions = {
    body: notification.body || '',
    icon: notification.icon || '/icon.png',
    badge: '/badge.png',
    data: data,
    requireInteraction: true, // 사용자가 클릭할 때까지 유지
    actions: [
      {
        action: 'open',
        title: '열기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };

  // 알림 표시
  self.registration.showNotification(
    notification.title || '알림',
    notificationOptions
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // 앱 열기 또는 특정 페이지로 이동
  const data = event.notification.data || {};
  const eventId = data.eventId;
  
  if (eventId) {
    event.waitUntil(
      clients.openWindow(`/events/${eventId}`)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치됨');
  self.skipWaiting();
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화됨');
  event.waitUntil(self.clients.claim());
});