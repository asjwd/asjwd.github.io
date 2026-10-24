'use strict';
window.__pmMainReady = true;
window.__pmBoot && window.__pmBoot.message('Mode GitHub V30 siap');
const CONFIG={
 experiences:{title:'Professional Experience',sub:'Jabatan, kegiatan, kontribusi, dokumentasi foto',key:'role',fields:[['role','Position / Role','text',true],['organization','Institution / Organization','text',true],['location','Location'],['contributions','Contributions (satu baris per item)','lines'],['activities','Activities (Judul | Tanggal | Uraian)','activities']]},
 projects:{title:'Projects & Studies',sub:'Kajian, pemodelan dan mitra proyek',key:'title',fields:[['title','Project title','text',true],['category','Category (Modeling / Consulting / Kajian)'],['model','Model / Software (AERMOD, WRF-Chem, GIS)'],['role','My role'],['description','Description','textarea'],['outputs','Outputs & contribution','textarea'],['partnerName','Mitra Proyek / Project Partner']]},
 publications:{title:'Publications',sub:'Daftar artikel ilmiah dan tautan publikasi',key:'title',fields:[['title','Article title','text',true],['authors','Authors'],['journal','Journal / Publisher'],['url','DOI or article URL','url']]},
 tools:{title:'Digital Tools',sub:'Aplikasi seperti ASPDF dan tautan unduhan',key:'name',fields:[['name','Application name','text',true],['version','Version'],['description','Description','textarea'],['features','Features (satu fitur per baris)','lines'],['url','Download link (GitHub Releases / Drive)','url']]},
 courses:{title:'Courses & Materials',sub:'Daftar mata kuliah dan materi yang tampil langsung di Academic Portal',key:'title',fields:[['title','Course name','text',true],['period','Academic period'],['description','Description','textarea'],['materials','Materials: Judul | URL (satu baris per materi)','materials']]},
  slides:{title:'Slideshow',sub:'',key:'title',fields:[['title','Title / Activity name','text',true]]},
  otherActivities:{title:'Other Activities',sub:'Seminar, training, workshop, conference, dan kegiatan profesional lainnya',key:'title',fields:[['title','Activity / Event Title','text',true],['type','Type (Seminar / Training / Conference / Workshop / Other)'],['role','Role (Speaker / Trainer / Participant / Organizer / Moderator)'],['organizer','Organizer / Institution'],['location','Location'],['description','Description','textarea'],['certificateTitle','Certificate / Attachment Title'],['certificateUrl','Certificate URL (PDF) or uploaded document','text']]},
  portalLinks:{title:'Academic Services',sub:'Links to existing Apps Script Courses, bimbingan dan asdos',key:'title',fields:[['title','Service title','text',true],['description','Description','textarea'],['url','Apps Script /exec URL','url'],['icon','Icon label']]} 
};
const LABELS={profile:['Profile','Identitas, pendidikan, sertifikasi, kontak, dan data privat.'],gradeBoards:['Grade Announcements','Import Excel/CSV, kolom dinamis, dan masa tayang tujuh hari.'],settings:['Settings & Publish','Pengaturan database, GitHub dan publikasi otomatis.']};
let v12SocialOrder=[],v28Certs=[],v28Contacts=[];
const V12_SOCIAL_LABELS={linkedin:'LinkedIn',instagram:'Instagram',youtube:'YouTube',scholar:'Google Scholar',orcid:'ORCID',mail:'Mail Me'};
const V12_SOCIAL_DEFAULT=['linkedin','instagram','youtube','scholar','orcid','mail'];
let APP=null, PAGE='profile', galleryTmp=[], photoUploading=false, profileImages={}, gradeTmp=null;
const $=x=>document.querySelector(x), $$=x=>Array.from(document.querySelectorAll(x));
const clone=x=>JSON.parse(JSON.stringify(x));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>('v3-'+Date.now()+'-'+Math.random().toString(36).slice(2,8));
// RPC diberi batas waktu supaya halaman tidak berputar tanpa akhir.
function rpc(fn,...args){return V30.rpc(fn,...args)}

function toast(text,ms=3300){const n=$('#toast');n.textContent=text;n.classList.remove('hide');clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.classList.add('hide'),ms)}
function showLoading(text='Menyimpan...'){$('#bodyContent').innerHTML='<div class="loading"><span class="spinner"></span> '+esc(text)+'</div>';}
function setBusy(on,text){$('#topPublish').disabled=on||!APP?.ready||!APP?.hasToken;$('#topStatus').textContent=text||(on?'Memproses...':'● GitHub Trial V30');}
function fail(err){alert(err?.message||String(err));setBusy(false);}
async function refresh(keep=true){const page=PAGE,scroll=window.scrollY;APP=await rpc('apiGetState');setBusy(false);if(keep){if(PAGE===page && $('#dialogBackdrop')?.classList.contains('hide')){setPage(page);window.scrollTo({top:scroll,behavior:'instant'});}}else setPage('profile');}
function setPage(page){$('#bodyContent').classList.remove('loading');PAGE=page;$$('[data-page]').forEach(n=>n.classList.toggle('on',n.dataset.page===page));const label=CONFIG[page]?[CONFIG[page].title,CONFIG[page].sub]:LABELS[page]||LABELS.profile;$('#pageTitle').textContent=label[0];$('#pageDescription').textContent=label[1];if(!APP?.ready){renderSetup();return;}if(page==='profile')renderProfile();else if(page==='gradeBoards')renderGrades();else if(page==='settings')renderSettings();else renderList(page);}
$$('[data-page]').forEach(n=>n.addEventListener('click',()=>setPage(n.dataset.page)));
async function initialize(){return V30.state()}
function renderSetup(){document.querySelector('#bodyContent').innerHTML='<div class="panel"><h2>Koneksi GitHub diperlukan</h2><p>Hubungkan fine-grained token melalui halaman awal untuk memakai Admin.</p><button class="primary" onclick="v30ShowLogin()">Hubungkan GitHub</button></div>'}

function field(id,label,val='',type='text',required=false,help=''){
 const v=type==='lines'?Array.isArray(val)?val.join('\n'):val||'':type==='activities'?Array.isArray(val)?val.map(a=>[a.title,a.date,a.description].join(' | ')).join('\n'):val||'':type==='materials'?Array.isArray(val)?val.map(m=>[m.title,m.url].join(' | ')).join('\n'):val||'':val??'';
 return `<div class="field"><label for="f-${esc(id)}">${esc(label)}${required?' *':''}</label>${['textarea','lines','activities','materials'].includes(type)?`<textarea id="f-${esc(id)}" name="${esc(id)}" ${required?'required':''}>${esc(v)}</textarea>`:`<input id="f-${esc(id)}" type="${esc(type)}" name="${esc(id)}" value="${esc(v)}" ${required?'required':''}>`}${help?`<small>${esc(help)}</small>`:''}</div>`;
}
function value(form,id){return String(new FormData(form).get(id)||'').trim()}
function lines(s){return String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}
function groupedLines(s,kind){return lines(s).map(row=>{const a=row.split('|').map(x=>x.trim());return kind==='activities'?{title:a[0],date:a[1]||'',description:a.slice(2).join(' | ')}:{title:a[0],url:a.slice(1).join('|').trim()}}).filter(x=>x.title);}
// V19: structured month/year for positions, projects, and activities.
const V19_MONTHS_ID=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const V19_MONTHS_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const V19_TIMED=new Set(['experiences','projects','otherActivities']);
function v19DateLabel(x,type){
 if(type==='publications'){
  if(x.publicationDate&&/^\d{4}-\d{2}-\d{2}$/.test(x.publicationDate))return x.publicationDate.split('-').reverse().join('/');
  return String(x.year||'');
 }
 if(x.startMonth&&x.startYear){
  const start=V19_MONTHS_ID[Number(x.startMonth)-1]+' '+x.startYear;
  if(x.currentlyActive)return start+' – Sekarang';
  if(x.endMonth&&x.endYear){const end=V19_MONTHS_ID[Number(x.endMonth)-1]+' '+x.endYear;return x.startYear===x.endYear&&x.startMonth===x.endMonth?start:start+' – '+end;}
  return start;
 }
 return String(x.period||x.date||x.year||x.releaseYear||'');
}
function v19YearOptions(value=''){
 const now=new Date().getFullYear();const first=now+1,years=Array.from({length:95},(_,i)=>String(first-i));
 if(value&&!years.includes(value))years.unshift(String(value));
 return years.map(y=>`<option value="${esc(y)}" ${String(value)===y?'selected':''}>${esc(y)}</option>`).join('');
}
function v19MonthOptions(value=''){
 return V19_MONTHS_ID.map((m,i)=>`<option value="${String(i+1).padStart(2,'0')}" ${String(value)===String(i+1).padStart(2,'0')?'selected':''}>${m}</option>`).join('');
}
function v19DateFields(type,x,fresh){
 if(V19_TIMED.has(type)){
  const legacy=!x.startMonth&&!fresh&&(x.period||x.date||x.year);
  return `<div class="v19-period" id="v19Period"><h3>Periode</h3>${legacy?`<p class="muted">Data lama: ${esc(v19DateLabel(x,type))}. Lengkapi bulan dan tahun sebelum menyimpan revisi.</p>`:''}
  <div class="v19-period-grid"><div><label>Start *</label><div class="v19-select-pair"><select name="startMonth" required><option value="">Bulan</option>${v19MonthOptions(x.startMonth)}</select><select name="startYear" required><option value="">Tahun</option>${v19YearOptions(x.startYear)}</select></div></div>
  <div><label>End (opsional)</label><div class="v19-select-pair"><select name="endMonth"><option value="">Bulan</option>${v19MonthOptions(x.endMonth)}</select><select name="endYear"><option value="">Tahun</option>${v19YearOptions(x.endYear)}</select></div></div></div>
  <label class="v19-current"><input type="checkbox" name="currentlyActive" ${x.currentlyActive?'checked':''}> Currently active</label><p class="muted">Jika Start dan End sama, hanya satu bulan ditampilkan. End boleh kosong.</p></div>`;
 }
 if(type==='tools'){return `<div class="v19-period"><h3>Tahun rilis (opsional)</h3><select name="releaseYear"><option value="">Belum diisi</option>${v19YearOptions(x.releaseYear||'')}</select></div>`;}
 if(type==='publications'){
  const parts=String(x.publicationDate||'').match(/^(\d{4})-(\d{2})-(\d{2})$/),year=parts?.[1]||'',month=parts?.[2]||'',day=parts?.[3]||'';
  return `<div class="v19-period"><h3>Tanggal publikasi</h3>${!parts&&x.year?`<p class="muted">Tahun lama: ${esc(x.year)}. Pilih tanggal terbit saat memperbarui entri.</p>`:''}<div class="v19-publication-date">
  <label>Hari <select name="publicationDay" required><option value="">Hari</option>${Array.from({length:31},(_,i)=>{const d=String(i+1).padStart(2,'0');return `<option value="${d}" ${d===day?'selected':''}>${i+1}</option>`}).join('')}</select></label>
  <label>Bulan <select name="publicationMonth" required><option value="">Bulan</option>${v19MonthOptions(month)}</select></label>
  <label>Tahun <select name="publicationYear" required><option value="">Tahun</option>${v19YearOptions(year)}</select></label></div></div>`;
 }
 return '';
}
function v19CollectDate(form,obj,type){
 if(V19_TIMED.has(type)){
  const month=value(form,'startMonth'),year=value(form,'startYear'),endMonth=value(form,'endMonth'),endYear=value(form,'endYear'),active=Boolean(form.elements.currentlyActive?.checked);
  if(!month||!year)throw Error('Start bulan dan tahun wajib dipilih.');
  if(!active&&Boolean(endMonth)!==Boolean(endYear))throw Error('End: pilih bulan dan tahun sekaligus, atau kosongkan keduanya.');
  if(!active&&endMonth&&Number(endYear+endMonth)<Number(year+month))throw Error('End tidak boleh sebelum Start.');
  obj.startMonth=month;obj.startYear=year;obj.endMonth=active?'':endMonth;obj.endYear=active?'':endYear;obj.currentlyActive=active;
  const start=V19_MONTHS_ID[Number(month)-1]+' '+year;
  const finish=active?'Now':endMonth?V19_MONTHS_ID[Number(endMonth)-1]+' '+endYear:'';
  const period=finish&&!(endMonth===month&&endYear===year&&!active)?start+' – '+finish:start;
  // Keep derived legacy fields for older clients without changing existing records until edited.
  if(type==='experiences')obj.period=period;
  if(type==='projects'){obj.period=period;obj.year=year;}
  if(type==='otherActivities')obj.date=period;
 }
 if(type==='tools')obj.releaseYear=value(form,'releaseYear');
 if(type==='publications'){
  const day=value(form,'publicationDay'),month=value(form,'publicationMonth'),year=value(form,'publicationYear');
  if(!day||!month||!year)throw Error('Tanggal publikasi lengkap wajib diisi (hari, bulan, tahun).');
  const iso=`${year}-${month}-${day}`;const d=new Date(iso+'T00:00:00Z');
  if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==iso)throw Error('Tanggal publikasi tidak valid.');
  obj.publicationDate=iso;obj.year=year;
 }
}
function v19IconSection(type,x){
 const cfg=type==='projects'?{name:'partnerLogo',website:'partnerWebsite',label:'Logo mitra proyek'}:
           type==='otherActivities'?{name:'organizerIcon',website:'organizerWebsite',label:'Logo penyelenggara'}:null;
 if(!cfg)return '';
 const k=type==='projects'?'partner':'organizer';
 return `<div class="bar"></div><div class="photo-area"><strong>${cfg.label}</strong><p class="muted">Ikon kecil: upload gambar atau masukkan URL website institusi untuk mengambil favicon (64px).</p>
 <div class="v15-icon-row"><div class="v15-company-preview" id="${k}IconPreview"></div><div><label class="field">Upload logo<input type="file" accept="image/*" id="${k}IconFile"></label>
 <div class="field"><label>Website</label><input type="text" id="${k}Website" placeholder="https://website-instansi.go.id" value="${esc(x[cfg.website]||'')}"></div>
 <button type="button" class="secondary small" id="${k}IconFromWeb">Ambil ikon dari website</button><input type="hidden" id="${k}IconValue" value="${esc(x[cfg.name]||'')}"><div id="${k}IconStatus" class="muted" aria-live="polite"></div><button type="button" class="secondary small" id="${k}IconClear">Hapus ikon</button></div></div></div>`;
}

