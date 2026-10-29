"use strict";
// V42: render nonempty Academic entries even when no link/material URL is available; avoid initial flashes.
let acData=null,acLanguage='id',acSelectedId='',acRows=null,acRequestSeq=0,acVisible=20;
let acToolId='',acRequestBusy=false,acNonce='',acRequestTimer=null;
const acSentTools=new Map();
const TXT={
 id:{navGrades:'Pengumuman Nilai',navTools:'Tools',servicesLabel:'LAYANAN AKADEMIK',servicesHeading:'Layanan Akademik',coursesLabel:'MATERI KULIAH',coursesHeading:'Mata Kuliah & Materi',portalEmpty:'Belum ada pengumuman atau materi yang dibagikan. Silakan kembali lagi nanti.',openService:'Buka layanan',noServiceLink:'Tautan layanan belum dibagikan.',noMaterials:'Belum ada materi yang dibagikan untuk mata kuliah ini.',portalLoadError:'Gagal memuat data Academic Portal. Silakan muat ulang halaman.',portalLoading:'Memuat Academic Portal...',searchLabel:'AKSES MAHASISWA',searchHeading:'Cari akses mahasiswa',searchButton:'Cari',searchPlaceholder:'Masukkan nama atau NPM',searchResponse:'Anda tidak memiliki akses khusus.',gradesLabel:'NILAI',gradesHeading:'Pengumuman Nilai',selectBoard:'Pilih mata kuliah',selectPlaceholder:'Pilih mata kuliah',noBoards:'Tidak ada pengumuman nilai saat ini.',loading:'Memuat nilai...',pick:'Pilih mata kuliah untuk melihat pengumuman nilai.',error:'Nilai gagal dimuat. Silakan coba lagi.',rank:'No.',npm:'NPM',firstName:'Nama',score:'Nilai Akhir',grade:'Grade',showMore:'Lihat lebih banyak',showLess:'Tampilkan lebih sedikit',until:'Dapat dilihat hingga',students:'mahasiswa',request:'Minta Link',toolsLabel:'PERANGKAT DIGITAL',toolsHeading:'Tools',requestTitle:'Permintaan aplikasi',requestSuccess:'',requestError:'Permintaan belum terkirim.',requestAwait:'Mohon tunggu...', signInNeeded:'Silakan masuk dengan Google untuk mengakses unduhan.',serviceUnavailable:'Layanan belum tersedia.',requestUncertain:'Belum ada konfirmasi. Periksa koneksi sebelum mencoba kembali.',toolGuestTitle:'Buku Tamu — ',courseInfo:'Materi kuliah: '},
 en:{navGrades:'Grade Announcements',navTools:'Tools',servicesLabel:'ACADEMIC SERVICES',servicesHeading:'Academic Services',coursesLabel:'COURSES',coursesHeading:'Courses & Materials',portalEmpty:'There are no announcements or materials available at the moment. Please check back later.',openService:'Open service',noServiceLink:'A service link has not been shared yet.',noMaterials:'No materials have been shared for this course yet.',portalLoadError:'Unable to load Academic Portal data. Please reload the page.',portalLoading:'Loading Academic Portal...',searchLabel:'STUDENT ACCESS',searchHeading:'Student access search',searchButton:'Search',searchPlaceholder:'Enter name or student ID (NPM)',searchResponse:'You do not have special access.',gradesLabel:'GRADES',gradesHeading:'Grade Announcements',selectBoard:'Select Course',selectPlaceholder:'Select Course',noBoards:'No grade announcements are currently available.',loading:'Loading grades...',pick:'Select a course to view its grades.',error:'Unable to load grades. Please try again.',rank:'No.',npm:'Student ID',firstName:'First name',score:'Final Score',grade:'Grade',showMore:'Show more',showLess:'Show less',until:'Available until',students:'students',request:'Request Download',toolsLabel:'DIGITAL TOOLS',toolsHeading:'Tools',requestTitle:'Application request',requestSuccess:'',requestError:'Your request was not sent.',requestAwait:'Please wait...', signInNeeded:'Please sign in with Google to access the download.',serviceUnavailable:'Download service is unavailable.',requestUncertain:'No confirmation received. Please check your connection before trying again.',toolGuestTitle:'Guestbook — ',courseInfo:'Course material: '}
};
const T=k=>TXT[acLanguage][k]||k;
const E=x=>SITE.escape(x);
const $=id=>document.getElementById(id);
function acLetter(x){if(x===null||x===undefined||String(x).trim()===''||!Number.isFinite(Number(x)))return '';const s=Number(x);return s>=85?'A':s>=80?'A-':s>=75?'B+':s>=70?'B':s>=65?'B-':s>=60?'C+':s>=55?'C':s>=50?'D':'E';}
function acExpiry(b){if(b.expiresAt){const t=Date.parse(b.expiresAt);if(Number.isFinite(t))return t;}const t=Date.parse(b.publishedAt||'');return Number.isFinite(t)?t+7*86400000:NaN;}
function acBoards(){return (acData?.gradeBoards||[]).filter(b=>Number.isFinite(acExpiry(b))&&acExpiry(b)>Date.now());}
function acDate(t){return new Intl.DateTimeFormat(acLanguage==='id'?'id-ID':'en-GB',{timeZone:'Asia/Jakarta',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' WIB';}
function acPreview(state,text){$('grade-table').innerHTML=`<div class="${state==='loading'?'v24-spin':'empty-card'}" role="status">${E(text)}</div>`;}
function acTheme(){
 document.documentElement.lang=acLanguage;
 document.querySelectorAll('[data-ac-i18n]').forEach(n=>n.textContent=T(n.dataset.acI18n));
 document.querySelectorAll('[data-ac-lang]').forEach(b=>{b.classList.toggle('active',b.dataset.acLang===acLanguage);b.setAttribute('aria-pressed',String(b.dataset.acLang===acLanguage));});
 $('studentQuery').placeholder=T('searchPlaceholder');
 if(!$('studentSearchResponse').hidden)$('studentSearchResponse').textContent=T('searchResponse');
 if(!acData && $('v35-ac-loading'))$('v35-ac-loading').textContent=(TXT[acLanguage].portalLoading||'Memuat Academic Portal...');
 const sel=$('gradeBoardSelect'),value=sel.value;
 if(sel.options[0])sel.options[0].textContent=T('selectPlaceholder');
 sel.value=value;
 if(acData){acRenderGrade();acRenderTools();acRenderVisibility();acUpdateRequestLanguage();}
 SITE.applyGuestbookLanguage(acLanguage);
 try{localStorage.setItem('portfolioLangV7',acLanguage);}catch(_){ }
}
// V54: translated descriptions are prepared at Publish in private Apps Script.
// Content names (books, courses, applications) always remain in their original language.
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
   if(material)return {name:material.title||'Material',description:T('courseInfo')+(course.title||course.course||'')};
  }
 }
 return null;
}
function acUpdateRequestLanguage(){
 if($('toolRequestModal')?.classList.contains('hidden')||!acToolId)return;
 const item=acRequestItem(acToolId);if(!item)return;
 $('toolRequestTitle').textContent=T('toolGuestTitle')+item.name;
 $('toolRequestDescription').textContent=item.description;
 // Only the label is retranslated; an active signed-in form remains intact.
}
function acApplyBrand(profile){
 const round=SITE.safeURL(profile?.brandingRound||'');
 const square=SITE.safeURL(profile?.brandingSquare||'');
 if(round){const img=document.querySelector('.v12-academic-brand img');if(img)img.src=round;}
 if(square)document.querySelectorAll('link[rel="icon"]').forEach(link=>link.href=square);
}
function acLoadSite(data){
 acData=data;acApplyBrand(data.profile||{});
 const boards=acBoards(),sel=$('gradeBoardSelect');
 sel.innerHTML=`<option value="">${E(T('selectPlaceholder'))}</option>`+boards.map(b=>`<option value="${E(b.id)}">${E(b.course||'')} · ${E(b.className||'')} · ${E(b.period||'')}</option>`).join('');
 sel.disabled=!boards.length;
 if(!boards.length)acPreview('empty',T('noBoards'));else acPreview('empty',T('pick'));
 acRenderTools();
 acRenderVisibility();
 acVisibilitySet($('v35-ac-loading'),false);
}
async function acSelectBoard(){
 const id=$('gradeBoardSelect').value;acSelectedId=id;acVisible=20;acRows=null;
 const seq=++acRequestSeq;
 if(!id){acPreview('empty',T('pick'));return;}
 const board=acBoards().find(b=>String(b.id)===id);
 if(!board){acPreview('empty',T('noBoards'));return;}
 acPreview('loading',T('loading'));
 try{
  const result=await SITE.loadGrades(id);
  if(String(result.id)!==id||!Array.isArray(result.rows))throw Error('Respons nilai tidak valid');
  const rows=result.rows;
  if(seq!==acRequestSeq)return;
  acRows=rows;acRenderGrade();
 }catch(e){if(seq===acRequestSeq)acPreview('empty',T('error'));}
}
function acRenderGrade(){
 const board=acBoards().find(b=>String(b.id)===acSelectedId);
 if(!board){if(acSelectedId){acSelectedId='';$('gradeBoardSelect').value='';}acPreview('empty',acBoards().length?T('pick'):T('noBoards'));return;}
 if(!acRows){acPreview('loading',T('loading'));return;}
 const originalColumns=Array.isArray(board.columns)?board.columns:[];
 const shownIndices=originalColumns.map((_,i)=>i).filter(i=>acRows.some(r=>String((r.extras||[])[i]??'').trim()!==''));
 const columns=shownIndices.map(i=>originalColumns[i]),withGrade=board.showGrade!==false;
 const rows=acRows.map((r,i)=>({...r,__i:i})).sort((a,b)=>Number(a.rank??a.__i+1)-Number(b.rank??b.__i+1));
 const hidden=board.hiddenCore||{};
 const head=`<th>${T('rank')}</th>${hidden.npm?'':`<th>${T('npm')}</th>`}${hidden.name?'':`<th>${T('firstName')}</th>`}${hidden.score?'':`<th>${E(board.scoreHeader||T('score'))}</th>`}${withGrade?`<th>${T('grade')}</th>`:''}${columns.map(c=>`<th>${E(c)}</th>`).join('')}`;
 const body=rows.slice(0,acVisible).map((r,i)=>`<tr><td>${i+1}</td>${hidden.npm?'':`<td class="mono">${E(r.npm||'')}</td>`}${hidden.name?'':`<td>${E(r.name||'')}</td>`}${hidden.score?'':`<td><strong>${E(r.score??'')}</strong></td>`}${withGrade?`<td>${acLetter(r.score)?`<span class="grade-pill">${E(acLetter(r.score))}</span>`:''}</td>`:''}${shownIndices.map(j=>`<td>${E((r.extras||[])[j]??'')}</td>`).join('')}</tr>`).join('');
 $('grade-table').innerHTML=`<div class="grade-summary"><div><strong>${E(board.course||'')}</strong><span>${E(board.className||'')} · ${E(board.period||'')} · ${rows.length} ${T('students')}</span></div><span class="v23-expiry-note">${T('until')} ${E(acDate(acExpiry(board)))}</span></div><div class="table-scroll"><table class="grades-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
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
function acRenderVisibility(){
 if(!acData)return;
 const services=acSectionOn('portalLinks')?acServicesAvailable():[];
 const courses=acSectionOn('courses')?acCoursesAvailable():[];
 const boards=acSectionOn('gradeBoards')?acBoards():[];
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
  const list=materials.length?`<ul class="v34-materials">${materials.map(m=>`<li><button type="button" class="v42-material-link" data-material-request="${E(m.materialRequestId)}" aria-label="${E((acLanguage==='id'?'Unduh materi ':'Download material ')+(m.title||(acLanguage==='id'?'Materi':'Material')))}">${E(m.title||(acLanguage==='id'?'Materi':'Material'))} <span aria-hidden="true">↗</span></button></li>`).join('')}</ul>`:`<p class="v35-link-pending">${T('noMaterials')}</p>`;
  return `<article class="v34-ac-card"><h3>${E(c.title||c.course||'Course')}</h3>${c.period?`<div class="v34-course-meta">${E(c.period)}</div>`:''}${acDescription(c)?`<p>${E(acDescription(c))}</p>`:''}${list}</article>`;
 }).join('');
 $('academic-courses-list').querySelectorAll('[data-material-request]').forEach(b=>b.addEventListener('click',()=>acOpenRequest(b.dataset.materialRequest)));
 // Student access lives within Academic Services and follows its visibility.
 const sel=$('gradeBoardSelect');const prior=sel.value;
 sel.innerHTML=`<option value="">${E(T('selectPlaceholder'))}</option>`+boards.map(b=>`<option value="${E(b.id)}">${E(b.course||'')} · ${E(b.className||'')} · ${E(b.period||'')}</option>`).join('');
 sel.value=boards.some(b=>String(b.id)===prior)?prior:'';
 sel.disabled=!boards.length;
 if(!boards.length){acSelectedId='';acRows=null;}
}
function acRenderTools(){
 if(!acData)return;
 const list=acSectionOn('tools')?acToolsAvailable().slice(0,5):[];
 acVisibilitySet($('academic-tools'),list.length>0);
 $('academic-tools-list').innerHTML=list.map(x=>`<div class="tool-card"><div class="tool-icon">${E((x.name||'A')[0])}</div><div class="tool-body"><div class="tool-header"><h3>${E(x.name||'')}</h3>${x.version?`<span>${E(x.version)}</span>`:''}</div><p>${E(acDescription(x))}</p><div class="tags">${acFeatures(x).map(f=>`<span class="tag">${E(f)}</span>`).join('')}</div></div><button type="button" class="btn v17-request-button" data-tool="${E(x.id)}" ${x.requestAvailable===false?'disabled':''}>${T('request')}</button></div>`).join('');
 $('academic-tools-list').querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>acOpenRequest(b.dataset.tool)));
}
function acOpenRequest(id){
 const item=acRequestItem(id);if(!item)return;
 acToolId=id;
 $('toolRequestTitle').textContent=T('toolGuestTitle')+item.name;
 $('toolRequestDescription').textContent=item.description;
 $('toolRequestModal').classList.remove('hidden');document.body.style.overflow='hidden';
 SITE.guestbookLogin(acData?.profile||{});
 SITE.applyGuestbookLanguage(acLanguage);
 $('toolRequestId').value=id;$('toolStartedAt').value=Date.now();
 $('toolRequestFeedback').hidden=true;$('toolRequestForm').hidden=acSentTools.has(id);$('pm51GuestbookLogin').hidden=acSentTools.has(id);
 $('toolRequestSubmit').disabled=acSentTools.has(id)||acRequestBusy;
 if(acSentTools.has(id)){acToolMessage('',true);acToolLink(acSentTools.get(id));}
}
function acToolMessage(msg,success){const el=$('toolRequestFeedback');el.hidden=false;el.className=success?(msg?'v54-download-pending':'v54-download-ready'):'contact-result error';el.textContent=msg;}
function acSuccessText(){return '';}
function acToolLink(url){if(!/^https:\/\//i.test(String(url||'')))return;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='v36-download-link';a.textContent=String(acToolId).startsWith('mat:')?(acLanguage==='id'?'↓ Download materi':'↓ Download material'):(acLanguage==='id'?'↓ Download aplikasi':'↓ Download application');$('toolRequestFeedback').appendChild(a);}
function acCloseRequest(){$('toolRequestModal').classList.add('hidden');document.body.style.overflow='';}
function acNewNonce(){try{const x=new Uint32Array(4);crypto.getRandomValues(x);return [...x].map(n=>n.toString(16)).join('');}catch(_){return Date.now().toString(36)+Math.random().toString(36).slice(2);}}
function acSubmitRequest(e){
 if(acRequestBusy||acSentTools.has(acToolId)){e.preventDefault();return;}
 if(!SITE.guestbookReady(e.target)){e.preventDefault();acToolMessage(T('signInNeeded'),false);return;}
 const endpoint=SITE.linkURL(acData?.profile?.toolGuestbookUrl||'');if(!endpoint){e.preventDefault();acToolMessage(T('serviceUnavailable'),false);return;}
 const form=e.target;form.action=endpoint;acNonce=acNewNonce();$('toolRequestNonce').value=acNonce;
 acRequestBusy=true;$('toolRequestSubmit').disabled=true;acToolMessage(T('requestAwait'),true);
 acRequestTimer=setTimeout(()=>{if(acRequestBusy){acRequestBusy=false;acToolMessage(T('requestUncertain'),false);$('toolRequestSubmit').disabled=false;}},45000);
 // Do not preventDefault: POST is directed to the hidden iframe.
}
window.addEventListener('message',e=>{
 const d=e.data;if(!acRequestBusy||!d||d.type!=='ASJ_GUESTBOOK_RESULT_V36'||d.requestId!==acNonce)return;
 const origin=String(e.origin||'');if(!(origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(origin)))return;
 clearTimeout(acRequestTimer);acRequestBusy=false;
 if(d.ok&&/^https:\/\//i.test(String(d.url||''))){acSentTools.set(acToolId,d.url);$('toolRequestForm').hidden=true;$('pm51GuestbookLogin').hidden=true;acToolMessage('',true);acToolLink(d.url);}else{acToolMessage(d.message||T('requestError'),false);$('toolRequestSubmit').disabled=false;}
});
try{const saved=localStorage.getItem('portfolioLangV7');if(saved==='en')acLanguage='en';}catch(_){ }
$('studentSearchForm').addEventListener('submit',e=>{e.preventDefault();if(!$('studentQuery').value.trim())return;$('studentSearchResponse').hidden=false;$('studentSearchResponse').textContent=T('searchResponse');});
$('gradeBoardSelect').addEventListener('change',acSelectBoard);
$('toolRequestForm').addEventListener('submit',acSubmitRequest);
document.querySelectorAll('[data-tool-close]').forEach(n=>n.addEventListener('click',acCloseRequest));
document.querySelectorAll('[data-ac-lang]').forEach(b=>b.addEventListener('click',()=>{acLanguage=b.dataset.acLang;acTheme();}));
acTheme();
SITE.loadAcademic().then(acLoadSite).catch(err=>{console.error('Academic Portal V35:',err);const state=$('v35-ac-loading');state.textContent=T('portalLoadError');acVisibilitySet(state,true);});
setInterval(()=>{if(!acData)return;const ids=acBoards().map(b=>b.id),sel=$('gradeBoardSelect');if(acSelectedId&&!ids.includes(acSelectedId)){acData.gradeBoards=acBoards();acSelectedId='';acRows=null;sel.value='';acPreview('empty',T('pick'));} acRenderVisibility(); },60000);
