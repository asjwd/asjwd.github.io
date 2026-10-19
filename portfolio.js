'use strict';
let portfolioData=null, currentLanguage='id', activeSlides=[],slideAt=0,slideTimer=null;
const V10_VISIBLE_STEP=5, v10Visible={experiences:5,projects:6,publications:5,otherActivities:5,tools:5};
const TEXT={
 id:{navExperience:'Pengalaman',navProjects:'Proyek',navPubs:'Publikasi',navOtherActivities:'Other Activities',otherActivitiesLabel:'KEGIATAN LAIN',otherActivitiesTitle:'Other Activities',emptyOtherActivities:'Belum ada kegiatan lain.',otherRole:'Peran',otherOrganizer:'Penyelenggara',otherCertificate:'Lihat sertifikat',navTools:'Tools',navContact:'Kontak',heroLabel:'PROFIL',explore:'Lihat Pengalaman',slideEmpty:'Dokumentasi kegiatan akan ditampilkan di sini.',metricRoles:'Jabatan',metricProjects:'Proyek',metricModels:'Pemodelan',metricPubs:'Publikasi',aboutLabel:'TENTANG SAYA',aboutTitle:'Tentang saya',degreeBachelor:'Sarjana',degreeMaster:'Magister',degreeDoctorate:'Doktor',graduationYear:'Lulus',affiliation:'Institusi',basedIn:'Lokasi',careerLabel:'PENGALAMAN',career:'Pengalaman Profesional',workLabel:'PROYEK & KAJIAN',work:'Proyek & Kajian',filterAll:'Semua proyek',filterModels:'Pemodelan',filterConsult:'Konsultansi / Kajian',researchLabel:'RISET',research:'Publikasi',softwareLabel:'PERANGKAT DIGITAL',software:'Tools',contactLabel:'KONTAK',messageTitle:'Kirim Pesan',messageIntro:'Silakan kirim pesan Anda. Saya akan merespons sesegera mungkin.',yourEmail:'Email Anda',subject:'Subjek',message:'Pesan',contactHint:'Pengiriman diproses langsung di halaman ini.', sending:'Mengirim pesan...', contactSuccess:'Pesan berhasil terkirim. Terima kasih, saya akan merespons sesegera mungkin.', contactError:'Pesan belum berhasil dikirim. Silakan coba lagi.', contactUncertain:'Konfirmasi pengiriman belum diterima. Pesan mungkin sudah terkirim; periksa kembali sebelum mengirim ulang.', contactSessionLocked:'Pesan Anda sudah terkirim. Untuk mengirim pesan baru, refresh halaman.',sendMessage:'Kirim Pesan',details:'Lihat detail',projectDetails:'Detail proyek',readPaper:'Baca artikel',download:'Unduh aplikasi',emptyExperience:'Belum ada pengalaman profesional.',emptyProject:'Belum ada proyek pada kategori ini.',emptyPublication:'Belum ada publikasi.',emptyTools:'Belum ada aplikasi.',contactNotReady:'Form Mail Me belum diaktifkan. Tambahkan URL Apps Script Contact melalui Portfolio Manager.',contribution:'Kontribusi',activities:'Kegiatan',documentation:'Dokumentasi',outputs:'Hasil dan kontribusi'},
 en:{navExperience:'Experience',navProjects:'Projects',navPubs:'Publications',navOtherActivities:'Other Activities',otherActivitiesLabel:'OTHER ACTIVITIES',otherActivitiesTitle:'Other Activities',emptyOtherActivities:'No activities yet.',otherRole:'Role',otherOrganizer:'Organizer',otherCertificate:'View certificate',navTools:'Tools',navContact:'Contact',heroLabel:'PROFILE',explore:'Explore Experience',slideEmpty:'Project and activity documentation will appear here.',metricRoles:'Roles',metricProjects:'Projects',metricModels:'Models',metricPubs:'Publications',aboutLabel:'ABOUT',aboutTitle:'About Me',degreeBachelor:'Bachelor',degreeMaster:'Master',degreeDoctorate:'Doctorate',graduationYear:'Graduated',affiliation:'Affiliation',basedIn:'Location',careerLabel:'CAREER',career:'Professional Experience',workLabel:'PROJECTS & STUDIES',work:'Projects & Studies',filterAll:'All Projects',filterModels:'Modeling',filterConsult:'Consulting / Studies',researchLabel:'RESEARCH',research:'Publications',softwareLabel:'DIGITAL TOOLS',software:'Tools',contactLabel:'CONTACT',messageTitle:'Send a Message',messageIntro:'Please leave your message, and I will respond as soon as possible.',yourEmail:'Your Email',subject:'Subject',message:'Message',contactHint:'Your message will be sent without opening a new tab.', sending:'Sending message...', contactSuccess:'Your message has been sent successfully. Thank you, I will respond as soon as possible.', contactError:'Your message could not be sent. Please try again.', contactUncertain:'Confirmation was not received. Your message may have been sent; please check before trying again.', contactSessionLocked:'Your message has already been sent. Refresh this page to send another message.',sendMessage:'Send Message',details:'View Details',projectDetails:'View Project',readPaper:'Read Paper',download:'Download Application',emptyExperience:'No professional experience yet.',emptyProject:'No projects in this category.',emptyPublication:'No publications yet.',emptyTools:'No tools yet.',contactNotReady:'Mail Me is not configured yet. Add the Contact App Script URL in Portfolio Manager.',contribution:'Key Contributions',activities:'Activities & Assignments',documentation:'Documentation',outputs:'Outputs & Contributions'}
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
 renderEducation(p);
 document.getElementById('year').textContent=new Date().getFullYear();
 renderExperience();renderProjects();renderPublications();renderOtherActivities();renderTools();renderContacts();renderSlides();}
