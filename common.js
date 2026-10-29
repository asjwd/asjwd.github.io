'use strict';
// V48 — early prefetch, safe 30-second session cache of PUBLIC content only. Read-only website.
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
  image(url,alt='',cls='',width=720,priority=false){const src=SITE.photoURL(url,width);return src?`<img draggable="false" class="${SITE.escape(cls)}" src="${SITE.escape(src)}" alt="${SITE.escape(alt)}" loading="${priority?'eager':'lazy'}" ${priority?'fetchpriority="high"':''} decoding="async">`:'';}
};

// V51: Guestbook always requires Google Sign-in (regardless of Mail Me toggle).
// Email/name shown in the form are display-only: the Mailer verifies the Google
// ID token and derives identity from the signed token on the server.
SITE.guestbookLogin = function(profile){
 const form=document.getElementById('toolRequestForm'),host=document.getElementById('pm51GuestbookLogin');
 if(!form||!host)return;
 const email=form.querySelector('[name="email"]'),name=form.querySelector('[name="fullName"]');
 for(const input of [email,name]){if(input){input.readOnly=true;input.value='';input.setAttribute('autocomplete','off');}}
 let token=form.querySelector('[name="googleCredential"]');
 if(!token){token=document.createElement('input');token.type='hidden';token.name='googleCredential';form.appendChild(token);}token.value='';
 const clientId=String(profile?.mailGoogleClientId||'').trim();
 host.innerHTML='<p style="margin:0 0 8px;font-weight:650">Sign in with Google to access the download</p><div class="pm51-google-button"></div><small class="pm51-google-message" style="display:block;margin-top:6px;color:#53727c">Your Google account will identify your guestbook entry.</small>';
 const status=host.querySelector('.pm51-google-message');
 if(!/^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)){
  status.textContent='Google Sign-in has not been configured. Please contact the website owner.';return;
 }
 const load=window.google?.accounts?.id?Promise.resolve():new Promise((resolve,reject)=>{
  const existing=document.querySelector('script[data-asj-gis]');
  if(existing){let checks=0;const timer=setInterval(()=>{if(window.google?.accounts?.id){clearInterval(timer);resolve();}else if(++checks>100){clearInterval(timer);reject(Error('Google Sign-in unavailable'));}},80);return;}
  const script=document.createElement('script');script.dataset.asjGis='1';script.src='https://accounts.google.com/gsi/client';script.async=true;
  script.onload=()=>window.google?.accounts?.id?resolve():reject(Error('Google Sign-in unavailable'));
  script.onerror=()=>reject(Error('Unable to load Google Sign-in'));document.head.appendChild(script);
 });
 load.then(()=>{
  if(!host.isConnected)return;
  google.accounts.id.initialize({client_id:clientId,callback:response=>{
   const credential=String(response?.credential||'');if(!credential)return;
   token.value=credential;
   try{const part=credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const parsed=JSON.parse(atob(part));
    if(email)email.value=String(parsed.email||'').slice(0,254);
    if(name)name.value=String(parsed.name||'').slice(0,100);
    status.textContent='Signed in with Google. Your account will be verified again when submitting.';
   }catch(_){status.textContent='Google account selected. Identity will be verified upon submitting.';}
  }});
  google.accounts.id.renderButton(host.querySelector('.pm51-google-button'),{theme:'outline',size:'large',text:'signin_with',shape:'rectangular'});
 }).catch(err=>{status.textContent=err.message;});
};
SITE.guestbookReady=function(form){
 const credential=String(form?.querySelector('[name="googleCredential"]')?.value||'');
 return credential.split('.').length===3&&credential.length>50;
};

// V49: convenience-only picture protection. No claim to prevent screenshots or DevTools.
document.addEventListener('contextmenu',e=>{if(e.target.closest('img, .gallery, .project-cover, .v13-slideshow, .hero-avatar'))e.preventDefault();});
document.addEventListener('dragstart',e=>{if(e.target.closest('img'))e.preventDefault();});
