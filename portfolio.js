'use strict';
let portfolioData=null, currentLanguage='id', activeSlides=[],slideAt=0,slideTimer=null;
const V10_VISIBLE_STEP=5, v10Visible={experiences:5,projects:6,publications:5,otherActivities:5,tools:5};
const TEXT={
 id:{navExperience:'Pengalaman',navProjects:'Proyek',navPubs:'Publikasi',navOtherActivities:'Other Activities',otherActivitiesLabel:'KEGIATAN LAIN',otherActivitiesTitle:'Other Activities',emptyOtherActivities:'Belum ada kegiatan lain.',otherRole:'Peran',otherOrganizer:'Penyelenggara',otherCertificate:'Lihat sertifikat',navTools:'Tools',navContact:'Kontak',heroLabel:'PROFIL',explore:'Lihat Pengalaman',slideEmpty:'Loading media...',metricRoles:'Jabatan',metricProjects:'Proyek',metricModels:'Pemodelan',metricPubs:'Publikasi',aboutLabel:'TENTANG SAYA',aboutTitle:'Tentang saya',degreeBachelor:'Sarjana',degreeMaster:'Magister',degreeDoctorate:'Doktor',graduationYear:'Lulus',affiliation:'Institusi',basedIn:'Lokasi',careerLabel:'PENGALAMAN',career:'Pengalaman Profesional',workLabel:'PROYEK & KAJIAN',work:'Proyek & Kajian',filterAll:'Semua proyek',filterModels:'Pemodelan',filterConsult:'Konsultansi / Kajian',researchLabel:'RISET',research:'Publikasi',softwareLabel:'PERANGKAT DIGITAL',software:'Tools',contactLabel:'KONTAK',messageTitle:'Kirim Pesan',messageIntro:'Silakan kirim pesan Anda. Saya akan merespons sesegera mungkin.',yourEmail:'Email Anda',yourName:'Nama Anda',institution:'Institusi / Organisasi',subject:'Subjek',message:'Pesan',contactHint:'Pengiriman diproses langsung di halaman ini.', sending:'Mengirim pesan...', contactSuccess:'Pesan berhasil terkirim. Terima kasih, saya akan merespons sesegera mungkin.', contactError:'Pesan belum berhasil dikirim. Silakan coba lagi.', contactUncertain:'Konfirmasi pengiriman belum diterima. Pesan mungkin sudah terkirim; periksa kembali sebelum mengirim ulang.', contactSessionLocked:'Pesan Anda sudah terkirim. Untuk mengirim pesan baru, refresh halaman.',sendMessage:'Kirim Pesan',details:'Lihat detail',projectDetails:'Detail proyek',readPaper:'Baca artikel',download:'Unduh aplikasi',emptyExperience:'Belum ada pengalaman profesional.',emptyProject:'Belum ada proyek pada kategori ini.',emptyPublication:'Belum ada publikasi.',emptyTools:'Belum ada aplikasi.',googleMailTitle:'Masuk dengan Google diperlukan untuk mengirim pesan.',googleMailHint:'Akun Google Anda akan diverifikasi sebelum pesan dikirim.',googleMailSigned:'Masuk sebagai: ',googleMailMissing:'Email belum diterima. Klik Masuk dengan Google lagi.',googleMailBad:'Data akun Google belum terbaca. Klik Masuk dengan Google lagi.',googleMailNotReady:'Google Sign-in belum dikonfigurasi oleh pemilik website.',googleMailFailed:'Google Sign-in belum tersedia. Silakan coba lagi.',googleMailRequired:'Silakan masuk dengan Google sebelum mengirim.',guestbookUnavailable:'Layanan unduhan belum tersedia.',guestbookUncertain:'Belum ada konfirmasi. Periksa koneksi sebelum mengirim ulang.',guestbookSignIn:'Silakan masuk dengan Google untuk mengakses unduhan.',contactNamePlaceholder:'Nama lengkap',contactOrgPlaceholder:'Nama institusi / organisasi',contactEmailPlaceholder:'nama@example.com',contactEmailHint:'Email terisi otomatis dari Google dan tidak dapat diedit. Jika masih kosong, klik Masuk dengan Google lagi.',contactNotReady:'Form Mail Me belum diaktifkan. Tambahkan URL Apps Script Contact melalui Portfolio Manager.',contribution:'Kontribusi',activities:'Kegiatan',documentation:'Dokumentasi',outputs:'Hasil dan kontribusi'},
 en:{navExperience:'Experience',navProjects:'Projects',navPubs:'Publications',navOtherActivities:'Other Activities',otherActivitiesLabel:'OTHER ACTIVITIES',otherActivitiesTitle:'Other Activities',emptyOtherActivities:'No activities yet.',otherRole:'Role',otherOrganizer:'Organizer',otherCertificate:'View certificate',navTools:'Tools',navContact:'Contact',heroLabel:'PROFILE',explore:'Explore Experience',slideEmpty:'Loading media...',metricRoles:'Roles',metricProjects:'Projects',metricModels:'Models',metricPubs:'Publications',aboutLabel:'ABOUT',aboutTitle:'About Me',degreeBachelor:'Bachelor',degreeMaster:'Master',degreeDoctorate:'Doctorate',graduationYear:'Graduated',affiliation:'Affiliation',basedIn:'Location',careerLabel:'CAREER',career:'Professional Experience',workLabel:'PROJECTS & STUDIES',work:'Projects & Studies',filterAll:'All Projects',filterModels:'Modeling',filterConsult:'Consulting / Studies',researchLabel:'RESEARCH',research:'Publications',softwareLabel:'DIGITAL TOOLS',software:'Tools',contactLabel:'CONTACT',messageTitle:'Send a Message',messageIntro:'Please leave your message, and I will respond as soon as possible.',yourEmail:'Your Email',yourName:'Your Name',institution:'Institution / Organization',subject:'Subject',message:'Message',contactHint:'Your message will be sent without opening a new tab.', sending:'Sending message...', contactSuccess:'Your message has been sent successfully. Thank you, I will respond as soon as possible.', contactError:'Your message could not be sent. Please try again.', contactUncertain:'Confirmation was not received. Your message may have been sent; please check before trying again.', contactSessionLocked:'Your message has already been sent. Refresh this page to send another message.',sendMessage:'Send Message',details:'View Details',projectDetails:'View Project',readPaper:'Read Paper',download:'Download Application',emptyExperience:'No professional experience yet.',emptyProject:'No projects in this category.',emptyPublication:'No publications yet.',emptyTools:'No tools yet.',googleMailTitle:'Sign in with Google is required before sending this message.',googleMailHint:'Your Google account is verified before sending.',googleMailSigned:'Signed in as: ',googleMailMissing:'Email was not provided. Please sign in with Google again.',googleMailBad:'Unable to read your Google account. Please sign in again.',googleMailNotReady:'Google Sign-in has not been configured by the website owner.',googleMailFailed:'Google Sign-in is unavailable. Please try again.',googleMailRequired:'Please sign in with Google before sending.',guestbookUnavailable:'Download service is unavailable.',guestbookUncertain:'No confirmation was received. Please check your connection before resubmitting.',guestbookSignIn:'Please sign in with Google to access the download.',contactNamePlaceholder:'Full name',contactOrgPlaceholder:'Institution / Organization',contactEmailPlaceholder:'name@example.com',contactEmailHint:'Email is filled automatically from Google and cannot be edited. If empty, sign in with Google again.',contactNotReady:'Mail Me is not configured yet. Add the Contact App Script URL in Portfolio Manager.',contribution:'Key Contributions',activities:'Activities & Assignments',documentation:'Documentation',outputs:'Outputs & Contributions'}
};
function t(k){return TEXT[currentLanguage][k]||k;}
function tr(x,key){if(!x)return '';const en=x.en||{};return (currentLanguage==='en' && typeof en[key]==='string' && en[key].trim())?en[key]:x[key]||'';}
function trArray(x,key){if(!x)return [];const en=x.en||{};return currentLanguage==='en' && Array.isArray(en[key]) && en[key].length ? en[key] : (x[key]||[]);}
function esc(x){return SITE.escape(x);}
function fillLangText(){document.documentElement.lang=currentLanguage;document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));document.querySelectorAll('[data-lang]').forEach(n=>{n.classList.toggle('active',n.dataset.lang===currentLanguage);n.setAttribute('aria-pressed',String(n.dataset.lang===currentLanguage));});document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>{const k=n.dataset.i18nPlaceholder;n.placeholder=t(k);});SITE.applyGuestbookLanguage(currentLanguage);pm54TranslateGoogleMail();}

