"use strict";
// V24: on-demand public grade board fetch, tools request via existing Contact Form.
let acData=null,acLanguage='id',acSelectedId='',acRows=null,acRequestSeq=0,acVisible=5;
let acToolId='',acRequestBusy=false,acNonce='',acRequestTimer=null;
const acSentTools=new Set();
const TXT={
 id:{navGrades:'Pengumuman Nilai',navTools:'Tools',searchLabel:'AKSES MAHASISWA',searchHeading:'Cari akses mahasiswa',searchButton:'Cari',searchPlaceholder:'Masukkan nama atau NPM',searchResponse:'Sistem masih dalam pengembangan. Silakan kembali lagi nanti.',gradesLabel:'NILAI',gradesHeading:'Pengumuman Nilai',selectBoard:'Pilih mata kuliah',selectPlaceholder:'Pilih mata kuliah',noBoards:'Belum ada pengumuman nilai.',loading:'Memuat nilai...',pick:'Pilih mata kuliah untuk melihat pengumuman nilai.',error:'Nilai gagal dimuat. Silakan coba lagi.',rank:'No.',npm:'NPM',firstName:'Nama',score:'Nilai Akhir',grade:'Grade',showMore:'Lihat lebih banyak',showLess:'Tampilkan lebih sedikit',until:'Dapat dilihat hingga',students:'mahasiswa',request:'Minta Link',toolsLabel:'PERANGKAT DIGITAL',toolsHeading:'Tools',requestTitle:'Permintaan aplikasi',requestSuccess:'Permintaan berhasil dikirim. Link dapat diberikan setelah ditinjau.',requestError:'Permintaan belum terkirim.',requestAwait:'Menunggu konfirmasi...'},
 en:{navGrades:'Grade Announcements',navTools:'Tools',searchLabel:'STUDENT ACCESS',searchHeading:'Student access search',searchButton:'Search',searchPlaceholder:'Enter name or student ID (NPM)',searchResponse:'This system is currently under development. Please check back later.',gradesLabel:'GRADES',gradesHeading:'Grade Announcements',selectBoard:'Select Course',selectPlaceholder:'Select Course',noBoards:'No grade announcements yet.',loading:'Loading grades...',pick:'Select a course to view its grades.',error:'Unable to load grades. Please try again.',rank:'No.',npm:'Student ID',firstName:'First name',score:'Final Score',grade:'Grade',showMore:'Show more',showLess:'Show less',until:'Available until',students:'students',request:'Request Download',toolsLabel:'DIGITAL TOOLS',toolsHeading:'Tools',requestTitle:'Application request',requestSuccess:'Your request was sent. A link may be provided after review.',requestError:'Your request was not sent.',requestAwait:'Waiting for confirmation...'}
};
const T=k=>TXT[acLanguage][k]||k;
const E=x=>SITE.escape(x);
const $=id=>document.getElementById(id);
function acLetter(x){const s=Number(x);return s>=85?'A':s>=80?'A-':s>=75?'B+':s>=70?'B':s>=65?'B-':s>=60?'C+':s>=55?'C':s>=50?'D':'E';}
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
 const sel=$('gradeBoardSelect'),value=sel.value;
 if(sel.options[0])sel.options[0].textContent=T('selectPlaceholder');
 sel.value=value;
 if(acData){acRenderGrade();acRenderTools();}
 try{localStorage.setItem('portfolioLangV7',acLanguage);}catch(_){ }
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
}
async function acSelectBoard(){
 const id=$('gradeBoardSelect').value;acSelectedId=id;acVisible=5;acRows=null;
 const seq=++acRequestSeq;
 if(!id){acPreview('empty',T('pick'));return;}
 const board=acBoards().find(b=>String(b.id)===id);
 if(!board){acPreview('empty',T('noBoards'));return;}
 acPreview('loading',T('loading'));
 try{
  let rows;
  if(Array.isArray(board.rows)){rows=board.rows;} // legacy board created before V24
  else if(board.rowsFile){
   const path=String(board.rowsFile);
   if(!/^assets\/grades\/[a-zA-Z0-9_.%~-]+\.json$/.test(path))throw Error('Invalid board path');
   const response=await fetch('/'+path,{cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const obj=await response.json();if(String(obj.id)!==String(id)||!Array.isArray(obj.rows))throw Error('Board response invalid');
   rows=obj.rows;
  }else rows=[];
  if(seq!==acRequestSeq)return;
  acRows=rows;acRenderGrade();
 }catch(e){if(seq===acRequestSeq)acPreview('empty',T('error'));}
}
function acRenderGrade(){
 const board=acBoards().find(b=>String(b.id)===acSelectedId);
 if(!board){if(acSelectedId){acSelectedId='';$('gradeBoardSelect').value='';}acPreview('empty',acBoards().length?T('pick'):T('noBoards'));return;}
 if(!acRows){acPreview('loading',T('loading'));return;}
 const columns=Array.isArray(board.columns)?board.columns:[],withGrade=board.showGrade!==false;
 const rows=acRows.map((r,i)=>({...r,__i:i})).sort((a,b)=>Number(b.score)-Number(a.score)||Number(a.rank||a.__i+1)-Number(b.rank||b.__i+1));
 const head=`<th>${T('rank')}</th><th>${T('npm')}</th><th>${T('firstName')}</th><th>${T('score')}</th>${withGrade?`<th>${T('grade')}</th>`:''}${columns.map(c=>`<th>${E(c)}</th>`).join('')}`;
 const body=rows.slice(0,acVisible).map((r,i)=>`<tr><td>${i+1}</td><td class="mono">${E(r.npm||'')}</td><td>${E(r.name||'')}</td><td><strong>${E(r.score??'')}</strong></td>${withGrade?`<td><span class="grade-pill">${E(acLetter(r.score))}</span></td>`:''}${columns.map((c,j)=>`<td>${E((r.extras||[])[j]??'')}</td>`).join('')}</tr>`).join('');
 $('grade-table').innerHTML=`<div class="grade-summary"><div><strong>${E(board.course||'')}</strong><span>${E(board.className||'')} · ${E(board.period||'')} · ${rows.length} ${T('students')}</span></div><span class="v23-expiry-note">${T('until')} ${E(acDate(acExpiry(board)))}</span></div><div class="table-scroll"><table class="grades-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
 if(rows.length>5){const container=document.createElement('div');container.className='v10-ac-more';const btn=document.createElement('button');btn.type='button';btn.className='v10-ac-btn';const all=acVisible>=rows.length;btn.textContent=all?T('showLess'):`${T('showMore')} (${rows.length-acVisible})`;btn.onclick=()=>{acVisible=all?5:Math.min(rows.length,acVisible+5);acRenderGrade()};container.append(btn);$('grade-table').append(container);}
}
function acRenderTools(){
 if(!acData)return;
 const list=(acData.tools||[]).slice(0,5);
 $('academic-tools-list').innerHTML=list.map(x=>`<div class="tool-card"><div class="tool-icon">${E((x.name||'A')[0])}</div><div class="tool-body"><div class="tool-header"><h3>${E(x.name||'')}</h3>${x.version?`<span>${E(x.version)}</span>`:''}</div><p>${E(acLanguage==='en'?(x.en?.description||x.description||''):(x.description||''))}</p><div class="tags">${(acLanguage==='en'?(x.en?.features||x.features||[]):x.features||[]).map(f=>`<span class="tag">${E(f)}</span>`).join('')}</div></div><button type="button" class="btn v17-request-button" data-tool="${E(x.id)}" ${x.requestAvailable===false?'disabled':''}>${T('request')}</button></div>`).join('');
 $('academic-tools-list').querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>acOpenRequest(b.dataset.tool)));
}
function acOpenRequest(id){
 const tool=(acData.tools||[]).find(t=>String(t.id)===String(id));if(!tool)return;
 acToolId=id;
 $('toolRequestTitle').textContent=T('requestTitle')+': '+tool.name;
 $('toolRequestDescription').textContent=acLanguage==='en'?(tool.en?.description||tool.description||''):(tool.description||'');
 $('toolRequestModal').classList.remove('hidden');document.body.style.overflow='hidden';
 $('toolRequestId').value=id;$('toolStartedAt').value=Date.now();
 $('toolRequestFeedback').hidden=true;$('toolRequestForm').hidden=acSentTools.has(id);
 $('toolRequestSubmit').disabled=acSentTools.has(id)||acRequestBusy;
 if(acSentTools.has(id))acToolMessage(T('requestSuccess'),true);
}
function acToolMessage(msg,success){const el=$('toolRequestFeedback');el.hidden=false;el.className='contact-result '+(success?'success':'error');el.textContent=msg;}
function acCloseRequest(){$('toolRequestModal').classList.add('hidden');document.body.style.overflow='';}
function acNewNonce(){try{const x=new Uint32Array(4);crypto.getRandomValues(x);return [...x].map(n=>n.toString(16)).join('');}catch(_){return Date.now().toString(36)+Math.random().toString(36).slice(2);}}
function acSubmitRequest(e){
 if(acRequestBusy||acSentTools.has(acToolId)){e.preventDefault();return;}
 const endpoint=SITE.linkURL(acData?.profile?.contactFormUrl||'');if(!endpoint){e.preventDefault();acToolMessage(acLanguage==='id'?'Layanan belum tersedia.':'Request service is unavailable.',false);return;}
 const form=e.target;form.action=endpoint;acNonce=acNewNonce();$('toolRequestNonce').value=acNonce;
 acRequestBusy=true;$('toolRequestSubmit').disabled=true;acToolMessage(T('requestAwait'),true);
 acRequestTimer=setTimeout(()=>{if(acRequestBusy){acRequestBusy=false;acToolMessage(acLanguage==='id'?'Belum ada konfirmasi; jangan kirim ulang sebelum memeriksa.':'No confirmation received. Please check before resubmitting.',false);$('toolRequestSubmit').disabled=false;}},45000);
 // Do not preventDefault: POST is directed to the hidden iframe.
}
window.addEventListener('message',e=>{
 const d=e.data;if(!acRequestBusy||!d||d.type!=='ASJ_TOOL_RESULT_V17'||d.requestId!==acNonce)return;
 const origin=String(e.origin||'');if(!(origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(origin)))return;
 clearTimeout(acRequestTimer);acRequestBusy=false;
 if(d.ok){acSentTools.add(acToolId);$('toolRequestForm').hidden=true;acToolMessage(T('requestSuccess'),true);}else{acToolMessage(d.message||T('requestError'),false);$('toolRequestSubmit').disabled=false;}
});
try{const saved=localStorage.getItem('portfolioLangV7');if(saved==='en')acLanguage='en';}catch(_){ }
$('studentSearchForm').addEventListener('submit',e=>{e.preventDefault();if(!$('studentQuery').value.trim())return;$('studentSearchResponse').hidden=false;$('studentSearchResponse').textContent=T('searchResponse');});
$('gradeBoardSelect').addEventListener('change',acSelectBoard);
$('toolRequestForm').addEventListener('submit',acSubmitRequest);
document.querySelectorAll('[data-tool-close]').forEach(n=>n.addEventListener('click',acCloseRequest));
document.querySelectorAll('[data-ac-lang]').forEach(b=>b.addEventListener('click',()=>{acLanguage=b.dataset.acLang;acTheme();}));
acTheme();
SITE.load().then(acLoadSite).catch(()=>acPreview('empty',T('error')));
setInterval(()=>{if(!acData)return;const ids=acBoards().map(b=>b.id),sel=$('gradeBoardSelect');if(acSelectedId&&!ids.includes(acSelectedId)){acData.gradeBoards=acBoards();acSelectedId='';acRows=null;sel.value='';acPreview('empty',T('pick'));} },60000);
