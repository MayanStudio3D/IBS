// Service Worker Básico e Seguro para Next.js
// Apenas registra a instalação para que o PWA possa ser instalado localmente,
// MAS DEIXA o navegador (Next.js) fazer os fetches normais (evitando ERR_FAILED).

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força a atualização imediata
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Limpa o cache problemático antigo, se existir
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim(); // Assume o controle imediatamente e conserta a aba aberta
    })
  );
});

// Interceptor de Fetch Vazio (Requisito mínimo do PWA para funcionar sem quebrar rotas do Next.js)
self.addEventListener('fetch', (event) => {
  // O navegador irá cuidar das requisições naturalmente.
});