// V16: Education is an optional object in Profile; existing Profiles continue to work.
function renderEducation(profile){
 const root=document.getElementById('education-grid');if(!root)return;
 const education=profile.education||{};
 const degrees=[['bachelor','degreeBachelor'],['master','degreeMaster'],['doctorate','degreeDoctorate']];
 const filled=degrees.filter(([key])=>{
   const d=education[key]||{};return !!String(d.institution||d.major||d.year||'').trim();
 });
 root.innerHTML=filled.map(([key,label])=>{
  const d=education[key]||{},logo=SITE.safeURL(d.logo||'');
  const major=currentLanguage==='en'?(d.majorEn||d.major||''):(d.major||'');
  return `<button type="button" class="v16-degree v17-degree" data-degree="${esc(key)}" aria-label="${esc(t(label))}: ${esc(d.institution||'')}">
    <div class="v16-degree-title">${esc(t(label))}</div><div class="v16-degree-body">${logo?`<img class="v16-degree-logo" src="${esc(logo)}" alt="" loading="lazy" decoding="async">`:''}
    <div class="v16-degree-info"><strong>${esc(d.institution||'')}</strong><span>${esc(major)}</span>${d.year?`<small>${esc(t('graduationYear'))} ${esc(d.year)}</small>`:''}</div></div>
  </button>`;
 }).join('');
 root.closest('.v16-education').hidden=!filled.length;
 root.style.gridTemplateColumns=filled.length===1?'minmax(0,1fr)':filled.length===2?'repeat(2,minmax(0,1fr))':'';
 root.querySelectorAll('[data-degree]').forEach(el=>el.addEventListener('click',()=>openEducation(el.dataset.degree)));
}
function openEducation(key){
 const d=portfolioData?.profile?.education?.[key]||{},labels={bachelor:'degreeBachelor',master:'degreeMaster',doctorate:'degreeDoctorate'};
 const label=t(labels[key]||'degreeBachelor'),major=currentLanguage==='en'?(d.majorEn||d.major||''):(d.major||'');
 const logo=SITE.safeURL(d.logo||'');
 const gallery=(d.gallery||[]).filter(ph=>ph&&SITE.safeURL(ph.url));
 openModal(`<div class="modal-eyebrow">${esc(label)}</div><h2 id="modalTitle">${esc(d.institution||label)}</h2>
   <div class="v17-edu-heading">${logo?`<img src="${esc(logo)}" alt="" class="v17-edu-modal-logo">`:''}<div>${major?`<p>${esc(major)}</p>`:''}${d.year?`<p>${esc(t('graduationYear'))} ${esc(d.year)}</p>`:''}</div></div>
   ${d.description?`<p>${esc(currentLanguage==='en'?(d.descriptionEn||d.description):d.description)}</p>`:''}${galleryHTML(gallery)}`);
}