function v10SortLabel(type,x){return esc(x[CONFIG[type]?.key]||x.course||x.title||'Untitled');}
function renderList(type){
 const items=APP.site[type]||[],cfg=CONFIG[type];
 $('#bodyContent').innerHTML=`<div class="panel"><div class="row-between"><div><h2>${esc(cfg.title)}</h2><span class="muted">${items.length} entri · tarik ikon ⠿ untuk mengubah urutan tanpa memuat ulang.</span></div><button class="primary" onclick="editItem('${type}',-1)">+ Add</button></div><div class="v10-sort-list" id="v10-sort-list">${items.length?items.map((x,i)=>`<div class="item v10-sort-item" data-order-id="${esc(x.id)}"><button class="v10-grip" type="button" aria-label="Geser urutan ${v10SortLabel(type,x)}" title="Drag untuk mengurutkan">⠿</button><div class="v10-rowbody"><div class="item-title">${v10SortLabel(type,x)}</div><div class="item-sub"><strong class="v19-row-date">${esc(v19DateLabel(x,type))}</strong>${v19DateLabel(x,type)?' · ':''}${esc(x.organization||x.category||x.journal||x.version||x.description||'')}</div></div><div class="actions"><button class="secondary small" type="button" data-v10-edit="${esc(x.id)}">Edit</button><button class="secondary small danger" type="button" data-v10-delete="${esc(x.id)}">Delete</button></div></div>`).join(''):'<div class="empty">Belum ada konten. Klik Add untuk membuat entri baru.</div>'}</div><p class="muted v10-order-tip">Urutan langsung disimpan ke Google Sheets setelah dilepas. Perubahan tampil di website publik setelah klik Publish.</p></div>`;
 const container=$('#v10-sort-list');
 container.addEventListener('click',e=>{const edit=e.target.closest('[data-v10-edit]'),del=e.target.closest('[data-v10-delete]');if(!edit&&!del)return;const id=(edit||del).dataset[edit?'v10Edit':'v10Delete'];const at=(APP.site[type]||[]).findIndex(x=>x.id===id);if(at<0)return;if(edit)editItem(type,at);else deleteItem(type,at);});
 v10AttachSort(container,type);
}
const v10Reordering=new Set();
function v10AttachSort(container,type,onLocalReorder){
 let drag=null, moved=false;
 const getItems=()=>Array.from(container.querySelectorAll('.v10-sort-item'));
 function commit(){
  const ids=getItems().map(n=>n.dataset.orderId);
  if(typeof onLocalReorder==='function'){onLocalReorder(ids);return;}
  const prior=(APP.site[type]||[]).slice();
  if(ids.join('\0')===prior.map(x=>x.id).join('\0'))return;
  const lookup=new Map(prior.map(x=>[x.id,x]));APP.site[type]=ids.map(id=>lookup.get(id));
  v10Reordering.add(type);container.classList.add('v10-saving');setBusy(true,'Menyimpan urutan...');
  rpc('apiReorderItems',type,ids).then(()=>toast('Urutan tersimpan di draft GitHub privat. Klik Publish untuk website utama.')).catch(err=>{APP.site[type]=prior;renderList(type);fail(err)}).finally(()=>{v10Reordering.delete(type);container.classList.remove('v10-saving');setBusy(false)});
 }
 container.addEventListener('pointerdown',e=>{
  const handle=e.target.closest('.v10-grip');if(!handle||v10Reordering.has(type)||e.button!==0)return;
  const row=handle.closest('.v10-sort-item');if(!row||getItems().length<2)return;
  const bounds=row.getBoundingClientRect();
  drag={handle,row,bounds,originalY:e.clientY,lastY:e.clientY,placeholder:null,startOrder:getItems().map(n=>n.dataset.orderId).join('\0')};
  moved=false;handle.setPointerCapture(e.pointerId);e.preventDefault();
 });
 container.addEventListener('pointermove',e=>{
  if(!drag || e.target!==drag.handle || !drag.handle.hasPointerCapture(e.pointerId))return;
  drag.lastY=e.clientY;
  if(!moved && Math.abs(e.clientY-drag.originalY)<5)return;
  if(!moved){
   moved=true;const ph=document.createElement('div');ph.className='v10-sort-placeholder';ph.style.height=drag.bounds.height+'px';drag.row.after(ph);drag.placeholder=ph;
   Object.assign(drag.row.style,{position:'fixed',top:drag.bounds.top+'px',left:drag.bounds.left+'px',width:drag.bounds.width+'px',height:drag.bounds.height+'px',zIndex:'120',pointerEvents:'none',margin:'0',boxSizing:'border-box'});
   drag.row.classList.add('v10-dragging');
  }
  drag.row.style.top=(drag.bounds.top+e.clientY-drag.originalY)+'px';
  const others=getItems().filter(n=>n!==drag.row);
  for(const other of others){const r=other.getBoundingClientRect();if(e.clientY<r.top+r.height/2){other.before(drag.placeholder);break;}else{other.after(drag.placeholder)}}
  if(e.clientY<70)window.scrollBy(0,-12);else if(e.clientY>window.innerHeight-70)window.scrollBy(0,12);
 });
 function finish(e){
  if(!drag)return;if(drag.handle.hasPointerCapture(e.pointerId))drag.handle.releasePointerCapture(e.pointerId);
  if(moved&&drag.placeholder){drag.placeholder.replaceWith(drag.row);drag.row.removeAttribute('style');drag.row.classList.remove('v10-dragging');}
  const changed=moved;drag=null;moved=false;if(changed)commit();
 }
 container.addEventListener('pointerup',finish);container.addEventListener('pointercancel',finish);
 container.addEventListener('keydown',e=>{
  if(!e.target.matches('.v10-grip')||!['ArrowUp','ArrowDown'].includes(e.key)||v10Reordering.has(type))return;
  const row=e.target.closest('.v10-sort-item'),other=e.key==='ArrowUp'?row.previousElementSibling:row.nextElementSibling;
  if(!other||!other.classList.contains('v10-sort-item'))return;e.preventDefault();
  if(e.key==='ArrowUp')other.before(row);else other.after(row);e.target.focus();commit();
 });
}
async function deleteItem(type,index){const x=APP.site[type][index];if(!confirm('Hapus '+(x.role||x.title||x.name||'item')+' dari draft GitHub privat? Perubahan baru terlihat publik setelah Publish.'))return;setBusy(true);try{await rpc('apiDeleteItem',type,x.id);await refresh();toast('Entri dihapus dari database. Klik Publish untuk memperbarui website.')}catch(err){fail(err)}}
function showDialog(html){$('#dialogContent').innerHTML=html;$('#dialogBackdrop').classList.remove('hide');$('#dialogBackdrop').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeDialog(){if(photoUploading){toast('Tunggu upload foto selesai.');return;}$('#dialogBackdrop').classList.add('hide');$('#dialogBackdrop').setAttribute('aria-hidden','true');document.body.style.overflow='';$('#dialogContent').innerHTML='';}
$('#dialogBackdrop').addEventListener('click',e=>{if(e.target.id==='dialogBackdrop')closeDialog()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#dialogBackdrop').classList.contains('hide'))closeDialog()});
function imgPreview(ref){
 if(!ref)return '';
 if(/^trial:[a-f0-9]{32}\.(?:webp|png|jpg)$/i.test(ref))return V30.mediaCache.get(ref)||'';
 if(/^assets\/(?:images|icons|documents)\/[a-zA-Z0-9_.-]+$/.test(ref))return '/'+ref;
 if(/^https:\/\//.test(ref))return ref;
 if(ref.startsWith('data:image/'))return ref;
 if(/^drive:/.test(ref))return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(ref.slice(6))+'&sz=w300';
 return '';
}

function galleryView(){
 const n=$('#galleryItems');if(!n)return;
 n.classList.add('v27-gallery');
 n.innerHTML=galleryTmp.map((x,i)=>`<div class="photo v27-photo" data-gallery-index="${i}" draggable="true"><button type="button" class="v27-gallery-grip" title="Geser foto" aria-label="Geser foto ${i+1}">⠿</button>${imgPreview(x.url)?`<img src="${esc(imgPreview(x.url))}" alt="Dokumentasi" draggable="false">`:'<div>Image</div>'}<button class="v27-photo-remove" type="button" onclick="removeGallery(${i})" aria-label="Hapus foto">×</button><label class="gallery-feature"><input type="checkbox" data-feat="${i}" ${x.featured?'checked':''}> Featured on Home</label></div>`).join('');
 n.querySelectorAll('[data-feat]').forEach(el=>el.addEventListener('change',()=>galleryTmp[Number(el.dataset.feat)].featured=el.checked));
 v27AttachGallerySort(n,(oldIndex,newIndex)=>{if(oldIndex===newIndex)return;galleryTmp.splice(newIndex,0,galleryTmp.splice(oldIndex,1)[0]);galleryView();});
}
function v27AttachGallerySort(root,reorder){
 let start=null,dragItem=null;
 root.querySelectorAll('.v27-photo').forEach(card=>{
  card.addEventListener('dragstart',e=>{if(e.target.closest('button')&& !e.target.closest('.v27-gallery-grip')){e.preventDefault();return;}start=Number(card.dataset.galleryIndex);dragItem=card;card.classList.add('v27-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(start));});
  card.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';card.classList.add('v27-drop-target');});
  card.addEventListener('dragleave',()=>card.classList.remove('v27-drop-target'));
  card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('v27-drop-target');const target=Number(card.dataset.galleryIndex);if(start!==null)reorder(start,target);start=null;});
  card.addEventListener('dragend',()=>{dragItem?.classList.remove('v27-dragging');root.querySelectorAll('.v27-drop-target').forEach(e=>e.classList.remove('v27-drop-target'));start=null;});
 });
 // On touchscreens, drag the small handle with a low-cost pointer gesture.
 let touch=null;
 root.querySelectorAll('.v27-gallery-grip').forEach(handle=>{
  handle.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const card=handle.closest('.v27-photo');touch={id:e.pointerId,from:Number(card.dataset.galleryIndex),to:Number(card.dataset.galleryIndex),handle};handle.setPointerCapture(e.pointerId);});
  handle.addEventListener('pointermove',e=>{if(!touch||touch.id!==e.pointerId)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.v27-photo');if(target&&root.contains(target)){touch.to=Number(target.dataset.galleryIndex);root.querySelectorAll('.v27-drop-target').forEach(x=>x.classList.remove('v27-drop-target'));target.classList.add('v27-drop-target');}});
  handle.addEventListener('pointerup',e=>{if(!touch||touch.id!==e.pointerId)return;const {from,to}=touch;touch=null;root.querySelectorAll('.v27-drop-target').forEach(x=>x.classList.remove('v27-drop-target'));reorder(from,to);});
  handle.addEventListener('pointercancel',()=>{touch=null;root.querySelectorAll('.v27-drop-target').forEach(x=>x.classList.remove('v27-drop-target'));});
 });
}
function removeGallery(i){galleryTmp.splice(i,1);galleryView()}
// V13: image optimization is automatic, done locally before the network transfer.
// No arbitrary limit on the ORIGINAL file size; server receives only an optimized image.
async function canvasData(file, maxEdge=2300){
 if(!file || !(file.type||'').startsWith('image/'))throw Error('Pilih file foto (JPG, PNG, WebP, atau format yang didukung browser).');
 const imgURL=URL.createObjectURL(file);
 try{
  const image=await new Promise((resolve,reject)=>{
   const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Format foto tidak dapat dibaca browser. Untuk HEIC yang tidak didukung, gunakan JPG atau JPEG.'));im.src=imgURL;
  });
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(!width||!height)throw Error('Resolusi foto tidak valid.');
  const scale=Math.min(1,maxEdge/Math.max(width,height));
  let w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
  const MAX_BYTES=2.55*1024*1024;
  for(let sizeTry=0;sizeTry<4;sizeTry++){
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Browser tidak dapat mengolah gambar ini.');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,w,h);
   for(const quality of [.88,.81,.74,.64,.54]){
    // Use JPEG for broad mobile compatibility, and deterministic downstream handling.
    const data=canvas.toDataURL('image/jpeg',quality);
    const approxBytes=Math.ceil((data.length-data.indexOf(',')-1)*.75);
    if(approxBytes<=MAX_BYTES)return data;
   }
   w=Math.max(1,Math.round(w*.82));h=Math.max(1,Math.round(h*.82));
   await new Promise(resolve=>setTimeout(resolve,0)); // keep mobile UI responsive
  }
  throw Error('Foto terlalu kompleks untuk diproses. Coba foto lain atau resolusi yang lebih rendah.');
 }finally{URL.revokeObjectURL(imgURL);}
}
async function uploadOne(file){const data=await canvasData(file);return await rpc('apiUploadPhoto',file.name,data);}
// V15: preserve PNG transparency and use a compact 512px logo instead of a photo-sized image.
// V16: favicon only from a public domain; tiny 64px image, without Drive upload.
function v16WebsiteFavicon(input){
 let raw=String(input||'').trim();
 if(!raw)throw Error('Masukkan URL website institusi.');
 if(!/^https?:\/\//i.test(raw))raw='https://'+raw;
 let u;try{u=new URL(raw)}catch(_){throw Error('URL website tidak valid.');}
 const host=u.hostname.toLowerCase();
 if(!['http:','https:'].includes(u.protocol)||!host.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)||host.endsWith('.local'))throw Error('Gunakan URL website publik dengan domain valid.');
 return 'https://www.google.com/s2/favicons?domain='+encodeURIComponent(host)+'&sz=64';
}
function v16BindLogo({fileId,webId,refId,previewId,statusId,fromWebId,clearId}){
 const file=$(fileId),web=$(webId),ref=$(refId),preview=$(previewId),status=$(statusId);
 const render=()=>{const src=imgPreview(ref.value);preview.innerHTML=src?`<img alt="Logo" src="${esc(src)}" onerror="this.style.display='none'">`:(ref.value?'<span>Ikon tersimpan</span>':'<span>Belum ada ikon</span>');};
 render();
 file.onchange=async()=>{
  const selected=file.files?.[0];if(!selected)return;
  photoUploading=true;status.textContent='Mengoptimalkan ikon lalu mengunggah...';
  try{const saved=await uploadCompanyLogo(selected);ref.value=saved.url;status.textContent='Ikon diunggah. Klik Save untuk menyimpan.';render();}
  catch(err){status.textContent='Gagal: '+(err.message||err);alert(err.message||String(err));}
  finally{photoUploading=false;file.value='';}
 };
 $(fromWebId).onclick=()=>{
  try{const logo=v16WebsiteFavicon(web.value);ref.value=logo;status.textContent='Favicon domain dipilih (64px). Klik Save untuk menyimpan.';render();}
  catch(err){status.textContent=err.message;alert(err.message);}
 };
 $(clearId).onclick=()=>{ref.value='';status.textContent='Ikon dihapus setelah Save.';render();};
}
async function uploadCompanyLogo(file){
 if(!file || !(file.type||'').startsWith('image/'))throw Error('Unggah ikon gambar JPG/PNG/WebP.');
 const url=URL.createObjectURL(file);
 try{
  const im=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Format gambar tidak didukung browser.'));img.src=url;});
  const originalWidth=im.naturalWidth||im.width,originalHeight=im.naturalHeight||im.height;
  if(!originalWidth||!originalHeight)throw Error('Resolusi ikon tidak valid.');
  const scale=Math.min(1,512/Math.max(originalWidth,originalHeight));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(originalWidth*scale));c.height=Math.max(1,Math.round(originalHeight*scale));
  const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,c.width,c.height);
  let data=c.toDataURL('image/png');
  if(data.length>3.7*1024*1024){
   ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
   data=c.toDataURL('image/jpeg',.84);
  }
  return await rpc('apiUploadPhoto',file.name,data);
 }finally{URL.revokeObjectURL(url);}
}
async function galleryUpload(input){const files=Array.from(input.files||[]);if(!files.length)return;if(files.length+galleryTmp.length>20){alert('Maksimal 20 foto dalam satu entri.');return;}photoUploading=true;const stat=$('#uploadStatus');try{for(let i=0;i<files.length;i++){stat.textContent=`Menyiapkan & upload foto ${i+1}/${files.length}...`;const saved=await uploadOne(files[i]);galleryTmp.push({url:saved.url,caption:''});galleryView()}toast('Foto terunggah ke GitHub privat. Simpan entri, lalu Publish untuk website.')}catch(err){fail(err)}finally{photoUploading=false;input.value='';stat.textContent='';}}
const EN_FIELDS={otherActivities:[['title','Title'],['type','Type'],['role','Role'],['organizer','Organizer'],['location','Location'],['description','Description'],['certificateTitle','Certificate title']],experiences:[['role','Role']],projects:[['title','Project title'],['category','Category'],['role','Role'],['description','Description'],['outputs','Outputs']],publications:[['title','Article title']],tools:[['description','Description']]};
function editItem(type,index){const cfg=CONFIG[type],fresh=index===-1,x=clone(fresh?{id:uid(),gallery:[],materials:[],contributions:[],activities:[],features:[]}:APP.site[type][index]);galleryTmp=clone(x.gallery||[]);const fields=cfg.fields.map(f=>field(f[0],f[1],x[f[0]],f[2]||'text',f[3]||false)).join('');
 const enFields=EN_FIELDS[type]||[], en=x.en||{};
 const translatedFields=enFields.length?`<details class="lang-editor"><summary>English (otomatis saat Publish; boleh dikoreksi)</summary><p class="muted">Jika English kosong, otomatis diterjemahkan dari bahasa Indonesia.</p><button type="button" class="secondary small" id="autoTranslateItem">Auto Translate</button><span id="itemTranslateStatus" class="muted"></span>${enFields.map(([key,label])=>field('en__'+key,label+' (EN)',en[key]||'', ['summary','description','outputs'].includes(key)?'textarea':'text')).join('')}${type==='experiences'?field('en__contributions','Contributions (EN, satu per baris)',en.contributions,'lines')+field('en__activities','Activities (EN): Title | Date | Description',en.activities,'activities'):''}${type==='tools'?field('en__features','Features (EN, per baris)',en.features,'lines'):''}</details>`:'';
 const withPhoto=['experiences','projects','slides','otherActivities'].includes(type);
 const companyIconSection=type==='experiences'?`<div class="bar"></div><div class="photo-area"><strong>Ikon perusahaan / institusi</strong><p class="muted">Pilih salah satu: upload gambar/logo (disimpan di Drive) atau masukkan alamat website untuk mengambil favicon 64px. Jika tidak diisi, website menampilkan ikon kantor standar.</p><div class="v15-icon-row"><div class="v15-company-preview" id="companyIconPreview"></div><div><label class="field">Upload logo<input type="file" accept="image/*" id="companyIconFile"></label><div class="field"><label>Website institusi (contoh: dlh.surabaya.go.id)</label><input type="text" id="companyWebsite" placeholder="https://website-instansi.go.id" value="${esc(x.companyWebsite||'')}"></div><button type="button" class="secondary small" id="companyIconFromWeb">Ambil ikon dari website</button><input type="hidden" id="companyIconValue" value="${esc(x.companyIcon||'')}"><div id="companyIconStatus" class="muted" aria-live="polite"></div><button type="button" class="secondary small" id="companyIconClear">Hapus ikon</button></div></div></div>`:'';
 const journalIconSection=type==='publications'?`<div class="photo-area"><strong>Ikon jurnal (opsional)</strong><p class="muted">Ikon dicoba otomatis dari Article URL. Jika tidak sesuai, upload logo jurnal PNG/JPG/WebP di sini.</p><div class="v15-icon-row"><div id="journalIconPreview" class="v15-company-preview">${imgPreview(x.journalIcon)?`<img src="${esc(imgPreview(x.journalIcon))}" alt="">`:'Auto'}</div><div><input type="file" accept="image/*" id="journalIconFile"><input type="hidden" id="journalIconValue" value="${esc(x.journalIcon||'')}"><div class="muted" id="journalIconStatus"></div><button type="button" class="secondary small" id="clearJournalIcon">Gunakan favicon otomatis</button></div></div></div>`:'';
 showDialog(`<h2>${fresh?'Add':'Edit'} ${esc(cfg.title)}</h2><p class="intro">Data disimpan di Sheets dahulu dan ditampilkan setelah Publish.</p><form id="itemForm">${fields}${v19DateFields(type,x,fresh)}${translatedFields}${companyIconSection}${v19IconSection(type,x)}${journalIconSection}${type==='otherActivities'?`<div class="bar"></div><div class="photo-area"><strong>Upload Certificate (PDF, optional)</strong><p class="muted">Foto dokumentasi dan foto sertifikat bisa masuk galeri. Untuk sertifikat PDF, unggah di sini (maksimal 5 MB) atau tempel URL di kolom Certificate URL.</p><input type="file" id="v18CertificateFile" accept="application/pdf,.pdf"><div id="v18CertificateStatus" class="muted" role="status"></div></div>`:''}${withPhoto?`<div class="bar"></div><div class="photo-area"><strong>Documentation Gallery</strong><p class="muted">Pilih foto langsung dari HP (termasuk file besar). Sistem otomatis mengecilkan ukuran transfer, menjaga ketajaman foto, dan menyimpannya ke Drive. Pilih Featured agar masuk slideshow.</p><input id="fileGallery" type="file" accept="image/*" multiple><div id="uploadStatus" class="muted"></div><div id="galleryItems" class="photo-grid"></div></div>`:''}<div class="footer-action"><button type="button" class="secondary" onclick="closeDialog()">Cancel</button><button type="submit" class="primary" id="itemSaveBtn">Save to Sheets</button></div></form>`);
 if(type==='courses')v10EnhanceMaterialsEditor();
 galleryView();$('#fileGallery')?.addEventListener('change',e=>galleryUpload(e.target));
 if(type==='otherActivities'){
  const upload=$('#v18CertificateFile'),status=$('#v18CertificateStatus');
  upload?.addEventListener('change',async()=>{
   const file=upload.files?.[0];if(!file)return;
   if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name)){status.textContent='Pilih dokumen PDF.';return;}
   if(file.size>5*1024*1024){status.textContent='File lebih dari 5 MB. Gunakan tautan Google Drive.';return;}
   photoUploading=true;status.textContent='Mengunggah sertifikat...';
   try{const b64=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(Error('File tidak terbaca'));fr.readAsDataURL(file);});
    const saved=await rpc('apiUploadCertificate',file.name,String(b64));
    $('#f-certificateUrl').value=saved.url;status.textContent='Sertifikat tersimpan di Drive. Klik Save to Sheets.';
   }catch(err){status.textContent=err.message||String(err);}finally{photoUploading=false;}
  });
 }

 // V16: two paths for small organization icons.
 if(type==='publications'){
  const file=$('#journalIconFile'),stat=$('#journalIconStatus');
  file.onchange=async()=>{const f=file.files?.[0];if(!f)return;stat.textContent='Mengunggah...';try{const up=await uploadOne(f);$('#journalIconValue').value=up.url;$('#journalIconPreview').innerHTML=`<img src="${esc(imgPreview(up.url))}" alt="">`;stat.textContent='Tersimpan. Klik Save to Sheets.';}catch(e){stat.textContent=e.message;}};
  $('#clearJournalIcon').onclick=()=>{$('#journalIconValue').value='';$('#journalIconPreview').textContent='Auto';stat.textContent='Gunakan favicon Article URL.';};
 }
 if(type==='projects'||type==='otherActivities'){const k=type==='projects'?'partner':'organizer';v16BindLogo({fileId:'#'+k+'IconFile',webId:'#'+k+'Website',refId:'#'+k+'IconValue',previewId:'#'+k+'IconPreview',statusId:'#'+k+'IconStatus',fromWebId:'#'+k+'IconFromWeb',clearId:'#'+k+'IconClear'});}
 if(V19_TIMED.has(type)){const active=$('[name=currentlyActive]');const sync=()=>{['endMonth','endYear'].forEach(key=>{const sel=$('[name='+key+']');sel.disabled=active.checked;});};active.addEventListener('change',sync);sync();}
 if(type==='experiences')v16BindLogo({fileId:'#companyIconFile',webId:'#companyWebsite',refId:'#companyIconValue',previewId:'#companyIconPreview',statusId:'#companyIconStatus',fromWebId:'#companyIconFromWeb',clearId:'#companyIconClear'});
 const auto=$('#autoTranslateItem');if(auto)auto.onclick=async()=>{const form=$('#itemForm');auto.disabled=true;$('#itemTranslateStatus').textContent=' Menerjemahkan...';try{const source={};for(const f of cfg.fields){const v=value(form,f[0]);source[f[0]]=f[2]==='lines'?lines(v):f[2]==='activities'?groupedLines(v,'activities'):f[2]==='materials'?groupedLines(v,'materials'):v;}const translated=await rpc('apiTranslateDraft',type,source);enFields.forEach(([key])=>{if(translated[key])form.elements['en__'+key].value=translated[key]});if(type==='experiences'){if(translated.contributions)form.elements.en__contributions.value=translated.contributions.join('\n');if(translated.activities)form.elements.en__activities.value=translated.activities.map(a=>[a.title,a.date,a.description].join(' | ')).join('\n');}if(type==='tools'&&translated.features)form.elements.en__features.value=translated.features.join('\n');$('#itemTranslateStatus').textContent=' Selesai. Periksa sebelum Save.';}catch(err){fail(err)}finally{auto.disabled=false}};
 $('#itemForm').onsubmit=async e=>{e.preventDefault();if(photoUploading)return toast('Upload foto masih berlangsung.');const form=e.target,obj={...x};for(const f of cfg.fields){const v=value(form,f[0]);obj[f[0]]=f[2]==='lines'?lines(v):f[2]==='activities'?groupedLines(v,'activities'):f[2]==='materials'?groupedLines(v,'materials'):v;}
 try{v19CollectDate(form,obj,type);}catch(err){return fail(err);}
 if(withPhoto){obj.gallery=clone(galleryTmp);if(type==='projects'){obj.cover=obj.gallery?.[0]?.url||x.cover||'';}}
 if(type==='publications'){obj.journalIcon=$('#journalIconValue').value;delete obj.journalWebsite;}
 if(type==='experiences'){obj.companyIcon=$('#companyIconValue').value;obj.companyWebsite=$('#companyWebsite').value.trim();}
 if(type==='projects'){obj.partnerLogo=$('#partnerIconValue').value;obj.partnerWebsite=$('#partnerWebsite').value.trim();}
 if(type==='otherActivities'){obj.organizerIcon=$('#organizerIconValue').value;obj.organizerWebsite=$('#organizerWebsite').value.trim();}
 if(enFields.length){obj.en={...(x.en||{})};enFields.forEach(([key])=>{const v=value(form,'en__'+key);if(v)obj.en[key]=v;else delete obj.en[key];});if(type==='experiences'){const c=lines(value(form,'en__contributions')),a=groupedLines(value(form,'en__activities'),'activities');if(c.length)obj.en.contributions=c;else delete obj.en.contributions;if(a.length)obj.en.activities=a;else delete obj.en.activities;}if(type==='tools'){const f=lines(value(form,'en__features'));if(f.length)obj.en.features=f;else delete obj.en.features;}}
 const btn=$('#itemSaveBtn');btn.disabled=true;btn.textContent='Saving...';try{await rpc('apiSaveItem',type,obj);closeDialog();await refresh();toast('Tersimpan di draft GitHub privat. Klik Publish untuk website.')}catch(err){btn.disabled=false;fail(err)}};
}
function v10EnhanceMaterialsEditor(){
 const ta=$('#f-materials');if(!ta)return;
 const outer=document.createElement('div');outer.className='v10-material-order';
 outer.innerHTML='<strong>Atur urutan materi</strong><small>Tarik ⠿ untuk mengatur posisi. Klik Save to Sheets setelah selesai.</small><div id="v10-material-list" class="v10-sort-list"></div>';
 ta.parentElement.after(outer);const list=outer.querySelector('#v10-material-list');
 const draw=()=>{const rows=lines(ta.value);list.innerHTML=rows.map((r,i)=>`<div class="v10-sort-item v10-material-item" data-order-id="${i}"><button type="button" class="v10-grip" title="Geser materi" aria-label="Geser materi ${i+1}">⠿</button><div class="v10-rowbody">${esc(r.split('|')[0].trim())}</div></div>`).join('');};
 v10AttachSort(list,'materials',ids=>{
  const current=lines(ta.value);
  const rearranged=ids.map(i=>current[Number(i)]).filter(Boolean);
  if(rearranged.some((row,i)=>row!==current[i])){ta.value=rearranged.join('\n');draw();toast('Urutan materi diperbarui. Klik Save to Sheets.');}
 });
 ta.addEventListener('input',draw);draw();
}
let v17EduPhotos={};
function v17EducationGallery(key){
 const el=$('#edu_'+key+'_gallery');if(!el)return;
 const photos=v17EduPhotos[key]||[];
 el.classList.add('v27-gallery');
 el.innerHTML=photos.map((ph,i)=>`<div class="v17-edu-thumb v27-photo" draggable="true" data-gallery-index="${i}"><button type="button" class="v27-gallery-grip" aria-label="Geser foto">⠿</button>${imgPreview(ph.url)?`<img src="${esc(imgPreview(ph.url))}" alt="Dokumentasi" draggable="false">`:'<span>Photo</span>'}<button type="button" class="v27-edu-remove" data-index="${i}" aria-label="Hapus foto">×</button></div>`).join('');
 el.querySelectorAll('[data-index]').forEach(btn=>btn.onclick=()=>{photos.splice(Number(btn.dataset.index),1);v17EducationGallery(key);});
 v27AttachGallerySort(el,(from,to)=>{if(from===to)return;photos.splice(to,0,photos.splice(from,1)[0]);v17EducationGallery(key);});
}
async function v17UploadEdu(key,input){
 const files=Array.from(input.files||[]);if(!files.length)return;
 const st=$('#edu_'+key+'_photoStatus');photoUploading=true;
 try{for(let i=0;i<files.length;i++){st.textContent=`Upload foto ${i+1}/${files.length}...`;const saved=await uploadOne(files[i]);v17EduPhotos[key].push({url:saved.url});v17EducationGallery(key);}st.textContent='Foto siap disimpan bersama profil.';}
 catch(e){st.textContent=e.message;}finally{photoUploading=false;input.value='';}
}
// V28 certifications/contact editor; keep ordering in the form without reloading the page.
const PM28_PRIVATE_FIELDS=[['phone','Nomor HP'],['email','Email'],['officeAddress','Alamat kantor'],['nip','NIP'],['functionalPosition','Jabatan fungsional'],['rankGroup','Pangkat/Golongan'],['bankAccount','Nama bank dan nomor rekening']];
function v28PrivateFields(){const p=APP.privateProfile||{};return PM28_PRIVATE_FIELDS.map(([k,l])=>field('private__'+k,l,p[k]||'','text')).join('');}
function v28CollectPrivate(){const f=$('#profileForm'),r={};PM28_PRIVATE_FIELDS.forEach(([k])=>r[k]=value(f,'private__'+k));return r;}
function v28LegacyContacts(p){const items=[['linkedin','LinkedIn'],['instagram','Instagram'],['youtube','YouTube'],['scholar','Google Scholar'],['orcid','ORCID'],['sinta','SINTA'],['upnProfile','UPN Profile']].filter(([k])=>p[k]).map(([k,name])=>({id:'legacy-'+k,type:'link',name,url:p[k],icon:''}));const order=p.socialOrder||[];return items.sort((a,b)=>(order.indexOf(a.id.replace('legacy-',''))<0?999:order.indexOf(a.id.replace('legacy-','')))-(order.indexOf(b.id.replace('legacy-',''))<0?999:order.indexOf(b.id.replace('legacy-',''))));}
// V29: bounded, single-marker drag sorting for in-form lists; no scroll jumps or giant placeholders.
function v29AttachLocalSort(root, onOrder){
 if(!root)return;
 const rows=()=>Array.from(root.querySelectorAll(':scope > .v10-sort-item'));
 let drag=null;
 const marker=document.createElement('div');marker.className='v29-sort-marker';marker.hidden=true;
 root.appendChild(marker);
 function markerAt(target,before){
   const box=target.getBoundingClientRect(),outer=root.getBoundingClientRect();
   marker.style.top=(before?box.top:box.bottom)-outer.top+root.scrollTop+'px';
   marker.hidden=false;
 }
 function cleanup(){marker.hidden=true; if(drag?.row)drag.row.classList.remove('v29-row-picked');drag=null;}
 root.addEventListener('pointerdown',e=>{
   const grip=e.target.closest('.v10-grip');if(!grip||e.button!==0)return;
   const row=grip.closest('.v10-sort-item');if(!row||rows().length<2)return;
   drag={row,grip,startY:e.clientY,target:null,before:true,moved:false};
   grip.setPointerCapture(e.pointerId);e.preventDefault();
 });
 root.addEventListener('pointermove',e=>{
   if(!drag||e.target!==drag.grip)return;
   if(!drag.moved&&Math.abs(e.clientY-drag.startY)<6)return;
   drag.moved=true;drag.row.classList.add('v29-row-picked');
   const others=rows().filter(r=>r!==drag.row);
   const target=others.find(r=>{const b=r.getBoundingClientRect();return e.clientY<b.bottom;})||others.at(-1);
   if(!target)return;
   const b=target.getBoundingClientRect(),before=e.clientY < (b.top+b.bottom)/2;
   drag.target=target;drag.before=before;markerAt(target,before);
 });
 function finish(e){
   if(!drag)return;
   const d=drag;if(d.grip.hasPointerCapture(e.pointerId))d.grip.releasePointerCapture(e.pointerId);
   if(d.moved&&d.target){d.before?d.target.before(d.row):d.target.after(d.row);}
   cleanup();if(d.moved)onOrder(rows().map(r=>r.dataset.orderId));
 }
 root.addEventListener('pointerup',finish);root.addEventListener('pointercancel',()=>cleanup());
 root.addEventListener('keydown',e=>{
   const grip=e.target.closest('.v10-grip');if(!grip||!['ArrowUp','ArrowDown'].includes(e.key))return;
   const row=grip.closest('.v10-sort-item'),items=rows(),i=items.indexOf(row),j=i+(e.key==='ArrowUp'?-1:1);
   if(j<0||j>=items.length)return;e.preventDefault();
   e.key==='ArrowUp'?items[j].before(row):items[j].after(row);
   grip.focus();onOrder(rows().map(r=>r.dataset.orderId));
 });
}
function v28DrawCerts(){const el=$('#v28-cert-list');if(!el)return;el.innerHTML=v28Certs.map(c=>`<div class="item v10-sort-item" data-order-id="${esc(c.id)}"><button type="button" class="v10-grip">⠿</button><div class="v10-rowbody"><strong>${esc(c.name||'Certification')}</strong><div class="muted">${esc([c.score,c.issuer,c.year].filter(Boolean).join(' · '))}</div></div><button type="button" class="secondary small" data-cert-edit="${esc(c.id)}">Edit</button><button type="button" class="secondary small danger" data-cert-remove="${esc(c.id)}">Delete</button></div>`).join('');el.querySelectorAll('[data-cert-edit]').forEach(b=>b.onclick=()=>v28EditCert(v28Certs.findIndex(c=>c.id===b.dataset.certEdit)));el.querySelectorAll('[data-cert-remove]').forEach(b=>b.onclick=()=>{v28Certs=v28Certs.filter(c=>c.id!==b.dataset.certRemove);v28DrawCerts();});v29AttachLocalSort(el,ids=>{const map=new Map(v28Certs.map(c=>[c.id,c]));v28Certs=ids.map(id=>map.get(id)).filter(Boolean);});}
function v28DrawContacts(){const el=$('#v28-contact-list');if(!el)return;el.innerHTML=v28Contacts.map(c=>`<div class="item v10-sort-item" data-order-id="${esc(c.id)}"><button type="button" class="v10-grip">⠿</button><div class="v10-rowbody"><strong>${esc(c.name||'Contact')}</strong><div class="muted">${esc(c.type==='mail'?'Mail Me (contact form)':(c.url||''))}</div></div><button type="button" class="secondary small" data-con-edit="${esc(c.id)}">Edit</button><button type="button" class="secondary small danger" data-con-remove="${esc(c.id)}">Delete</button></div>`).join('');el.querySelectorAll('[data-con-edit]').forEach(b=>b.onclick=()=>v28EditContact(v28Contacts.findIndex(c=>c.id===b.dataset.conEdit)));el.querySelectorAll('[data-con-remove]').forEach(b=>b.onclick=()=>{v28Contacts=v28Contacts.filter(c=>c.id!==b.dataset.conRemove);v28DrawContacts();});v29AttachLocalSort(el,ids=>{const map=new Map(v28Contacts.map(c=>[c.id,c]));v28Contacts=ids.map(id=>map.get(id)).filter(Boolean);});}
function v28EditCert(i){const c=i>=0?v28Certs[i]:{id:uid(),name:'',issuer:'',score:'',year:'',expiry:'',url:'',logo:'',logoWebsite:''};showDialog(`<h2>${i<0?'Add':'Edit'} Certification</h2><form id="v28-edit-cert">${field('name','Nama sertifikasi',c.name,'text',true)}${field('issuer','Lembaga penerbit',c.issuer)}${field('score','Nilai / Level',c.score)}${field('year','Tahun terbit',c.year)}${field('expiry','Masa berlaku (opsional)',c.expiry)}${field('url','Link sertifikat (opsional)',c.url,'url')}<div class="v28-small-logo-editor"><div class="v15-company-preview" id="certIconPreview"></div><div><label>Upload logo<input type="file" id="certIconFile" accept="image/*"></label><label>Website sumber logo<input type="url" id="certIconWeb" value="${esc(c.logoWebsite||'')}"></label><button type="button" class="secondary small" id="certIconFromWeb">Ambil favicon</button><button type="button" class="secondary small" id="certIconClear">Hapus ikon</button><input type="hidden" id="certIconValue" value="${esc(c.logo||'')}"><small id="certIconStatus"></small></div></div><div class="footer-action"><button type="button" class="secondary" onclick="closeDialog()">Cancel</button><button class="primary" type="submit">Save Certification</button></div></form>`);v16BindLogo({fileId:'#certIconFile',webId:'#certIconWeb',refId:'#certIconValue',previewId:'#certIconPreview',statusId:'#certIconStatus',fromWebId:'#certIconFromWeb',clearId:'#certIconClear'});$('#v28-edit-cert').onsubmit=e=>{e.preventDefault();if(photoUploading)return toast('Tunggu upload logo.');const f=e.target;const o={...c};['name','issuer','score','year','expiry','url'].forEach(k=>o[k]=value(f,k));o.logo=$('#certIconValue').value;o.logoWebsite=$('#certIconWeb').value.trim();if(!o.name.trim())return toast('Nama sertifikasi wajib.');if(i<0)v28Certs.push(o);else v28Certs[i]=o;closeDialog();v28DrawCerts();toast('Klik Save Profile untuk menyimpan.');};}
function v28EditContact(i){const c=i>=0?v28Contacts[i]:{id:uid(),type:'link',name:'',url:'',icon:''};showDialog(`<h2>${i<0?'Add':'Edit'} Contact</h2><form id="v28-edit-contact">${field('name','Nama tampilan',c.name,'text',true)}${field('url','URL (untuk external link)',c.url,'url')}<div class="v28-small-logo-editor"><div class="v15-company-preview" id="contactIconPreview"></div><div><label>Upload logo<input type="file" id="contactIconFile" accept="image/*"></label><label>Website sumber favicon<input id="contactIconWeb" type="url" value="${esc(c.iconWebsite||c.url||'')}"></label><button type="button" id="contactIconFromWeb" class="secondary small">Ambil favicon</button><button type="button" id="contactIconClear" class="secondary small">Hapus ikon</button><input type="hidden" id="contactIconValue" value="${esc(c.icon||'')}"><small id="contactIconStatus"></small></div></div><div class="footer-action"><button type="button" class="secondary" onclick="closeDialog()">Cancel</button><button class="primary" type="submit">Save Contact</button></div></form>`);v16BindLogo({fileId:'#contactIconFile',webId:'#contactIconWeb',refId:'#contactIconValue',previewId:'#contactIconPreview',statusId:'#contactIconStatus',fromWebId:'#contactIconFromWeb',clearId:'#contactIconClear'});$('#v28-edit-contact').onsubmit=e=>{e.preventDefault();if(photoUploading)return toast('Tunggu upload logo.');const f=e.target,o={...c};o.type='link';o.name=value(f,'name');o.url=value(f,'url');o.icon=$('#contactIconValue').value;o.iconWebsite=$('#contactIconWeb').value;if(!o.name.trim()||(o.type==='link'&&!/^https:\/\//i.test(o.url)))return toast('Nama dan URL HTTPS wajib untuk external link.');if(i<0)v28Contacts.push(o);else v28Contacts[i]=o;closeDialog();v28DrawContacts();toast('Klik Save Profile untuk menyimpan.');};}
function renderProfile(){const p=APP.site.profile||{};v17EduPhotos=Object.fromEntries(['bachelor','master','doctorate'].map(key=>[key,clone(p.education?.[key]?.gallery||[])]));profileImages={avatar:p.avatar||'',banner:p.banner||'',brandingRound:p.brandingRound||'',brandingSquare:p.brandingSquare||''};v28Certs=clone(p.certifications||[]);v28Contacts=clone((Array.isArray(p.contacts)?p.contacts:v28LegacyContacts(p)).filter(c=>c.type!=='mail'&&!/^(mail me|kirim pesan)$/i.test(String(c.name||''))));v12SocialOrder=[...new Set([...(Array.isArray(p.socialOrder)?p.socialOrder:[]).filter(k=>V12_SOCIAL_DEFAULT.includes(k)),...V12_SOCIAL_DEFAULT])];
 const en=p.en||{};
 $('#bodyContent').innerHTML=`<div class="panel"><h2>Personal Information</h2><p class="muted">Profil utama di website. Isi utama dengan bahasa Indonesia.</p><form id="profileForm"><div class="cols2">${field('name','Full name',p.name,'text',true)}${field('title','Professional headline (ID)',p.title)}</div><div class="v29-institution-grid"><div class="v29-institution-text">${field('institution','Institution',p.institution)}${field('institutionUrl','Link institusi (dibuka saat nama/logo diklik)',p.institutionUrl||'https://teklingk.upnjatim.ac.id/jawwad/','url')}</div><div class="v29-institution-icon"><strong>Logo institusi</strong><div class="v29-institution-tools"><div class="v15-company-preview" id="institutionIconPreview"></div><div class="v29-logo-actions"><label class="field">Upload<input id="institutionIconFile" type="file" accept="image/png,image/jpeg,image/webp"></label><label class="field">Sumber favicon<input id="institutionIconWebsite" type="url" value="${esc(p.institutionIconWebsite||p.institutionUrl||'https://teklingk.upnjatim.ac.id/jawwad/')}"></label><div class="v29-logo-buttons"><button type="button" id="institutionIconFromWeb" class="secondary small">Ambil ikon</button><button type="button" id="institutionIconClear" class="secondary small">Hapus</button></div><input id="institutionIconValue" type="hidden" value="${esc(p.institutionIcon||'')}"><div id="institutionIconStatus" class="muted" aria-live="polite"></div></div></div></div></div>${field('location','Location',p.location)}${field('tagline','Tagline (ID)',p.tagline)}${field('about','About / Biography (ID)',p.about,'textarea')}
 <div class="bar"></div><h2>Riwayat Pendidikan</h2><p class="muted">Sarjana, Magister, Doktor. Kosongkan jenjang yang belum ditempuh. Setiap logo dapat di-upload atau diambil dari favicon website universitas.</p><div class="v16-education-admin">${[['bachelor','Sarjana (S1)'],['master','Magister (S2)'],['doctorate','Doktor (S3)']].map(([key,label])=>{const d=(p.education||{})[key]||{};return `<div class="v16-education-admin-card"><h3>${label}</h3>${field('education__'+key+'__institution','Nama kampus',d.institution)}${field('education__'+key+'__major','Jurusan / Program studi',d.major)}${field('education__'+key+'__year','Tahun lulus',d.year)}${field('education__'+key+'__description','Keterangan pendidikan (opsional)',d.description,'textarea')}<div class="photo-area"><strong>Galeri foto pendidikan</strong><input type="file" id="edu_${key}_photos" accept="image/*" multiple><div id="edu_${key}_photoStatus" class="muted"></div><div id="edu_${key}_gallery" class="v17-edu-gallery"></div></div><div class="v16-degree-icon-edit"><div class="v15-company-preview" id="edu_${key}_preview"></div><div><label class="field">Upload logo<input type="file" accept="image/*" id="edu_${key}_file"></label><div class="field"><label>URL website kampus</label><input type="text" id="edu_${key}_website" value="${esc(d.logoWebsite||'')}" placeholder="https://kampus.ac.id"></div><button type="button" class="secondary small" id="edu_${key}_fromweb">Ambil ikon website</button><input type="hidden" id="edu_${key}_logo" value="${esc(d.logo||'')}"><div class="muted" id="edu_${key}_status" aria-live="polite"></div><button type="button" class="secondary small" id="edu_${key}_clear">Hapus logo</button></div></div></div>`;}).join('')}</div>
 <div class="bar"></div><h2>Certifications</h2><p class="muted">Sertifikasi di bawah Education pada website dan CV ATS. Urutkan dengan ⠿.</p><div id="v28-cert-list" class="v10-sort-list"></div><button type="button" class="secondary small" id="v28-add-cert">+ Add Certification</button>
 <details class="lang-editor"><summary>English (otomatis saat Publish; boleh dikoreksi)</summary><p class="muted">Jika kolom English kosong, sistem menerjemahkan teks Indonesia otomatis saat Publish. Terjemahan yang diisi manual akan dipertahankan.</p><button type="button" class="secondary small" id="autoTranslateProfile">Auto Translate</button><span id="englishStatus" class="muted"></span>${field('en__title','English headline',en.title)}${field('en__tagline','English tagline',en.tagline)}${field('en__about','English biography',en.about,'textarea')}</details>
 <div class="bar"></div><h2>Profile Images</h2><div class="cols2"><div class="field"><label>Profile photo</label>${imgPreview(p.avatar)?`<img class="thumb" src="${esc(imgPreview(p.avatar))}">`:''}<input type="file" id="avatarFile" accept="image/*"><small id="avatarStatus">Kosongkan untuk mempertahankan foto lama.</small><button class="secondary small" type="button" id="clearAvatar">Remove photo</button></div><div class="field"><label>Banner photo</label>${imgPreview(p.banner)?`<img class="thumb" src="${esc(imgPreview(p.banner))}">`:''}<input type="file" id="bannerFile" accept="image/*"><small id="bannerStatus">Kosongkan untuk mempertahankan banner lama.</small><button class="secondary small" type="button" id="clearBanner">Remove banner</button></div></div>
  <div class="bar"></div><h2>Website Branding</h2><p class="muted">Upload dua logo terpisah. Logo bundar dipakai pada header Portofolio dan Akademik; logo kotak dipakai pada tab browser. Kosongkan untuk mempertahankan logo sebelumnya.</p><div class="cols2"><div class="field"><label>Logo bundar (Round)</label><div class="v24-logo-preview" id="brandingRoundPreview">${imgPreview(p.brandingRound)?`<img class="thumb" src="${esc(imgPreview(p.brandingRound))}" alt="Round logo">`:''}</div><input type="file" id="brandingRoundFile" accept="image/png,image/jpeg,image/webp"><small id="brandingRoundStatus">Pertahankan logo lama jika tidak diunggah.</small><button type="button" class="secondary small" id="clearBrandingRound">Gunakan logo default</button></div><div class="field"><label>Logo kotak (Square / Favicon)</label><div class="v24-logo-preview" id="brandingSquarePreview">${imgPreview(p.brandingSquare)?`<img class="thumb" src="${esc(imgPreview(p.brandingSquare))}" alt="Square logo">`:''}</div><input type="file" id="brandingSquareFile" accept="image/png,image/jpeg,image/webp"><small id="brandingSquareStatus">Pertahankan logo lama jika tidak diunggah.</small><button type="button" class="secondary small" id="clearBrandingSquare">Gunakan logo default</button></div></div>
  <div class="bar"></div><h2>Let's Connect</h2><p class="muted">Atur tautan sosial di sini. Mail Me selalu tampil paling awal dan dikelola secara terpisah.</p><div id="v28-contact-list" class="v10-sort-list"></div><button type="button" class="secondary small" id="v28-add-contact">+ Add Contact</button>
  <div class="bar"></div><h2>Mail Me</h2><div class="info">URL Apps Script Contact privat, tidak ada alamat penerima yang ditampilkan publik.</div>${field('contactFormUrl','Contact Form Apps Script /exec URL',p.contactFormUrl,'url')}
  <div class="bar"></div><h2>Unpublished Data</h2><p class="muted">Data hanya disimpan di database privat; tidak ikut GitHub Pages. Saat Download CV, pilih mana yang ingin dimasukkan.</p><div class="cols2">${v28PrivateFields()}</div>
 <div class="footer-action"><button class="secondary" type="button" onclick="v28CVDialog()">↓ Download CV ATS</button><button class="primary" type="submit" id="saveProfile">Save Profile</button></div></form></div>`;
 for(const key of ['bachelor','master','doctorate']){v17EducationGallery(key);$('#edu_'+key+'_photos').onchange=e=>v17UploadEdu(key,e.target);}
 v16BindLogo({fileId:'#institutionIconFile',webId:'#institutionIconWebsite',refId:'#institutionIconValue',previewId:'#institutionIconPreview',statusId:'#institutionIconStatus',fromWebId:'#institutionIconFromWeb',clearId:'#institutionIconClear'});
 for(const key of ['bachelor','master','doctorate'])v16BindLogo({fileId:'#edu_'+key+'_file',webId:'#edu_'+key+'_website',refId:'#edu_'+key+'_logo',previewId:'#edu_'+key+'_preview',statusId:'#edu_'+key+'_status',fromWebId:'#edu_'+key+'_fromweb',clearId:'#edu_'+key+'_clear'});
 v28DrawCerts();v28DrawContacts();$('#v28-add-cert').onclick=()=>v28EditCert(-1);$('#v28-add-contact').onclick=()=>v28EditContact(-1);
 for(const key of ['avatar','banner','brandingRound','brandingSquare']){const file=$('#'+key+'File'),stat=$('#'+key+'Status');file.onchange=async()=>{const f=file.files?.[0];if(!f)return;stat.textContent='Mengoptimalkan foto & mengunggah...';try{const saved=key.startsWith('branding')?await uploadCompanyLogo(f):await uploadOne(f);profileImages[key]=saved.url;stat.textContent='Media disimpan di GitHub privat. Klik Save Profile.';}catch(err){stat.textContent=err.message;alert(err.message)}};$('#clear'+key[0].toUpperCase()+key.slice(1)).onclick=()=>{profileImages[key]='';stat.textContent='Foto akan dihapus dari profil ketika disimpan.'};}
 $('#autoTranslateProfile').onclick=async()=>{const f=$('#profileForm'),b=$('#autoTranslateProfile');b.disabled=true;$('#englishStatus').textContent=' Menerjemahkan...';try{const content={title:value(f,'title'),tagline:value(f,'tagline'),about:value(f,'about'),};const translated=await rpc('apiTranslateDraft','profile',content);['title','tagline','about'].forEach(k=>{if(translated[k])f.elements['en__'+k].value=translated[k];});$('#englishStatus').textContent=' Selesai. Periksa lalu Save Profile.';}catch(err){fail(err)}finally{b.disabled=false}};
 $('#profileForm').onsubmit=async e=>{e.preventDefault();if(photoUploading)return toast('Tunggu upload foto pendidikan selesai.');const btn=$('#saveProfile');btn.disabled=true;const form=e.target,obj={...p};['name','title','institution','institutionUrl','location','tagline','about','linkedin','instagram','youtube','upnProfile','scholar','orcid','sinta','contactFormUrl'].forEach(k=>obj[k]=value(form,k));obj.institutionIcon=$('#institutionIconValue').value;obj.institutionIconWebsite=$('#institutionIconWebsite').value.trim();if(obj.institutionUrl && !/^https:\/\/[^\s.]+(?:\.[^\s./]+)+/i.test(obj.institutionUrl)){btn.disabled=false;return toast('Link institusi harus berupa URL https:// yang valid.');}delete obj.specialties;obj.avatar=profileImages.avatar;obj.banner=profileImages.banner;obj.brandingRound=profileImages.brandingRound;obj.brandingSquare=profileImages.brandingSquare;obj.certifications=clone(v28Certs);obj.contacts=clone(v28Contacts.filter(c=>c.type!=='mail'));obj.mailContactIcon=(p.contacts||[]).find(c=>c.type==='mail')?.icon||p.mailContactIcon||'';delete obj.socialOrder;obj.en={...(p.en||{})};['title','tagline','about'].forEach(k=>{const v=value(form,'en__'+k);if(v)obj.en[k]=v;else delete obj.en[k];});delete obj.en.specialties;
 obj.education={...(p.education||{})};
 for(const key of ['bachelor','master','doctorate']){
  const old=obj.education[key]||{};
  const d={...old,institution:value(form,'education__'+key+'__institution'),major:value(form,'education__'+key+'__major'),year:value(form,'education__'+key+'__year'),logo:$('#edu_'+key+'_logo').value,logoWebsite:$('#edu_'+key+'_website').value.trim(),description:value(form,'education__'+key+'__description'),gallery:clone(v17EduPhotos[key]||[])};
  if(d.major!==old.major)delete d.majorEn; // automatic translation will refresh when published
  obj.education[key]=d;
 }
 try{await rpc('apiSaveProfile',obj);await rpc('apiSavePrivateProfile',v28CollectPrivate());await refresh();toast('Profil dan data privat tersimpan di GitHub privat.')}catch(err){btn.disabled=false;fail(err)}};
}
function normalizeHeader(s){return String(s||'').toLowerCase().trim().replace(/[._-]+/g,' ').replace(/\s+/g,' ')}
function column(headers,options){for(const q of options){const i=headers.indexOf(q);if(i>=0)return i;}for(const q of options){const i=headers.findIndex(h=>h.includes(q));if(i>=0)return i;}return -1}
function numeric(v){const t=String(v??'').replace(/\s/g,'');if(!t)return NaN;if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t))return Number(t.replace(/\./g,'').replace(',','.'));if(t.includes(',')&&!t.includes('.'))return Number(t.replace(',','.'));return Number(t)}
function grade(s){return s>=85?'A':s>=80?'A-':s>=75?'B+':s>=70?'B':s>=65?'B-':s>=60?'C+':s>=55?'C':s>=50?'D':'E'}
function csvParse(s){const out=[];let cell='',row=[],quoted=false;for(let i=0;i<s.length;i++){const c=s[i],n=s[i+1];if(c==='"'){if(quoted&&n==='"'){cell+='"';i++}else quoted=!quoted;}else if(!quoted&&(c===','||c===';'||c==='\t')){row.push(cell);cell='';}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&n==='\n')i++;row.push(cell);out.push(row);row=[];cell='';}else cell+=c;}if(row.length||cell){row.push(cell);out.push(row);}return out}
let xlsxLoadPromise=null;
async function loadExcelLibrary(){
 if(window.XLSX)return Promise.resolve();
 if(xlsxLoadPromise)return xlsxLoadPromise;
 // Hanya saat pengguna memilih Excel, bukan saat halaman Admin pertama dibuka.
 const hosts=[
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
 ];
 xlsxLoadPromise=(async()=>{
  for(const url of hosts){
   try{await new Promise((resolve,reject)=>{
    const tag=document.createElement('script');tag.async=true;tag.src=url;
    const timer=setTimeout(()=>{tag.remove();reject(Error('CDN timeout'));},11000);
    tag.onload=()=>{clearTimeout(timer);window.XLSX?resolve():reject(Error('Library Excel tidak valid'));};
    tag.onerror=()=>{clearTimeout(timer);tag.remove();reject(Error('CDN tidak dapat diakses'));};
    document.head.appendChild(tag);
   });if(window.XLSX)return;
   }catch(e){/* Coba sumber lain */}
  }
  throw Error('Pembaca Excel tidak dapat diunduh. Cek akses CDN atau simpan Excel sebagai CSV dan upload file CSV.');
 })();
 try{return await xlsxLoadPromise;}catch(e){xlsxLoadPromise=null;throw e;}
}
async function excelMatrix(file){
 const buffer=await file.arrayBuffer();
 if(/\.csv$/i.test(file.name))return {matrix:csvParse(new TextDecoder().decode(buffer)),hidden:[]};
 await loadExcelLibrary();
 const b=window.XLSX.read(buffer,{type:'array',cellStyles:true});
 const ws=b.Sheets[b.SheetNames[0]];
 const hidden=(ws['!cols']||[]).map(x=>!!x?.hidden);
 return {matrix:window.XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}),hidden};
}

