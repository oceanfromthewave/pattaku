// Service Worker for PWA
const CACHE_NAME = 'pattaku-chat-v1.0.0';
const STATIC_CACHE = 'pattaku-static-v1.0.0';
const DYNAMIC_CACHE = 'pattaku-dynamic-v1.0.0';

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 설치 중...');
  
  event.waitUntil(
    Promise.all([
      // 정적 리소스 캐시
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 정적 리소스 캐싱...');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      
      // 즉시 활성화
      self.skipWaiting()
    ])
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화');
  
  event.waitUntil(
    Promise.all([
      // 오래된 캐시 정리
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ 오래된 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // 클라이언트 즉시 제어
      self.clients.claim()
    ])
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청 처리
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 정적 리소스 처리
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // 기본 네트워크 우선 전략
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// API 요청 처리 (네트워크 우선, 오프라인 시 캐시)
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // 성공적인 응답만 캐시
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('📡 네트워크 오류, 캐시에서 응답:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 오프라인 API 응답
    return new Response(
      JSON.stringify({
        success: false,
        message: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 정적 리소스 처리 (캐시 우선, 네트워크 백업)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // 백그라운드에서 업데이트 확인
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
      // 네트워크 오류 무시
    });
    
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // 오프라인 페이지 반환
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// 푸시 알림 처리
self.addEventListener('push', (event) => {
  console.log('🔔 푸시 알림 수신:', event);
  
  const options = {
    body: '새로운 메시지가 도착했습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/chat',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: '확인하기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      
      options.title = data.title || '새 메시지';
      options.body = data.body || options.body;
      options.icon = data.icon || options.icon;
      
      if (data.roomId) {
        options.data.url = `/chat/${data.roomId}`;
      }
      
      if (data.userId) {
        options.data.userId = data.userId;
      }
    } catch (error) {
      console.error('푸시 데이터 파싱 오류:', error);
      options.title = '새 메시지';
    }
  } else {
    options.title = '새 메시지';
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 알림 클릭:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // 이미 열린 창이 있는지 확인
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: data
          });
          return client.focus();
        }
      }

      // 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(data.url || '/chat');
      }
    })
  );
});

console.log('🚀 Service Worker 로드 완료');