function isModel(x){return /model|pemodelan|aermod|wrf|calpuff|gis/i.test([x.category,x.model,x.title].join(' '));}
function v10ShowMore(kind,length){
 const id=kind==='experiences'?'experience-list':kind==='projects'?'project-list':kind==='publications'?'publication-list':kind==='otherActivities'?'other-activities-list':'tools-list';
 const holder=document.getElementById(id),old=holder.nextElementSibling;
 if(old?.classList.contains('v10-more'))old.remove();
 const step=kind==='projects'?6:V10_VISIBLE_STEP;
 if(length<=step)return;
 const n=v10Visible[kind]||step,expanded=n>=length,remaining=Math.max(0,length-n);
 const more=document.createElement('div');more.className='v10-more';
 const btn=document.createElement('button');btn.type='button';btn.className='btn v10-more-button';
 btn.textContent=expanded?(currentLanguage==='id'?'Tampilkan lebih sedikit':'Show less'):(currentLanguage==='id'?`Lihat lebih banyak (${remaining})`:`Show more (${remaining})`);
 btn.addEventListener('click',()=>{v10Visible[kind]=expanded?step:Math.min(length,n+step);({experiences:renderExperience,projects:renderProjects,publications:renderPublications,otherActivities:renderOtherActivities,tools:renderTools})[kind]();});
 more.appendChild(btn);holder.after(more);
}
// V15: optional institution/company logos replace numbered badges.
function experienceLogo(x){
 const src=SITE.safeURL(x.companyIcon||x.organizationIcon||'');
 if(src)return `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`;
 return `<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="1.5"/><path d="M8 7V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 13h18M10 13v2h4v-2"/></svg>`;
}
// V19: render structured months while preserving legacy year/period/date records.
const V19_PUBLIC_MONTHS={id:['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],en:['January','February','March','April','May','June','July','August','September','October','November','December']};
function v19Period(x){
 const months=V19_PUBLIC_MONTHS[currentLanguage]||V19_PUBLIC_MONTHS.id;
 if(x.startMonth&&x.startYear){
  const a=months[Number(x.startMonth)-1]+' '+x.startYear;
  if(x.currentlyActive)return a+' – '+(currentLanguage==='id'?'Sekarang':'Present');
  if(x.endMonth&&x.endYear){const b=months[Number(x.endMonth)-1]+' '+x.endYear;return x.startMonth===x.endMonth&&x.startYear===x.endYear?a:a+' – '+b;}
  return a;
 }
 return String(x.period||x.date||x.year||'');
}
function v19PubDate(x){
 const m=String(x.publicationDate||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(m)return `${Number(m[3])} ${V19_PUBLIC_MONTHS[currentLanguage][Number(m[2])-1]} ${m[1]}`;
 return String(x.year||'');
}
function v19SmallLogo(ref,cls='v19-small-logo'){
 const url=SITE.safeURL(ref||'');return url?`<img class="${cls}" src="${esc(url)}" alt="" width="30" height="30" loading="lazy" decoding="async">`:'';
}

function renderExperience(){const el=document.getElementById('experience-list');const all=portfolioData.experiences||[],a=all.slice(0,v10Visible.experiences);el.innerHTML=all.length?a.map(x=>`<button class="experience-item" data-experience="${esc(x.id)}"><div class="experience-icon v15-company-icon">${experienceLogo(x)}</div><div class="experience-main"><div class="experience-top"><h3>${esc(tr(x,'role'))}</h3><span>${esc(v19Period(x))}</span></div><p>${esc(x.organization||'')}${x.location?' · '+esc(x.location):''}</p><small>${esc(tr(x,'summary'))}</small></div></button>`).join(''):`<div class="empty-card">${t('emptyExperience')}</div>`;el.querySelectorAll('[data-experience]').forEach(b=>b.addEventListener('click',()=>openExperience(b.dataset.experience)));v10ShowMore('experiences',all.length);}
function renderProjects(){const all=portfolioData.projects||[],list=all.slice(0,v10Visible.projects);const el=document.getElementById('project-list');el.innerHTML=all.length?list.map(x=>`<button class="project-card" data-project="${esc(x.id)}"><div class="project-cover">${SITE.safeURL(x.cover)?SITE.image(x.cover,tr(x,'title')):`<span class="project-symbol">${isModel(x)?'◎':'▧'}</span>`}<span class="project-type">${esc(tr(x,'category')||'Kajian')}</span></div><div class="project-meta">${esc(v19Period(x))} ${x.model?' · '+esc(x.model):''}</div><h3>${esc(tr(x,'title'))}</h3><p>${esc(tr(x,'description'))}</p>${x.partnerName?`<div class="v19-partner">${v19SmallLogo(x.partnerLogo)}<span>${esc(x.partnerName)}</span></div>`:''}</button>`).join(''):`<div class="empty-card wide">${t('emptyProject')}</div>`;el.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.project)));v10ShowMore('projects',all.length);}
// Prefer the actual publisher hostname. If a DOI resolves to doi.org, try a known
// publisher inferred from journal/publisher metadata; an optional journalWebsite
// in the Admin overrides inference. Never render an executable protocol.
function v10JournalHost(x){
 let raw=String(x.url||x.doi||x.publisherUrl||x.journalWebsite||'').trim();
 if(raw && !/^https?:\/\//i.test(raw) && /^10\.\d{4,9}\//.test(raw))raw='https://doi.org/'+raw;
 let host='';try{host=new URL(raw).hostname.replace(/^www\./,'').toLowerCase()}catch(_e){}
 if(!host || ['doi.org','dx.doi.org'].includes(host)){
  const j=String(x.journal||'').toLowerCase();
  if(/science\s?direct|elsevier/.test(j))host='sciencedirect.com';
  else if(/springer|nature/.test(j))host='link.springer.com';
  else if(/wiley/.test(j))host='onlinelibrary.wiley.com';
  else if(/mdpi/.test(j))host='mdpi.com';
  else if(/taylor|francis/.test(j))host='tandfonline.com';
  else if(/sage/.test(j))host='journals.sagepub.com';
 }
 return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)?host:'';
}
function v10PublicationIcon(x){
 const manual=SITE.safeURL(x.journalIcon||'');
 if(manual)return `<img class="v10-pub-icon" loading="lazy" src="${esc(manual)}" alt="" onerror="this.replaceWith(document.createTextNode('▤'))">`;
 const host=v10JournalHost(x),fallback='<span class="v10-pub-fallback" aria-hidden="true">▤</span>';
 if(!host)return fallback;
 const url='https://www.google.com/s2/favicons?domain='+encodeURIComponent(host)+'&sz=64';
 return `<img class="v10-pub-icon" loading="lazy" src="${esc(url)}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode('▤'))">`;
}
function renderPublications(){const all=portfolioData.publications||[],list=all.slice(0,v10Visible.publications),el=document.getElementById('publication-list');el.innerHTML=all.length?list.map(x=>`<article class="publication-item v10-publication"><span class="publication-index v10-journal-icon" title="${esc(v10JournalHost(x)||'Jurnal')}">${v10PublicationIcon(x)}</span><div><span class="pub-year">${esc(v19PubDate(x))}</span><h3>${esc(tr(x,'title'))}</h3><p>${esc(x.authors||'')}</p><small>${esc(x.journal||'')}</small></div>${SITE.linkURL(x.url||x.doi)?SITE.external(x.url||x.doi,t('readPaper'),'pub-link'):''}</article>`).join(''):`<div class="empty-card">${t('emptyPublication')}</div>`;v10ShowMore('publications',all.length);}
/** V18 — Activities share the existing detail modal but not the Experience list. */
function renderOtherActivities(){
 const root=document.getElementById('other-activities-list');if(!root)return;
 const all=portfolioData.otherActivities||[],n=v10Visible.otherActivities||5;
 root.innerHTML=all.length?all.slice(0,n).map(x=>`<button type="button" class="v18-activity" data-other-activity="${esc(x.id)}">
 <span class="v18-activity-mark" aria-hidden="true">${v19SmallLogo(x.organizerIcon)||activityIcon(x.type)}</span>
 <span class="v18-activity-info"><span class="v18-activity-meta">${esc(v19Period(x))}${x.type?` · ${esc(tr(x,'type'))}`:''}${x.role?` · ${esc(tr(x,'role'))}`:''}</span>
 <strong>${esc(tr(x,'title'))}</strong><small>${esc(tr(x,'organizer'))}${x.location?' · '+esc(tr(x,'location')):''}</small></span>
 </button>`).join(''):`<div class="empty-card">${t('emptyOtherActivities')}</div>`;
 root.querySelectorAll('[data-other-activity]').forEach(b=>b.addEventListener('click',()=>openOtherActivity(b.dataset.otherActivity)));
 v10ShowMore('otherActivities',all.length);
}
function activityIcon(type){
 const key=String(type||'').toLowerCase();
 return /training|trainer|pelatihan/.test(key)?'▣':/conference|konferen/.test(key)?'◎':/seminar|speaker/.test(key)?'◈':/workshop/.test(key)?'▤':'◇';
}
function openOtherActivity(id){
 const x=(portfolioData?.otherActivities||[]).find(a=>a.id===id);if(!x)return;
 const meta=[tr(x,'type'),v19Period(x),tr(x,'role')].filter(Boolean).map(esc).join(' · ');
 const organizer=tr(x,'organizer')||'',loc=tr(x,'location')||'';
 const cert=SITE.linkURL(x.certificateUrl||'');
 openModal(`<div class="modal-eyebrow">${t('otherActivitiesTitle')}${meta?' · '+meta:''}</div>
 <h2 id="modalTitle">${esc(tr(x,'title'))}</h2><p class="modal-org">${esc(organizer)}${loc?' · '+esc(loc):''}</p>
 ${tr(x,'description')?`<p>${esc(tr(x,'description'))}</p>`:''}
 ${cert?`<p><a class="btn v18-certificate" target="_blank" rel="noopener noreferrer" href="${esc(cert)}">${esc(tr(x,'certificateTitle')||t('otherCertificate'))}</a></p>`:''}
 ${galleryHTML(x.gallery)}`);
}
function renderTools(){
 const all=portfolioData.tools||[],list=all.slice(0,v10Visible.tools),el=document.getElementById('tools-list');
 el.innerHTML=all.length?list.map(x=>`<div class="tool-card"><div class="tool-icon">${esc((x.name||'A')[0])}</div><div class="tool-body"><div class="tool-header"><h3>${esc(x.name)}</h3>${x.version?`<span>Version ${esc(x.version)}</span>`:''}</div><p>${esc(tr(x,'description'))}</p><div class="tags">${trArray(x,'features').map(f=>`<span class="tag">${esc(f)}</span>`).join('')}</div></div><button type="button" class="btn v17-request-button" data-request-tool="${esc(x.id)}" ${x.requestAvailable===false?'disabled title="Not yet available"':''}>${currentLanguage==='id'?'Minta Link':'Request Download'}</button></div>`).join(''):`<div class="empty-card">${t('emptyTools')}</div>`;
 el.querySelectorAll('[data-request-tool]').forEach(btn=>btn.addEventListener('click',()=>openToolRequest(btn.dataset.requestTool)));
 v10ShowMore('tools',all.length);
}
const ICONS={linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0a66c2"/><path d="M5 10h3v9H5zm1.5-5a1.7 1.7 0 110 3.4 1.7 1.7 0 010-3.4zM10 10h2.8v1.3c.5-.9 1.5-1.5 2.9-1.5 3 0 3.3 2 3.3 4.5V19h-3v-4.3c0-1.1 0-2.4-1.6-2.4-1.6 0-1.8 1.2-1.8 2.4V19H10z" fill="white"/></svg>',instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ig"><stop stop-color="#feda75"/><stop offset=".45" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="0" y="0" width="24" height="24" rx="6" fill="url(#ig)"/><rect x="5" y="5" width="14" height="14" rx="4" stroke="white" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="white" stroke-width="2" fill="none"/><circle cx="17" cy="7" r="1.2" fill="white"/></svg>',youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="5" fill="#ff0033"/><path d="m10 8 7 4-7 4z" fill="#fff"/></svg>',orcid:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#a6ce39"/><circle cx="6.8" cy="7.5" r="1.2" fill="#fff"/><path fill="#fff" d="M6 10h1.7v8H6zm4.1-4h4.2c4.2 0 6.7 2.3 6.7 6s-2.5 6-6.7 6h-4.2zm3 2.2v7.6h1.2c2.7 0 4.3-1.3 4.3-3.8s-1.6-3.8-4.3-3.8z"/></svg>'};
function linkMarkup(label,url,icon){const safe=SITE.linkURL(url);if(!safe)return '';return `<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer"><span class="brand-icon">${icon}</span><span>${esc(label)}</span></a>`;}
function renderContacts(){
 const p=portfolioData.profile||{};
 const scholar='<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#4285f4"/><path d="M3 10 12 4l9 6-9 6z" fill="#fff"/><path d="M7 13v3.2c1.6 2 8.4 2 10 0V13l-5 3.1z" fill="#e9f2ff"/><path d="M20 10v6" stroke="#fff" stroke-width="1.4"/></svg>';
 const entries={
  linkedin:linkMarkup('LinkedIn',p.linkedin,ICONS.linkedin),
  instagram:linkMarkup('Instagram',p.instagram,ICONS.instagram),
  youtube:linkMarkup('YouTube',p.youtube,ICONS.youtube),
  scholar:linkMarkup('Google Scholar',p.scholar,scholar),
  orcid:linkMarkup('ORCID',p.orcid,ICONS.orcid),
  mail:'<button type="button" id="openContact"><span class="brand-icon mail">✉</span><span>Mail Me</span></button>'
 };
 const defaults=['linkedin','instagram','youtube','scholar','orcid','mail'];
 const order=Array.isArray(p.socialOrder)?p.socialOrder.filter(k=>defaults.includes(k)):[];
 const unique=[...new Set([...order,...defaults])];
 document.getElementById('contact-links').innerHTML=unique.map(key=>entries[key]||'').filter(Boolean).join('');
 document.getElementById('openContact')?.addEventListener('click',openContact);
}

function openModal(html){document.getElementById('modalContent').innerHTML=html;document.getElementById('detailModal').classList.remove('hidden');document.body.style.overflow='hidden';}
function galleryHTML(g){return Array.isArray(g)&&g.length?`<h3 class="modal-subheading">${t('documentation')}</h3><div class="gallery">${g.filter(x=>SITE.safeURL(x.url)).map(x=>`<figure>${SITE.image(x.url,'Foto dokumentasi kegiatan')}</figure>`).join('')}</div>`:'';}
function openExperience(id){const x=(portfolioData.experiences||[]).find(x=>x.id===id);if(!x)return;const activities=(trArray(x,'activities')||[]).map(a=>`<li><strong>${esc(a.title)}</strong>${a.date?` <span>${esc(a.date)}</span>`:''}${a.description?`<p>${esc(a.description)}</p>`:''}</li>`).join('');openModal(`<div class="modal-eyebrow">${t('career')}</div><h2 id="modalTitle">${esc(tr(x,'role'))}</h2><p class="modal-org">${esc(x.organization||'')} ${x.period?' · '+esc(x.period):''}</p><p>${esc(tr(x,'summary'))}</p>${trArray(x,'contributions').length?`<h3 class="modal-subheading">${t('contribution')}</h3><ul class="modal-list">${trArray(x,'contributions').map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''}${activities?`<h3 class="modal-subheading">${t('activities')}</h3><ul class="activity-list">${activities}</ul>`:''}${galleryHTML(x.gallery)}`);}
function openProject(id){
 const x=(portfolioData.projects||[]).find(x=>x.id===id);if(!x)return;
 // Cover belongs to the documentation gallery, never repeated in the detail header.
 const gallery=[],seen=new Set();
 for(const photo of x.gallery||[]){if(photo&&SITE.safeURL(photo.url)&&!seen.has(photo.url)){seen.add(photo.url);gallery.push(photo);}}
 if(SITE.safeURL(x.cover)&&!seen.has(x.cover))gallery.unshift({url:x.cover});
 openModal(`<div class="modal-eyebrow">${esc(tr(x,'category'))} ${v19Period(x)?' / '+esc(v19Period(x)):''}</div><h2 id="modalTitle">${esc(tr(x,'title'))}</h2><p class="modal-org">${esc(tr(x,'role'))} ${x.model?' · '+esc(x.model):''}</p>${x.partnerName?`<p class="v19-detail-partner">${esc(currentLanguage==='id'?'Mitra Proyek':'Project Partner')}: ${esc(x.partnerName)} ${v19SmallLogo(x.partnerLogo)}</p>`:''}<p>${esc(tr(x,'description'))}</p>${tr(x,'outputs')?`<h3 class="modal-subheading">${t('outputs')}</h3><p>${esc(tr(x,'outputs'))}</p>`:''}${galleryHTML(gallery)}`);
}
// V15 — per-session selection: at most 10 randomized photos, loaded progressively.
function shuffled(list){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function collectSlides(){
 const d=portfolioData||{},groups=new Map();
 const add=(source,url,featured=false)=>{if(!SITE.safeURL(url))return;const key=String(source);if(!groups.has(key))groups.set(key,[]);const photos=groups.get(key);if(!photos.some(p=>p.url===url))photos.push({url,featured});};
 // Manual slide entries are distinct; photos attached to a single slide record share a source.
 for(const [i,x] of (d.slides||[]).entries()){
  const key=x.sourceId||x.activityId||x.projectId?String(x.sourceId||x.activityId||x.projectId):String(x.title||'').trim().toLowerCase()?('activity:'+String(x.title).trim().toLowerCase()):('manual:'+String(x.id||i));
  add(key,x.url,true);for(const ph of x.gallery||[])add(key,ph.url,true);
 }
 const sources=[['projects',d.projects||[]],['experiences',d.experiences||[]],['otherActivities',d.otherActivities||[]]];
 let anyFeatured=false;
 for(const [type,items] of sources)for(const [i,x] of items.entries())for(const ph of x.gallery||[]){if(ph.featured)anyFeatured=true;const name=String(x.title||x.role||'').trim().toLowerCase();const source=name?'activity:'+name:type+':'+String(x.id||i);add(source,ph.url,!!ph.featured);}
 // If a project provides Featured images, use only featured images from that project.
 const chosen=shuffled([...groups.entries()].map(([source,photos])=>({source,photos:photos.filter(p=>p.featured).length?photos.filter(p=>p.featured):photos})))
   .filter(group=>group.photos.length).map(group=>shuffled(group.photos)[0]);
 try{const last=sessionStorage.getItem('asj-v19-last-slide');if(last&&chosen.length>1&&chosen[0].url===last){const n=chosen.findIndex(p=>p.url!==last);if(n>0)[chosen[0],chosen[n]]=[chosen[n],chosen[0]];}if(chosen.length)sessionStorage.setItem('asj-v19-last-slide',chosen[0].url);}catch(_e){}
 return chosen.slice(0,10);
}

let slideRequest=0, sessionSlideSelection=null;
function changeSlide(i){
 if(!activeSlides.length)return;
 const next=(i+activeSlides.length)%activeSlides.length;
 const nodes=[...document.querySelectorAll('#heroSlideshow img')],node=nodes[next];
 if(!node)return;
 const thisRequest=++slideRequest;
 const show=()=>{
  if(thisRequest!==slideRequest)return;
  slideAt=next;
  nodes.forEach((image,index)=>image.classList.toggle('active',index===slideAt));
  document.querySelectorAll('#slideDots button').forEach((b,index)=>b.classList.toggle('active',index===slideAt));
 };
 if(!node.getAttribute('src'))node.src=node.dataset.src;
 if(node.complete && node.naturalWidth){show();return;}
 // Keep the current slide visible until the selected photo has fully loaded.
 node.addEventListener('load',show,{once:true});
 node.addEventListener('error',()=>{
  // A failed photo is skipped on the next timer tick; never loop requests.
  node.dataset.failed='1';
 },{once:true});
}
function resetSlideTimer(){
 clearInterval(slideTimer);
 if(activeSlides.length>1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  slideTimer=setInterval(()=>changeSlide(slideAt+1),5000);
 }
}
function renderSlides(){
 clearInterval(slideTimer);
 if(!sessionSlideSelection)sessionSlideSelection=collectSlides();
 activeSlides=sessionSlideSelection;slideAt=0;slideRequest++;
 const el=document.getElementById('heroSlideshow'),dot=document.getElementById('slideDots');
 el.querySelectorAll('img').forEach(n=>n.remove());
 const empty=el.querySelector('.slide-empty');empty.hidden=activeSlides.length>0;
 // Only the first image receives a src. Other images are not fetched until displayed.
 activeSlides.forEach((s,i)=>{
  const im=document.createElement('img');im.dataset.src=SITE.safeURL(s.url);
  im.alt='Foto dokumentasi kegiatan';im.decoding='async';
  im.loading=i===0?'eager':'lazy';
  if(i===0){im.src=im.dataset.src;im.classList.add('active');}
  el.appendChild(im);
 });
 dot.innerHTML=activeSlides.map((_,i)=>`<button aria-label="Foto ${i+1}" data-slide="${i}" type="button"></button>`).join('');
 dot.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{changeSlide(Number(b.dataset.slide));resetSlideTimer()}));
 if(activeSlides.length){dot.querySelector('button')?.classList.add('active');}
 resetSlideTimer();
}
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

// V17 — Tool request via separate public Apps Script receiver; no download URL in page data.
let toolRequestPending=false,toolRequestSent=new Set(),toolRequestNonce='',toolRequestTimer=null,toolCurrentId='';
function toolMessage(text,ok){const n=document.getElementById('toolRequestFeedback');n.hidden=false;n.className='contact-result '+(ok?'success':'error');n.textContent=text;}
function openToolRequest(id){
 const tool=(portfolioData?.tools||[]).find(x=>x.id===id);if(!tool)return;
 toolCurrentId=id;
 const modal=document.getElementById('toolRequestModal'),form=document.getElementById('toolRequestForm');
 document.getElementById('toolRequestTitle').textContent=currentLanguage==='id'?'Permintaan Aplikasi: '+tool.name:'Request Access: '+tool.name;
 document.getElementById('toolRequestDescription').textContent=tr(tool,'description');
 modal.classList.remove('hidden');document.body.style.overflow='hidden';
 document.getElementById('toolRequestId').value=id;
 document.getElementById('toolStartedAt').value=String(Date.now());
 document.getElementById('toolRequestFeedback').hidden=true;
 const wasSent=toolRequestSent.has(id);
 form.hidden=wasSent;document.getElementById('toolRequestSubmit').disabled=wasSent||toolRequestPending;
 if(wasSent)toolMessage(currentLanguage==='id'?'Permintaan sudah dikirim. Silakan tunggu balasan melalui email.':'Request received. Please check your email for a response.',true);
}
function submitToolRequest(event){
 const form=event.target;
 if(toolRequestPending||toolRequestSent.has(toolCurrentId)){event.preventDefault();return;}
 const url=SITE.linkURL(portfolioData?.profile?.contactFormUrl||'');
 if(!url){event.preventDefault();toolMessage('Layanan permintaan belum tersedia. Silakan coba lagi nanti.',false);return;}
 form.action=url;toolRequestNonce=newContactRequestId();document.getElementById('toolRequestNonce').value=toolRequestNonce;
 toolRequestPending=true;document.getElementById('toolRequestSubmit').disabled=true;
 toolRequestTimer=setTimeout(()=>{if(!toolRequestPending)return;toolRequestPending=false;toolMessage('Konfirmasi server belum diterima. Jangan mengirim permintaan kedua sebelum memastikan email masuk.',false);},25000);
}
window.addEventListener('message',function(event){
 const d=event.data;if(!toolRequestPending||!d||d.type!=='ASJ_TOOL_RESULT_V17'||d.requestId!==toolRequestNonce)return;
 const origin=String(event.origin||'');
 if(!(origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(origin)))return;
 clearTimeout(toolRequestTimer);toolRequestPending=false;
 if(d.ok){toolRequestSent.add(toolCurrentId);document.getElementById('toolRequestForm').hidden=true;toolMessage(currentLanguage==='id'?'Permintaan berhasil dikirim. Link akan dikirim setelah ditinjau.':'Request sent. A download link may be provided after review.',true);}
 else {document.getElementById('toolRequestSubmit').disabled=false;toolMessage(d.message||'Permintaan belum terkirim.',false);}
});
document.querySelectorAll('[data-tool-close]').forEach(n=>n.addEventListener('click',()=>{document.getElementById('toolRequestModal').classList.add('hidden');document.body.style.overflow='';}));
document.getElementById('toolRequestForm').addEventListener('submit',submitToolRequest);
document.querySelectorAll('[data-close],[data-contact-close]').forEach(n=>n.addEventListener('click',closeAll));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{currentLanguage=b.dataset.lang;try{localStorage.setItem('portfolioLangV7',currentLanguage)}catch(e){};if(portfolioData)renderPortfolio(portfolioData)}));
try{if(localStorage.getItem('portfolioLangV7')==='en')currentLanguage='en';}catch(e){}
document.getElementById('navToggle').addEventListener('click',()=>document.querySelector('.topnav').classList.toggle('open'));
document.getElementById('slidePrev').addEventListener('click',()=>{changeSlide(slideAt-1);resetSlideTimer()});document.getElementById('slideNext').addEventListener('click',()=>{changeSlide(slideAt+1);resetSlideTimer()});
document.getElementById('contactForm').addEventListener('submit',submitContactSamePage);
SITE.load().then(renderPortfolio).catch(e=>{document.querySelector('.page-content').innerHTML=`<div class="empty-card">Gagal memuat data website: ${SITE.escape(e.message)}</div>`});
