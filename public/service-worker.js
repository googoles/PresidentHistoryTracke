// Korea Promise Tracker Service Worker
const CACHE_NAME = 'korea-promise-tracker-v1';
const DYNAMIC_CACHE = 'korea-promise-tracker-dynamic-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/korea-map.svg',
  '/static/css/main.css',
  '/static/js/bundle.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('/static/')));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) return;

  // Handle API requests differently
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // For HTML requests, try network first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // For other assets, use cache first
  event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    
    // If it's a navigation request, show offline page
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match(OFFLINE_URL);
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // If it's a navigation request, show offline page
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match(OFFLINE_URL);
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-ratings') {
    event.waitUntil(syncRatings());
  } else if (event.tag === 'sync-comments') {
    event.waitUntil(syncComments());
  } else if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

// Sync offline ratings
async function syncRatings() {
  try {
    // Get pending ratings from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending_ratings', 'readonly');
    const store = tx.objectStore('pending_ratings');
    const ratings = await store.getAll();
    
    // Send each rating to the server
    for (const rating of ratings) {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rating)
      });
      
      // Remove from pending after successful sync
      const deleteTx = db.transaction('pending_ratings', 'readwrite');
      await deleteTx.objectStore('pending_ratings').delete(rating.id);
    }
  } catch (error) {
    console.error('[Service Worker] Sync ratings failed:', error);
  }
}

// Sync offline comments
async function syncComments() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending_comments', 'readonly');
    const store = tx.objectStore('pending_comments');
    const comments = await store.getAll();
    
    for (const comment of comments) {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment)
      });
      
      const deleteTx = db.transaction('pending_comments', 'readwrite');
      await deleteTx.objectStore('pending_comments').delete(comment.id);
    }
  } catch (error) {
    console.error('[Service Worker] Sync comments failed:', error);
  }
}

// Sync offline reports
async function syncReports() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending_reports', 'readonly');
    const store = tx.objectStore('pending_reports');
    const reports = await store.getAll();
    
    for (const report of reports) {
      const formData = new FormData();
      Object.keys(report).forEach(key => {
        formData.append(key, report[key]);
      });
      
      await fetch('/api/reports', {
        method: 'POST',
        body: formData
      });
      
      const deleteTx = db.transaction('pending_reports', 'readwrite');
      await deleteTx.objectStore('pending_reports').delete(report.id);
    }
  } catch (error) {
    console.error('[Service Worker] Sync reports failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received:', event);
  
  let notification = {
    title: '공약 추적 시스템 알림',
    body: '새로운 업데이트가 있습니다.',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  if (event.data) {
    try {
      notification = event.data.json();
    } catch (e) {
      notification.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notification.title, notification)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Update check
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        const latestVersion = cacheNames.find(name => name.startsWith('korea-promise-tracker-v'));
        event.ports[0].postMessage({ version: latestVersion });
      })
    );
  }
});

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KoreaPromiseTracker', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending_ratings')) {
        db.createObjectStore('pending_ratings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_comments')) {
        db.createObjectStore('pending_comments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_reports')) {
        db.createObjectStore('pending_reports', { keyPath: 'id' });
      }
    };
  });
}