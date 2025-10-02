// ============= SERVICE WORKER V2.0 - OFFLINE SUPPORT =============

const CACHE_NAME = 'iccifree-v2.3';
const OFFLINE_URL = '/offline.html';

// Files da cachare
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/mobile-app.html',
    '/mobile-tiktok.html',
    '/dashboard.html',
    '/auth.html',
    '/golive.html',
    '/css/style.css',
    '/css/mobile-optimizations.css',
    '/css/mobile-app.css',
    '/css/tiktok-mobile.css',
    '/css/gift-system.css',
    '/css/gift-animations.css',
    '/js/app.js',
    '/js/mobile-detector.js',
    '/js/mobile-app.js',
    '/js/tiktok-mobile.js',
    '/js/tiktok-modals.js',
    '/js/supabase.js',
    '/js/supabase-mobile.js',
    '/js/analytics.js',
    '/js/error-handler.js',
    '/js/performance-optimizer.js',
    '/js/webrtc-streaming.js',
    '/js/gift-system.js',
    '/js/gift-system-mobile.js',
    '/js/testing-utils.js',
    '/manifest.json',
    OFFLINE_URL
];

// ============= INSTALL =============
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ============= ACTIVATE =============
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activated');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('🗑️ Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ============= FETCH =============
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip chrome extensions
    if (url.protocol === 'chrome-extension:') return;
    
    // Skip Supabase API calls (always need fresh data)
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ error: 'Offline - Supabase not available' }),
                    { 
                        headers: { 'Content-Type': 'application/json' },
                        status: 503 
                    }
                );
            })
        );
        return;
    }
    
    // Network-first for HTML pages
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful HTML responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache
                    return caches.match(request)
                        .then(cached => cached || caches.match(OFFLINE_URL));
                })
        );
        return;
    }
    
    // Cache-first for assets (CSS, JS, images) con fallback sicuro
    event.respondWith(
        caches.match(request)
            .then(cached => {
                const networkFetch = fetch(request)
                    .then(response => {
                        if (response && response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                        }
                        return response;
                    })
                    .catch(() => cached || Response.error());
                return cached || networkFetch;
            })
            .catch(() => fetch(request).catch(() => new Response('', { status: 204 })))
    );
});

// ============= PUSH NOTIFICATIONS =============
self.addEventListener('push', (event) => {
    let data = { title: 'ICCI FREE', body: 'Notifica' };
    
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect width="72" height="72" rx="8" fill="%23FFD700"/><text x="36" y="48" font-size="36" text-anchor="middle">🔥</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect width="72" height="72" rx="8" fill="%23FFD700"/><text x="36" y="48" font-size="36" text-anchor="middle">🔥</text></svg>',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' },
        actions: [
            { action: 'open', title: 'Apri' },
            { action: 'close', title: 'Chiudi' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============= NOTIFICATION CLICK =============
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        const url = event.notification.data.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clientList => {
                    // Check if window already open
                    for (let client of clientList) {
                        if (client.url === url && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Open new window
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
                })
        );
    }
});

// ============= BACKGROUND SYNC =============
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncAnalytics() {
    // Sync analytics data quando torna online
    try {
        const cache = await caches.open('analytics-cache');
        const requests = await cache.keys();
        
        for (const request of requests) {
            try {
                await fetch(request.clone());
                await cache.delete(request);
            } catch (e) {
                console.error('Sync failed:', e);
            }
        }
    } catch (e) {
        console.error('Analytics sync error:', e);
    }
}

// ============= MESSAGE HANDLER =============
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'clearCache') {
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

console.log('✅ Service Worker V2.0 loaded');
