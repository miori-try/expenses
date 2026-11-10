const V="gastos-v2",CORE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-180.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!=="cg-agenda").map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r&&(r.ok||r.type==="opaque")){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>hit);
    return hit||net;
  }));
});
/* avisos de vencimento em segundo plano (Android, quando o navegador permite) */
async function avisa(){
  const c=await caches.open("cg-agenda"),u=n=>new URL(n,self.registration.scope);
  const r=await c.match(u("agenda.json"));if(!r)return;
  const ag=await r.json(),h=new Date(),d0=Date.UTC(h.getFullYear(),h.getMonth(),h.getDate());
  const vr=await c.match(u("vistos.json")),vistos=vr?await vr.json():{};
  for(const x of ag){
    const dd=Math.round((Date.parse(x.data+"T00:00:00Z")-d0)/864e5),k=x.id+"|"+x.data+"|"+dd;
    if((dd===0||dd===2)&&!vistos[k]){
      await self.registration.showNotification((dd?"Vence em 2 dias: ":"Vence hoje: ")+x.t,{body:x.b,tag:k,icon:"icon-192.png",badge:"icon-192.png"});
      vistos[k]=1;
    }
  }
  await c.put(u("vistos.json"),new Response(JSON.stringify(vistos)));
}
self.addEventListener("periodicsync",e=>{if(e.tag==="avisos")e.waitUntil(avisa())});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window"}).then(l=>l.length?l[0].focus():clients.openWindow("./")))});
