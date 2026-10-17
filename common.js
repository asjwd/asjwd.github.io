'use strict';
const SITE_FILE = 'site.json';
const DRAFT_KEY = 'academic_portfolio_v1_draft';
const SITE = {
  async load() {
    const preview = new URLSearchParams(location.search).has('preview');
    if (preview) {try { const raw = localStorage.getItem(DRAFT_KEY); if(raw) return JSON.parse(raw); } catch(e) {console.warn(e);} }
    const r = await fetch(SITE_FILE, {cache:'no-store'}); if(!r.ok) throw Error('Gagal membaca site.json'); return await r.json();
  },
  draftLoad() { try {const raw=localStorage.getItem(DRAFT_KEY);return raw?JSON.parse(raw):null;} catch(e){return null;} },
  draftSave(data){localStorage.setItem(DRAFT_KEY, JSON.stringify(data));},
  escape(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));},
  safeURL(value){const v=String(value||'').trim();if(!v)return '';if(v.startsWith('data:image/jpeg;base64,')||v.startsWith('data:image/webp;base64,')||v.startsWith('data:image/png;base64,'))return v;try {const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(e){return '';}},
  linkURL(value){const v=String(value||'').trim();if(!v)return '';try {const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(e){return '';}},
  avatarInitials(name){return String(name||'AP').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();},
  id(){return 'id-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)},
  hasPreview(){return new URLSearchParams(location.search).has('preview')&&Boolean(localStorage.getItem(DRAFT_KEY));},
  setPreviewFlag(){if(SITE.hasPreview())document.getElementById('previewNotice')?.classList.remove('hidden');},
  external(url,title,klass=''){const safe=SITE.linkURL(url);return safe?`<a class="${klass}" href="${SITE.escape(safe)}" target="_blank" rel="noopener noreferrer">${SITE.escape(title)} ↗</a>`:'';},
  drivePreview(url){const s=String(url||'');let id='';const a=s.match(/\/file\/d\/([\w-]+)/);const b=s.match(/[?&]id=([\w-]+)/);id=a?.[1]||b?.[1]||'';return id?`https://drive.google.com/file/d/${id}/preview`:SITE.linkURL(s);},
  image(url,alt='',cls=''){const src=SITE.safeURL(url);return src?`<img class="${cls}" src="${SITE.escape(src)}" alt="${SITE.escape(alt)}" loading="lazy">`:'';}
};