/** V25 — dynamically import arbitrary optional columns, never expose full identities. */
/** V28 — full identities stay private; main column C is ranking and optional Grade. */
function parseGrades(matrix,hiddenCols=[]){
 const rows=matrix.filter(r=>Array.isArray(r)&&r.some(c=>String(c??'').trim()));
 const h=rows.findIndex(r=>r.some(c=>/^(npm|nim|student id|nomor pokok mahasiswa)$/i.test(normalizeHeader(c)))&&r.some(c=>/nama|name/i.test(normalizeHeader(c))));
 if(h<0)throw Error('Header NPM dan Nama tidak ditemukan.');
 const rawHeaders=rows[h].map(v=>String(v??'').trim()),headers=rawHeaders.map(normalizeHeader);
 const iNpm=column(headers,['npm','nim','student id']),iName=column(headers,['nama mahasiswa','nama','name']);
 const iScore=iNpm===0&&iName===1&&rawHeaders[2]!==undefined?2:headers.findIndex(t=>['nilai akhir','final score','final mark','score','nilai'].includes(t)||/^nilai akhir\b/.test(t)||/^final score\b/.test(t));
 const iGrade=column(headers,['grade','nilai huruf','huruf']);
 if(iNpm<0||iName<0)throw Error('Kolom wajib: NPM dan Nama.');
 const excluded=new Set([iNpm,iName,iGrade]);if(iScore>=0)excluded.add(iScore);
 const entries=rawHeaders.map((label,index)=>({label,index})).filter(x=>x.label&&!excluded.has(x.index)&&!(/^(?:…|\.\.\.|nilai\/keterangan)$/i.test(x.label)&&!rows.slice(h+1).some(r=>String(r[x.index]??'').trim())));
 const columns=entries.map(e=>e.label),columnHidden=entries.map(e=>!!hiddenCols[e.index]);
 const hiddenCore={npm:!!hiddenCols[iNpm],name:!!hiddenCols[iName],score:iScore>=0&&!!hiddenCols[iScore]};
 if(new Set(columns.map(x=>x.toLowerCase())).size!==columns.length)throw Error('Nama kolom tambahan harus unik.');
 if(columns.some(x=>/^(email|e-mail|no hp|nomor hp|alamat|address|telephone|telepon)$/i.test(x)))throw Error('Data pribadi seperti email/nomor HP tidak boleh ditambahkan dalam pengumuman publik.');
 const out=[];let invalid=0;
 for(const row of rows.slice(h+1)){
  const fullNpm=String(row[iNpm]??'').trim().replace(/\.0$/,''),fullName=String(row[iName]??'').trim();
  const txt=iScore>=0?String(row[iScore]??'').trim():'';const score=txt===''?null:numeric(row[iScore]);
  if(!/^\d{5,}$/.test(fullNpm)||!fullName||(score!==null&&(!Number.isFinite(score)||score<0||score>100))){invalid++;continue;}
  out.push({fullNpm,fullName,npm:fullNpm.slice(0,2)+'••••'+fullNpm.slice(-3),name:fullName.split(/\s+/)[0],score:score===null?null:Number(score.toFixed(2)),grade:score===null?'':grade(score),extras:entries.map(e=>String(row[e.index]??'').trim().slice(0,300))});
 }
 if(!out.length)throw Error('Tidak ditemukan mahasiswa valid. NPM minimal 5 digit dan Nama tidak boleh kosong.');
 // Keep hidden source columns PRIVATE so a new Excel download can reproduce them.
 // Empty visible columns are not published (backend filters), but remain available in the private source.
 const candidate=iScore;
 const rankColumn=-1; // V28: always rank by principal score column C.
 const scoreForRank=r=>{const val=rankColumn===-2?null:rankColumn>=0?r.extras[rankColumn]:r.score;if(val===null||val===undefined||String(val).trim()==='')return null;const n=numeric(val);return Number.isFinite(n)?n:null;};
 out.sort((a,b)=>{const x=scoreForRank(a),y=scoreForRank(b);if(x===null&&y!==null)return 1;if(y===null&&x!==null)return -1;if(x!==null&&y!==null&&x!==y)return y-x;return a.fullNpm.localeCompare(b.fullNpm,undefined,{numeric:true});});
 out.forEach((r,i)=>r.rank=i+1);
 return {rows:out,columns,columnHidden,hiddenCore,scoreHeader:rawHeaders[iScore]||'Nilai',rankColumn,rankLabel:candidate<0?'NPM':rawHeaders[candidate],skipped:invalid};
}
function renderGrades(){
 const list=APP.site.gradeBoards||[];
 const fmt=iso=>{const d=new Date(iso||'');return isNaN(d)?'Belum dipublikasikan':new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}).format(d)+' WIB';};
 $('#bodyContent').innerHTML=`<div class="panel"><div class="row-between"><div><h2>Grade Announcements</h2><p class="muted">${list.length} pengumuman nilai · urutkan dengan drag-and-drop.</p></div><button class="primary" onclick="openGrades()">+ Import Excel / CSV</button></div><div id="v10-sort-list" class="v10-sort-list">${list.map(b=>`<div class="item v10-sort-item" data-order-id="${esc(b.id)}"><button class="v10-grip" type="button" aria-label="Geser pengumuman">⠿</button><div class="v10-rowbody"><div class="item-title">${esc(b.course)} — ${esc(b.className)}</div><div class="item-sub">${esc(b.period)} · ${(b.rows||[]).length} mahasiswa · ${b.showGrade===false?'Grade disembunyikan':'Grade ditampilkan'}</div><div class="item-sub">${b.expiresAt?'Tayang hingga '+esc(fmt(b.expiresAt)):(b.publishedAt?'Periode lama · cek expiry saat Publish':'Mulai tayang saat Publish pertama')}</div></div><div class="actions"><button class="secondary small" data-v27-edit-board="${esc(b.id)}">Edit</button><button class="secondary small" data-v27-download-board="${esc(b.id)}">↓ Excel</button><button class="secondary small" data-v10-preview="${esc(b.id)}">Preview</button><button class="secondary small danger" data-v10-delete-board="${esc(b.id)}">Delete</button></div></div>`).join('')||'<div class="empty">Belum ada nilai yang diimpor.</div>'}</div><p class="muted">Pengumuman baru ditayangkan tujuh hari sejak Publish pertama. Setelahnya, data publik akan dihapus otomatis; backup di Sheets tetap tersimpan.</p></div>`;
 const c=$('#v10-sort-list');c.addEventListener('click',e=>{const edit=e.target.closest('[data-v27-edit-board]'),download=e.target.closest('[data-v27-download-board]'),pre=e.target.closest('[data-v10-preview]'),del=e.target.closest('[data-v10-delete-board]');if(!edit&&!download&&!pre&&!del)return;const id=edit?edit.dataset.v27EditBoard:download?download.dataset.v27DownloadBoard:pre?pre.dataset.v10Preview:del.dataset.v10DeleteBoard,idx=(APP.site.gradeBoards||[]).findIndex(x=>x.id===id);if(idx<0)return;if(edit)v27EditBoard(idx);else if(download)v27DownloadBoard(idx);else if(pre)previewBoard(idx);else deleteBoard(idx)});v10AttachSort(c,'gradeBoards');
}
function downloadTemplate(){
 const raw=atob('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'),bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 const file=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='V28_Template_Grades.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function openGrades(){
 gradeTmp=null;
 showDialog(`<h2>Import Grade Announcement</h2><p class="intro">File Excel/CSV diproses di browser. NPM dan nama lengkap disamarkan sebelum disimpan.</p><form id="gradeForm">${field('course','Mata kuliah','Matematika 1','text',true)}<div class="cols2">${field('className','Kelas','Kelas A','text',true)}${field('period','Periode','Gasal 2026/2027','text',true)}</div><div class="field"><label>Excel (.xlsx / .xls) atau CSV *</label><input type="file" id="excelInput" accept=".xlsx,.xls,.csv" required><small>Wajib hanya NPM dan Nama. Kolom C = nilai utama (ranking & Grade), boleh kosong. Grade dihitung otomatis untuk skor yang tersedia. Kolom ekstra bebas; yang seluruhnya kosong tidak dipublikasikan.</small></div><label class="v23-grade-toggle"><input type="checkbox" id="showGrade" checked> Show Grade — tampilkan A, A-, B+, dan seterusnya</label><button class="secondary small" type="button" onclick="downloadTemplate()">Download Template Excel</button><div id="gradePreview" class="muted" style="margin-top:16px">Belum ada file dipilih.</div><div class="footer-action"><button type="button" class="secondary" onclick="closeDialog()">Cancel</button><button type="submit" class="primary" id="saveGrades" disabled>Save Grade Board</button></div></form>`);
 function showGradePreview(){
   if(!gradeTmp)return;
   const cols=gradeTmp.columns,showGrade=$('#showGrade').checked;
   $('#gradePreview').innerHTML=`<b>${gradeTmp.rows.length} mahasiswa siap disimpan</b>${gradeTmp.skipped?`<p>${gradeTmp.skipped} baris tidak valid dilewati.</p>`:''}<p>${cols.length} kolom tambahan: ${esc(cols.join(', ')||'Tidak ada')} · Ranking: ${esc(gradeTmp.rankLabel)}</p><div class="table-wrap"><table><thead><tr><th>NPM</th><th>Nama</th><th>${esc(gradeTmp.scoreHeader||'Nilai')}</th>${showGrade?'<th>Grade</th>':''}${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${gradeTmp.rows.slice(0,5).map(r=>`<tr><td>${esc(r.npm)}</td><td>${esc(r.name)}</td><td>${r.score===null?'':r.score}</td>${showGrade?`<td>${esc(r.grade||'')}</td>`:''}${r.extras.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 }
 $('#excelInput').onchange=async e=>{
   const f=e.target.files?.[0];if(!f)return;
   $('#gradePreview').textContent='Membaca file...';
   try{
     const fileData=await excelMatrix(f);gradeTmp=parseGrades(fileData.matrix,fileData.hidden);
     const cols=gradeTmp.columns;
     showGradePreview();
     $('#saveGrades').disabled=false;
   }catch(err){gradeTmp=null;$('#gradePreview').textContent=err.message;$('#saveGrades').disabled=true;}
 };
 $('#showGrade').onchange=showGradePreview;
 $('#gradeForm').onsubmit=async e=>{
   e.preventDefault();if(!gradeTmp)return;const form=e.target;
   const board={id:uid(),course:value(form,'course'),className:value(form,'className'),period:value(form,'period'),columns:gradeTmp.columns,scoreHeader:gradeTmp.scoreHeader,showGrade:$('#showGrade').checked,rows:gradeTmp.rows,columnHidden:gradeTmp.columnHidden,hiddenCore:gradeTmp.hiddenCore,rankColumn:gradeTmp.rankColumn};
   $('#saveGrades').disabled=true;
   try{await rpc('apiSaveGradeBoard',board);closeDialog();await refresh();toast('Nilai tersimpan. Publish untuk memulai masa tayang 7 hari.');}
   catch(err){$('#saveGrades').disabled=false;fail(err);}
 };
}
function previewBoard(index){
 const b=APP.site.gradeBoards[index],cols=Array.isArray(b.columns)?b.columns:[];
 showDialog(`<h2>${esc(b.course)} — ${esc(b.className)}</h2><p class="intro">${esc(b.period)}</p><div class="table-wrap"><table><thead><tr><th>#</th><th>NPM</th><th>Nama</th><th>${esc(b.scoreHeader||'Nilai')}</th>${b.showGrade===false?'':'<th>Grade</th>'}${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${(b.rows||[]).map(r=>`<tr><td>${r.rank}</td><td>${esc(r.npm)}</td><td>${esc(r.name)}</td><td>${r.score===null?'':esc(r.score)}</td>${b.showGrade===false?'':`<td>${esc(r.grade||'')}</td>`}${cols.map((_,i)=>`<td>${esc((r.extras||[])[i]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
}
async function deleteBoard(index){const b=APP.site.gradeBoards[index];if(!confirm('Hapus pengumuman nilai '+b.course+' '+b.className+'?'))return;try{await rpc('apiDeleteItem','gradeBoards',b.id);await refresh();toast('Pengumuman dihapus dari database.')}catch(err){fail(err)}}
/** V27: editing happens in the owner-only Admin; full identities never leave private Sheets. */
function v27RankBoard(board){
 const idx=Number.isInteger(board.rankColumn)?board.rankColumn:-1;
 const val=r=>{const t=idx===-2?null:idx>=0?r.extras?.[idx]:r.score;if(t===null||t===undefined||String(t).trim()==='')return null;const v=numeric(t);return Number.isFinite(v)?v:null;};
 const rows=board.rows||[];
 rows.sort((a,b)=>{const av=val(a),bv=val(b);if(av===null&&bv!==null)return 1;if(bv===null&&av!==null)return -1;if(av!==null&&bv!==null&&av!==bv)return bv-av;return (a.fullNpm&&b.fullNpm)?a.fullNpm.localeCompare(b.fullNpm,undefined,{numeric:true}):(a.rank||0)-(b.rank||0);});
 rows.forEach((r,i)=>{r.rank=i+1;r.grade=r.score===null||r.score===''?'':grade(Number(r.score));});
}
let v27Editor=null;
function v27EditBoard(index){
 const b=clone(APP.site.gradeBoards[index]);v27RankBoard(b);
 v27Editor={board:b,page:0,query:'',dirty:false};
 showDialog(`<h2>Edit Grade Announcement</h2><p class="intro">Edit nilai langsung. Perubahan hanya masuk website setelah Save, lalu Publish. NPM/nama lengkap pada file baru tersimpan privat.</p>
 <div class="cols2">${field('v27-course','Mata kuliah',b.course)}${field('v27-class','Kelas',b.className)}${field('v27-period','Periode',b.period)}</div>
 <label class="v23-grade-toggle"><input type="checkbox" id="v27-showgrade" ${b.showGrade!==false?'checked':''}> Show Grade</label>
 <div class="field"><label>Cari mahasiswa</label><input id="v27-find" placeholder="Nama / NPM"></div>
 <p class="muted">Ranking: kolom utama C (Nilai), tanpa terpengaruh kolom tambahan. Nilai sama diurutkan menurut NPM. Baris baru dari V27 dapat diunduh dengan NPM dan nama lengkap.</p>
 <div id="v27-grade-grid"></div>
 <div class="footer-action"><button type="button" class="secondary" onclick="closeDialog()">Cancel</button><button type="button" class="primary" id="v27-save-board">Save Changes</button></div>`);
 $('#v27-find').oninput=e=>{v27Editor.query=e.target.value.toLowerCase().trim();v27Editor.page=0;v27DrawEditor();};
 $('#v27-save-board').onclick=async()=>{const state=v27Editor,board=state?.board;if(!board)return;board.course=$('#f-v27-course').value.trim();board.className=$('#f-v27-class').value.trim();board.period=$('#f-v27-period').value.trim();board.showGrade=$('#v27-showgrade').checked;
  v27RankBoard(board);const save=$('#v27-save-board');save.disabled=true;
  try{await rpc('apiSaveGradeBoard',board);APP.site.gradeBoards[index]=board;closeDialog();renderGrades();toast('Perubahan nilai tersimpan. Download Excel menghasilkan versi terbaru. Klik Publish untuk memperbarui GitHub.');}
  catch(err){save.disabled=false;fail(err);}
 };
 v27DrawEditor();
}
function v27DrawEditor(){
 if(!v27Editor)return;const b=v27Editor.board,query=v27Editor.query;
 const all=(b.rows||[]).map((r,i)=>({r,i})).filter(({r})=>!query||[r.fullNpm,r.fullName,r.npm,r.name].some(t=>String(t||'').toLowerCase().includes(query)));
 const per=40,nPages=Math.max(1,Math.ceil(all.length/per));v27Editor.page=Math.min(v27Editor.page,nPages-1);
 const page=all.slice(v27Editor.page*per,(v27Editor.page+1)*per);
 const cols=b.columns||[];
 $('#v27-grade-grid').innerHTML=`<p class="muted">${all.length} mahasiswa · halaman ${v27Editor.page+1}/${nPages}. Kolom tersembunyi Excel tetap privat.</p><div class="table-wrap v27-grade-table"><table><thead><tr><th>Rank</th><th>NPM (privat)</th><th>Nama (privat)</th><th>${esc(b.scoreHeader||'Nilai')}</th>${cols.map((c,i)=>`<th>${esc(c)}${b.columnHidden?.[i]?' (hidden)':''}</th>`).join('')}</tr></thead><tbody>${page.map(({r,i})=>`<tr><td>${r.rank}</td><td><input data-v27-row="${i}" data-v27-col="fullNpm" value="${esc(r.fullNpm||r.npm||'')}" aria-label="NPM"></td><td><input data-v27-row="${i}" data-v27-col="fullName" value="${esc(r.fullName||r.name||'')}" aria-label="Nama"></td><td><input data-v27-row="${i}" data-v27-col="score" value="${esc(r.score===null?'':r.score)}" inputmode="decimal" aria-label="Nilai Akhir"></td>${cols.map((_,j)=>`<td><input data-v27-row="${i}" data-v27-col="${j}" value="${esc(r.extras?.[j]||'')}" aria-label="${esc(cols[j])}"></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="actions"><button class="secondary small" type="button" id="v27-page-prev" ${v27Editor.page===0?'disabled':''}>← Previous</button><button class="secondary small" type="button" id="v27-page-next" ${v27Editor.page>=nPages-1?'disabled':''}>Next →</button></div>`;
 $('#v27-grade-grid').querySelectorAll('input[data-v27-row]').forEach(input=>{input.addEventListener('change',()=>{
   const idx=Number(input.dataset.v27Row),c=input.dataset.v27Col,r=b.rows[idx],t=input.value.trim();
   if(c==='score'){const v=t===''?null:numeric(t);if(v!==null&&(!Number.isFinite(v)||v<0||v>100)){input.setCustomValidity('Nilai harus 0 sampai 100');input.reportValidity();return;}input.setCustomValidity('');r.score=v;}
   else if(c==='fullNpm'){if(/^\d{5,}$/.test(t)){r.fullNpm=t;r.npm=t.slice(0,2)+'••••'+t.slice(-3);}else if(t===r.npm){r.fullNpm='';}else{input.setCustomValidity('Masukkan NPM lengkap atau biarkan NPM lama tersamarkan');input.reportValidity();return;}input.setCustomValidity('');}
   else if(c==='fullName'){r.fullName=t;r.name=t.split(/\s+/)[0]||r.name;}
   else {r.extras=r.extras||[];r.extras[Number(c)]=t;}
   v27Editor.dirty=true;
  });});
 $('#v27-page-prev').onclick=()=>{v27Editor.page--;v27DrawEditor();};$('#v27-page-next').onclick=()=>{v27Editor.page++;v27DrawEditor();};
}
async function v27DownloadBoard(index){
 const b=APP.site.gradeBoards[index];if(!b)return;
 try{await loadExcelLibrary();const XLSX=window.XLSX;
  const headers=['NPM','Nama',b.scoreHeader||'Nilai',...(b.columns||[])];
  const help=['','', 'Nilai utama untuk ranking dan grade. Header C boleh diganti.', ...(b.columns||[]).map(()=> 'Kolom tambahan opsional; Hide di Excel untuk menyembunyikan.')];const data=[help,headers,...(b.rows||[]).map(r=>[r.fullNpm||r.npm,r.fullName||r.name,r.score===null?'':r.score,...(r.extras||[])])];
  const ws=XLSX.utils.aoa_to_sheet(data),book=XLSX.utils.book_new();
  ws['!cols']=[{wch:18,hidden:!!b.hiddenCore?.npm},{wch:31,hidden:!!b.hiddenCore?.name},{wch:14,hidden:!!b.hiddenCore?.score},...(b.columns||[]).map((c,i)=>({wch:Math.min(35,Math.max(14,c.length+3)),hidden:!!b.columnHidden?.[i]}))];
  XLSX.utils.book_append_sheet(book,ws,'Grades');
  const notes=XLSX.utils.aoa_to_sheet([['V28 — Grades export'],['File berasal dari data terakhir yang telah disimpan di Portfolio Manager.'],['NPM/nama tersamarkan pada impor lama tidak dapat dipulihkan otomatis.'],['Nilai Akhir boleh kosong. Grade dihitung oleh website saat Show Grade aktif.'],['Kolom yang semula disembunyikan akan tetap disembunyikan pada Excel ini.']]);
  XLSX.utils.book_append_sheet(book,notes,'Instructions');
  const filename=String((b.course||'Course')+'_'+(b.className||'Class')).replace(/[^a-z0-9_.-]+/gi,'_').slice(0,90)+'_Grades_V28.xlsx';
  XLSX.writeFile(book,filename,{bookType:'xlsx'});
  if((b.rows||[]).some(r=>!r.fullNpm||!r.fullName))toast('Excel terbaru diunduh. Data lama yang sudah tersamarkan tidak dapat dipulihkan otomatis.',6000);
 }catch(err){fail(err);}
}
async function v27LoadPDF(){if(window.jspdf?.jsPDF)return;
 const hosts=['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'];
 for(const src of hosts){try{await new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=reject;document.head.appendChild(el);});if(window.jspdf?.jsPDF)return;}catch(_){}}
 throw Error('Generator PDF tidak dapat dimuat. Periksa akses internet / CDN dan coba kembali.');
}
const PM28_CV_QR='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGkAAABpAQAAAAAR+TCXAAABeElEQVR4nM2UMU7DQBBF/3otORSx0yI5ihEnSGejSHbHPcgBIFATx9BQ2XAAuEc6R4pIOk6AtMGgtLZT4EhJhjZIoHGFmG61o79v9v9dQdirSMO3+sNlJPSosQ29hRB8s0UqTA0Nkiq+mQSSwDbniIJaVGfrxVVad4QHkvnvu3tFCWUFqUGVUUUjTrkQzqMn28FWNHiMkDYleiLpEPEYRLKYKdPPYpfD0EEna91X+YH38cwrjyBjyNiVsc8PGKbrN7zmhuqn/IBFuEyq4xYczHmMqOrsDJkji2rc87U1fajUk3u4e+Exbse980Y7Sw0xqJEN9/3eVffG5sLgmnU0A7vv2cOJc/TJK6/S6VN3qcE2fzz3+7J52iusngm9ZDE0iPFUpKoEmjXe4IVhN732zqVLv1Y2dj7lyBLiTbFI3UwWndQuJ7xyjIxmAGDVsBtAEWyG2JxbvCkAzK5sQRds+DUIwurOKf0srJGNQjhwpyYcsKaI//E/fwEl+5niDa/ObwAAAABJRU5ErkJggg==';
function v28CVDialog(){
 const choices=[['phone','Nomor HP'],['email','Email'],['officeAddress','Alamat kantor'],['nip','NIP'],['functionalPosition','Jabatan fungsional'],['rankGroup','Pangkat/Golongan'],['bankAccount','Nama bank dan nomor rekening']];
 showDialog(`<h2>Download CV ATS</h2><p class="intro">Satu halaman A4; QR kanan atas menuju portofolio.</p><div class="v29-cv-language"><span>Bahasa CV</span><div class="v29-language-switch" role="group" aria-label="Bahasa CV"><button type="button" data-v29-cvlang="id" class="active" aria-pressed="true">ID</button><button type="button" data-v29-cvlang="en" aria-pressed="false">EN</button></div></div><h3>Additional Data (opsional)</h3><div class="cols2">${choices.map(([k,label])=>`<label class="v28-check"><input type="checkbox" class="v28-cv-extra" value="${k}"> ${esc(label)}</label>`).join('')}</div><div class="footer-action"><button type="button" class="secondary" onclick="closeDialog()">Cancel</button><button type="button" class="primary" id="v28-make-cv">Download PDF</button></div>`);
 let v29CvLanguage='id';$$('[data-v29-cvlang]').forEach(button=>{button.onclick=()=>{v29CvLanguage=button.dataset.v29Cvlang;$$('[data-v29-cvlang]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});};});$('#v28-make-cv').onclick=()=>v28DownloadCV(v29CvLanguage,Array.from(document.querySelectorAll('.v28-cv-extra:checked')).map(n=>n.value));
}
async function v28DownloadCV(language,extraKeys){
 try{await v27LoadPDF();const {jsPDF}=window.jspdf, pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'}),p=APP.site.profile||{};
 const lang=language==='en'?'en':'id',en=lang==='en',t=(v)=>String(v??'').normalize('NFC').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();
 const enSource=[p.title,p.about,...Object.values(p.education||{}).map(d=>d?.major),...(p.certifications||[]).slice(0,12).flatMap(c=>[c.name,c.issuer]),...(APP.site.experiences||[]).slice(0,7).map(x=>x.role),...(APP.site.projects||[]).slice(0,7).map(x=>x.title),...(APP.site.otherActivities||[]).slice(0,7).flatMap(x=>[x.title,x.role]),...[['experiences',APP.site.experiences],['projects',APP.site.projects],['otherActivities',APP.site.otherActivities]].flatMap(([type,a])=>(a||[]).slice(0,7).filter(x=>!x.startMonth).map(x=>v19DateLabel(x,type)))].filter(v=>String(v||'').trim());
 let translations={};
 if(en&&enSource.length){const ret=await rpc('apiV28TranslateCV',enSource);enSource.forEach((v,i)=>translations[v]=ret[i]);}
 const tr=(x,k)=>t(en?(x?.en?.[k]||translations[x?.[k]]||x?.[k]||''):(x?.[k]||''));
 const period=(x,type)=>{const fmt=(mo,y)=>mo&&y?new Date(Number(y),Number(mo)-1,1).toLocaleDateString(en?'en-US':'id-ID',{month:'long',year:'numeric'}):'';const st=fmt(x.startMonth,x.startYear);const ed=x.currentlyActive?(en?'Present':'Sekarang'):fmt(x.endMonth,x.endYear);return st?(st===ed?st:[st,ed].filter(Boolean).join(' - ')):(en?(translations[v19DateLabel(x,type)]||v19DateLabel(x,type).replace(/Sekarang/g,'Present')):v19DateLabel(x,type));};
 const labels=en?{EDU:'EDUCATION',CERT:'CERTIFICATIONS',EX:'PROFESSIONAL EXPERIENCE',PROJECT:'PROJECTS & STUDIES',PUB:'PUBLICATIONS',ACT:'OTHER ACTIVITIES'}:{EDU:'PENDIDIKAN',CERT:'SERTIFIKASI',EX:'PENGALAMAN PROFESIONAL',PROJECT:'PROYEK & KAJIAN',PUB:'PUBLIKASI',ACT:'KEGIATAN LAIN'};
 const blocks=[];const push=(id,items,max=7)=>{const a=items.filter(Boolean).slice(0,max);if(a.length)blocks.push({id,title:labels[id],items:a});};
 const ds=['bachelor','master','doctorate'];push('EDU',ds.map(k=>{const d=p.education?.[k];if(!d?.institution)return '';return t((en?{bachelor:'Bachelor',master:'Master',doctorate:'Doctorate'}:{bachelor:'Sarjana',master:'Magister',doctorate:'Doktor'})[k]+' - '+d.institution+' | '+(en?(d.majorEn||translations[d.major]||d.major):d.major||'')+' | '+(d.year||''));}),3);
 push('CERT',(p.certifications||[]).map(c=>t([en?(c.nameEn||translations[c.name]||c.name):c.name,c.score,en?(c.issuerEn||translations[c.issuer]||c.issuer):c.issuer,c.year].filter(Boolean).join(' | '))),12);
 push('EX',(APP.site.experiences||[]).map(x=>t(tr(x,'role')+' - '+(x.organization||'')+' ('+period(x,'experiences')+')')));
 push('PROJECT',(APP.site.projects||[]).map(x=>t(tr(x,'title')+' ('+period(x,'projects')+')')));
 push('PUB',(APP.site.publications||[]).map(x=>t(tr(x,'title')+' ('+v19DateLabel(x,'publications')+')')));
 push('ACT',(APP.site.otherActivities||[]).map(x=>{const title=tr(x,'title')||x.name||x.event||x.organizer||'';const role=tr(x,'role')||'';return t([title,role].filter(Boolean).join(' - ')+(period(x,'otherActivities')?' ('+period(x,'otherActivities')+')':''));}));
 const priv=APP.privateProfile||{};const pLabels=en?{phone:'Phone',email:'Email',officeAddress:'Office address',nip:'Employee ID (NIP)',functionalPosition:'Academic rank',rankGroup:'Civil-service grade',bankAccount:'Bank / account'}:{phone:'Telepon',email:'Email',officeAddress:'Alamat kantor',nip:'NIP',functionalPosition:'Jabatan fungsional',rankGroup:'Pangkat/Golongan',bankAccount:'Bank dan rekening'};
 const selected=(extraKeys||[]).filter(k=>Object.prototype.hasOwnProperty.call(pLabels,k)&&priv[k]).map(k=>pLabels[k]+': '+priv[k]);
 const mm=17, availableWidth=175, bottom=278;
 // Every line wraps naturally; never truncate individual entries.
 function layout(draw){let y=17;const font=9.1,line=4.45;pdf.setTextColor(25,34,40);
  if(draw){pdf.addImage(PM28_CV_QR,'PNG',174,10,23,23);pdf.setFont('helvetica','bold');pdf.setFontSize(16);pdf.text(t(p.name||'Portfolio'),mm,y);}y+=7;
  // V29: line wrapping with an aligned hanging indent. Non-Latin text is rasterized
   // at high resolution on the client's system font so CJK glyphs are not silently lost.
   function lineText(value,bold=false,width=availableWidth){
    const str=t(value);if(!str)return;
    const bullet=str.startsWith('- '),body=bullet?str.slice(2):str;
    if(!body.trim())return;
    const left=mm+(bullet?3:0),w=width-(bullet?3:0);
    pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(font);
    const nonLatin=/[^\u0000-\u00ff]/.test(body);
    let chunks=[];
    if(nonLatin){
      const cv=document.createElement('canvas'),ctx=cv.getContext('2d');
      const fontPx=font*96/72;
      ctx.font=(bold?'bold ':'')+fontPx+'px Arial, "Microsoft JhengHei", "PingFang TC", "Noto Sans CJK TC", sans-serif';
      const maxPx=w*96/25.4;
      let lineBuffer='';
      for(const ch of Array.from(body)){
        if(lineBuffer && ctx.measureText(lineBuffer+ch).width>maxPx){
          chunks.push(lineBuffer.trimEnd());lineBuffer=ch.trimStart();
        }else lineBuffer+=ch;
      }
      if(lineBuffer)chunks.push(lineBuffer);
      if(draw){
        chunks.forEach((segment,i)=>{
          const scale=3,hPx=line*96/25.4;
          cv.width=Math.ceil(maxPx*scale);cv.height=Math.ceil(hPx*scale);
          const c=cv.getContext('2d');c.scale(scale,scale);
          c.clearRect(0,0,maxPx,hPx);
          c.fillStyle='#192228';
          c.font=(bold?'bold ':'')+fontPx+'px Arial, "Microsoft JhengHei", "PingFang TC", "Noto Sans CJK TC", sans-serif';
          c.textBaseline='alphabetic';c.fillText(segment,0,fontPx+0.5);
          pdf.addImage(cv.toDataURL('image/png'),'PNG',left,y+i*line-3.3,w,line);
        });
      }
    }else{
      chunks=pdf.splitTextToSize(body,w);
      if(draw)chunks.forEach((txt,i)=>pdf.text(txt,left,y+i*line));
    }
    if(draw&&bullet)pdf.text('-',mm,y);
    y+=chunks.length*line+0.5;
   }
  lineText(tr(p,'title'),false,143);lineText(p.institution||'',false,143);lineText(p.location||'',false,143);
  // Avoid fixed public contact strings in English CV if not translated.
  if(selected.length){y+=1;selected.forEach(item=>lineText(item,false,143));}y+=2;
  const bio=tr(p,'about');if(bio){lineText(bio,false,availableWidth);y+=1;}
  for(const b of blocks){if(!b.items.length)continue;y+=2;if(draw){pdf.setFont('helvetica','bold');pdf.setFontSize(9.6);pdf.text(b.title,mm,y);pdf.setDrawColor(140);pdf.line(mm,y+1,mm+availableWidth,y+1);}y+=5.8;
   for(const item of b.items){lineText('- '+item,false,availableWidth-3);}y+=0.6;
  }return y;}
 // Remove lowest entries round-robin: Experience, Projects, Publications, Other Activities.
 const trim=['EX','PROJECT','PUB','ACT'];let tries=0;
 while(layout(false)>bottom && tries++<100){let cut=false;for(const id of trim){if(layout(false)<=bottom)break;const b=blocks.find(x=>x.id===id);if(b?.items.length){b.items.pop();cut=true;}}if(!cut)break;}
 // If certifications themselves exceed the page, omit lower certificates only after other sections are exhausted.
 while(layout(false)>bottom){const b=blocks.find(x=>x.id==='CERT'&&x.items.length);if(!b)break;b.items.pop();}
 if(layout(false)>bottom)throw Error('Data profil terlalu panjang untuk satu halaman. Pendekkan biografi atau Additional Data.');
 layout(true);pdf.save(t(p.name||'Portfolio').replace(/[^A-Za-z0-9_-]+/g,'_')+'_CV_ATS_'+lang.toUpperCase()+'.pdf');closeDialog();
 }catch(err){fail(err);}
}
function renderSettings(){
 const v=V30.state(),group=['profile','experiences','projects','publications','otherActivities','tools','courses','portalLinks','gradeBoards'];
 document.querySelector('#bodyContent').innerHTML=`
 <div class="panel"><h2>GitHub Trial V30 — Satu Website Utama</h2>
  <div class="v30-stack"><span class="v30-status">● Connected · ${esc(v.repo)}</span><a href="https://asjwd.github.io/" target="_blank" rel="noopener">Buka website ↗</a><a href="https://github.com/asjwd/as-portfolio-draft-trial" target="_blank" rel="noopener">Buka draft privat ↗</a></div>
  <p class="muted" style="margin-top:11px">Save menulis <code>draft.json</code> di repository PRIVATE. Publish memperbarui <code>site.json</code> pada <b>asjwd.github.io</b> yang sama. Admin Apps Script tetap berjalan dan tidak diubah.</p>
  <div class="v30-warning">Jangan melakukan Publish melalui Admin GitHub dan Admin Script secara bersamaan. Jika Script memublikasikan versi baru, V30 akan <b>memblokir Publish</b> hingga Anda membandingkan dan melakukan Rebase.</div>
 </div>
 <div class="panel"><h2>Kontrol versi & konflik</h2><p>Baseline dari website pada saat draft dibuat: <code>${esc((v.baseline||'').slice(0,13))}</code>. Update publik terakhir V30: ${esc(v.publishedAt||'Belum ada')}.</p>
  <div class="v30-stack"><button class="secondary" id="v30Compare">↔ Compare Draft vs Live</button><button class="secondary" id="v30Rebase">↓ Rebase dari Website</button><button class="secondary" id="v30Backup">↓ Download Draft</button><button class="secondary" id="v30Perf">⏱ Performance</button></div>
  <div id="v30Diff" class="v30-meta" style="margin-top:10px">Klik Compare sebelum Publish untuk memeriksa perubahan.</div>
 </div>
 <div class="panel"><h2>Publish ke Website Asli</h2><p>Alamat tujuan: <b>https://asjwd.github.io/</b>. Foto baru di-upload dari repository privat ke folder <code>assets/images/</code> saat Publish.</p>
  <div class="v30-stack"><button class="primary" id="v30Publish">↑ Publish to asjwd.github.io</button><button class="secondary" id="v30Disconnect">Putuskan Token</button></div>
  <p class="muted">Perhatikan: logo/tautan Tools privat yang sebelumnya tersinkron lewat Apps Script tetap menggunakan katalog lama. Terjemahan otomatis dari browser menggunakan layanan eksternal dan mungkin tidak tersedia; teks English bisa diisi manual.</p>
 </div>`;
 document.querySelector('#v30Compare').onclick=v30Compare;
 document.querySelector('#v30Rebase').onclick=v30Rebase;
 document.querySelector('#v30Backup').onclick=exportBackup;
 document.querySelector('#v30Perf').onclick=v30Performance;
 document.querySelector('#v30Publish').onclick=publishNow;
 document.querySelector('#v30Disconnect').onclick=()=>{if(confirm('Akhiri sesi? Token dihapus dari memori tab ini.')){V30.disconnect();APP=null;v30ShowLogin();}};
}

async function importLiveSite(){toast('Gunakan tombol Rebase di Settings (dengan backup otomatis).');setPage('settings');}

function exportBackup(){if(!APP?.site)return;const b=new Blob([JSON.stringify(APP.site,null,2)],{type:'application/json'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='V30_GitHub_Draft_'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(u);}
async function publishNow(){
 if(!V30.hasToken()){v30ShowLogin();return;}
 const compare=await V30.diff().catch(err=>{fail(err);return null});if(!compare)return;
 if(compare.changed){alert('Tidak bisa Publish! Website asli telah berubah sejak draft ini dibuat. Buka Settings → Compare/Rebase. Perubahan draft tidak otomatis dibuang.');setPage('settings');return;}
 if(!confirm('Publikasikan draft GitHub ini ke WEBSITE UTAMA https://asjwd.github.io/?\n\nScript dan Spreadsheet TIDAK diubah, tetapi file site.json publik akan diganti.'))return;
 setBusy(true,'Memublikasikan ke GitHub...');
 try{const result=await rpc('apiPublish');await refresh();showDialog(`<h2>✓ Publish sukses</h2><p>Website utama diperbarui melalui GitHub API, tanpa Apps Script.</p><div class="info">Aset baru: ${result.images}. Konten publik: <code>site.json</code>. Data privat CV tetap berada di GitHub privat.</div><div class="v30-warning">Peringatan: Jika Anda klik Publish dari Admin Script lama setelah ini, perubahan JSON dapat tertimpa karena Spreadsheet tidak otomatis ikut berubah.</div><p><a href="https://asjwd.github.io/" target="_blank" rel="noopener">Buka website utama ↗</a></p><div class="footer-action"><button class="primary" onclick="closeDialog()">Selesai</button></div>`);}
 catch(err){fail(err)}finally{setBusy(false)}
}

async function loadInitial(){return v30ShowLogin()}
function v30ShowLogin(){
 setBusy(false,'GitHub trial · Offline');document.querySelector('#pageTitle').textContent='Hubungkan GitHub';document.querySelector('#pageDescription').textContent='Koneksi token sementara, tanpa server dan tanpa menyimpan token.';
 document.querySelector('#bodyContent').innerHTML=`<div class="panel" style="max-width:850px;margin:auto"><h2>V30 — GitHub Portfolio Manager Trial</h2>
 <p>Ini Admin kedua untuk <b>asjwd.github.io yang sama</b>. Apps Script, Spreadsheet, dan foto Drive lama <b>tidak disentuh</b>.</p>
 <div class="v30-warning"><b>Keamanan:</b> HTML Admin ini publik dan tidak memberi proteksi login sendiri. Hanya akun yang memasukkan fine-grained token valid dapat membaca draft privat dan mengubah website. Gunakan token yang hanya berizin pada dua repository trial, jangan tempel token di chat, file GitHub, atau penyimpanan browser. Tutup/refresh tab untuk menghapus token dari memori.</div>
 <form id="v30ConnectForm" style="margin-top:15px"><div class="field"><label>Fine-grained GitHub Token (sesi ini saja)</label><input type="password" id="v30Token" autocomplete="off" spellcheck="false" placeholder="github_pat_..." required></div><div class="v30-stack"><button type="submit" class="primary">Connect GitHub</button><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Buat Token ↗</a></div></form>
 <p class="v30-meta" id="v30LoginStatus">Butuh izin Contents (Read and Write) untuk <code>asjwd.github.io</code> dan <code>as-portfolio-draft-trial</code> yang Private. Token tidak disimpan di localStorage, sessionStorage, cookie, atau file.</p>
 </div>`;
 document.querySelector('#v30ConnectForm').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;const value=e.target.querySelector('#v30Token').value;e.target.querySelector('#v30Token').value='';try{document.querySelector('#v30LoginStatus').textContent='Menghubungkan GitHub...';await V30.connect(value);APP=await rpc('apiGetState');setBusy(false);setPage('profile');toast('GitHub siap. Anda sekarang mengedit draft privat.');}catch(err){b.disabled=false;alert(err.message);document.querySelector('#v30LoginStatus').textContent='Koneksi gagal. Periksa repository privat dan izin token.';}};
}
async function v30Compare(){setBusy(true,'Membandingkan...');try{const d=await V30.diff();const table=`<table style="width:100%;font-size:12px"><thead><tr><th>Bagian</th><th>Draft</th><th>Live</th><th>Status</th></tr></thead><tbody>${d.rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.draftCount)}</td><td>${esc(r.liveCount)}</td><td>${r.same?'Sama':'Berbeda'}</td></tr>`).join('')}</tbody></table>`;
  const status=d.changed?'<b style="color:#a94b22">⚠ Website berubah sejak baseline. Publish DIBLOKIR.</b>':'<b style="color:#197b65">✓ SHA website belum berubah sejak baseline.</b>';
  document.querySelector('#v30Diff').innerHTML=status+'<p>Perbandingan ini berdasarkan nilai data saat ini, bukan merge otomatis. Perubahan beberapa field kecil dapat tidak terlihat hanya dari jumlah entri.</p>'+table;
 }catch(e){fail(e)}finally{setBusy(false)}}
async function v30Rebase(){if(!confirm('REBASE mengembalikan draft ke site.json website yang sekarang. Sebelum menghapus perubahan draft, sistem membuat BACKUP di repo privat. Lanjut?'))return;setBusy(true,'Rebase...');try{const r=await V30.rebase();await refresh();toast(r.unchanged?'Website belum berubah. Tidak perlu rebase.':'Rebase berhasil. Backup: '+r.backup,6000);}catch(e){fail(e)}finally{setBusy(false)}}
function v30Performance(){const rows=V30.metrics.slice(-100).reverse();showDialog(`<h2>Performance · GitHub API</h2><p class="muted">Durasi diukur pada browser untuk jaringan GitHub dan operasi UI. Save dan Publish berbeda tahap.</p><div class="v30-stack"><button class="secondary" id="v30CopyTimes">Copy CSV</button></div><table style="width:100%;font-size:12px"><thead><tr><th>Operation</th><th>Waktu</th><th>Durasi</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.fn)}</td><td>${esc(x.time)}</td><td>${x.ms} ms</td></tr>`).join('')}</tbody></table><div class="footer-action"><button class="primary" onclick="closeDialog()">Tutup</button></div>`);document.querySelector('#v30CopyTimes').onclick=async()=>{await navigator.clipboard.writeText('operation,time,ms\n'+rows.map(x=>[x.fn,x.time,x.ms].join(',')).join('\n'));toast('Performance disalin')};}
// Compact grouping: the original field nodes and handlers are preserved.
function v30CompactProfile(){const f=document.querySelector('#profileForm');if(!f||f.dataset.v30Folded)return;f.dataset.v30Folded='1';const nodes=[...f.children];let group=[],title='Identitas & Profil';const sections=[];
 for(const el of nodes){if(el.tagName==='H2'){if(group.length){sections.push([title,group]);group=[];}title=el.textContent.trim();el.remove();continue;}if(el.matches('.bar')){el.remove();continue;}if(el.matches('.footer-action')){if(group.length){sections.push([title,group]);group=[];}sections.push(['__actions',[el]]);continue;}group.push(el);}if(group.length)sections.push([title,group]);
 for(const [label,items] of sections){if(label==='__actions'){f.append(...items);continue;}const details=document.createElement('details');details.className='v30-fold';details.open=/^(Identitas|Basic|Profil|Personal|Education|Pendidikan)/i.test(label);const sum=document.createElement('summary');sum.textContent=label;details.appendChild(sum);const body=document.createElement('div');body.append(...items);details.appendChild(body);f.appendChild(details);}
}
// Preserve published announcements, but do not pretend public masked row files contain
// the complete student spreadsheet needed for safe editing or private Excel export.
document.addEventListener('click',function(e){
 const item=e.target.closest('[data-v27-edit-board],[data-v27-download-board],[data-v10-preview]');
 if(!item||PAGE!=='gradeBoards'||!APP)return;
 const id=item.dataset.v27EditBoard||item.dataset.v27DownloadBoard||item.dataset.v10Preview;
 const board=(APP.site.gradeBoards||[]).find(x=>x.id===id);
 if(board?.rowsFile&&!Array.isArray(board.rows)){
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  alert('Nilai ini berasal dari site.json PUBLIK, yang tidak berisi NPM/nama lengkap atau seluruh kolom sumber. Agar aman, edit dan unduh nilai lama melalui Admin Apps Script dahulu. Pengumuman baru dapat diimpor dari Excel melalui V30.');
 }
},true);
const v30OldSetPage=setPage;
setPage=function(page){v30OldSetPage(page);if(page==='profile')v30CompactProfile()};
const v30OldShowDialog=showDialog;
showDialog=function(html){v30OldShowDialog(html);const form=document.querySelector('#itemForm');if(!form||form.dataset.v30Folded)return;form.dataset.v30Folded='1';for(const el of [...form.children].filter(x=>x.matches('.photo-area'))){const details=document.createElement('details');details.className='v30-fold';const summary=document.createElement('summary');summary.textContent='Media & Gallery';details.appendChild(summary);el.before(details);const div=document.createElement('div');div.appendChild(el);details.appendChild(div)}};
loadInitial();