// V48 — Layout settings from the published profile; no HTML injection.
const PM48_LAYOUT=[
 ['experience','#experience','navExperience'],['projects','#projects','navProjects'],
 ['publications','#publications','navPubs'],['otherActivities','#other-activities','navOtherActivities'],
 ['contact','#contact','navContact'],['academic','academic','']
];
function pm48ApplyPublicLayout(){
 const profile=portfolioData?.profile||{},raw=profile.webLayout;
 const ids=PM48_LAYOUT.map(x=>x[0]);
 const order=raw&&Array.isArray(raw.order)?raw.order.filter(id=>ids.includes(id)):[];
 const keys=[...new Set(order),...ids.filter(id=>!order.includes(id))];
 const nav=document.getElementById('topNav');
 if(!nav)return;
 const page=document.querySelector('.page-content');
 const refs={};
 PM48_LAYOUT.forEach(([key,selector])=>{
  refs[key]={anchor: key==='academic'?nav.querySelector('a.nav-portal'):nav.querySelector('a[href="'+selector+'"]'),
             section:key==='academic'?null:document.querySelector(selector)};
 });
 // Apply the same ordering to nav AND main sections, keeping hero/about unchanged.
 keys.forEach(key=>{const entry=refs[key];if(entry?.anchor)nav.appendChild(entry.anchor);if(entry?.section&&page)page.appendChild(entry.section);});
 PM48_LAYOUT.forEach(([key,,navKey])=>{
  const entry=refs[key],names=raw?.labels?.[key];
  const custom=typeof names?.[currentLanguage]==='string'&&names[currentLanguage].trim()?names[currentLanguage].trim().slice(0,42):'';
  if(custom&&entry?.anchor)entry.anchor.textContent=custom;
  else if(entry?.anchor)entry.anchor.textContent=key==='academic'?'Academic Portal':t(navKey);
  if(entry?.section){
   const heading=entry.section.querySelector('h2');
   // Use custom section titles only when actually changed from the standard nav label.
   const base=key==='academic'?'Academic Portal':t(navKey);
   if(heading&&custom&&custom!==base)heading.textContent=custom;
   else if(heading){const defaults={experience:t('career'),projects:t('work'),publications:t('researchLabel')==='RISET'?t('research'):t('research'),otherActivities:t('otherActivitiesTitle'),contact:"Let's Connect"};heading.textContent=defaults[key]||base;}
  }
 });
}

