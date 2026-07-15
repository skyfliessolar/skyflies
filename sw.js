// ══════════════════════════════════════════════
// SKYFLIES SOLAR – SERVICE WORKER (v16)
// Network-first for pages: users ALWAYS get the
// latest app after one reload. Cache = offline only.
// ══════════════════════════════════════════════

var CACHE_NAME = 'skyflies-v24';
var URLS_TO_CACHE = [
  '/skyflies/',
  '/skyflies/index.html',
  '/skyflies/privacy.html',
  '/skyflies/terms.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap',
  'https://skyflies.in/wp-content/uploads/2025/12/Sky-Flies-Solar.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', function(e){
  var url = e.request.url;

  // Never intercept backend/API calls
  if(url.includes('script.google.com') || url.includes('supabase.co') || url.includes('postalpincode.in')){
    return;
  }

  var isHTML = e.request.mode === 'navigate' ||
               url.endsWith('/skyflies/') ||
               url.indexOf('.html') !== -1;

  if(isHTML){
    // NETWORK-FIRST for pages: always try to get the freshest version.
    e.respondWith(
      fetch(e.request).then(function(response){
        if(response && response.status === 200){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        }
        return response;
      }).catch(function(){
        // Offline: serve last cached copy
        return caches.match(e.request).then(function(c){
          return c || caches.match('/skyflies/index.html');
        });
      })
    );
    return;
  }

  // CACHE-FIRST for static assets (fonts, images) — fast + offline-friendly
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        if(response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        }
        return response;
      }).catch(function(){ return cached; });
    })
  );
});
