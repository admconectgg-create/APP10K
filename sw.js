/* Salão PDV: guarda o app no aparelho para abrir rápido e funcionar sem internet. */
const CACHE='salao-pdv-2a09b2b3';
const SHELL=["./", "./index.html", "./manifest.webmanifest?v=f6fc060c", "./icon-192.png?v=f6fc060c", "./icon-512.png?v=f6fc060c", "./icon-maskable-512.png?v=f6fc060c", "./apple-touch-icon.png?v=f6fc060c", "./logo.webp?v=f6fc060c"];
const EXTERNAL=['www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{const c=cs.find(x=>'focus' in x);return c?c.focus():self.clients.openWindow('./')}));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    // páginas e regras vêm da internet quando dá (para pegar versões novas) e do aparelho quando não dá
    if(req.mode==='navigate'||/\.(html|rules|webmanifest)$/.test(url.pathname)){
      const app=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html'),key=app?'./index.html':req;
      e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(key,copy))}return res}).catch(()=>caches.match(key).then(hit=>hit||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
      return;
    }
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));
    return;
  }
  // bibliotecas (Firebase, fontes, QR code): depois da primeira vez, abrem do aparelho
  if(EXTERNAL.includes(url.host)&&(url.host!=='www.gstatic.com'||url.pathname.startsWith('/firebasejs/'))){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok||res.type==='opaque'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));
  }
});
