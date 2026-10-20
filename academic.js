"use strict";
// V21: search is a local UI placeholder only. No name/NPM is sent or persisted.
let academicData=null, acLanguage='id';
const acVisible={grades:5};
const AC_TEXT={
 id:{navGrades:'Pengumuman Nilai',eyebrow:'PORTAL MAHASISWA',searchLabel:'AKSES MAHASISWA',searchHeading:'Cari akses mahasiswa',searchButton:'Cari',searchPlaceholder:'Masukkan nama atau NPM',searchAria:'Nama atau NPM',searchNote:'Pencarian akses mahasiswa akan tersedia pada tahap berikutnya.',searchResponse:'Sistem masih dalam pengembangan. Silakan kembali lagi nanti.',gradesLabel:'NILAI',gradesHeading:'Pengumuman Nilai',selectBoard:'Pilih pengumuman nilai',privacyNote:'Perhatian: nilai ini bersifat publik. Identitas yang disamarkan sebagian masih mungkin dikenali dalam kelas kecil.',noBoards:'Belum ada pengumuman nilai',noGrades:'Belum ada nilai yang dipublikasikan.',highest:'Diurutkan dari nilai tertinggi',students:'mahasiswa',rank:'Peringkat',npm:'NPM (disamarkan)',firstName:'Nama depan',score:'Nilai',grade:'Grade',showMore:'Lihat lebih banyak',showLess:'Tampilkan lebih sedikit'},
 en:{navGrades:'Grade Announcements',eyebrow:'STUDENT PORTAL',searchLabel:'STUDENT ACCESS',searchHeading:'Student access search',searchButton:'Search',searchPlaceholder:'Enter name or student ID (NPM)',searchAria:'Name or student ID (NPM)',searchNote:'Student access search will be available in a future update.',searchResponse:'This system is currently under development. Please check back later.',gradesLabel:'GRADES',gradesHeading:'Grade Announcements',selectBoard:'Select a grade announcement',privacyNote:'Note: these grades are public. Partially masked identities may still be recognizable in small classes.',noBoards:'No grade announcements yet',noGrades:'No grades have been published.',highest:'Sorted by highest score',students:'students',rank:'Rank',npm:'NPM (masked)',firstName:'First name',score:'Score',grade:'Grade',showMore:'Show more',showLess:'Show less'}
};
function acT(key){return AC_TEXT[acLanguage][key]||key;}
function acEsc(value){return SITE.escape(value);}
function acLoadLang(){try{const saved=localStorage.getItem('portfolioLangV7');if(saved==='en'||saved==='id')acLanguage=saved;}catch(_){}}
function acSetLang(lang){
 if(lang!=='id'&&lang!=='en')return;
 acLanguage=lang;
 document.documentElement.lang=lang;
 document.querySelectorAll('[data-ac-i18n]').forEach(n=>n.textContent=acT(n.dataset.acI18n));
 document.querySelectorAll('[data-ac-lang]').forEach(b=>{b.classList.toggle('active',b.dataset.acLang===lang);b.setAttribute('aria-pressed',String(b.dataset.acLang===lang));});
 const input=document.getElementById('studentQuery');input.placeholder=acT('searchPlaceholder');input.setAttribute('aria-label',acT('searchAria'));
 const response=document.getElementById('studentSearchResponse');if(!response.hidden)response.textContent=acT('searchResponse');
 try{localStorage.setItem('portfolioLangV7',lang);}catch(_){}
 document.title='My Academic Portal';
 if(academicData)acRenderGrades();
}
function acSearch(e){
 e.preventDefault();
 const input=document.getElementById('studentQuery');
 if(!input.value.trim()){input.focus();return;}
 const response=document.getElementById('studentSearchResponse');response.hidden=false;
 response.textContent=acT('searchResponse');
 // Deliberately no network request, logging, storage, or authorization.
}
function acRender(data){
 academicData=data;
 const select=document.getElementById('gradeBoardSelect');
 const old=select.value;
 const boards=Array.isArray(data.gradeBoards)?data.gradeBoards:[];
 select.innerHTML=boards.length?boards.map(b=>`<option value="${acEsc(b.id)}">${acEsc(b.course||'')} · ${acEsc(b.className||'')} · ${acEsc(b.period||'')}</option>`).join(''):`<option value="">${acEsc(acT('noBoards'))}</option>`;
 if(boards.some(b=>String(b.id)===old))select.value=old;
 select.disabled=!boards.length;
 acRenderGrades();
}
function acRenderGrades(){
 const boards=academicData?.gradeBoards||[];
 const select=document.getElementById('gradeBoardSelect');
 if(!boards.length)select.innerHTML=`<option value="">${acEsc(acT('noBoards'))}</option>`;
 const board=boards.find(x=>String(x.id)===select.value);
 const el=document.getElementById('grade-table');
 const oldMore=el.nextElementSibling;
 if(oldMore?.classList?.contains('v10-ac-more'))oldMore.remove();
 if(!board){el.innerHTML=`<div class="empty-card">${acEsc(acT('noGrades'))}</div>`;return;}
 let rows=Array.isArray(board.rows)?[...board.rows]:[];
 rows.sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0));
 let prior=null,rank=0;
 rows=rows.map((x,i)=>{const s=Number(x.score)||0;if(prior===null||s!==prior)rank=i+1;prior=s;return {...x,rank};});
 el.innerHTML=`<div class="grade-summary"><div><strong>${acEsc(board.course||'')}</strong><span>${acEsc(board.className||'')} · ${acEsc(board.period||'')} · ${rows.length} ${acEsc(acT('students'))}</span></div><span>${acEsc(acT('highest'))}</span></div><div class="table-scroll"><table class="grades-table"><thead><tr><th>${acEsc(acT('rank'))}</th><th>${acEsc(acT('npm'))}</th><th>${acEsc(acT('firstName'))}</th><th>${acEsc(acT('score'))}</th><th>${acEsc(acT('grade'))}</th></tr></thead><tbody>${rows.slice(0,acVisible.grades).map(x=>`<tr><td>${x.rank}</td><td class="mono">${acEsc(x.npm)}</td><td>${acEsc(x.name)}</td><td><strong>${acEsc(x.score)}</strong></td><td><span class="grade-pill">${acEsc(x.grade)}</span></td></tr>`).join('')}</tbody></table></div>`;
 if(rows.length<=5)return;
 const wrap=document.createElement('div');wrap.className='v10-ac-more';
 const button=document.createElement('button');button.type='button';button.className='v10-ac-btn';
 const expanded=acVisible.grades>=rows.length;
 button.textContent=expanded?acT('showLess'):`${acT('showMore')} (${rows.length-acVisible.grades})`;
 button.addEventListener('click',()=>{acVisible.grades=expanded?5:Math.min(rows.length,acVisible.grades+5);acRenderGrades();});
 wrap.appendChild(button);el.after(wrap);
}
acLoadLang();
acSetLang(acLanguage);
document.getElementById('studentSearchForm').addEventListener('submit',acSearch);
document.querySelectorAll('[data-ac-lang]').forEach(b=>b.addEventListener('click',()=>acSetLang(b.dataset.acLang)));
document.getElementById('gradeBoardSelect').addEventListener('change',()=>{acVisible.grades=5;acRenderGrades();});
SITE.load().then(acRender).catch(e=>{
 document.getElementById('grade-table').innerHTML=`<div class="empty-card">${acEsc(acLanguage==='id'?'Tidak dapat memuat data pengumuman nilai.':'Unable to load grade announcements.')}</div>`;
});
