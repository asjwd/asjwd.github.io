'use strict';
let portfolioData=null, projectFilter='all', currentLanguage='id', activeSlides=[],slideAt=0,slideTimer=null;
const TEXT={
 id:{navExperience:'Pengalaman',navProjects:'Proyek',navPubs:'Publikasi',navTools:'Aplikasi',navContact:'Kontak',heroLabel:'PROFIL PROFESIONAL',explore:'Lihat Pengalaman',slideEmpty:'Dokumentasi kegiatan akan ditampilkan di sini.',metricRoles:'Jabatan',metricProjects:'Proyek',metricModels:'Pemodelan',metricPubs:'Publikasi',aboutLabel:'TENTANG SAYA',aboutTitle:'Tentang saya',affiliation:'Institusi',basedIn:'Lokasi',careerLabel:'PENGALAMAN',career:'Pengalaman Profesional',workLabel:'KAJIAN & PEMODELAN',work:'Proyek & Pemodelan',filterAll:'Semua proyek',filterModels:'Pemodelan',filterConsult:'Konsultansi / Kajian',researchLabel:'RISET',research:'Publikasi',softwareLabel:'PERANGKAT DIGITAL',software:'Aplikasi',contactLabel:'KONTAK',messageTitle:'Kirim Pesan',messageIntro:'Silakan kirim pesan Anda. Saya akan merespons sesegera mungkin.',yourEmail:'Email Anda',subject:'Subjek',message:'Pesan',contactHint:'Pengiriman diproses langsung di halaman ini.', sending:'Mengirim pesan...', contactSuccess:'Pesan berhasil terkirim. Terima kasih, saya akan merespons sesegera mungkin.', contactError:'Pesan belum berhasil dikirim. Silakan coba lagi.', contactUncertain:'Konfirmasi pengiriman belum diterima. Pesan mungkin sudah terkirim; periksa kembali sebelum mengirim ulang.', contactSessionLocked:'Pesan Anda sudah terkirim. Untuk mengirim pesan baru, refresh halaman.',sendMessage:'Kirim Pesan',details:'Lihat detail',projectDetails:'Detail proyek',readPaper:'Baca artikel',download:'Unduh aplikasi',emptyExperience:'Belum ada pengalaman profesional.',emptyProject:'Belum ada proyek pada kategori ini.',emptyPublication:'Belum ada publikasi.',emptyTools:'Belum ada aplikasi.',contactNotReady:'Form Mail Me belum diaktifkan. Tambahkan URL Apps Script Contact melalui Portfolio Manager.',contribution:'Kontribusi',activities:'Kegiatan',documentation:'Dokumentasi',outputs:'Hasil dan kontribusi'},
 en:{navExperience:'Experience',navProjects:'Projects',navPubs:'Publications',navTools:'Tools',navContact:'Contact',heroLabel:'PROFESSIONAL PROFILE',explore:'Explore Experience',slideEmpty:'Project and activity documentation will appear here.',metricRoles:'Roles',metricProjects:'Projects',metricModels:'Models',metricPubs:'Publications',aboutLabel:'ABOUT',aboutTitle:'About Me',affiliation:'Affiliation',basedIn:'Location',careerLabel:'CAREER',career:'Professional Experience',workLabel:'SELECTED WORK',work:'Projects & Modeling',filterAll:'All Projects',filterModels:'Modeling',filterConsult:'Consulting / Studies',researchLabel:'RESEARCH',research:'Publications',softwareLabel:'DIGITAL TOOLS',software:'Digital Tools',contactLabel:'CONTACT',messageTitle:'Send a Message',messageIntro:'Please leave your message, and I will respond as soon as possible.',yourEmail:'Your Email',subject:'Subject',message:'Message',contactHint:'Your message will be sent without opening a new tab.', sending:'Sending message...', contactSuccess:'Your message has been sent successfully. Thank you, I will respond as soon as possible.', contactError:'Your message could not be sent. Please try again.', contactUncertain:'Confirmation was not received. Your message may have been sent; please check before trying again.', contactSessionLocked:'Your message has already been sent. Refresh this page to send another message.',sendMessage:'Send Message',details:'View Details',projectDetails:'View Project',readPaper:'Read Paper',download:'Download Application',emptyExperience:'No professional experience yet.',emptyProject:'No projects in this category.',emptyPublication:'No publications yet.',emptyTools:'No tools yet.',contactNotReady:'Mail Me is not configured yet. Add the Contact App Script URL in Portfolio Manager.',contribution:'Key Contributions',activities:'Activities & Assignments',documentation:'Documentation',outputs:'Outputs & Contributions'}
};
function t(k){return TEXT[currentLanguage][k]||k;}
function tr(x,key){if(!x)return '';const en=x.en||{};return (currentLanguage==='en' && typeof en[key]==='string' && en[key].trim())?en[key]:x[key]||'';}
function trArray(x,key){if(!x)return [];const en=x.en||{};return currentLanguage==='en' && Array.isArray(en[key]) && en[key].length ? en[key] : (x[key]||[]);}
function esc(x){return SITE.escape(x);}
function fillLangText(){document.documentElement.lang=currentLanguage;document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));document.querySelectorAll('[data-lang]').forEach(n=>{n.classList.toggle('active',n.dataset.lang===currentLanguage);n.setAttribute('aria-pressed',String(n.dataset.lang===currentLanguage));});}
function renderPortfolio(data){portfolioData=data;const p=data.profile||{};document.title=(p.name||'Portfolio')+' — '+(currentLanguage==='id'?'Portofolio':'Professional Portfolio');fillLangText();
 document.querySelector('#profile-name').textContent=p.name||'Academic Portfolio';document.querySelector('#profile-title').textContent=tr(p,'title');document.querySelector('#profile-tagline').textContent=tr(p,'tagline');document.querySelector('#about-text').textContent=tr(p,'about')||'—';document.querySelector('#profile-institution').textContent=p.institution||'—';document.querySelector('#profile-location').textContent=p.location||'—';
 const ava=document.getElementById('profile-avatar');ava.innerHTML=SITE.safeURL(p.avatar)?SITE.image(p.avatar,p.name):`<span>${esc(SITE.avatarInitials(p.name))}</span>`;
 const hero=document.querySelector('.hero');if(SITE.safeURL(p.banner))hero.style.backgroundImage=`linear-gradient(100deg,rgba(13,40,55,.94),rgba(14,51,63,.83)),url("${SITE.safeURL(p.banner).replaceAll('"','%22')}")`;
 document.getElementById('specialty-tags').innerHTML=trArray(p,'specialties').map(x=>`<span class="tag">${esc(x)}</span>`).join('');
 document.getElementById('year').textContent=new Date().getFullYear();
 renderExperience();renderProjects();renderPublications();renderTools();renderContacts();renderSlides();}
