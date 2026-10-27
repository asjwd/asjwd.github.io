'use strict';
// V2 — public, read-only site data. Editing is deliberately not included in GitHub Pages.
const PM46_PUBLIC_API = 'https://script.google.com/macros/s/AKfycbzsyunPGbY7EKWLzN4pnphb6q0UDn-0Ys-W_ZVcJI3vaQwSKmRPLWny2u5BPtKWI4_W/exec';
const SITE = {
  load(){return this.read('site');},
  loadGrades(board){return this.read('grades',board);},
  read(kind,board=''){
    return new Promise((resolve,reject)=>{
      if(!['site','grades'].includes(kind))return reject(Error('Rute tidak dikenal'));
      const bytes=new Uint8Array(18);
      if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(bytes);
      else return reject(Error('Browser tidak mendukung pemanggilan aman'));
      const nonce=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
      const iframe=document.createElement('iframe');iframe.hidden=true;
      iframe.setAttribute('aria-hidden','true');iframe.tabIndex=-1;
      const action=kind==='site'?'published_site':'published_grades';
      const url=new URL(PM46_PUBLIC_API);
      url.searchParams.set('action',action);url.searchParams.set('nonce',nonce);
      if(kind==='grades')url.searchParams.set('board',String(board));
      let done=false;
      const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',onMessage);iframe.remove();};
      const fail=msg=>{if(done)return;done=true;cleanup();reject(Error(msg));};
      const onMessage=event=>{
        const data=event.data||{};
        if(data.type!=='ASJ_PUBLISHED_V46'||data.requestId!==nonce||data.kind!==kind)return;
        const origin=String(event.origin||'');
        if(!(origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(origin)))return;
        if(done)return;done=true;cleanup();
        data.ok?resolve(data.data):reject(Error(data.message||'Gagal memuat data'));
      };
      const timer=setTimeout(()=>fail('Server belum merespons. Coba muat ulang halaman.'),30000);
      window.addEventListener('message',onMessage);
      iframe.src=url.href;
      document.body.appendChild(iframe);
    });
  },
  escape(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));},
  safeURL(value){const v=String(value||'').trim();if(!v)return '';if(v.startsWith('data:image/jpeg;base64,')||v.startsWith('data:image/webp;base64,')||v.startsWith('data:image/png;base64,'))return v;try {const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(e){return '';}},
  linkURL(value){const v=String(value||'').trim();if(!v)return '';try {const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(e){return '';}},
  avatarInitials(name){return String(name||'AP').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();},
  id(){return 'id-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)},
  external(url,title,klass=''){const safe=SITE.linkURL(url);return safe?`<a class="${klass}" href="${SITE.escape(safe)}" target="_blank" rel="noopener noreferrer">${SITE.escape(title)}</a>`:'';},
  drivePreview(url){const s=String(url||'');let id='';const a=s.match(/\/file\/d\/([\w-]+)/);const b=s.match(/[?&]id=([\w-]+)/);id=a?.[1]||b?.[1]||'';return id?`https://drive.google.com/file/d/${id}/preview`:SITE.linkURL(s);},
  image(url,alt='',cls=''){const src=SITE.safeURL(url);return src?`<img class="${cls}" src="${SITE.escape(src)}" alt="${SITE.escape(alt)}" loading="lazy">`:'';}
};
