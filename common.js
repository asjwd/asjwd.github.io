'use strict';
// V2 — public, read-only site data. Editing is deliberately not included in GitHub Pages.
const PM46_PUBLIC_API = 'https://script.google.com/macros/s/AKfycbzsyunPGbY7EKWLzN4pnphb6q0UDn-0Ys-W_ZVcJI3vaQwSKmRPLWny2u5BPtKWI4_W/exec';
const SITE = {
  // One in-flight request per page; recent public content is cached in sessionStorage only.
  _pending: new Map(),
  _storagePrefix:'asj-v47:public:',
  _storageTtl:30000, // PUBLIC content only; OFF can remain in this tab's cache for up to 30s.
  load(){return this.loadPortfolio();}, // compatibility
  loadPortfolio(){return this.cachedPage('portfolio');},
  loadAcademic(){return this.cachedPage('academic');},
  loadGrades(board){return this.read('grades',board);}, // no grade browser persistence
  cachedPage(kind){
    if(this._pending.has(kind))return this._pending.get(kind);
    const now=Date.now(),key=this._storagePrefix+kind;
    try{
      const stored=JSON.parse(sessionStorage.getItem(key)||'null');
      if(stored&&stored.savedAt<=now&&now-stored.savedAt<this._storageTtl&&stored.data&&typeof stored.data.profile==='object'){
        if(window.performance?.mark)performance.mark('asj-v47-'+kind+'-session-cache');
        return Promise.resolve(stored.data);
      }
    }catch(_e){}
    const task=this.read(kind).then(data=>{
      if(data&&typeof data.profile==='object'){
        try{sessionStorage.setItem(key,JSON.stringify({savedAt:Date.now(),data}));}catch(_e){}
      }
      return data;
    }).finally(()=>this._pending.delete(kind));
    this._pending.set(kind,task);return task;
  },
  read(kind,board=''){
    return new Promise((resolve,reject)=>{
      if(!['portfolio','academic','site','grades'].includes(kind))return reject(Error('Rute tidak dikenal'));
      const bytes=new Uint8Array(18);
      if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(bytes);
      else return reject(Error('Browser tidak mendukung pemanggilan aman'));
      const nonce=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
      const iframe=document.createElement('iframe');iframe.hidden=true;
      iframe.setAttribute('aria-hidden','true');iframe.tabIndex=-1;
      const action={portfolio:'published_portfolio',academic:'published_academic',site:'published_site',grades:'published_grades'}[kind];
      const url=new URL(PM46_PUBLIC_API);
      url.searchParams.set('action',action);url.searchParams.set('nonce',nonce);
      if(kind==='grades')url.searchParams.set('board',String(board));
      const started=performance.now();let done=false;
      const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',onMessage);iframe.remove();};
      const fail=msg=>{if(done)return;done=true;cleanup();reject(Error(msg));};
      const onMessage=event=>{
        const data=event.data||{};
        if(data.type!=='ASJ_PUBLISHED_V46'||data.requestId!==nonce||data.kind!==kind)return;
        const origin=String(event.origin||'');
        if(!(origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(origin)))return;
        if(done)return;done=true;cleanup();
        if(window.console&&console.info)console.info('[V47 Load]',kind,'totalMs='+Math.round(performance.now()-started),'serverMs='+String(data.serverMs||'?'));
        data.ok?resolve(data.data):reject(Error(data.message||'Gagal memuat data'));
      };
      const timer=setTimeout(()=>fail('Server belum merespons. Coba muat ulang halaman.'),30000);
      window.addEventListener('message',onMessage);
      iframe.src=url.href;document.body.appendChild(iframe);
    });
  },
  escape(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));},
  safeURL(value){const v=String(value||'').trim();if(!v)return '';if(v.startsWith('data:image/jpeg;base64,')||v.startsWith('data:image/webp;base64,')||v.startsWith('data:image/png;base64,'))return v;try {const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(e){return '';}},
  linkURL(value){const v=String(value||'').trim();if(!v)return '';try {const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(e){return '';}},
  avatarInitials(name){return String(name||'AP').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();},
  id(){return 'id-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)},
  external(url,title,klass=''){const safe=SITE.linkURL(url);return safe?`<a class="${klass}" href="${SITE.escape(safe)}" target="_blank" rel="noopener noreferrer">${SITE.escape(title)}</a>`:'';},
  drivePreview(url){const s=String(url||'');let id='';const a=s.match(/\/file\/d\/([\w-]+)/);const b=s.match(/[?&]id=([\w-]+)/);id=a?.[1]||b?.[1]||'';return id?`https://drive.google.com/file/d/${id}/preview`:SITE.linkURL(s);},
  photoURL(url,width=720){
    const safe=SITE.safeURL(url);if(!safe)return '';
    // Drive serves resized thumbnails without creating duplicate files.
    try{const u=new URL(safe);if(u.hostname==='drive.google.com'&&u.pathname==='/thumbnail'&&u.searchParams.has('id')){
      const allowed=[320,480,720,1200,1600];const target=allowed.find(n=>n>=Number(width))||1600;
      u.searchParams.set('sz','w'+target);return u.href;
    }}catch(_e){}
    return safe;
  },
  image(url,alt='',cls='',width=720,priority=false){const src=SITE.photoURL(url,width);return src?`<img class="${SITE.escape(cls)}" src="${SITE.escape(src)}" alt="${SITE.escape(alt)}" loading="${priority?'eager':'lazy'}" ${priority?'fetchpriority="high"':''} decoding="async">`:'';}
};