function isModel(x){return /model|pemodelan|aermod|wrf|calpuff|gis/i.test([x.category,x.model,x.title].join(' '));}
function renderExperience(){const el=document.getElementById('experience-list');const a=portfolioData.experiences||[];el.innerHTML=a.length?a.map((x,i)=>`<button class="experience-item" data-experience="${esc(x.id)}"><div class="experience-icon">${String(i+1).padStart(2,'0')}</div><div class="experience-main"><div class="experience-top"><h3>${esc(tr(x,'role'))}</h3><span>${esc(x.period||'')}</span></div><p>${esc(x.organization||'')}${x.location?' · '+esc(x.location):''}</p><small>${esc(tr(x,'summary'))}</small></div></button>`).join(''):`<div class="empty-card">${t('emptyExperience')}</div>`;el.querySelectorAll('[data-experience]').forEach(b=>b.addEventListener('click',()=>openExperience(b.dataset.experience)));}
function renderProjects(){let list=portfolioData.projects||[];if(projectFilter==='modeling')list=list.filter(isModel);if(projectFilter==='consulting')list=list.filter(x=>!isModel(x));const el=document.getElementById('project-list');el.innerHTML=list.length?list.map(x=>`<button class="project-card" data-project="${esc(x.id)}"><div class="project-cover">${SITE.safeURL(x.cover)?SITE.image(x.cover,tr(x,'title')):`<span class="project-symbol">${isModel(x)?'◎':'▧'}</span>`}<span class="project-type">${esc(tr(x,'category')||'Project')}</span></div><div class="project-meta">${esc(x.year||'')} ${x.model?' · '+esc(x.model):''}</div><h3>${esc(tr(x,'title'))}</h3><p>${esc(tr(x,'description'))}</p><span class="card-link">${t('projectDetails')}</span></button>`).join(''):`<div class="empty-card wide">${t('emptyProject')}</div>`;el.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.project)));}
function renderPublications(){const list=portfolioData.publications||[];document.getElementById('publication-list').innerHTML=list.length?list.map((x,i)=>`<article class="publication-item"><span class="publication-index">${String(i+1).padStart(2,'0')}</span><div><span class="pub-year">${esc(x.year||'')}</span><h3>${esc(tr(x,'title'))}</h3><p>${esc(x.authors||'')}</p><small>${esc(x.journal||'')}</small></div>${SITE.linkURL(x.url||x.doi)?SITE.external(x.url||x.doi,t('readPaper'),'pub-link'):''}</article>`).join(''):`<div class="empty-card">${t('emptyPublication')}</div>`;}
function renderTools(){const list=portfolioData.tools||[];document.getElementById('tools-list').innerHTML=list.length?list.map(x=>`<div class="tool-card"><div class="tool-icon">${esc((x.name||'A')[0])}</div><div class="tool-body"><div class="tool-header"><h3>${esc(x.name)}</h3>${x.version?`<span>Version ${esc(x.version)}</span>`:''}</div><p>${esc(tr(x,'description'))}</p><div class="tags">${trArray(x,'features').map(f=>`<span class="tag">${esc(f)}</span>`).join('')}</div></div>${SITE.linkURL(x.url)?SITE.external(x.url,t('download'),'tool-download'):''}</div>`).join(''):`<div class="empty-card">${t('emptyTools')}</div>`;}
const ICONS={linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0a66c2"/><path d="M5 10h3v9H5zm1.5-5a1.7 1.7 0 110 3.4 1.7 1.7 0 010-3.4zM10 10h2.8v1.3c.5-.9 1.5-1.5 2.9-1.5 3 0 3.3 2 3.3 4.5V19h-3v-4.3c0-1.1 0-2.4-1.6-2.4-1.6 0-1.8 1.2-1.8 2.4V19H10z" fill="white"/></svg>',instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ig"><stop stop-color="#feda75"/><stop offset=".45" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="0" y="0" width="24" height="24" rx="6" fill="url(#ig)"/><rect x="5" y="5" width="14" height="14" rx="4" stroke="white" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="white" stroke-width="2" fill="none"/><circle cx="17" cy="7" r="1.2" fill="white"/></svg>',youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="5" fill="#ff0033"/><path d="m10 8 7 4-7 4z" fill="#fff"/></svg>',orcid:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#a6ce39"/><circle cx="6.8" cy="7.5" r="1.2" fill="#fff"/><path fill="#fff" d="M6 10h1.7v8H6zm4.1-4h4.2c4.2 0 6.7 2.3 6.7 6s-2.5 6-6.7 6h-4.2zm3 2.2v7.6h1.2c2.7 0 4.3-1.3 4.3-3.8s-1.6-3.8-4.3-3.8z"/></svg>'};
function linkMarkup(label,url,icon){const safe=SITE.linkURL(url);if(!safe)return '';return `<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer"><span class="brand-icon">${icon}</span><span>${esc(label)}</span></a>`;}
function renderContacts(){
 const p=portfolioData.profile||{};
 const scholar='<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#4285f4"/><path d="M3 10 12 4l9 6-9 6z" fill="#fff"/><path d="M7 13v3.2c1.6 2 8.4 2 10 0V13l-5 3.1z" fill="#e9f2ff"/><path d="M20 10v6" stroke="#fff" stroke-width="1.4"/></svg>';
 const records=[
  linkMarkup('LinkedIn',p.linkedin,ICONS.linkedin),
  linkMarkup('Instagram',p.instagram,ICONS.instagram),
  linkMarkup('YouTube',p.youtube,ICONS.youtube),
  linkMarkup('Google Scholar',p.scholar,scholar),
  linkMarkup('ORCID',p.orcid,ICONS.orcid)
 ];
 records.push('<button type="button" id="openContact"><span class="brand-icon mail">✉</span><span>Mail Me</span></button>');
 document.getElementById('contact-links').innerHTML=records.filter(Boolean).join('');
 document.getElementById('openContact')?.addEventListener('click',openContact);
}

function openModal(html){document.getElementById('modalContent').innerHTML=html;document.getElementById('detailModal').classList.remove('hidden');document.body.style.overflow='hidden';}
function galleryHTML(g){return Array.isArray(g)&&g.length?`<h3 class="modal-subheading">${t('documentation')}</h3><div class="gallery">${g.map(x=>`<figure>${SITE.image(x.url,x.caption||'Activity photo')}<figcaption>${esc(x.caption||'')}</figcaption></figure>`).join('')}</div>`:'';}
function openExperience(id){const x=(portfolioData.experiences||[]).find(x=>x.id===id);if(!x)return;const activities=(trArray(x,'activities')||[]).map(a=>`<li><strong>${esc(a.title)}</strong>${a.date?` <span>${esc(a.date)}</span>`:''}${a.description?`<p>${esc(a.description)}</p>`:''}</li>`).join('');openModal(`<div class="modal-eyebrow">${t('career')}</div><h2 id="modalTitle">${esc(tr(x,'role'))}</h2><p class="modal-org">${esc(x.organization||'')} ${x.period?' · '+esc(x.period):''}</p><p>${esc(tr(x,'summary'))}</p>${trArray(x,'contributions').length?`<h3 class="modal-subheading">${t('contribution')}</h3><ul class="modal-list">${trArray(x,'contributions').map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''}${activities?`<h3 class="modal-subheading">${t('activities')}</h3><ul class="activity-list">${activities}</ul>`:''}${galleryHTML(x.gallery)}`);}
function openProject(id){const x=(portfolioData.projects||[]).find(x=>x.id===id);if(!x)return;openModal(`<div class="modal-eyebrow">${esc(tr(x,'category'))} ${x.year?' / '+esc(x.year):''}</div><h2 id="modalTitle">${esc(tr(x,'title'))}</h2><p class="modal-org">${esc(tr(x,'role'))} ${x.model?' · '+esc(x.model):''}</p>${SITE.safeURL(x.cover)?`<div class="modal-cover">${SITE.image(x.cover,tr(x,'title'))}</div>`:''}<p>${esc(tr(x,'description'))}</p>${tr(x,'outputs')?`<h3 class="modal-subheading">${t('outputs')}</h3><p>${esc(tr(x,'outputs'))}</p>`:''}${galleryHTML(x.gallery)}`);}
function shuffled(list){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function collectSlides(){const d=portfolioData||{},slides=[];for(const x of d.slides||[]){if(SITE.safeURL(x.url))slides.push({url:x.url,caption:currentLanguage==='en'?(x.captionEn||x.caption||x.title||''):(x.caption||x.title||'')});for(const ph of x.gallery||[])if(SITE.safeURL(ph.url))slides.push({url:ph.url,caption:currentLanguage==='en'?(ph.captionEn||ph.caption||x.title||''):(ph.caption||x.title||'')});}
 const from=[];for(const x of [...(d.projects||[]),...(d.experiences||[])]){for(const ph of x.gallery||[])if(SITE.safeURL(ph.url))from.push({url:ph.url,caption:currentLanguage==='en'?(ph.captionEn||ph.caption||x.title||x.role||''):(ph.caption||x.title||x.role||''),featured:!!ph.featured});}
 const preferred=from.filter(x=>x.featured);slides.push(...(preferred.length?preferred:from));const seen=new Set();return shuffled(slides.filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return true}));}
function changeSlide(i){if(!activeSlides.length)return;slideAt=(i+activeSlides.length)%activeSlides.length;document.querySelectorAll('#heroSlideshow img').forEach((node,index)=>node.classList.toggle('active',index===slideAt));document.querySelectorAll('#slideDots button').forEach((node,index)=>node.classList.toggle('active',index===slideAt));document.getElementById('slideCaption').textContent=activeSlides[slideAt].caption||'';}
function resetSlideTimer(){clearInterval(slideTimer);if(activeSlides.length>1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)slideTimer=setInterval(()=>changeSlide(slideAt+1),3000);}
function renderSlides(){clearInterval(slideTimer);activeSlides=collectSlides();const el=document.getElementById('heroSlideshow'),dot=document.getElementById('slideDots');el.querySelectorAll('img').forEach(n=>n.remove());const empty=el.querySelector('.slide-empty');empty.hidden=activeSlides.length>0;
 activeSlides.forEach((s,i)=>{const im=document.createElement('img');im.src=SITE.safeURL(s.url);im.alt=s.caption||'Dokumentasi kegiatan';im.loading=i<2?'eager':'lazy';el.appendChild(im)});
 dot.innerHTML=activeSlides.map((_,i)=>`<button aria-label="Foto ${i+1}" data-slide="${i}" type="button"></button>`).join('');dot.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{changeSlide(Number(b.dataset.slide));resetSlideTimer()}));changeSlide(0);resetSlideTimer();}
function closeAll(){document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));document.body.style.overflow='';}
// V9: Send through a hidden iframe and wait for a signed-by-request completion message.
// 'success' is never inferred from submitting the form or from the iframe load event.
let contactSentInSession=false, contactPending=false, contactRequestId='', contactTimeout=null;
function contactFeedback(message,kind){
 const el=document.getElementById('contactResult');
 el.hidden=false;el.className='contact-result '+(kind||'');el.textContent=message;
}
function contactResetFeedback(){
 const el=document.getElementById('contactResult');el.textContent='';el.hidden=true;el.className='contact-result';
}
function contactSendButton(){return document.getElementById('submitContact');}
function contactSetSubmitting(on){
 const b=contactSendButton();b.disabled=on||contactSentInSession;
 b.textContent=on?t('sending'):t('sendMessage');
}
function newContactRequestId(){
 if(window.crypto && window.crypto.getRandomValues){
  const a=new Uint32Array(4);window.crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(8,'0')).join('');
 }
 return String(Date.now())+Math.random().toString(36).slice(2);
}
function openContact(){
 const p=portfolioData.profile||{},modal=document.getElementById('contactModal'),form=document.getElementById('contactForm'),url=SITE.linkURL(p.contactFormUrl||'');
 modal.classList.remove('hidden');document.body.style.overflow='hidden';
 document.getElementById('contactNotReady').hidden=!!url;
 if(!url)document.getElementById('contactNotReady').textContent=t('contactNotReady');
 if(contactSentInSession){form.hidden=true;contactFeedback(t('contactSessionLocked'),'success');return;}
 form.hidden=!url;
 if(url){form.action=url; if(!contactPending){
   document.getElementById('contactStartedAt').value=String(Date.now());
   document.getElementById('contactRequestId').value='';contactResetFeedback();
 }}
}
function contactComplete(ok,msg){
 contactPending=false;clearTimeout(contactTimeout);contactTimeout=null;
 if(ok){
  contactSentInSession=true;
  document.getElementById('contactForm').hidden=true;
  contactFeedback(t('contactSuccess'),'success');
  contactSendButton().disabled=true;
 }else{
  contactFeedback(msg||t('contactError'),'error');
  contactSetSubmitting(false);
 }
}
window.addEventListener('message',event=>{
 const d=event.data;
 if(!d||typeof d!=='object'||d.type!=='ASJ_CONTACT_RESULT_V9'||!contactPending)return;
 // Only the owner-controlled Apps Script response may confirm delivery.
 const origin=String(event.origin||'');
 const allowedGoogleOrigin=origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(origin);
 if(!allowedGoogleOrigin||!contactRequestId||d.requestId!==contactRequestId)return;
 contactComplete(d.ok===true,d.ok?t('contactSuccess'):(typeof d.message==='string'&&d.message?d.message:t('contactError')));
});
function submitContactSamePage(event){
 if(contactPending||contactSentInSession){event.preventDefault();return;}
 // HTML5 form validation happens before the submit event.
 const p=portfolioData?.profile||{},url=SITE.linkURL(p.contactFormUrl||'');
 if(!url){event.preventDefault();contactFeedback(t('contactNotReady'),'error');return;}
 contactRequestId=newContactRequestId();
 document.getElementById('contactRequestId').value=contactRequestId;
 contactPending=true;contactResetFeedback();contactSetSubmitting(true);
 contactTimeout=setTimeout(()=>{
  if(!contactPending)return;
  // Unknown delivery; never say 'sent' without receiving an acknowledgement.
  contactComplete(false,t('contactUncertain'));
 },45000);
 // Do not call preventDefault: the standard POST targets only the hidden iframe.
}

document.querySelectorAll('[data-close],[data-contact-close]').forEach(n=>n.addEventListener('click',closeAll));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{currentLanguage=b.dataset.lang;try{localStorage.setItem('portfolioLangV7',currentLanguage)}catch(e){};if(portfolioData)renderPortfolio(portfolioData)}));
try{if(localStorage.getItem('portfolioLangV7')==='en')currentLanguage='en';}catch(e){}
document.getElementById('project-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;projectFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderProjects()});document.getElementById('navToggle').addEventListener('click',()=>document.querySelector('.topnav').classList.toggle('open'));
document.getElementById('slidePrev').addEventListener('click',()=>{changeSlide(slideAt-1);resetSlideTimer()});document.getElementById('slideNext').addEventListener('click',()=>{changeSlide(slideAt+1);resetSlideTimer()});
document.getElementById('contactForm').addEventListener('submit',submitContactSamePage);
SITE.load().then(renderPortfolio).catch(e=>{document.querySelector('.page-content').innerHTML=`<div class="empty-card">Gagal memuat data website: ${SITE.escape(e.message)}</div>`});
