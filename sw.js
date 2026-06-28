// オフラインキャッシュ（壊れにくい版）
const CACHE = "reina-chiri-v7";
const ASSETS = [
  "./", "./index.html", "./style.css",
  "./data.js", "./world-geo.js", "./app.js",
  "./manifest.json", "./icon-192.png", "./icon-512.png"
];

self.addEventListener("install", e=>{
  e.waitUntil((async()=>{
    const c = await caches.open(CACHE);
    // 1ファイル失敗しても全体を止めない（index.html は必ず入れる）
    await Promise.allSettled(ASSETS.map(u=>c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e=>{
  e.waitUntil((async()=>{
    const ks = await caches.keys();
    await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method!=="GET") return;

  // ページ遷移はネット優先（最新を取得）、ダメなら index.html
  if(req.mode==="navigate"){
    e.respondWith((async()=>{
      try{
        const fresh = await fetch(req);
        const c = await caches.open(CACHE); c.put("./index.html", fresh.clone()).catch(()=>{});
        return fresh;
      }catch(_){
        const cached = await caches.match("./index.html") || await caches.match("./");
        return cached || new Response("<h1>オフラインです</h1>", {headers:{"Content-Type":"text/html; charset=utf-8"}});
      }
    })());
    return;
  }

  // それ以外はキャッシュ優先→ネット
  e.respondWith((async()=>{
    const cached = await caches.match(req);
    if(cached) return cached;
    try{
      const resp = await fetch(req);
      const c = await caches.open(CACHE); c.put(req, resp.clone()).catch(()=>{});
      return resp;
    }catch(_){
      return new Response("", {status:504, statusText:"offline"});
    }
  })());
});
