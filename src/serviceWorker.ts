// ?�� YAGO VIBE 관리자 PWA ?�비???�커
const CACHE_NAME = "yagovibe-admin-v1";
const urlsToCache = [
  "/",
  "/admin/home",
  "/admin/chat-dashboard", 
  "/admin/chat-stats",
  "/admin/slack-test",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json"
];

// ?�비???�커 ?�치
self.addEventListener("install", (event: any) => {
  console.log("?�� YAGO VIBE 관리자 PWA ?�비???�커 ?�치 �?..");
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("??캐시 ?�기 ?�공");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("??모든 리소??캐시 ?�료");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("???�비???�커 ?�치 ?�패:", error);
      })
  );
});

// ?�비???�커 ?�성??self.addEventListener("activate", (event: any) => {
  console.log("?�� YAGO VIBE 관리자 PWA ?�비???�커 ?�성??�?..");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("?���??�전 캐시 ??��:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("???�비???�커 ?�성???�료");
      return self.clients.claim();
    })
  );
});

// ?�트?�크 ?�청 가로채�?(?�프?�인 지??
self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시???�으�?캐시?�서 반환
        if (response) {
          console.log("?�� 캐시?�서 반환:", event.request.url);
          return response;
        }
        
        // 캐시???�으�??�트?�크?�서 가?�오�?        return fetch(event.request)
          .then((response) => {
            // ?�효???�답?��? ?�인
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // ?�답??복제?�여 캐시???�??            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // ?�트?�크 ?�패 ???�프?�인 ?�이지 반환 (관리자 ?�용)
            if (event.request.destination === 'document') {
              return caches.match('/admin/home');
            }
          });
      })
  );
});

// 백그?�운???�기??(?�택?�항)
self.addEventListener("sync", (event: any) => {
  console.log("?�� 백그?�운???�기??", event.tag);
  
  if (event.tag === "background-sync") {
    event.waitUntil(
      // 백그?�운?�에???�이???�기??로직
      syncAdminData()
    );
  }
});

// 관리자 ?�이???�기???�수
async function syncAdminData() {
  try {
    console.log("?�� 관리자 ?�이??백그?�운???�기???�작");
    // ?�기??Firebase ?�이???�기??로직 추�?
    // ?? 최신 ?�계 ?�이??미리 로드
  } catch (error) {
    console.error("??백그?�운???�기???�패:", error);
  }
}

// ?�시 ?�림 처리 (FCM�??�동)
self.addEventListener("push", (event: any) => {
  console.log("?�� ?�시 ?�림 ?�신:", event);
  
  const options = {
    body: event.data ? event.data.text() : "YAGO VIBE 관리자 ?�림",
    icon: "/icons/pwa-192.png",
    badge: "/icons/pwa-192.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: "explore",
        title: "?�?�보???�기",
        icon: "/icons/chat-96.png"
      },
      {
        action: "close",
        title: "?�기",
        icon: "/icons/close.png"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification("YAGO VIBE 관리자", options)
  );
});

// ?�림 ?�릭 처리
self.addEventListener("notificationclick", (event: any) => {
  console.log("?�� ?�림 ?�릭:", event.notification.tag);
  
  event.notification.close();

  if (event.action === "explore") {
    // ?�?�보?�로 ?�동
    event.waitUntil(
      clients.openWindow("/admin/home")
    );
  } else if (event.action === "close") {
    // ?�림�??�기
  } else {
    // 기본 ?�작: 관리자 ?�으�??�동
    event.waitUntil(
      clients.openWindow("/admin/home")
    );
  }
});

export default {};
