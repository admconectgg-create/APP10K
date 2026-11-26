/* Salão PDV: guarda o app no aparelho para abrir rápido e funcionar sem internet. */
const CACHE='salao-pdv-v2';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
const EXTERNAL=['www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    // páginas e regras vêm da internet quando dá (para pegar versões novas) e do aparelho quando não dá
    if(req.mode==='navigate'||/\.(html|rules)$/.test(url.pathname)){
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
