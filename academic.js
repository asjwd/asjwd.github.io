"use strict";
// V42: render nonempty Academic entries even when no link/material URL is available; avoid initial flashes.
let acData=null,acLanguage='id',acSelectedId='',acRows=null,acRequestSeq=0,acVisible=20;
let acToolId='',acRequestBusy=false,acNonce='',acRequestTimer=null;
let ac58ServerUpnDenied=false;
let ac55OpenCourseId='';
let ac71OpenId='';
const ac71GradeCache=new Map();
const acSentTools=new Map();
const TXT={
 id:{navGrades:'Pengumuman',navTools:'Tools',servicesLabel:'LAYANAN AKADEMIK',servicesHeading:'Layanan Akademik',coursesLabel:'MATERI KULIAH',coursesHeading:'Mata Kuliah & Materi',portalEmpty:'Belum ada pengumuman atau materi yang dibagikan. Silakan kembali lagi nanti.',openService:'Buka layanan',noServiceLink:'Tautan layanan belum dibagikan.',noMaterials:'Belum ada materi yang dibagikan untuk mata kuliah ini.',portalLoadError:'Gagal memuat data Academic Portal. Silakan muat ulang halaman.',portalLoading:'Memuat Academic Portal...',searchLabel:'AKSES MAHASISWA',searchHeading:'Cari akses mahasiswa',searchButton:'Cari',searchPlaceholder:'Masukkan nama atau NPM',searchResponse:'Anda tidak memiliki akses khusus.',gradesLabel:'AKADEMIK',gradesHeading:'Pengumuman',selectBoard:'Pilih mata kuliah',selectPlaceholder:'Pilih mata kuliah',noBoards:'Tidak ada pengumuman nilai saat ini.',loading:'Memuat nilai...',pick:'Pilih mata kuliah untuk melihat pengumuman nilai.',error:'Nilai gagal dimuat. Silakan coba lagi.',rank:'No.',npm:'NPM',firstName:'Nama',score:'Nilai Akhir',grade:'Grade',showMore:'Lihat lebih banyak',showLess:'Tampilkan lebih sedikit',until:'Dapat dilihat hingga',students:'mahasiswa',request:'Minta Link',toolsLabel:'PERANGKAT DIGITAL',toolsHeading:'Tools',requestTitle:'Permintaan aplikasi',requestSuccess:'',requestError:'Permintaan belum terkirim.',requestAwait:'Mohon tunggu...', signInNeeded:'Silakan masuk dengan Google untuk mengakses unduhan.',serviceUnavailable:'Layanan belum tersedia.',requestUncertain:'Belum ada konfirmasi. Periksa koneksi sebelum mencoba kembali.',toolGuestTitle:'',courseInfo:'Materi kuliah: ',upnOnly:'Khusus Akun UPN',mobileNotice:'Informasi unduhan: Pengunduhan mungkin tidak berjalan otomatis di HP. Jika mengalami kendala, silakan gunakan komputer atau laptop.',moreMaterials:'Lihat semua materi',close:'Tutup'},
 en:{navGrades:'Announcements',navTools:'Tools',servicesLabel:'ACADEMIC SERVICES',servicesHeading:'Academic Services',coursesLabel:'COURSES',coursesHeading:'Courses & Materials',portalEmpty:'There are no announcements or materials available at the moment. Please check back later.',openService:'Open service',noServiceLink:'A service link has not been shared yet.',noMaterials:'No materials have been shared for this course yet.',portalLoadError:'Unable to load Academic Portal data. Please reload the page.',portalLoading:'Loading Academic Portal...',searchLabel:'STUDENT ACCESS',searchHeading:'Student access search',searchButton:'Search',searchPlaceholder:'Enter name or student ID (NPM)',searchResponse:'You do not have special access.',gradesLabel:'ACADEMIC',gradesHeading:'Announcements',selectBoard:'Select Course',selectPlaceholder:'Select Course',noBoards:'No grade announcements are currently available.',loading:'Loading grades...',pick:'Select a course to view its grades.',error:'Unable to load grades. Please try again.',rank:'No.',npm:'Student ID',firstName:'First name',score:'Final Score',grade:'Grade',showMore:'Show more',showLess:'Show less',until:'Available until',students:'students',request:'Request Download',toolsLabel:'DIGITAL TOOLS',toolsHeading:'Tools',requestTitle:'Application request',requestSuccess:'',requestError:'Your request was not sent.',requestAwait:'Please wait...', signInNeeded:'Please sign in with Google to access the download.',serviceUnavailable:'Download service is unavailable.',requestUncertain:'No confirmation received. Please check your connection before trying again.',toolGuestTitle:'',courseInfo:'Course material: ',upnOnly:'UPN Account Only',mobileNotice:'Download information: Downloads may not start automatically on mobile devices. If you experience issues, please use a desktop or laptop computer.',moreMaterials:'Show more...',close:'Close'}
};
const T=k=>TXT[acLanguage][k]||k;
const E=x=>SITE.escape(x);
const $=id=>document.getElementById(id);
function acLetter(x){if(x===null||x===undefined||String(x).trim()===''||!Number.isFinite(Number(x)))return '';const s=Number(x);return s>=85?'A':s>=80?'A-':s>=75?'B+':s>=70?'B':s>=65?'B-':s>=60?'C+':s>=55?'C':s>=50?'D':'E';}
function acBoards(){return acData?.gradeBoards||[];}
function acDate(t){return new Intl.DateTimeFormat(acLanguage==='id'?'id-ID':'en-GB',{timeZone:'Asia/Jakarta',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' WIB';}
function acPreview(state,text){if(!$('grade-table'))return;$('grade-table').innerHTML=`<div class="${state==='loading'?'v24-spin':'empty-card'}" role="status">${E(text)}</div>`;}
function acTheme(){
 document.documentElement.lang=acLanguage;
 document.querySelectorAll('[data-ac-i18n]').forEach(n=>n.textContent=T(n.dataset.acI18n));
 document.querySelectorAll('[data-ac-lang]').forEach(b=>{b.classList.toggle('active',b.dataset.acLang===acLanguage);b.setAttribute('aria-pressed',String(b.dataset.acLang===acLanguage));});
 $('studentQuery').placeholder=T('searchPlaceholder');
 if(!$('studentSearchResponse').hidden)$('studentSearchResponse').textContent=T('searchResponse');
 if(!acData && $('v35-ac-loading'))$('v35-ac-loading').textContent=(TXT[acLanguage].portalLoading||'Memuat Academic Portal...');
 if(acData){ac71Render();acRenderTools();acRenderVisibility();acUpdateRequestLanguage();}
 SITE.applyGuestbookLanguage(acLanguage);
 if(window.CT66)CT66.applyLanguage();
 try{localStorage.setItem('portfolioLangV7',acLanguage);}catch(_){ }
}
// V54: translated descriptions are prepared at Publish in private Apps Script.
// Book and application names remain as entered. Course names use titleId/en.title from Publish.
function ac55CourseTitle(course){
 if(!course)return '';
 if(acLanguage==='id')return String(course.titleId||course.title||course.course||'Course');
 return String(course.en?.title||course.title||course.course||'Course');
}
function acDescription(item){
 if(!item)return '';
 if(acLanguage==='id')return String(item.descriptionId||item.description||'');
 return String(item.en?.description||item.description||'');
}
function acFeatures(item){
 if(acLanguage==='id')return item.featuresId||item.features||[];
 return item.en?.features||item.features||[];
}
function acRequestItem(id){
 const tool=(acData?.tools||[]).find(t=>String(t.id)===String(id));
 if(tool)return {name:tool.name||'',description:acDescription(tool)};
 if(String(id).startsWith('mat:')){
  for(const course of acData?.courses||[]){
   const material=acCourseMaterials(course).find(m=>String(m.materialRequestId)===String(id));
   if(material)return {name:material.title||'Material',description:T('courseInfo')+ac55CourseTitle(course),upnOnly:material.upnOnly===true};
  }
 }
 return null;
}
function acUpdateRequestLanguage(){
 if($('toolRequestModal')?.classList.contains('hidden')||!acToolId)return;
 const item=acRequestItem(acToolId);if(!item)return;
 $('toolRequestTitle').textContent=item.name;
 $('toolRequestDescription').textContent=item.description;
 ac55UpdateNotices(item);ac58SyncUPN();
 // Only the label is retranslated; an active signed-in form remains intact.
}
function acApplyBrand(profile){
 const round=SITE.safeURL(profile?.brandingRound||'');
 const square=SITE.safeURL(profile?.brandingSquare||'');
 if(round){const img=document.querySelector('.v12-academic-brand img');if(img)img.src=round;}
 if(square)document.querySelectorAll('link[rel="icon"]').forEach(link=>link.href=square);
}
function acLoadSite(data){
 acData=data;acApplyBrand(data.profile||{});ac63LoadInstitutionLogo(data.profile||{});
 const appt=$('v66Appointment'),link=String(data.profile?.appointmentLink||'').trim();
 if(appt&&/^https:\/\/(?:calendar\.google\.com|calendar\.app\.google)\//i.test(link)){appt.href=link;appt.hidden=false;}else if(appt)appt.hidden=true;
 if(window.CT66)CT66.init(data);
 ac71Render();
 ac71OpenLinked();
 acRenderTools();
 acRenderVisibility();
 acVisibilitySet($('v35-ac-loading'),false);
}
function acRenderGrade(){
 const board=acBoards().find(b=>String(b.id)===acSelectedId);
 if(!board||!$('grade-table'))return;
 if(!acRows){acPreview('loading',T('loading'));return;}
 const originalColumns=Array.isArray(board.columns)?board.columns:[];
 const shownIndices=originalColumns.map((_,i)=>i).filter(i=>acRows.some(r=>String((r.extras||[])[i]??'').trim()!==''));
 const columns=shownIndices.map(i=>originalColumns[i]),withGrade=board.showGrade!==false;
 const rows=acRows.map((r,i)=>({...r,__i:i})).sort((a,b)=>Number(a.rank??a.__i+1)-Number(b.rank??b.__i+1));
 const hidden=board.hiddenCore||{};
 const head=`<th>${T('rank')}</th>${hidden.npm?'':`<th>${T('npm')}</th>`}${hidden.name?'':`<th>${T('firstName')}</th>`}${hidden.score?'':`<th>${E(board.scoreHeader||T('score'))}</th>`}${withGrade?`<th>${T('grade')}</th>`:''}${columns.map(c=>`<th>${E(c)}</th>`).join('')}`;
 const body=rows.slice(0,acVisible).map((r,i)=>`<tr><td>${i+1}</td>${hidden.npm?'':`<td class="mono">${E(r.npm||'')}</td>`}${hidden.name?'':`<td>${E(r.name||'')}</td>`}${hidden.score?'':`<td><strong>${E(r.score??'')}</strong></td>`}${withGrade?`<td>${acLetter(r.score)?`<span class="grade-pill">${E(acLetter(r.score))}</span>`:''}</td>`:''}${shownIndices.map(j=>`<td>${E((r.extras||[])[j]??'')}</td>`).join('')}</tr>`).join('');
 $('grade-table').innerHTML=`<div class="grade-summary"><div><strong>${E(board.course||'')}</strong><span>${E(board.className||'')} · ${E(board.period||'')} · ${rows.length} ${T('students')}</span></div></div><div class="table-scroll"><table class="grades-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
 if(rows.length>acVisible){const container=document.createElement('div');container.className='v10-ac-more';const btn=document.createElement('button');btn.type='button';btn.className='v10-ac-btn';btn.textContent=`${T('showMore')} (${rows.length-acVisible})`;btn.onclick=()=>{acVisible=Math.min(rows.length,acVisible+20);acRenderGrade()};container.append(btn);$('grade-table').append(container);}
}

// V34 visibility: toggles come from the Google Sheets profile and are published in site.json.
// Empty/off sections are both hidden. The student search is bundled with Academic Services.
function acSectionOn(key){const a=acData?.profile?.academicVisibility;return !a||a[key]!==false;}
function acValidExternalURL(x){
 try{const u=new URL(String(x||''));return ['https:','http:'].includes(u.protocol)&&Boolean(u.hostname)&&!u.username&&!u.password;}catch(_){return false;}
}
function acHasText(x){return String(x??'').trim().length>0;}
function acServicesAvailable(){
 // V34 rejected all legacy service entries without URLs, despite their visible titles and descriptions.
 // An entry with meaningful content is visible; its outbound link is optional.
 return (Array.isArray(acData?.portalLinks)?acData.portalLinks:[])
  .filter(s=>s&&typeof s==='object'&&(acHasText(s.title)||acHasText(s.name)||acHasText(s.description)||acValidExternalURL(s.url)));
}
function acCourseMaterials(c){
 return (Array.isArray(c?.materials)?c.materials:[])
  .map((m,i)=>({ ...m,materialRequestId:m?.materialRequestId||('mat:'+String(c.id||'')+':'+i) }))
  .filter(m=>m&&(m.requestAvailable===true||acValidExternalURL(m.url)));
}
function acCoursesAvailable(){
 // The course card itself is content, even when the materials array is still empty.
 return (Array.isArray(acData?.courses)?acData.courses:[])
  .filter(c=>c&&typeof c==='object'&&(acHasText(c.title)||acHasText(c.course)||acHasText(c.period)||acHasText(c.description)||acCourseMaterials(c).length>0));
}
function acToolsAvailable(){return (Array.isArray(acData?.tools)?acData.tools:[]).filter(t=>t?.requestAvailable===true);}
function acVisibilitySet(el,show){if(!el)return;el.hidden=!show;if(show)el.style.removeProperty('display');else el.style.display='none';}
// V63: the restricted-material marker uses exactly the logo shown in About Me.
// The public academic subset intentionally does not include institutionIcon; read it
// from the already-published public Portfolio profile (no private Drive ID or URL here).
let ac63InstitutionLogo='',ac63LogoRequest=null;
function ac63LogoBadge(){
 return `<span class="pm63-upn-slot" title="${E(T('upnOnly'))}"><span class="pm63-upn-fallback">UPN</span></span>`;
}
function ac63ApplyInstitutionLogo(){
 if(!ac63InstitutionLogo)return;
 document.querySelectorAll('.pm63-upn-slot').forEach(slot=>{
  if(slot.dataset.logoSrc===ac63InstitutionLogo)return;
  slot.dataset.logoSrc=ac63InstitutionLogo;
  const img=document.createElement('img');
  img.className='pm55-upn-icon';img.alt='';img.loading='lazy';img.decoding='async';
  img.addEventListener('load',()=>{if(img.isConnected)slot.classList.add('pm63-upn-ready');},{once:true});
  img.addEventListener('error',()=>{slot.classList.remove('pm63-upn-ready');slot.dataset.logoSrc='';img.remove();},{once:true});
  img.src=ac63InstitutionLogo;slot.prepend(img);
 });
}
function ac63LoadInstitutionLogo(profile){
 const direct=SITE.safeURL(profile?.institutionIcon||'');
 if(direct){ac63InstitutionLogo=direct;ac63ApplyInstitutionLogo();return;}
 if(ac63LogoRequest)return;
 ac63LogoRequest=SITE.loadPortfolio().then(data=>{
  const logo=SITE.safeURL(data?.profile?.institutionIcon||'');
  if(logo){ac63InstitutionLogo=logo;ac63ApplyInstitutionLogo();}
 }).catch(()=>{ /* Keep readable UPN fallback when the public profile is unavailable. */ });
}
// A separate list bullet keeps the bullet on the first line for long titles.
function ac55MaterialHTML(m){
 const name=String(m.title||(acLanguage==='id'?'Materi':'Material'));
 const badge=m.upnOnly===true?ac63LogoBadge():'';
 return `<li><button type="button" class="v42-material-link pm55-material-button" data-material-request="${E(m.materialRequestId)}" aria-label="${E(name)}${m.upnOnly===true?' — '+E(T('upnOnly')):''}"><span>${E(name)}</span>${badge}<span class="pm55-external" aria-hidden="true">↗</span></button></li>`;
}
function ac55PopulateCourseMore(id){
 const course=acCoursesAvailable().find(c=>String(c.id)===String(id));
 if(!course){ac55CloseCourseMore();return;}
 const modal=$('pm55CourseModal'),list=$('pm55CourseMaterials');if(!modal||!list)return;
 $('pm55CourseTitle').textContent=ac55CourseTitle(course);
 $('pm55CoursePeriod').textContent=course.period||'';
 list.innerHTML=acCourseMaterials(course).map(ac55MaterialHTML).join('');ac63ApplyInstitutionLogo();
 list.querySelectorAll('[data-material-request]').forEach(b=>b.addEventListener('click',()=>{ac55CloseCourseMore();acOpenRequest(b.dataset.materialRequest);}));
 $('pm55CloseCourse').textContent=T('close');
}
function ac55OpenCourseMore(id){
 ac55OpenCourseId=String(id);ac55PopulateCourseMore(id);
 $('pm55CourseModal').classList.remove('hidden');document.body.style.overflow='hidden';
 $('pm55CloseCourse').focus();
}
function ac55CloseCourseMore(){
 ac55OpenCourseId='';const modal=$('pm55CourseModal');if(modal)modal.classList.add('hidden');
 if($('toolRequestModal')?.classList.contains('hidden'))document.body.style.overflow='';
}
function ac55UpdateNotices(item){
 const upn=$('pm55UpnNotice'),mobile=$('pm55MobileNotice');
 if(upn){upn.hidden=item?.upnOnly!==true;upn.textContent=T('upnOnly')+' — @upnjatim.ac.id / @student.upnjatim.ac.id';}
 if(mobile){mobile.hidden=!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');mobile.textContent=T('mobileNotice');}
}
function acRenderVisibility(){
 if(!acData)return;
 const services=acSectionOn('portalLinks')?acServicesAvailable():[];
 const courses=acSectionOn('courses')?acCoursesAvailable():[];
 const boards=ac71Announcements();
 const tools=acSectionOn('tools')?acToolsAvailable():[];
 acVisibilitySet($('academic-services'),services.length>0);
 acVisibilitySet($('academic-courses'),courses.length>0);
 acVisibilitySet($('grades'),boards.length>0);
 acVisibilitySet($('academic-tools'),tools.length>0);
 acVisibilitySet($('v34-ac-empty'),!(services.length||courses.length||boards.length||tools.length));
 $('academic-services-list').innerHTML=services.map(s=>{
  const url=acValidExternalURL(s.url)?String(s.url):'';
  const link=url?`<a href="${E(url)}" target="_blank" rel="noopener noreferrer">${T('openService')} ↗</a>`:`<span class="v35-link-pending">${T('noServiceLink')}</span>`;
  return `<article class="v34-ac-card"><h3>${E(s.title||s.name||'Academic Service')}</h3>${acDescription(s)?`<p>${E(acDescription(s))}</p>`:''}${link}</article>`;
 }).join('');
 $('academic-courses-list').innerHTML=courses.map(c=>{
  const materials=acCourseMaterials(c);
  const list=materials.length?`<ul class="v34-materials pm55-materials">${materials.slice(0,4).map(ac55MaterialHTML).join('')}</ul>${materials.length>4?`<button type="button" class="pm55-show-more" data-course-more="${E(c.id)}">${T('moreMaterials')}</button>`:''}`:`<p class="v35-link-pending">${T('noMaterials')}</p>`;
  return `<article class="v34-ac-card"><h3>${E(ac55CourseTitle(c))}</h3>${c.period?`<div class="v34-course-meta">${E(c.period)}</div>`:''}${acDescription(c)?`<p>${E(acDescription(c))}</p>`:''}${list}</article>`;
 }).join('');
 ac63ApplyInstitutionLogo();
 $('academic-courses-list').querySelectorAll('[data-material-request]').forEach(b=>b.addEventListener('click',()=>acOpenRequest(b.dataset.materialRequest)));
 $('academic-courses-list').querySelectorAll('[data-course-more]').forEach(b=>b.addEventListener('click',()=>ac55OpenCourseMore(b.dataset.courseMore)));
 if(ac55OpenCourseId)ac55PopulateCourseMore(ac55OpenCourseId);
}

function acRenderTools(){
 if(!acData)return;
 const list=acSectionOn('tools')?acToolsAvailable().slice(0,5):[];
 acVisibilitySet($('academic-tools'),list.length>0);
 $('academic-tools-list').innerHTML=list.map(x=>`<div class="tool-card"><div class="tool-icon">${E((x.name||'A')[0])}</div><div class="tool-body"><div class="tool-header"><h3>${E(x.name||'')}</h3>${x.version?`<span>${E(x.version)}</span>`:''}</div><p>${E(acDescription(x))}</p><div class="tags">${acFeatures(x).map(f=>`<span class="tag">${E(f)}</span>`).join('')}</div></div><button type="button" class="btn v17-request-button" data-tool="${E(x.id)}" ${x.requestAvailable===false?'disabled':''}>${T('request')}</button></div>`).join('');
 $('academic-tools-list').querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>acOpenRequest(b.dataset.tool)));
}
// V58: domain mismatch is signaled near Submit, but Mailer makes final access decision.
function ac58AllowedUPN(email){return /^[^\s@]+@(?:upnjatim\.ac\.id|student\.upnjatim\.ac\.id)$/i.test(String(email||'').trim());}
function ac58NearForm(message,problem){
 const node=$('pm58FormFeedback');if(!node)return;
 node.hidden=!message;node.textContent=message||'';
 node.className='pm58-form-feedback'+(problem?' pm58-form-error':' pm58-form-progress');
}
function ac58SyncUPN(){
 const item=acRequestItem(acToolId),email=String($('toolRequesterEmail')?.value||'').trim();
 const limited=item?.upnOnly===true;
 const invalid=limited&&!!email&&!ac58AllowedUPN(email);
 const denied=invalid||ac58ServerUpnDenied;
 const warning=$('pm58UpnDenied');
 if(warning){warning.hidden=!denied;warning.textContent=acLanguage==='en'
  ?'UPN Account Required — This material is available only to @upnjatim.ac.id or @student.upnjatim.ac.id Google accounts. Please sign in with your institutional account.'
  :'UPN Account Required — Materi ini hanya tersedia untuk akun @upnjatim.ac.id atau @student.upnjatim.ac.id. Silakan masuk menggunakan akun Google institusi.';}
 const button=$('toolRequestSubmit');
 if(button)button.disabled=denied||acRequestBusy||acSentTools.has(acToolId);
 if(denied)ac58NearForm('',false);
 return !denied;
}
document.addEventListener('pm58-guestbook-identity',()=>{
 ac58ServerUpnDenied=false;
 if(acToolId&& !$('toolRequestModal')?.classList.contains('hidden'))ac58SyncUPN();
});
function acOpenRequest(id){
 const item=acRequestItem(id);if(!item)return;
 acToolId=id;ac58ServerUpnDenied=false;ac58NearForm('',false);
 $('toolRequestTitle').textContent=item.name;
 $('toolRequestDescription').textContent=item.description;
 ac55UpdateNotices(item);
 $('toolRequestModal').classList.remove('hidden');document.body.style.overflow='hidden';
 SITE.guestbookLogin(acData?.profile||{});
 SITE.applyGuestbookLanguage(acLanguage);
 $('toolRequestId').value=id;$('toolStartedAt').value=Date.now();
 $('toolRequestFeedback').hidden=true;$('toolRequestForm').hidden=acSentTools.has(id);$('pm51GuestbookLogin').hidden=acSentTools.has(id);
 $('toolRequestSubmit').disabled=acSentTools.has(id)||acRequestBusy;ac58SyncUPN();
 if(acSentTools.has(id)){acToolMessage('',true);acToolLink(acSentTools.get(id));}
}
function acToolMessage(msg,success){const el=$('toolRequestFeedback');if(!$('toolRequestForm').hidden){el.hidden=true;el.textContent='';ac58NearForm(msg,!success);return;}ac58NearForm('',false);el.hidden=false;el.className=success?(msg?'v54-download-pending':'v54-download-ready'):'contact-result error';el.textContent=msg;}
function acSuccessText(){return '';}
function acToolLink(url){if(!/^https:\/\//i.test(String(url||'')))return;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.dataset.downloadResource=acToolId;a.className='v36-download-link';a.textContent=String(acToolId).startsWith('mat:')?(acLanguage==='id'?'↓ Download materi':'↓ Download material'):(acLanguage==='id'?'↓ Download aplikasi':'↓ Download application');$('toolRequestFeedback').appendChild(a);}
function acCloseRequest(){$('toolRequestModal').classList.add('hidden');document.body.style.overflow='';}
function acNewNonce(){try{const x=new Uint32Array(4);crypto.getRandomValues(x);return [...x].map(n=>n.toString(16)).join('');}catch(_){return Date.now().toString(36)+Math.random().toString(36).slice(2);}}
function acSubmitRequest(e){
 if(acRequestBusy||acSentTools.has(acToolId)){e.preventDefault();return;}
 if(!ac58SyncUPN()){e.preventDefault();return;}
 if(!SITE.guestbookReady(e.target)){e.preventDefault();acToolMessage(T('signInNeeded'),false);return;}
 const endpoint=SITE.linkURL(acData?.profile?.toolGuestbookUrl||'');if(!endpoint){e.preventDefault();acToolMessage(T('serviceUnavailable'),false);return;}
 const form=e.target;form.action=endpoint;acNonce=acNewNonce();$('toolRequestNonce').value=acNonce;
 acRequestBusy=true;$('toolRequestSubmit').disabled=true;acToolMessage(T('requestAwait'),true);
 acRequestTimer=setTimeout(()=>{if(acRequestBusy){acRequestBusy=false;acToolMessage(T('requestUncertain'),false);ac58SyncUPN();}},45000);
 // Do not preventDefault: POST is directed to the hidden iframe.
}
window.addEventListener('message',e=>{
 const d=e.data;if(!acRequestBusy||!d||d.type!=='ASJ_GUESTBOOK_RESULT_V36'||d.requestId!==acNonce)return;
 const origin=String(e.origin||'');if(!(origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(origin)))return;
 clearTimeout(acRequestTimer);acRequestBusy=false;
 if(d.ok&&/^https:\/\//i.test(String(d.url||''))){acSentTools.set(acToolId,d.url);$('toolRequestForm').hidden=true;$('pm51GuestbookLogin').hidden=true;acToolMessage('',true);acToolLink(d.url);}else{ac58ServerUpnDenied=/UPN Account Required/i.test(String(d.message||''));if(!ac58ServerUpnDenied)acToolMessage(d.message||T('requestError'),false);ac58SyncUPN();}
});
try{const saved=localStorage.getItem('portfolioLangV7');if(saved==='en')acLanguage='en';}catch(_){ }
$('studentSearchForm').addEventListener('submit',e=>{e.preventDefault();if(!$('studentQuery').value.trim())return;$('studentSearchResponse').hidden=false;$('studentSearchResponse').textContent=T('searchResponse');});
window.addEventListener('hashchange',ac71OpenLinked);
$('toolRequestForm').addEventListener('submit',acSubmitRequest);
document.querySelectorAll('[data-tool-close]').forEach(n=>n.addEventListener('click',acCloseRequest));
document.querySelectorAll('[data-pm55-course-close]').forEach(n=>n.addEventListener('click',ac55CloseCourseMore));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ac55OpenCourseId)ac55CloseCourseMore();});
document.querySelectorAll('[data-ac-lang]').forEach(b=>b.addEventListener('click',()=>{acLanguage=b.dataset.acLang;acTheme();}));
acTheme();
SITE.loadAcademic().then(acLoadSite).catch(err=>{console.error('Academic Portal V35:',err);const state=$('v35-ac-loading');state.textContent=T('portalLoadError');acVisibilitySet(state,true);});
// Update only NEW markers; do not rebuild an open reader or unrelated sections.
setInterval(()=>document.querySelectorAll('[data-ac71-new]').forEach(el=>{
 el.hidden=!ac71IsNew(el.dataset.ac71New);
}),30000);

// V71: one expanded announcement, stable DOM, no focus/scroll commands.
function ac71Announcements(){
 if(!acSectionOn('gradeBoards'))return [];
 const source=Array.isArray(acData?.announcements)?acData.announcements:acBoards().map(b=>({id:'grade:'+b.id,type:'grade',boardId:String(b.id),title:'Pengumuman nilai '+b.course+' - '+b.className+' ('+b.period+')',publishedAt:b.publishedAt,body:''}));
 return source.filter(a=>a.visible!==false).slice().sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0)||String(a.id).localeCompare(String(b.id)));
}
function ac71IsNew(iso){const age=Date.now()-Date.parse(iso);return age>=0&&age<48*3600000;}
function ac71Date(iso){
 const t=Date.parse(iso);if(!Number.isFinite(t))return '';
 const parts=Object.fromEntries(new Intl.DateTimeFormat(acLanguage==='id'?'id-ID':'en-GB',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(t)).map(p=>[p.type,p.value]));
 return parts.day+' '+parts.month+' '+parts.year+', '+parts.hour+':'+parts.minute;
}
function ac71PDF(url){
 try{const u=new URL(url);if(u.protocol!=='https:')return '';
  if(u.hostname==='drive.google.com'){
   const id=u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]||u.searchParams.get('id');
   if(!id||!/^[a-zA-Z0-9_-]+$/.test(id))return '';
   return 'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview';
  }
  return u.href;
 }catch(_){return '';}
}
function ac71Render(){
 const host=$('announcement-list');if(!host)return;
 const all=ac71Announcements(),limit=Math.max(1,Math.min(500,Number(acData?.profile?.announcementLimit)||10));
 const list=all.slice(0,limit),linked=all.find(a=>String(a.id)===ac71OpenId);
 if(linked&&!list.some(a=>a.id===linked.id)){if(list.length>=limit)list.pop();list.push(linked);}
 host.innerHTML=list.map((a,i)=>`<article class="ac71-item" data-ac71-id="${E(a.id)}"><button type="button" class="ac71-toggle" aria-expanded="false" aria-controls="ac71-panel-${i}"><span class="ac71-line"><span class="ac71-new" data-ac71-new="${E(a.publishedAt||'')}" aria-label="${acLanguage==='id'?'Baru':'New'}" ${ac71IsNew(a.publishedAt)?'':'hidden'}>🆕</span><time datetime="${E(a.publishedAt||'')}">(${E(ac71Date(a.publishedAt))})</time> <strong>${E(a.title)}</strong></span><span class="ac71-chevron" aria-hidden="true">⌄</span></button><div id="ac71-panel-${i}" class="ac71-panel" hidden></div></article>`).join('');
 host.querySelectorAll('.ac71-toggle').forEach(button=>button.addEventListener('click',()=>ac71Toggle(button.closest('[data-ac71-id]').dataset.ac71Id)));
 if(ac71OpenId){const id=ac71OpenId;ac71OpenId='';ac71Toggle(id);}
}
async function ac71Toggle(id){
 const host=$('announcement-list'),item=Array.from(host.querySelectorAll('[data-ac71-id]')).find(el=>el.dataset.ac71Id===id);
 if(!item)return;
 const close=ac71OpenId===id;
 ++acRequestSeq;acSelectedId='';acRows=null;
 host.querySelectorAll('.ac71-panel').forEach(panel=>{panel.hidden=true;panel.replaceChildren();});
 host.querySelectorAll('.ac71-toggle').forEach(btn=>btn.setAttribute('aria-expanded','false'));
 ac71OpenId=close?'':id;if(close)return;
 const a=ac71Announcements().find(a=>String(a.id)===id);if(!a)return;
 const panel=item.querySelector('.ac71-panel');panel.hidden=false;
 item.querySelector('button').setAttribute('aria-expanded','true');
 if(a.body){const intro=document.createElement('div');intro.className='ac71-body';intro.textContent=a.body;panel.append(intro);}
 if(a.type==='pdf'){
  const src=ac71PDF(a.pdfUrl);
  if(src){const link=document.createElement('a');link.href=a.pdfUrl;link.target='_blank';link.rel='noopener noreferrer';link.className='ac71-pdf-link';link.textContent=acLanguage==='id'?'Buka PDF ↗':'Open PDF ↗';panel.append(link);
   const frame=document.createElement('iframe');frame.className='ac71-pdf';frame.title=a.title;frame.src=src;frame.setAttribute('loading','lazy');frame.setAttribute('allow','fullscreen');panel.append(frame);
  }
 }else if(a.type==='grade'){
  const target=document.createElement('div');target.id='grade-table';panel.append(target);
  acSelectedId=String(a.boardId);acVisible=20;const seq=acRequestSeq;
  acRows=ac71GradeCache.get(acSelectedId)||null;
  if(acRows){acRenderGrade();return;}
  acPreview('loading',T('loading'));
  try{const result=await SITE.loadGrades(acSelectedId);
   if(seq!==acRequestSeq)return;
   if(String(result.id)!==acSelectedId||!Array.isArray(result.rows))throw Error('Invalid grades');
   acRows=result.rows;ac71GradeCache.set(acSelectedId,acRows);acRenderGrade();
  }catch(_){if(seq===acRequestSeq)acPreview('empty',T('error'));}
 }
}
function ac71OpenLinked(){
 if(!acData)return;
 let id='';try{if(location.hash.startsWith('#announcement='))id=decodeURIComponent(location.hash.slice(14));}catch(_){return;}
 if(!id||id===ac71OpenId||!ac71Announcements().some(a=>String(a.id)===id))return;
 ac71OpenId=id;ac71Render();
}