function renderPortfolio(data){portfolioData=data;const p=data.profile||{};document.title=(p.name||'Portfolio')+' — '+(currentLanguage==='id'?'Portofolio':'Professional Portfolio');fillLangText();
 document.querySelector('#profile-name').textContent=p.name||'Academic Portfolio';document.querySelector('#profile-title').textContent=tr(p,'title');document.querySelector('#profile-tagline').textContent=tr(p,'tagline');document.querySelector('#about-text').textContent=tr(p,'about')||'—';const inst=document.querySelector('#profile-institution');
  if(inst){
    const rawUrl=p.institutionUrl||'';
    const link=SITE.linkURL(rawUrl);
    const directIcon=SITE.safeURL(p.institutionIcon||'');
    const iconHost=(()=>{try{const u=new URL(p.institutionIconWebsite||rawUrl);return u.protocol==='https:'||u.protocol==='http:'?u.hostname:'';}catch(_){return '';}})();
    // V49: public snapshot contains Drive logo URLs, not repository image assets.
    const icon=directIcon;
    const text=esc(String(p.institution||'—').replace(/\s*[↗↗]\s*$/g,''));
    if(link)inst.href=link;else inst.removeAttribute('href');
    inst.innerHTML='<span class="institution-title">'+text+'</span>'+(icon?'<img class="v22-institution-logo" src="'+esc(icon)+'" alt="Logo institusi" width="24" height="24" loading="lazy" decoding="async" onerror="this.hidden=true">':'');
  }
  document.querySelector('#profile-location').textContent=p.location||'—';
 const ava=document.getElementById('profile-avatar');ava.innerHTML=SITE.safeURL(p.avatar)?SITE.image(p.avatar,p.name,'',320,true):`<span>${esc(SITE.avatarInitials(p.name))}</span>`;
 const hero=document.querySelector('.hero');if(SITE.safeURL(p.banner))hero.style.backgroundImage=`linear-gradient(100deg,rgba(13,40,55,.94),rgba(14,51,63,.83)),url("${SITE.photoURL(p.banner,1200).replaceAll('"','%22')}")`;
 document.getElementById('specialty-tags')?.remove();
 renderEducation(p);renderCertifications(p);
 document.getElementById('year').textContent=new Date().getFullYear();document.getElementById('site-owner').textContent=p.name||'';
 renderExperience();renderProjects();renderPublications();renderOtherActivities();renderContacts();renderSlides();pm24ApplyBranding(p);pm48ApplyPublicLayout();}
