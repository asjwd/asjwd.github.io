'use strict';
/* V66 Class Talk. All authorization and private-identity filtering are enforced by Mailer.
   The public browser sees only display aliases for anonymous students. */
const CT66={data:null,items:[],owner:false,student:false,serverOffset:0,rows:3,sort:'post',opened:null,busy:false,loginBusy:false,
 esc:v=>SITE.escape(v),
 session(){const s=SITE._v60GuestSession;return s&&s.credential&&s.expiresAt>Date.now()+30000?s:null;},
 locale(){return document.documentElement.lang==='en'?'en':'id';},
 msg(id,en){return this.locale()==='en'?en:id;},
 time(iso){try{return new Intl.DateTimeFormat(this.locale()==='en'?'en-GB':'id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(iso))+' WIB';}catch(e){return '';}},
 nonce(){const a=new Uint8Array(16);crypto.getRandomValues(a);return [...a].map(v=>v.toString(16).padStart(2,'0')).join('');},
 api(payload){return new Promise((resolve,reject)=>{
  const endpoint=SITE.linkURL(this.data?.profile?.toolGuestbookUrl||'');if(!endpoint)return reject(Error('Class Talk Mailer endpoint not configured.'));
  const requestId=payload.requestId||this.nonce(),frame=document.createElement('iframe'),form=document.createElement('form');
  frame.name='ct66frame-'+requestId;frame.hidden=true;frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
  form.action=endpoint;form.method='POST';form.target=frame.name;form.hidden=true;
  const args=Object.assign({action:'class_talk',requestId,googleCredential:this.session()?.credential||''},payload);
  Object.entries(args).forEach(([key,val])=>{const input=document.createElement('input');input.type='hidden';input.name=key;input.value=String(val??'');form.append(input);});
  let settled=false;const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',onMessage);form.remove();setTimeout(()=>frame.remove(),800);};
  const onMessage=e=>{const d=e.data;if(!d||d.type!=='ASJ_CLASS_TALK_V66'||d.requestId!==requestId)return;
   if(!(e.origin==='null'||/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(e.origin)))return;
   if(settled)return;settled=true;cleanup();d.ok?resolve(d):reject(Error(d.message||'Class Talk request failed.'));
  };
  const timer=setTimeout(()=>{if(!settled){settled=true;cleanup();reject(Error('Class Talk response timed out.'));}},45000);
  window.addEventListener('message',onMessage);document.body.append(frame,form);form.submit();
 });},
 applyLanguage(){
  const subtitle=document.getElementById('ct66Subtitle'),sort=document.getElementById('ct66Sort'),start=document.getElementById('ct66Start'),more=document.getElementById('ct66More');
  if(subtitle)subtitle.textContent=this.msg('Tanyakan materi, sampaikan pendapat, dan diskusikan perkuliahan.','Ask questions, share thoughts, and discuss your courses.');
  if(sort){sort.options[0].text=this.msg('Post Terbaru','Newest Post');sort.options[1].text=this.msg('Balasan Terbaru','Newest Reply');}
  if(start)start.textContent=this.msg('+ Post Baru','+ New Post');
  if(more)more.textContent=this.msg('Tampilkan 2 baris lagi','Show 2 more rows');
 },
 init(data){this.data=data;const root=document.getElementById('ct66Section');if(!root)return;root.hidden=false;
  document.getElementById('ct66Sort').onchange=e=>{this.sort=e.target.value;this.rows=3;this.render();};
  document.getElementById('ct66More').onclick=()=>{this.rows+=2;this.render();};
  document.getElementById('ct66Start').onclick=()=>this.openComposer();
  document.getElementById('ct66DialogClose').onclick=()=>this.close();
  document.getElementById('ct66Backdrop').addEventListener('click',e=>{if(e.target.id==='ct66Backdrop')this.close();});
  document.addEventListener('pm58-guestbook-identity',()=>{this.renderLogin();this.refresh();});
  this.applyLanguage();this.renderLogin();this.refresh();
  window.addEventListener('resize',()=>this.render());
  setInterval(()=>this.tickDeletes(),1000);
 },
 courseList(){return (this.data?.courses||[]).map(c=>String(c.titleId||c.title||c.course||'')).filter(Boolean);},
 renderLogin(){const el=document.getElementById('ct66Login');if(!el)return;
  const s=this.session();if(s){el.innerHTML='<span class="ct66-signed">✓ '+this.esc(s.email)+'</span><button type="button" class="ct66-small" id="ct66Switch">'+this.msg('Ganti akun','Switch account')+'</button>';
   el.querySelector('#ct66Switch').onclick=()=>{SITE._v60GuestSession=null;try{google.accounts.id.disableAutoSelect();}catch(e){}document.dispatchEvent(new CustomEvent('pm58-guestbook-identity',{detail:{email:''}}));this.renderLogin();};return;}
  el.innerHTML='<span class="ct66-login-caption">'+this.msg('Masuk dengan Google','Sign in with Google')+'</span><span id="ct66GoogleBtn"></span>';
  this.googleButton();
 },
 googleButton(){if(this.loginBusy)return;this.loginBusy=true;
  const clientId=String(this.data?.profile?.mailGoogleClientId||'');
  if(!/^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)){this.loginBusy=false;return;}
  const start=()=>{
   const target=document.getElementById('ct66GoogleBtn');if(!target){this.loginBusy=false;return;}
   google.accounts.id.initialize({client_id:clientId,callback:response=>{
    try{const credential=String(response.credential||''),parts=credential.split('.');if(parts.length!==3)return;
      const payload=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
      if(String(payload.aud)!==clientId||Number(payload.exp)*1000<=Date.now()+30000)return;
      SITE._v60GuestSession={credential,clientId,email:String(payload.email||''),name:String(payload.name||''),expiresAt:Number(payload.exp)*1000};
      document.dispatchEvent(new CustomEvent('pm58-guestbook-identity',{detail:{email:String(payload.email||'')}}));
    }catch(err){this.feedback(err.message||'Google Sign-in failed.');}
   }});
   google.accounts.id.renderButton(target,{theme:'outline',size:'medium',width:178,text:'signin_with',shape:'rectangular'});
   this.loginBusy=false;
  };
  if(window.google?.accounts?.id){start();return;}
  const old=document.querySelector('script[data-asj-gis]');if(!old){const js=document.createElement('script');js.dataset.asjGis='1';js.src='https://accounts.google.com/gsi/client';js.async=true;document.head.append(js);}
  let attempts=0;const check=setInterval(()=>{if(window.google?.accounts?.id){clearInterval(check);start();}else if(++attempts>=60){clearInterval(check);this.loginBusy=false;this.feedback('Google Sign-in unavailable.');}},100);
 },
 feedback(message){const e=document.getElementById('ct66Status');if(e)e.textContent=message;},
 tickDeletes(){if(this.owner)return;const box=document.getElementById('ct66ModalBody');if(!box)return;box.querySelectorAll('[data-ct66-delete]').forEach(b=>{const until=Number(b.dataset.until||0),left=Math.max(0,Math.ceil((until-Date.now()-this.serverOffset)/1000));if(!left)b.remove();else b.textContent='Delete '+left+'s';});},
 async refresh(){if(!this.data)return;
  try{const res=await this.api({operation:'list'});this.items=res.items||[];this.owner=!!res.owner;this.student=!!res.student;
   this.serverOffset=(res.serverNow||Date.now())-Date.now();this.feedback(this.session()&&!this.owner&&!this.student?this.msg('Class Talk hanya menerima akun mahasiswa 11 digit NPM@student.upnjatim.ac.id.','Class Talk requires a verified 11-digit student NPM@student.upnjatim.ac.id account.'):'' );this.render();if(this.opened)this.openDiscussion(this.opened,true);
  }catch(err){this.feedback(err.message||String(err));}
 },
 roots(){const replies=this.items.filter(x=>x.parentId),byRoot={};replies.forEach(r=>{(byRoot[r.parentId]||=[]).push(r);});
  return this.items.filter(x=>!x.parentId).map(x=>Object.assign({},x,{replies:byRoot[x.id]||[],latest:Math.max(Date.parse(x.createdAt)||0,...(byRoot[x.id]||[]).map(r=>Date.parse(r.createdAt)||0))})).sort((a,b)=>this.sort==='reply'?b.latest-a.latest:Date.parse(b.createdAt)-Date.parse(a.createdAt));
 },
 render(){const root=document.getElementById('ct66Grid');if(!root)return;
  const data=this.roots(),width=window.innerWidth,cols=width<=620?1:width<=850?2:width<=1199?3:4,visible=this.rows*cols;root.innerHTML=data.slice(0,visible).map(x=>{
   const body=x.body||'',preview=body.length>170?body.slice(0,170)+'…':body;
   return `<button type="button" class="ct66-card" data-ct66-open="${this.esc(x.id)}"><span class="ct66-kind">${this.esc(x.kind==='material'?'New Material':x.kind==='grade'?'Grade Announcement':'Discussion')}</span>
    <strong class="ct66-author${x.display==='Lecturer'?' ct66-lecturer':''}">${this.esc(x.display||'Anonymous')}</strong><small>${this.esc(x.course)}${x.className?' · '+this.esc(x.className):''}</small>
    <span class="ct66-preview">${this.esc(preview)}</span><span class="ct66-meta">${this.esc(this.time(x.createdAt))} · ${x.replies.length} replies</span></button>`;
  }).join('')||'<div class="ct66-empty">'+this.msg('Belum ada diskusi.','No discussions yet.')+'</div>';
  root.querySelectorAll('[data-ct66-open]').forEach(el=>el.onclick=()=>this.openDiscussion(el.dataset.ct66Open));
  document.getElementById('ct66More').hidden=data.length<=visible;
  document.getElementById('ct66Start').hidden=!(this.student||this.owner);
 },
 open(){document.getElementById('ct66Backdrop').hidden=false;document.body.classList.add('ct66-modal-open');},
 close(){document.getElementById('ct66Backdrop').hidden=true;document.body.classList.remove('ct66-modal-open');this.opened=null;},
 controls(item){const signed=this.session(),timeLeft=item.canDeleteUntil-Date.now()-this.serverOffset;
  return `${signed&&(this.owner||(item.mine&&timeLeft>0))&&!item.deleted?`<button class="ct66-small ct66-danger" data-ct66-delete="${this.esc(item.id)}" data-until="${item.canDeleteUntil}">Delete ${this.owner?'':Math.max(0,Math.ceil(timeLeft/1000))+'s'}</button>`:''}${this.owner?`<button class="ct66-small" data-ct66-hide="${this.esc(item.id)}" data-value="${item.hidden?'false':'true'}">${item.hidden?'Unhide':'Hide'}</button>`:''}`;
 },
 privateLine(item){return this.owner&&item.privateEmail?`<small class="ct66-private">${this.esc(item.privateName)} · ${this.esc(item.privateEmail)}</small>`:'';},
 openDiscussion(id,keep=false){const item=this.items.find(x=>x.id===id&&!x.parentId);if(!item){this.close();return;}
  this.opened=id;this.open();const replies=this.items.filter(x=>x.parentId===id).sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));
  document.getElementById('ct66ModalTitle').textContent=item.display;
  const out=document.getElementById('ct66ModalBody');out.innerHTML=`<div class="ct66-thread-root"><div class="ct66-thread-meta">${this.esc(item.course)} · ${this.esc(this.time(item.createdAt))}</div>${this.privateLine(item)}<p>${this.esc(item.body)}</p><div class="ct66-actions">${this.controls(item)}</div></div>`+
   replies.map(r=>`<article class="ct66-reply"><strong class="${r.display==='Lecturer'?'ct66-lecturer':''}">${this.esc(r.display)}</strong> <small>${this.esc(this.time(r.createdAt))}</small>${this.privateLine(r)}<p>${this.esc(r.body)}</p><div class="ct66-actions">${this.controls(r)}</div></article>`).join('')+
   ((this.student||this.owner)?this.replyForm(item):'<p class="ct66-nologin">'+this.msg('Masuk dengan akun mahasiswa UPN untuk membalas.','Sign in with a UPN student account to reply.')+'</p>');
  out.querySelectorAll('[data-ct66-delete]').forEach(b=>b.onclick=()=>this.action('delete',b.dataset.ct66Delete));
  out.querySelectorAll('[data-ct66-hide]').forEach(b=>b.onclick=()=>this.action('hide',b.dataset.ct66Hide,{hidden:b.dataset.value}));
  out.querySelector('#ct66ReplyForm')?.addEventListener('submit',e=>this.submit(e,'reply',id));
 },
 selectClass(){return '<label>Class<select name="className" required><option value="">Class</option>'+['A','B','C','D','E'].map(c=>`<option value="${c}">${c}</option>`).join('')+'</select></label>';},
 anonym(){return '<label class="ct66-checkbox"><input type="checkbox" name="anonymous" checked> '+this.msg('Tampilkan sebagai anonim','Post anonymously')+'</label>';},
 replyForm(item){return `<form id="ct66ReplyForm" class="ct66-composer"><h4>Reply</h4>${this.owner?'':this.selectClass()+this.anonym()}<textarea name="body" required ${this.owner?'':'maxlength="1000"'} rows="3" placeholder="${this.msg('Tulis balasan...','Write your reply...')}"></textarea><button type="submit" class="ct66-primary">${this.msg('Kirim Balasan','Post Reply')}</button></form>`;},
 openComposer(){if(!this.student&&!this.owner){this.feedback('Sign in with an eligible UPN student account first.');return;}
  this.opened=null;this.open();document.getElementById('ct66ModalTitle').textContent=this.msg('Tulis Post Baru','New Discussion');
  const courses=this.courseList();document.getElementById('ct66ModalBody').innerHTML=`<form id="ct66PostForm" class="ct66-composer"><label>Course<select name="course" required><option value="">Choose course</option>${courses.map(c=>`<option value="${this.esc(c)}">${this.esc(c)}</option>`).join('')}</select></label>${this.owner?'':this.selectClass()+this.anonym()}<textarea name="body" required ${this.owner?'':'maxlength="1000"'} rows="5" placeholder="${this.msg('Tulis pertanyaan atau komentar...','Write your question or comment...')}"></textarea><button type="submit" class="ct66-primary">${this.msg('Kirim Post','Post Discussion')}</button></form>`;
  document.getElementById('ct66PostForm').addEventListener('submit',e=>this.submit(e,'post',''));
 },
 async submit(event,operation,parentId){event.preventDefault();if(this.busy)return;const form=event.target,body=form.querySelector('textarea')?.value||'';
  this.busy=true;const button=form.querySelector('button[type="submit"]');button.disabled=true;
  try{await this.api({operation,parentId,body,course:form.elements.course?.value||'',className:form.elements.className?.value||'',anonymous:form.elements.anonymous?.checked===true});this.close();await this.refresh();}
  catch(err){this.feedback(err.message||String(err));alert(err.message||String(err));}
  finally{this.busy=false;if(button.isConnected)button.disabled=false;}
 },
 async action(operation,id,extra={}){if(!confirm(operation==='delete'?'Delete this message?':'Change visibility of this message?'))return;
  try{await this.api(Object.assign({operation,itemId:id},extra));await this.refresh();}catch(err){alert(err.message||String(err));}
 }
};
window.CT66=CT66;
