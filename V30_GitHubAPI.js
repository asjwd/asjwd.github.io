/* V30 GitHub Portfolio Trial — browser-only GitHub REST adapter.
   IMPORTANT: The fine-grained PAT is NEVER persisted and never included in this repository.
   Trial target is explicitly locked to asjwd/asjwd.github.io.
*/
'use strict';
const V30=(function(){
 const OWNER='asjwd',PUBLIC_REPO='asjwd.github.io',PRIVATE_REPO='as-portfolio-draft-trial',BRANCH='main';
 const PRIVATE_KEYS=['phone','email','officeAddress','nip','functionalPosition','rankGroup','bankName','bankAccount','accountNumber','privateProfile'];
 const CATEGORIES=['experiences','projects','publications','tools','courses','portalLinks','gradeBoards','slides','otherActivities'];
 let token='',site=null,privateData={},meta={},publicSha='',draftSha='',privateSha='',metaSha='',metrics=[];
 const mediaCache=new Map(),clone=x=>structuredClone(x),utf8=new TextEncoder(),decoder=new TextDecoder();
 const safeId=k=>/^[a-f0-9]{32}\.(?:webp|jpg|png|pdf)$/.test(k);
 const codePath=(repo,path)=>`/repos/${OWNER}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
 function bytesB64(bytes){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str);}
 function fromB64(b64){const binary=atob(b64.replace(/\s/g,'')),buf=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)buf[i]=binary.charCodeAt(i);return buf;}
 function checkToken(){if(!token)throw Error('Hubungkan token GitHub sebelum mengedit. Token tidak disimpan oleh browser.');}
 async function gh(method,path,body=null,optional=false){
  checkToken();const headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+token};
  if(body!==null)headers['Content-Type']='application/json';
  const started=performance.now();let response;
  try{response=await fetch('https://api.github.com'+path,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store',referrerPolicy:'no-referrer'});}catch(e){throw Error('Tidak bisa menjangkau GitHub API dari browser. Cek internet, CORS, ekstensi keamanan, atau VPN. '+e.message);}
  metrics.push({fn:method+' '+path.split('/').slice(-2).join('/'),ms:Math.round(performance.now()-started),time:new Date().toLocaleTimeString()});if(metrics.length>250)metrics.shift();
  if(optional&&response.status===404)return null;
  const out=await response.json().catch(()=>({}));
  if(!response.ok)throw Error('GitHub HTTP '+response.status+': '+(out.message||response.statusText));
  return out;
 }
 async function getFile(repo,path){const res=await gh('GET',codePath(repo,path)+'?ref='+encodeURIComponent(BRANCH),null,true);if(!res)return null;if(res.encoding==='base64'&&res.content)return {sha:res.sha,bytes:fromB64(res.content)};
  // For large files the contents endpoint may omit the payload.
  if(res.sha){const blob=await gh('GET',`/repos/${OWNER}/${repo}/git/blobs/${res.sha}`);if(blob.encoding==='base64')return {sha:res.sha,bytes:fromB64(blob.content)};}
  throw Error('Gagal membaca file GitHub: '+path);
 }
 async function getJson(repo,path){const f=await getFile(repo,path);return f?{sha:f.sha,data:JSON.parse(decoder.decode(f.bytes))}:null;}
 async function put(repo,path,bytes,message,sha=null){const result=await gh('PUT',codePath(repo,path),{message,content:bytesB64(bytes),branch:BRANCH,...(sha?{sha}:{})});return result.content?.sha||null;}
 async function putJson(repo,path,data,message,sha=null){return put(repo,path,utf8.encode(JSON.stringify(data,null,2)+'\n'),message,sha);}
 async function assertMatch(repo,path,expected){const now=await getFile(repo,path);if((now?.sha||'')!==(expected||''))throw Error('KONFLIK: '+path+' berubah dari tab/perangkat atau Admin lain. Tidak ada yang ditimpa. Refresh dan bandingkan sebelum mengulang.');}
 function ensureShape(obj){if(!obj||!obj.profile||!Array.isArray(obj.experiences))throw Error('Struktur portfolio.json tidak cocok dengan V29.');for(const k of CATEGORIES){if(!Array.isArray(obj[k]||[]))throw Error('Kategori '+k+' rusak');obj[k] ||= [];}return obj;}
 async function connect(value){if(!/^(github_pat_|ghp_)/.test(value))throw Error('Gunakan fine-grained GitHub Personal Access Token.');token=value.trim();try{
   const user=await gh('GET','/user');if(user.login?.toLowerCase()!==OWNER){throw Error('Trial dikunci untuk akun GitHub asjwd. Akun terdeteksi: '+user.login);}
   const repo=await gh('GET',`/repos/${OWNER}/${PRIVATE_REPO}`,null,true);
   if(!repo||!repo.private)throw Error('Buat repository PRIVATE bernama '+PRIVATE_REPO+' dahulu (main branch). Token harus mendapat Contents Read & Write ke kedua repository.');
   const pub=await gh('GET',`/repos/${OWNER}/${PUBLIC_REPO}`);
   // Fine-grained token repository metadata may omit permissions.push;
   // actual PUT verifies Contents write at publish time.
   await loadState();return true;
  }catch(e){token='';throw e;}}
 async function loadState(){
  const publicFile=await getJson(PUBLIC_REPO,'site.json');if(!publicFile)throw Error('site.json website utama tidak ditemukan.');
  publicSha=publicFile.sha;
  const [draft,record,priv]=await Promise.all([getJson(PRIVATE_REPO,'draft.json'),getJson(PRIVATE_REPO,'trial-meta.json'),getJson(PRIVATE_REPO,'private.json')]);
  if(!draft){site=ensureShape(clone(publicFile.data));draftSha=null;meta={basePublicSha:publicSha,updatedAt:new Date().toISOString()};metaSha=null;
    // Start trial with a private copy only. Main website remains untouched.
    draftSha=await putJson(PRIVATE_REPO,'draft.json',site,'V30 initialize private GitHub draft');metaSha=await putJson(PRIVATE_REPO,'trial-meta.json',meta,'V30 record initial public SHA');
  }else{site=ensureShape(draft.data);draftSha=draft.sha;meta=record?.data||{basePublicSha:''};metaSha=record?.sha||null;}
  privateData=priv?.data||{};privateSha=priv?.sha||null;
  // Fetch only a capped set of private media previews, not every image in the public site.
  const refs=new Set();(function scan(o){if(!o||typeof o!=='object')return;if(Array.isArray(o)){o.forEach(scan);return;}for(const v of Object.values(o)){if(typeof v==='string'&&/^trial:[a-f0-9]{32}\.(jpg|png|webp)$/.test(v))refs.add(v);else if(v&&typeof v==='object')scan(v);}})(site);
  const list=[...refs].slice(0,36);for(let i=0;i<list.length;i+=5)await Promise.all(list.slice(i,i+5).map(async ref=>{try{await preview(ref)}catch(e){console.warn('Preview gagal',ref,e.message)}}));
  return state();
 }
 function state(){return {ready:true,site:clone(site),privateProfile:clone(privateData),repo:OWNER+'/'+PUBLIC_REPO,branch:BRANCH,hasToken:!!token,publishedAt:meta.publishedAt||'',draftRepo:OWNER+'/'+PRIVATE_REPO,baseline:meta.basePublicSha,currentPublicSha:publicSha,readOnly:false,mode:'github'};}
 async function mutate(fn){checkToken();const data=clone(site);const result=await fn(data);ensureShape(data);await assertMatch(PRIVATE_REPO,'draft.json',draftSha);const next=await putJson(PRIVATE_REPO,'draft.json',data,'V30 update private portfolio draft',draftSha);site=data;draftSha=next;return result||{ok:true};}
 function assertCategory(c){if(!CATEGORIES.includes(c))throw Error('Kategori tidak valid: '+c);}
 async function preview(ref){if(mediaCache.has(ref))return mediaCache.get(ref);if(!/^trial:[a-f0-9]{32}\.(jpg|png|webp|pdf)$/.test(ref))return '';const key=ref.slice(6);const f=await getFile(PRIVATE_REPO,'media/'+key);if(!f)throw Error('Media privat tidak ditemukan: '+key);const url=URL.createObjectURL(new Blob([f.bytes],{type:key.endsWith('pdf')?'application/pdf':'image/'+(key.endsWith('jpg')?'jpeg':key.split('.').pop())}));mediaCache.set(ref,url);return url;}
 async function upload(name,url,isPdf=false){checkToken();const m=/^data:(image\/(?:jpeg|webp|png)|application\/pdf);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(url||''));if(!m||!!isPdf!==(m[1]==='application/pdf'))throw Error('Hanya image JPEG/PNG/WebP atau PDF yang diizinkan.');const bytes=fromB64(m[2]);const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf"}[m[1]];if(bytes.length>(isPdf?5:3)*1048576)throw Error('Media sesudah kompresi terlalu besar.');if(ext==='pdf'&&decoder.decode(bytes.slice(0,5))!=='%PDF-')throw Error('PDF tidak valid.');if(ext==='jpg'&&!(bytes[0]===255&&bytes[1]===216))throw Error('File JPEG tidak valid.');if(ext==='png'&&!(bytes[0]===137&&bytes[1]===80))throw Error('File PNG tidak valid.');if(ext==='webp'&&decoder.decode(bytes.slice(8,12))!=='WEBP')throw Error('File WebP tidak valid.');
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));const key=Array.from(hash.slice(0,16)).map(x=>x.toString(16).padStart(2,'0')).join('')+'.'+ext;const path='media/'+key;const existing=await getFile(PRIVATE_REPO,path);if(!existing)await put(PRIVATE_REPO,path,bytes,'V30 upload optimized '+ext);
  const ref='trial:'+key;mediaCache.set(ref,URL.createObjectURL(new Blob([bytes],{type:m[1]})));return {url:ref,name,preview:mediaCache.get(ref)};
 }
 function assetTarget(ref){const key=ref.slice(6);if(!safeId(key))throw Error('Media reference invalid.');return key.endsWith('.pdf')?'assets/documents/'+key:'assets/images/'+key;}
 function convertMedia(obj,uploads){if(!obj||typeof obj!=='object')return;if(Array.isArray(obj)){obj.forEach(v=>convertMedia(v,uploads));return;}for(const [k,v] of Object.entries(obj)){
   if(typeof v==='string'&&v.startsWith('trial:')){const path=assetTarget(v);uploads.set(path,v.slice(6));obj[k]=path;}
   else if(typeof v==='string'&&v.startsWith('drive:'))throw Error('Draft memiliki Drive private reference yang belum dipublikasikan: '+k+'. Upload ulang file di Admin GitHub atau gunakan aset publik.');
   else if(v&&typeof v==='object')convertMedia(v,uploads);
 }}
 function cleanBoards(list,extras){const now=Date.now();return list.filter(b=>{const until=b.expiresAt?Date.parse(b.expiresAt):b.publishedAt?Date.parse(b.publishedAt)+7*86400000:now+7*86400000;return until>now;}).map(b=>{
   const x=clone(b),date=x.publishedAt||new Date().toISOString();x.publishedAt=date;x.expiresAt=x.expiresAt||new Date(Date.parse(date)+7*86400000).toISOString();
   if(Array.isArray(x.rows)&&x.rows.length){const cols=x.columns||[],keep=cols.map((_,i)=>i).filter(i=>!x.columnHidden?.[i]&&x.rows.some(r=>String(r.extras?.[i]??'').trim()!==''));x.columns=keep.map(i=>cols[i]);const rows=x.rows.map((r,i)=>({rank:i+1,npm:String(r.npm||''),name:String(r.name||'').split(/\s+/)[0],score:r.score??null,grade:r.grade||'',extras:keep.map(j=>r.extras?.[j]??'')}));
     if(rows.some(r=>!/^[0-9]{2}••••[0-9]{3}$/.test(r.npm)))throw Error('Format NPM publik belum dimasking; Publish dibatalkan.');
     const path='assets/grades/'+encodeURIComponent(String(x.id))+'.json';extras.set(path,utf8.encode(JSON.stringify({id:x.id,rows},null,2)+'\n'));x.rowsFile=path;x.rowCount=rows.length;
   }
   delete x.rows;delete x.rankColumn;delete x.columnHidden;return x;
 });}
 function publicExport(){const data=clone(site);for(const key of PRIVATE_KEYS)delete data.profile[key];delete data.privateProfile;
  const uploads=new Map(),extra=new Map();data.gradeBoards=cleanBoards(data.gradeBoards||[],extra);
  for(const item of data.tools||[]){item.requestAvailable=Boolean(item.url||item.downloadUrl||item.downloadLink||item.requestAvailable);delete item.url;delete item.downloadUrl;delete item.downloadLink;}
  convertMedia(data,uploads);return {data,uploads,extra};}
 async function stageAssets(uploads,extra){let uploaded=0;
  for(const [path,key] of uploads){const existing=await getFile(PUBLIC_REPO,path);if(existing)continue;const f=await getFile(PRIVATE_REPO,'media/'+key);if(!f)throw Error('Media private hilang: '+key);await put(PUBLIC_REPO,path,f.bytes,'V30 publish optimized portfolio media');uploaded++;}
  for(const [path,bytes] of extra){const current=await getFile(PUBLIC_REPO,path);await put(PUBLIC_REPO,path,bytes,'V30 publish masked grades',current?.sha||null);uploaded++;}
  return uploaded;
 }
 async function publish(){checkToken();const latest=await getJson(PUBLIC_REPO,'site.json');if(!latest)throw Error('Public site.json hilang.');if(latest.sha!==meta.basePublicSha)throw Error('PUBLISH DIBLOKIR: website sudah diperbarui oleh Apps Script/GitHub sejak draft ini dibuat. Download draft, lalu lakukan Rebase dari Website Terbaru sebelum Publish. Tidak ada data publik yang ditimpa.');
  const {data,uploads,extra}=publicExport();const newFiles=await stageAssets(uploads,extra);
  // The source may change during asset transfers; check again immediately before editing site.json.
  const check=await getFile(PUBLIC_REPO,'site.json');if(check?.sha!==meta.basePublicSha)throw Error('PUBLISH DIBLOKIR: ada Publish lain saat upload foto berlangsung. site.json tidak ditimpa.');
  const bytes=utf8.encode(JSON.stringify(data,null,2)+'\n');if(bytes.length>850000)throw Error('site.json melebihi 850 KB; periksa Grade dan galeri.');
  const newSha=await put(PUBLIC_REPO,'site.json',bytes,'V30 GitHub Admin Publish (V29-compatible)',check.sha);
  const updated=clone(site);for(const b of updated.gradeBoards||[]){if(!b.publishedAt){b.publishedAt=new Date().toISOString();b.expiresAt=new Date(Date.now()+7*86400000).toISOString();}}
  await assertMatch(PRIVATE_REPO,'draft.json',draftSha);draftSha=await putJson(PRIVATE_REPO,'draft.json',updated,'V30 retain grade dates after publish',draftSha);site=updated;
  // Preserve the base SHA so next Publish succeeds if no other writer changes the site.
  const nextMeta={...meta,basePublicSha:newSha,publishedAt:new Date().toISOString()};await assertMatch(PRIVATE_REPO,'trial-meta.json',metaSha);metaSha=await putJson(PRIVATE_REPO,'trial-meta.json',nextMeta,'V30 publish checkpoint',metaSha);meta=nextMeta;publicSha=newSha;
  return {ok:true,website:'https://asjwd.github.io/',images:newFiles,iconCounts:{success:0,missing:0},iconReport:[],toolSync:'Katalog private download Tools tetap mengikuti sinkronisasi Apps Script lama.'};
 }
 async function diff(){const latest=await getJson(PUBLIC_REPO,'site.json');const changed=latest.sha!==meta.basePublicSha;const current=latest.data,groups=['profile',...CATEGORIES];const rows=groups.map(k=>{let a=site[k],b=current[k];return {name:k,draftCount:Array.isArray(a)?a.length:'profil',liveCount:Array.isArray(b)?b.length:'profil',same:JSON.stringify(a)===JSON.stringify(b)};});return {changed,rows,liveSha:latest.sha,baseline:meta.basePublicSha,live:current};}
 async function rebase(){const latest=await diff();if(!latest.changed)return {ok:true,unchanged:true};const backup='backups/draft-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';await putJson(PRIVATE_REPO,backup,site,'V30 backup draft before rebase');
  await assertMatch(PRIVATE_REPO,'draft.json',draftSha);draftSha=await putJson(PRIVATE_REPO,'draft.json',ensureShape(clone(latest.live)),'V30 rebase from live site.json',draftSha);site=clone(latest.live);const m={...meta,basePublicSha:latest.liveSha,rebaseAt:new Date().toISOString()};await assertMatch(PRIVATE_REPO,'trial-meta.json',metaSha);metaSha=await putJson(PRIVATE_REPO,'trial-meta.json',m,'V30 rebase checkpoint',metaSha);meta=m;publicSha=latest.liveSha;return {ok:true,backup};}
 async function translate(text){if(!text)return '';const url='https://translate.googleapis.com/translate_a/single?'+new URLSearchParams({client:'gtx',sl:'id',tl:'en',dt:'t',q:String(text).slice(0,2000)});const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw Error('Layanan Translate tidak merespons.');const a=await res.json();return a[0].map(x=>x[0]||'').join('');}
 async function translateDraft(type,source){const keys={profile:['title','tagline','about'],experiences:['role','contributions','activities'],projects:['title','category','role','description','outputs'],publications:['title'],tools:['description','features'],otherActivities:['title','type','role','organizer','location','description','certificateTitle']}[type]||[];const o={};for(const k of keys){const v=source[k];if(!v)continue;if(Array.isArray(v)){o[k]=[];for(const a of v){if(a&&typeof a==='object')o[k].push({...a,title:await translate(a.title),description:await translate(a.description)});else o[k].push(await translate(a));}}else o[k]=await translate(v);}return o;}
 async function rpc(fn,...args){const started=performance.now();try{switch(fn){
  case 'apiGetState':return state();
  case 'apiInitialize':return state();
  case 'apiSaveProfile':return mutate(s=>{if(!args[0]?.name?.trim())throw Error('Nama profil wajib diisi');s.profile=args[0];});
  case 'apiSavePrivateProfile':{const next=Object.fromEntries(Object.entries(args[0]||{}).filter(([k])=>PRIVATE_KEYS.includes(k)));await assertMatch(PRIVATE_REPO,'private.json',privateSha);privateSha=await putJson(PRIVATE_REPO,'private.json',next,'V30 private CV settings',privateSha);privateData=next;return {ok:true};}
  case 'apiSaveItem':return mutate(s=>{const [key,item]=args;assertCategory(key);if(key==='gradeBoards'||!item?.id)throw Error('Item tidak valid');const i=s[key].findIndex(x=>x.id===item.id);if(i>=0)s[key][i]=item;else s[key].push(item);});
  case 'apiDeleteItem':return mutate(s=>{const [key,id]=args;assertCategory(key);s[key]=s[key].filter(x=>x.id!==id);});
  case 'apiReorderItems':return mutate(s=>{const [key,ids]=args;assertCategory(key);if(ids.length!==s[key].length||new Set(ids).size!==ids.length)throw Error('Urutan tidak cocok');const m=new Map(s[key].map(x=>[x.id,x]));if(ids.some(x=>!m.has(x)))throw Error('Urutan memuat ID yang tidak ditemukan');s[key]=ids.map(id=>m.get(id));});
  case 'apiSaveGradeBoard':return mutate(s=>{const b=args[0];if(!b?.id||!b.course||!b.className||!b.period)throw Error('Data grade harus dilengkapi');const i=s.gradeBoards.findIndex(x=>x.id===b.id);if(i>=0){const old=s.gradeBoards[i];b.publishedAt ||= old.publishedAt;b.expiresAt ||= old.expiresAt;s.gradeBoards[i]=b;}else s.gradeBoards.push(b);return {ok:true,count:b.rows?.length||0};});
  case 'apiUploadPhoto':return upload(args[0],args[1],false);
  case 'apiUploadCertificate':return upload(args[0],args[1],true);
  case 'apiTranslateDraft':return translateDraft(args[0],args[1]);
  case 'apiV28TranslateCV':return Promise.all((args[0]||[]).map(translate));
  case 'apiPublish':return publish();
  case 'apiImportFromGitHub':throw Error('Gunakan Rebase pada Settings. Import otomatis diblokir agar draft tidak tertimpa.');
  case 'apiImportSite':throw Error('Import file manual tidak diaktifkan pada trial. Gunakan Rebase dari website.');
  case 'apiGetOrCreateToolSyncKey':throw Error('Sync Tools pribadi tetap melalui Apps Script lama selama trial.');
  case 'apiSyncToolCatalog':throw Error('Sinkronisasi tautan unduhan Tools masih menggunakan Apps Script lama.');
  default:throw Error('Fungsi '+fn+' belum didukung pada trial GitHub.');
 } }finally{metrics.push({fn,ms:Math.round(performance.now()-started),time:new Date().toLocaleTimeString()});if(metrics.length>250)metrics.shift();}}
 function disconnect(){token='';site=null;privateData={};meta={};for(const ref of mediaCache.values())URL.revokeObjectURL(ref);mediaCache.clear();}
 return {OWNER,PUBLIC_REPO,PRIVATE_REPO,BRANCH,connect,disconnect,rpc,state,diff,rebase,preview,mediaCache,metrics,hasToken:()=>!!token,exportPublic:publicExport};
})();
