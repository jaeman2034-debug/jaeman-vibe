// ?”¥ YAGO VIBE ê´€ë¦¬ì PWA ?œë¹„???Œì»¤
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

// ?œë¹„???Œì»¤ ?¤ì¹˜
self.addEventListener("install", (event: any) => {
  console.log("?“± YAGO VIBE ê´€ë¦¬ì PWA ?œë¹„???Œì»¤ ?¤ì¹˜ ì¤?..");
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("??ìºì‹œ ?´ê¸° ?±ê³µ");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("??ëª¨ë“  ë¦¬ì†Œ??ìºì‹œ ?„ë£Œ");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("???œë¹„???Œì»¤ ?¤ì¹˜ ?¤íŒ¨:", error);
      })
  );
});

// ?œë¹„???Œì»¤ ?œì„±??self.addEventListener("activate", (event: any) => {
  console.log("?“± YAGO VIBE ê´€ë¦¬ì PWA ?œë¹„???Œì»¤ ?œì„±??ì¤?..");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("?—‘ï¸??´ì „ ìºì‹œ ?? œ:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("???œë¹„???Œì»¤ ?œì„±???„ë£Œ");
      return self.clients.claim();
    })
  );
});

// ?¤íŠ¸?Œí¬ ?”ì²­ ê°€ë¡œì±„ê¸?(?¤í”„?¼ì¸ ì§€??
self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // ìºì‹œ???ˆìœ¼ë©?ìºì‹œ?ì„œ ë°˜í™˜
        if (response) {
          console.log("?“¦ ìºì‹œ?ì„œ ë°˜í™˜:", event.request.url);
          return response;
        }
        
        // ìºì‹œ???†ìœ¼ë©??¤íŠ¸?Œí¬?ì„œ ê°€?¸ì˜¤ê¸?        return fetch(event.request)
          .then((response) => {
            // ? íš¨???‘ë‹µ?¸ì? ?•ì¸
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // ?‘ë‹µ??ë³µì œ?˜ì—¬ ìºì‹œ???€??            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // ?¤íŠ¸?Œí¬ ?¤íŒ¨ ???¤í”„?¼ì¸ ?˜ì´ì§€ ë°˜í™˜ (ê´€ë¦¬ì ?±ìš©)
            if (event.request.destination === 'document') {
              return caches.match('/admin/home');
            }
          });
      })
  );
});

// ë°±ê·¸?¼ìš´???™ê¸°??(? íƒ?¬í•­)
self.addEventListener("sync", (event: any) => {
  console.log("?”„ ë°±ê·¸?¼ìš´???™ê¸°??", event.tag);
  
  if (event.tag === "background-sync") {
    event.waitUntil(
      // ë°±ê·¸?¼ìš´?œì—???°ì´???™ê¸°??ë¡œì§
      syncAdminData()
    );
  }
});

// ê´€ë¦¬ì ?°ì´???™ê¸°???¨ìˆ˜
async function syncAdminData() {
  try {
    console.log("?“Š ê´€ë¦¬ì ?°ì´??ë°±ê·¸?¼ìš´???™ê¸°???œì‘");
    // ?¬ê¸°??Firebase ?°ì´???™ê¸°??ë¡œì§ ì¶”ê?
    // ?? ìµœì‹  ?µê³„ ?°ì´??ë¯¸ë¦¬ ë¡œë“œ
  } catch (error) {
    console.error("??ë°±ê·¸?¼ìš´???™ê¸°???¤íŒ¨:", error);
  }
}

// ?¸ì‹œ ?Œë¦¼ ì²˜ë¦¬ (FCMê³??°ë™)
self.addEventListener("push", (event: any) => {
  console.log("?”” ?¸ì‹œ ?Œë¦¼ ?˜ì‹ :", event);
  
  const options = {
    body: event.data ? event.data.text() : "YAGO VIBE ê´€ë¦¬ì ?Œë¦¼",
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
        title: "?€?œë³´???´ê¸°",
        icon: "/icons/chat-96.png"
      },
      {
        action: "close",
        title: "?«ê¸°",
        icon: "/icons/close.png"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification("YAGO VIBE ê´€ë¦¬ì", options)
  );
});

// ?Œë¦¼ ?´ë¦­ ì²˜ë¦¬
self.addEventListener("notificationclick", (event: any) => {
  console.log("?”” ?Œë¦¼ ?´ë¦­:", event.notification.tag);
  
  event.notification.close();

  if (event.action === "explore") {
    // ?€?œë³´?œë¡œ ?´ë™
    event.waitUntil(
      clients.openWindow("/admin/home")
    );
  } else if (event.action === "close") {
    // ?Œë¦¼ë§??«ê¸°
  } else {
    // ê¸°ë³¸ ?™ì‘: ê´€ë¦¬ì ?ˆìœ¼ë¡??´ë™
    event.waitUntil(
      clients.openWindow("/admin/home")
    );
  }
});

export default {};
