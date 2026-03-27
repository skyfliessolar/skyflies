// ══════════════════════════════════════════════
// SKYFLIES SOLAR – SERVICE WORKER
// Enables offline support & install as app
// ══════════════════════════════════════════════

var CACHE_NAME = 'skyflies-v1';
var URLS_TO_CACHE = [
  '/skyflies/',
  '/skyflies/index.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap',
  'https://skyflies.in/wp-content/uploads/2025/12/Sky-Flies-Solar.png'
];

// Install — cache all essential files
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', function(e){
  // Don't cache Google Apps Script requests
  if(e.request.url.includes('script.google.com')){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cache new pages
        if(response && response.status === 200 && response.type === 'basic'){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function(){
        // Offline fallback — return cached index
        return caches.match('/skyflies/index.html');
      });
    })
  );
});
