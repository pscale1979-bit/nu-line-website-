const CACHE="nuline-edition-1-v2";
const CORE=["./","index.html","styles.css?v=2.0.0","app.js?v=2.0.0","pages.json","assets/pages/01-cover.jpg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(response=>{
    const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return response;
  }).catch(()=>caches.match("index.html"))));
});