// V16: Education is an optional object in Profile; existing Profiles continue to work.
function pm24ApplyBranding(profile){
 const round=SITE.safeURL(profile.brandingRound||'');
 const square=SITE.safeURL(profile.brandingSquare||'');
 if(round)document.querySelectorAll('.v12-round-logo,.v12-academic-brand img,.nav-favicon').forEach(i=>{i.src=round;});
 if(square)document.querySelectorAll('link[rel="icon"]').forEach(l=>{l.href=square;});
 const link=document.getElementById('profile-institution');
 if(link){const text=link.textContent.replace(/\s*↗\s*$/,'');const logo=SITE.safeURL(profile.institutionIcon||'');link.innerHTML=(logo?`<img src="${esc(logo)}" class="v24-affiliation-logo" alt="" loading="lazy">`:'')+`<span>${esc(text)}</span><span class="v24-affiliation-arrow" aria-hidden="true">↗</span>`;if(profile.institutionUrl&&SITE.linkURL(profile.institutionUrl))link.href=SITE.linkURL(profile.institutionUrl);}
}
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
// V28 — compact certificates immediately below education, without a section title.
function renderCertifications(profile){
 const el=document.getElementById('certification-list');if(!el)return;
 const certs=Array.isArray(profile.certifications)?profile.certifications:[];
 el.hidden=!certs.length;
 el.innerHTML=certs.map(c=>{
  const icon=SITE.safeURL(c.logo||'');const name=currentLanguage==='en'?(c.nameEn||c.name):(c.name||'');
  const label=[name,c.score].filter(Boolean).join(' ');const details=[c.issuer,c.year].filter(Boolean).join(' · ');
  const html=`${icon?`<img src="${esc(icon)}" alt="" loading="lazy" decoding="async">`:''}<span><strong>${esc(label)}</strong>${details?`<small>${esc(details)}</small>`:''}</span>`;
  const url=SITE.linkURL(c.url||'');return url?`<a class="v28-cert-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${html}</a>`:`<span class="v28-cert-card">${html}</span>`;
 }).join('');
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

function renderExperience(){const el=document.getElementById('experience-list');const all=portfolioData.experiences||[],a=all.slice(0,v10Visible.experiences);el.innerHTML=all.length?a.map(x=>`<button class="experience-item" data-experience="${esc(x.id)}"><div class="experience-icon v15-company-icon">${experienceLogo(x)}</div><div class="experience-main"><div class="experience-top"><h3>${esc(tr(x,'role'))}</h3><span>${esc(v19Period(x))}</span></div><p>${esc(x.organization||'')}${x.location?' · '+esc(x.location):''}</p></div></button>`).join(''):`<div class="empty-card">${t('emptyExperience')}</div>`;el.querySelectorAll('[data-experience]').forEach(b=>b.addEventListener('click',()=>openExperience(b.dataset.experience)));v10ShowMore('experiences',all.length);}
function renderProjects(){const all=portfolioData.projects||[],list=all.slice(0,v10Visible.projects);const el=document.getElementById('project-list');el.innerHTML=all.length?list.map(x=>`<button class="project-card" data-project="${esc(x.id)}"><div class="project-cover">${SITE.safeURL(x.cover)?SITE.image(x.cover,tr(x,'title'),'',720):`<span class="project-symbol">${isModel(x)?'◎':'▧'}</span>`}${x.partnerName?`<span class="v21-partner-badge">${v19SmallLogo(x.partnerLogo,'v21-partner-logo')}<span class="v21-partner-name">${esc(x.partnerName)}</span></span>`:''}</div><div class="project-meta">${esc(v19Period(x))} ${x.model?' · '+esc(x.model):''}</div><h3>${esc(tr(x,'title'))}</h3><p>${esc(tr(x,'description'))}</p></button>`).join(''):`<div class="empty-card wide">${t('emptyProject')}</div>`;el.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.project)));v10ShowMore('projects',all.length);}
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
 // V24: published journal icons are local GitHub assets; unavailable icons show fallback.
 return '<span class="v10-pub-fallback" aria-hidden="true">▤</span>';
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
 const p=portfolioData.profile||{},el=document.getElementById('contact-links');if(!el)return;
 const legacy=[['linkedin','LinkedIn'],['instagram','Instagram'],['youtube','YouTube'],['scholar','Google Scholar'],['orcid','ORCID'],['sinta','SINTA'],['upnProfile','UPN Profile']].filter(([k])=>p[k]).map(([k,name])=>({id:'legacy-'+k,name,url:p[k],type:'link',platform:k}));
 const order=p.socialOrder||[],ordered=legacy.sort((a,b)=>(order.indexOf(a.platform)<0?999:order.indexOf(a.platform))-(order.indexOf(b.platform)<0?999:order.indexOf(b.platform)));
 const links=(Array.isArray(p.contacts)?p.contacts:ordered).filter(c=>c.type!=='mail'&&!/^(mail me|kirim pesan)$/i.test(String(c.name||'')));
 const oldMail=(p.contacts||[]).find(c=>c.type==='mail');
 const mail={id:'built-in-mail',type:'mail',name:currentLanguage==='id'?'Mail Me':'Mail Me',icon:p.mailContactIcon||oldMail?.icon||''};
 const items=[mail,...links];
 el.innerHTML=items.map(c=>{
   const name=esc(c.name||'Contact');const img=SITE.safeURL(c.icon||'')?`<img src="${esc(c.icon)}" alt="" loading="lazy">`:c.type==='mail'?'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" fill="#173e52"/><path d="M4 7l8 6 8-6" fill="none" stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>':(c.platform&&ICONS[c.platform]?ICONS[c.platform]:'↗');
   const body=`<span class="brand-icon v28-contact-icon">${img}</span><span>${name}</span>`;
   if(c.type==='mail')return `<button type="button" data-v28-mail>${body}</button>`;
   const u=SITE.linkURL(c.url||'');return u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${body}</a>`:'';
 }).join('');
 el.querySelectorAll('[data-v28-mail]').forEach(b=>b.addEventListener('click',openContact));
}

function openModal(html){document.getElementById('modalContent').innerHTML=html;document.getElementById('detailModal').classList.remove('hidden');document.body.style.overflow='hidden';}
function galleryHTML(g){return Array.isArray(g)&&g.length?`<h3 class="modal-subheading">${t('documentation')}</h3><div class="gallery">${g.filter(x=>SITE.safeURL(x.url)).map(x=>`<figure>${SITE.image(x.url,'Foto dokumentasi kegiatan','',1200)}</figure>`).join('')}</div>`:'';}
function openExperience(id){const x=(portfolioData.experiences||[]).find(x=>x.id===id);if(!x)return;const activities=(trArray(x,'activities')||[]).map(a=>`<li><strong>${esc(a.title)}</strong>${a.date?` <span>${esc(a.date)}</span>`:''}${a.description?`<p>${esc(a.description)}</p>`:''}</li>`).join('');openModal(`<div class="modal-eyebrow">${t('career')}</div><h2 id="modalTitle">${esc(tr(x,'role'))}</h2><p class="modal-org">${esc(x.organization||'')} ${x.period?' · '+esc(x.period):''}</p>${trArray(x,'contributions').length?`<h3 class="modal-subheading">${t('contribution')}</h3><ul class="modal-list">${trArray(x,'contributions').map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''}${activities?`<h3 class="modal-subheading">${t('activities')}</h3><ul class="activity-list">${activities}</ul>`:''}${galleryHTML(x.gallery)}`);}
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
 const empty=el.querySelector('.slide-empty');if(empty)empty.hidden=!activeSlides.length;
 // Only the first image receives a src. Other images are not fetched until displayed.
 activeSlides.forEach((s,i)=>{
  const im=document.createElement('img');im.dataset.src=SITE.photoURL(s.url,1200);
  im.alt='Foto dokumentasi kegiatan';im.decoding='async';
  im.loading=i===0?'eager':'lazy';
  if(i===0){im.fetchPriority='high';im.addEventListener('load',()=>{if(empty)empty.hidden=true;},{once:true});im.addEventListener('error',()=>{if(empty)empty.hidden=true;},{once:true});im.src=im.dataset.src;im.classList.add('active');if(im.complete&&empty)empty.hidden=true;}
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
let pm49GISLoading=null;
function pm49LoadGIS(){
 if(window.google?.accounts?.id)return Promise.resolve();
 if(pm49GISLoading)return pm49GISLoading;
 pm49GISLoading=new Promise((resolve,reject)=>{
  const tag=document.createElement('script');tag.src='https://accounts.google.com/gsi/client';tag.async=true;tag.defer=true;
  tag.onload=()=>window.google?.accounts?.id?resolve():reject(Error('Google Sign-in unavailable'));
  tag.onerror=()=>reject(Error('Could not load Google Sign-in'));
  document.head.appendChild(tag);
 });return pm49GISLoading;
}
// V54: Repaint Sign-in messages without invalidating an existing Google credential.
function pm54TranslateGoogleMail(){
 const title=document.getElementById('pm49GoogleTitle');if(title)title.textContent=t('googleMailTitle');
 const status=document.getElementById('pm49GoogleStatus');
 if(status){const state=status.dataset.pm54State||'googleMailHint';status.textContent=t(state)+(state==='googleMailSigned'?(status.dataset.pm54Email||''):'');}
}
function pm54GoogleState(state,email=''){
 const status=document.getElementById('pm49GoogleStatus');if(!status)return;
 status.dataset.pm54State=state;status.dataset.pm54Email=email;
 pm54TranslateGoogleMail();
}
function pm49SetupGoogleMail(p){
 const form=document.getElementById('contactForm');if(!form)return;
 let area=document.getElementById('pm49GoogleArea');
 if(!area){area=document.createElement('div');area.id='pm49GoogleArea';area.className='pm49-google';form.prepend(area);}
 let hidden=document.getElementById('pm49GoogleCredential');
 if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.name='googleCredential';hidden.id='pm49GoogleCredential';form.append(hidden);}
 const emailHint=document.getElementById('pm53ContactEmailHint');
 form.dataset.googleRequired=p.mailGoogleRequired===true?'true':'false';
 if(emailHint)emailHint.hidden=p.mailGoogleRequired!==true;
 if(p.mailGoogleRequired!==true){area.hidden=true;area.innerHTML='';hidden.value='';const email=form.querySelector('[name="sender"]');if(email){email.readOnly=false;email.removeAttribute('aria-readonly');email.value='';email.placeholder=t('contactEmailPlaceholder');}return;}
 area.hidden=false;
 const email=form.querySelector('[name="sender"]');
 if(email){email.readOnly=true;email.setAttribute('aria-readonly','true');email.value='';email.placeholder='Sign in with Google to fill your email';}
 const clientId=String(p.mailGoogleClientId||'');
 area.innerHTML='<p id="pm49GoogleTitle"></p><div id="pm49GoogleButton"></div><small id="pm49GoogleStatus"></small>';
 pm54GoogleState('googleMailHint');
 if(!/^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)){
  pm54GoogleState('googleMailNotReady');return;
 }
 pm49LoadGIS().then(()=>{
  if(!document.getElementById('pm49GoogleButton'))return;
  window.google.accounts.id.initialize({client_id:clientId,callback:response=>{
   const credential=String(response?.credential||'');if(!credential)return;
   hidden.value=credential;
   // Display convenience only; the Mailer will validate the signed ID token.
   try{const part=credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const data=JSON.parse(atob(part));
    const email=form.querySelector('[name="sender"]');if(email){email.value=String(data.email||'').slice(0,254);email.readOnly=true;}
    if(!email?.value){hidden.value='';pm54GoogleState('googleMailMissing');return;}
    const name=form.querySelector('[name="fullName"]');if(name&&data.name)name.value=String(data.name).slice(0,100);
    pm54GoogleState('googleMailSigned',String(data.email||''));
   }catch(_){hidden.value='';pm54GoogleState('googleMailBad');}
  }});
  // V61: official GIS medium button is not personalized; do not show remembered account until token callback.
  window.google.accounts.id.renderButton(document.getElementById('pm49GoogleButton'),{theme:'outline',size:'medium',width:190,text:'signin_with',shape:'rectangular',locale:document.documentElement.lang==='en'?'en':'id'});
 }).catch(err=>{const stat=document.getElementById('pm49GoogleStatus');if(stat)pm54GoogleState('googleMailFailed');});
}
function openContact(){
 const p=portfolioData.profile||{},modal=document.getElementById('contactModal'),form=document.getElementById('contactForm'),url=SITE.linkURL(p.contactFormUrl||'');
 modal.classList.remove('hidden');document.body.style.overflow='hidden';
 pm49SetupGoogleMail(p);
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
 if(p.mailGoogleRequired===true && (!document.getElementById('pm49GoogleCredential')?.value || !document.getElementById('senderMail')?.value)){
  event.preventDefault();contactFeedback(t('googleMailRequired'),'error');return;
 }
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
let toolRequestPending=false,toolRequestSent=new Map(),toolRequestNonce='',toolRequestTimer=null,toolCurrentId='';
function toolMessage(text,ok){const n=document.getElementById('toolRequestFeedback'),near=document.getElementById('pm58FormFeedback'),form=document.getElementById('toolRequestForm');if(form&&!form.hidden){n.hidden=true;n.textContent='';if(near){near.hidden=!text;near.textContent=text||'';near.className='pm58-form-feedback '+(ok?'pm58-form-progress':'pm58-form-error');}return;}if(near){near.hidden=true;near.textContent='';}n.hidden=false;n.className=ok?(text?'v54-download-pending':'v54-download-ready'):'contact-result error';n.textContent=text;}

function toolGuestbookLink(url){if(!/^https:\/\//i.test(String(url||'')))return;const n=document.getElementById('toolRequestFeedback'),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.dataset.downloadResource=toolCurrentId;a.className='v36-download-link';a.textContent=currentLanguage==='id'?'↓ Download aplikasi':'↓ Download application';n.appendChild(a);}
function openToolRequest(id){
 const tool=(portfolioData?.tools||[]).find(x=>x.id===id);if(!tool)return;
 toolCurrentId=id;
 const modal=document.getElementById('toolRequestModal'),form=document.getElementById('toolRequestForm');
 document.getElementById('toolRequestTitle').textContent=tool.name;
 document.getElementById('toolRequestDescription').textContent=tr(tool,'description');
 const mobileNotice=document.getElementById('pm55MobileNotice');
 if(mobileNotice){mobileNotice.hidden=!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');mobileNotice.textContent=currentLanguage==='id'?'Informasi unduhan: Pengunduhan mungkin tidak berjalan otomatis di HP. Jika mengalami kendala, silakan gunakan komputer atau laptop.':'Download information: Downloads may not start automatically on mobile devices. If you experience issues, please use a desktop or laptop computer.';}
 modal.classList.remove('hidden');document.body.style.overflow='hidden';
 SITE.guestbookLogin(portfolioData?.profile||{});
 document.getElementById('toolRequestId').value=id;
 document.getElementById('toolStartedAt').value=String(Date.now());
 document.getElementById('toolRequestFeedback').hidden=true;
 const near=document.getElementById('pm58FormFeedback');if(near){near.hidden=true;near.textContent='';}
 const wasSent=toolRequestSent.has(id);
 form.hidden=wasSent;document.getElementById('pm51GuestbookLogin').hidden=wasSent;document.getElementById('toolRequestSubmit').disabled=wasSent||toolRequestPending;
 if(wasSent){toolMessage('',true);toolGuestbookLink(toolRequestSent.get(id));}
}
function submitToolRequest(event){
 const form=event.target;
 if(toolRequestPending||toolRequestSent.has(toolCurrentId)){event.preventDefault();return;}
 if(!SITE.guestbookReady(form)){event.preventDefault();toolMessage(t('guestbookSignIn'),false);return;}
 const url=SITE.linkURL(portfolioData?.profile?.toolGuestbookUrl||'');
 if(!url){event.preventDefault();toolMessage(t('guestbookUnavailable'),false);return;}
 form.action=url;toolRequestNonce=newContactRequestId();document.getElementById('toolRequestNonce').value=toolRequestNonce;
 toolRequestPending=true;document.getElementById('toolRequestSubmit').disabled=true;toolMessage(currentLanguage==='id'?'Mohon tunggu...':'Please wait...',true);
 toolRequestTimer=setTimeout(()=>{if(!toolRequestPending)return;toolRequestPending=false;toolMessage(t('guestbookUncertain'),false);},25000);
}
window.addEventListener('message',function(event){
 const d=event.data;if(!toolRequestPending||!d||d.type!=='ASJ_GUESTBOOK_RESULT_V36'||d.requestId!==toolRequestNonce)return;
 const origin=String(event.origin||'');
 if(!(origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(origin)))return;
 clearTimeout(toolRequestTimer);toolRequestPending=false;
 if(d.ok&&/^https:\/\//i.test(String(d.url||''))){toolRequestSent.set(toolCurrentId,d.url);document.getElementById('toolRequestForm').hidden=true;document.getElementById('pm51GuestbookLogin').hidden=true;toolMessage('',true);toolGuestbookLink(d.url);}
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
SITE.loadPortfolio().then(renderPortfolio).catch(e=>{document.querySelector('.page-content').innerHTML=`<div class="empty-card">Gagal memuat data website: ${SITE.escape(e.message)}</div>`});
