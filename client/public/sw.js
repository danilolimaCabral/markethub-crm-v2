// Service Worker para forçar limpeza de cache
const CACHE_VERSION = 'v10-force-clear-' + Date.now();

self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  // Força ativação imediata
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    // Limpa TODOS os caches antigos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Força controle imediato de todas as páginas
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Não faz cache de nada - sempre busca do servidor
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store'
    }).catch(() => {
      // Se falhar, tenta do cache como fallback
      return caches.match(event.request);
    })
  );
});

console.log('[SW] Service Worker loaded - Version:', CACHE_VERSION);
