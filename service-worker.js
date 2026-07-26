const CACHE="nu-line-edition-v3";
const CORE=["./","index.html","styles.css?v=3.0.0","app.js?v=3.0.0","config.js?v=3.0.0","pages.json","manifest.webmanifest","01-cover.jpg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(url.pathname.endsWith("config.js")||url.pathname.endsWith("pages.json")){event.respondWith(fetch(event.request,{cache:"no-store"}).catch(()=>caches.match(event.request)));return}
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response})));
});
