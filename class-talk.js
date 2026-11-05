'use strict';
/* Reactions and comments belong to the expanded announcement. No standalone forum or forced scrolling. */
const AnnouncementTalk = {
  emoji: ['👍🏻', '👏🏻', '😁', '😂', '😭', '😱', '🔥'],
  data: null, current: null, epoch: 0, summaries: new Map(), initialized: false,
  outbox: [], outboxKey: 'announcementOutboxV74', processing: false,
  esc: value => SITE.escape(value),
  msg(id, en) { return document.documentElement.lang === 'en' ? en : id; },
  session() {
    const session = SITE._v60GuestSession;
    return session?.credential && session.expiresAt > Date.now() + 30000 ? session : null;
  },
  nonce() { return [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, '0')).join(''); },
  accountKey() { return String(this.session()?.email||'').trim().toLowerCase(); },
  restoreOutbox() {
    try {
      const saved=JSON.parse(localStorage.getItem(this.outboxKey)||'[]');
      if(Array.isArray(saved))this.outbox=saved.filter(item=>item&&/^[a-zA-Z0-9_-]{12,100}$/.test(item.requestId)&&typeof item.account==='string'&&typeof item.body==='string'&&item.body.length<=45000&&/^[a-zA-Z0-9_.:-]{1,120}$/.test(item.announcementId)).slice(0,50)
        .map(item=>({...item,status:item.status==='failed'?'failed':'queued'}));
    } catch(_) { this.outbox=[]; }
  },
  persistOutbox() {
    // Deliberately omit Google credentials: queued text can wait for the same account to sign in again.
    try { localStorage.setItem(this.outboxKey,JSON.stringify(this.outbox.map(({requestId,account,announcementId,parentId,body,anonymous,displayName,display,createdAt,status,retryable})=>({requestId,account,announcementId,parentId,body,anonymous,displayName,display,createdAt,status,retryable}))));return true; }
    catch(_) { return false; }
  },
  removePending(requestId) {
    if(!this.outbox.some(item=>item.requestId===requestId))return;
    this.outbox=this.outbox.filter(item=>item.requestId!==requestId);this.persistOutbox();
  },
  pendingFor(id) {
    const account=this.accountKey();if(!account)return [];
    return this.outbox.filter(item=>item.account===account&&item.announcementId===id).map(item=>({
      id:'pending:'+item.requestId,requestId:item.requestId,parentId:item.parentId||'',body:item.body,display:item.display,
      anonymous:item.anonymous,createdAt:item.createdAt,pending:item.status,isLecturer:item.display==='Lecturer',mine:true
    }));
  },
  refreshPending() {
    const state=this.current;
    if(state&&this.active(state)){this.renderComments(state,true);}
  },
  pendingPayload(item,credential) {
    return {operation:'announcement_comment',announcementId:item.announcementId,parentId:item.parentId||'',
      body:item.body,anonymous:item.anonymous===true,displayName:item.displayName||'',requestId:item.requestId,googleCredential:credential};
  },
  async resumeOutbox() {
    const account=this.accountKey();if(!account||!this.data)return;
    const pending=this.outbox.filter(item=>item.account===account);
    if(!pending.length)return;
    try {
      const result=await this.api({operation:'announcement_receipts',ids:JSON.stringify(pending.map(item=>item.requestId))});
      for(const id of result.accepted||[])this.removePending(id);
    } catch(_) { /* Retrying the same request ID remains safe when a receipt lookup is unavailable. */ }
    if(this.accountKey()!==account)return;
    for(const item of this.outbox)if(item.account===account&&item.status==='failed'&&item.retryable)item.status='queued';
    this.persistOutbox();this.refreshPending();this.flushOutbox();
  },
  async flushOutbox() {
    if(this.processing)return;this.processing=true;
    try {
      while(this.session()) {
        const account=this.accountKey(),item=this.outbox.find(item=>item.account===account&&item.status==='queued');
        if(!item||navigator.onLine===false)break;
        const credential=this.session().credential;
        item.status='sending';this.persistOutbox();this.refreshPending();
        try {
          const result=await this.api(this.pendingPayload(item,credential));
          this.removePending(item.requestId);
          this.applyCommentAck(item,result);
        } catch(error) {
          item.status='failed';item.retryable=!error.server||/identitas|login|sign.in|kedaluwarsa/i.test(error.message);this.persistOutbox();
          if(this.accountKey()===account){this.refreshPending();if(this.current?.announcement.id===item.announcementId)this.status(this.current,error.message);}
        }
      }
    } finally {this.processing=false;}
  },
  applyCommentAck(item,result) {
    const summary=this.summaries.get(item.announcementId);
    if(summary&&Number.isFinite(result.publicCount)){summary.comments=result.publicCount;this.paintSummaries();}
    const state=this.current;
    if(!state||!this.active(state)||state.announcement.id!==item.announcementId||this.accountKey()!==item.account)return;
    if(!state.loaded){this.loadThread(state);return;}
    ++state.threadSequence;
    if(result.comment&&!state.comments.some(comment=>comment.id===result.comment.id)){
      state.comments.push(result.comment);state.total=Math.max(state.total+1,result.publicCount||0);
    }
    if(result.actor)state.actor=result.actor;
    this.renderComments(state,true);this.status(state,this.msg('Komentar terkirim.','Comment posted.'));
  },
  retryComment(requestId) {
    const item=this.outbox.find(item=>item.requestId===requestId&&item.account===this.accountKey());
    if(!item||item.status==='sending')return;
    item.status='queued';this.persistOutbox();this.refreshPending();this.flushOutbox();
  },
  sendOnLeave() {
    const session=this.session(),account=this.accountKey(),endpoint=SITE.linkURL(this.data?.profile?.toolGuestbookUrl||'');
    if(!session||!endpoint)return;
    for(const item of this.outbox.filter(item=>item.account===account&&item.status!=='failed')) {
      if(item.lastBeacon&&Date.now()-item.lastBeacon<1000)continue;
      item.lastBeacon=Date.now();
      const payload={action:'class_talk',...this.pendingPayload(item,session.credential)},body=new URLSearchParams();
      for(const [key,value]of Object.entries(payload))body.set(key,String(value));
      if(new Blob([body.toString()]).size>60000)continue;
      try {
        if(navigator.sendBeacon&&navigator.sendBeacon(endpoint,body))continue;
        fetch(endpoint,{method:'POST',body,mode:'no-cors',credentials:'omit',keepalive:true}).catch(()=>{});
      }catch(_){}
      // A browser-queued request is not a server acknowledgement. Keep it for receipt checks on return.
    }
  },
  api(payload) {
    return new Promise((resolve, reject) => {
      const endpoint = SITE.linkURL(this.data?.profile?.toolGuestbookUrl || '');
      if (!endpoint) return reject(Error(this.msg('Layanan komentar belum tersedia.', 'Comments are not available yet.')));
      const requestId = payload.requestId || this.nonce();
      const frame = document.createElement('iframe'), form = document.createElement('form');
      frame.name = 'announcement-' + requestId; frame.hidden = true; frame.tabIndex = -1; frame.setAttribute('aria-hidden', 'true');
      form.action = endpoint; form.method = 'POST'; form.target = frame.name; form.hidden = true;
      // Counts and the public name list need no token verification; signed thread reads and writes do.
      const publicRead = ['announcement_summary', 'announcement_reactors','announcement_reaction_groups'].includes(payload.operation);
      const args = {action: 'class_talk', requestId, googleCredential: publicRead ? '' : this.session()?.credential || '', ...payload};
      for (const [key, value] of Object.entries(args)) {
        const input = document.createElement('input'); input.type = 'hidden'; input.name = key; input.value = String(value ?? ''); form.append(input);
      }
      let settled = false;
      const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); form.remove(); setTimeout(() => frame.remove(), 800); };
      const receive = event => {
        const message = event.data;
        // HTMLService may send from a nested googleusercontent frame; validate its origin and nonce.
        if (message?.type !== 'ASJ_CLASS_TALK_V66' || message.requestId !== requestId) return;
        if (!(event.origin === 'null' || /^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(event.origin))) return;
        if (settled) return;
        settled = true; cleanup();
        if(message.ok)resolve(message);else{const error=Error(message.message||'Request failed.');error.server=true;reject(error);}
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true; cleanup(); reject(Error(this.msg('Respons belum diterima. Periksa koneksi sebelum mencoba lagi.', 'No response yet. Check your connection before trying again.')));
      }, 45000);
      window.addEventListener('message', receive); document.body.append(frame, form); form.submit();
    });
  },
  init(data) {
    this.data = data;
    this.renderHeaderLogin();
    if (this.initialized) return;
    this.initialized = true;
    this.restoreOutbox();
    window.addEventListener('pagehide',()=>this.sendOnLeave());
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')this.sendOnLeave();});
    window.addEventListener('online',()=>this.resumeOutbox());
    document.addEventListener('pm58-guestbook-identity', () => {
      ++this.epoch; this.summaries.clear();
      this.renderHeaderLogin();
      const state = this.current;
      if (state) {
        state.owner = false; state.student = false; state.replyTo = null; state.comments = [];state.actor=null;state.groups=null;state.groupsError='';
        state.reactions = state.reactions ? {...state.reactions, mine: ''} : null;
        state.epoch = this.epoch; state.loaded = false; state.draft = {};
        state.element.querySelector('.an72-comments').replaceChildren();
        this.renderLogin(state); this.renderReactions(state); this.renderComments(state); this.loadThread(state);
      }
      this.refreshSummaries();
      this.resumeOutbox();
    });
    this.resumeOutbox();
  },
  applyLanguage() {
    this.paintSummaries();
    this.renderHeaderLogin();
    const state = this.current;
    if (state) { this.renderLogin(state); this.renderReactions(state); this.renderComments(state); }
  },
  async refreshSummaries() {
    const ids = [...document.querySelectorAll('[data-ac71-id]')].map(el => el.dataset.ac71Id);
    if (!ids.length || !this.data?.profile?.toolGuestbookUrl) return;
    const epoch = this.epoch;
    try {
      const result = await this.api({operation: 'announcement_summary', ids: JSON.stringify(ids)});
      if (epoch !== this.epoch) return;
      for (const summary of result.summaries || []) this.summaries.set(summary.id, summary);
      this.paintSummaries();
    } catch (_) { /* Unavailable counts must not prevent opening an announcement. */ }
  },
  paintSummaries() {
    document.querySelectorAll('[data-an72-summary]').forEach(host => {
      const summary = this.summaries.get(host.dataset.an72Summary);
      if (!summary) { host.hidden = true; return; }
      const count = summary.counts.reduce((sum, item) => sum + item.count, 0);
      host.hidden = false; host.textContent = `${count} ☻ · ${summary.comments} 💬`;
      host.setAttribute('aria-label', `${count} ${this.msg('reaksi', 'reactions')}, ${summary.comments} ${this.msg('komentar', 'comments')}`);
    });
  },
  unmount() { if (this.current?.timer) clearInterval(this.current.timer); this.current = null; },
  mount(panel, announcement) {
    this.unmount();
    const element = document.createElement('section'); element.className = 'an72-talk';
    element.setAttribute('aria-label', this.msg('Reaksi dan komentar', 'Reactions and comments'));
    element.innerHTML = '<div class="an72-reactions"></div><div class="an72-login"></div><div class="an72-comments"></div><div class="an72-status" role="status" aria-live="polite"></div>';
    panel.append(element);
    const state = this.current = {element, announcement, epoch: this.epoch, owner: false, student: false, comments: [], total: 0, nextOffset: 0,
      replyTo: null, reactions: null, busy: false, loaded: false, peopleToken: 0};
    this.renderLogin(state); this.status(state, this.msg('Memuat interaksi…', 'Loading interactions…'));
    state.timer = setInterval(() => this.tickDeletes(state), 1000); this.loadThread(state);
  },
  active(state) { return this.current === state && state.element.isConnected && state.epoch === this.epoch; },
  status(state, text) { if (this.active(state)) state.element.querySelector('.an72-status').textContent = text; },
  async loadThread(state, more = false) {
    const epoch = state.epoch, offset = more ? state.nextOffset : 0, sequence = state.threadSequence = (state.threadSequence || 0) + 1;
    try {
      const result = await this.api({operation: 'announcement_thread', announcementId: state.announcement.id, offset});
      if (!this.active(state) || epoch !== this.epoch || sequence !== state.threadSequence) return;
      state.owner = !!result.owner; state.student = !!result.student; state.loaded = true;
      state.serverOffset = (result.serverNow || Date.now()) - Date.now();
      state.comments = more ? [...state.comments, ...result.comments] : result.comments;
      state.comments=[...new Map(state.comments.map(item=>[item.id,item])).values()];
      for(const item of result.comments||[])if(item.requestId)this.removePending(item.requestId);
      state.total = result.total; state.nextOffset = result.nextOffset; state.commentsEnabled = result.commentsEnabled; state.reactions = result.reactions;
      state.actor=result.actor||null;
      this.summaries.set(state.announcement.id, {id: state.announcement.id, comments: result.publicCount ?? result.total, ...result.reactions});
      this.paintSummaries(); this.renderLogin(state); this.renderReactions(state); this.renderComments(state); this.status(state, '');
    } catch (error) {
      if (!this.active(state) || epoch !== this.epoch || sequence !== state.threadSequence) return;
      this.status(state, error.message);
      if (!state.loaded) {
        const host = state.element.querySelector('.an72-comments'), retry = document.createElement('button');
        host.replaceChildren(); retry.type = 'button'; retry.className = 'an72-small'; retry.textContent = this.msg('Coba muat lagi', 'Try loading again');
        retry.onclick = () => this.loadThread(state); host.append(retry);
      }
    }
  },
  renderLogin(state) {
    const host = state.element.querySelector('.an72-login'), session = this.session();
    if (session) {
      host.innerHTML = `<small>${state.loaded && !state.owner && !state.student ? this.msg('Gunakan akun mahasiswa UPN untuk berdiskusi.', 'Use a verified UPN student account to discuss.') : this.msg('Nama Google terlihat pada reaksi. Komentar boleh anonim.', 'Reactions show your Google name. Comments can be anonymous.')}</small>`;
    } else {
      host.innerHTML = `<p>${this.msg('Masuk dengan akun mahasiswa untuk berdiskusi.', 'Sign in with your student account to discuss.')}</p>`;
    }
  },
  renderHeaderLogin() {
    const host = document.getElementById('announcement-login');
    if (!host || !this.data) return;
    const session = this.session();
    if (session) {
      host.innerHTML = `<span class="an73-account">${this.esc(session.name || this.msg('Akun Google terhubung', 'Google account connected'))}</span><button type="button" class="an72-small" data-header-switch>${this.msg('Ganti akun', 'Switch account')}</button>`;
      host.querySelector('[data-header-switch]').onclick = () => {
        SITE._v60GuestSession = null; try { google.accounts.id.disableAutoSelect(); } catch (_) {}
        document.dispatchEvent(new CustomEvent('pm58-guestbook-identity', {detail: {email: ''}}));
      };
    } else {
      host.innerHTML = '<div id="an73Google"></div>';
      this.googleButton();
    }
  },
  async googleButton(state) {
    const sequence = this.googleSequence = (this.googleSequence || 0) + 1;
    const clientId = String(this.data?.profile?.mailGoogleClientId || '');
    if (!/^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)) return;
    if (!window.google?.accounts?.id) {
      let script = document.querySelector('script[data-asj-gis]');
      if (!script) { script = document.createElement('script'); script.dataset.asjGis = '1'; script.src = 'https://accounts.google.com/gsi/client'; script.async = true; document.head.append(script); }
      let tries = 0;
      while (!window.google?.accounts?.id && tries++ < 60) await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (sequence !== this.googleSequence || this.session()) return;
    const target = document.getElementById('an73Google');
    if (!target || !window.google?.accounts?.id) return;
    google.accounts.id.initialize({client_id: clientId, callback: response => {
      try {
        const credential = String(response.credential || ''), parts = credential.split('.'); if (parts.length !== 3) return;
        const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0))));
        if (payload.aud !== clientId || payload.exp * 1000 <= Date.now() + 30000) return;
        // This token decode controls UI only. The server independently verifies every write.
        SITE._v60GuestSession = {credential, clientId, email: String(payload.email || ''), name: String(payload.name || ''), expiresAt: payload.exp * 1000};
        document.dispatchEvent(new CustomEvent('pm58-guestbook-identity', {detail: {email: payload.email || ''}}));
      } catch (error) { this.status(state, error.message); }
    }});
    google.accounts.id.renderButton(target, {theme: 'outline', size: 'medium', text: 'signin_with', shape: 'rectangular'});
  },
  renderReactions(state) {
    const host=state.element.querySelector('.an72-reactions');
    const counts=state.reactions?.counts||this.emoji.map(emoji=>({emoji,count:0}));
    if(!state.reactionsOpen){
      host.innerHTML=`<div class="an74-reaction-card"><button type="button" class="an74-reaction-summary" aria-expanded="false" aria-label="${this.msg('Buka pilihan dan daftar reaksi','Open reactions and people')}" data-open-reactions>${counts.map(item=>`<span>${item.emoji}<b>${item.count}</b></span>`).join('<span class="an74-dot" aria-hidden="true"> · </span>')}</button></div>`;
      host.querySelector('[data-open-reactions]').onclick=()=>{state.reactionsOpen=true;this.renderReactions(state);this.loadGroups(state);};
      return;
    }
    host.innerHTML=`<div class="an74-reaction-card"><div class="an74-reaction-toolbar"><div class="an74-reaction-choices">${this.emoji.map(emoji=>`<button type="button" data-react="${emoji}" aria-label="${this.msg('Beri reaksi','React')} ${emoji}" aria-pressed="${state.reactions?.mine===emoji}" ${state.busy?'disabled':''}>${emoji}</button>`).join('')}</div><button type="button" class="an72-small" data-close-reactions>${this.msg('Tutup','Close')}</button></div><div class="an74-reaction-groups">${state.groups?state.groups.filter(group=>group.total>0).map(group=>`<div class="an74-reaction-group"><strong>${group.emoji} ${group.total}</strong><span> — ${group.people.map(person=>`(${this.esc(person.name)})`).join(' ')}</span>${group.nextOffset<group.total?` <button type="button" class="an72-small" data-more-group="${group.emoji}">${this.msg('Lihat lagi','Show more')}</button>`:''}</div>`).join(''):state.groupsError?`<span class="an74-group-status">${this.esc(state.groupsError)}</span>`:`<span class="an74-group-status">${this.msg('Memuat…','Loading…')}</span>`}</div></div>`;
    host.querySelector('[data-close-reactions]').onclick=()=>{state.reactionsOpen=false;this.renderReactions(state);};
    host.querySelectorAll('[data-react]').forEach(button=>button.onclick=()=>this.react(state,button.dataset.react));
    host.querySelectorAll('[data-more-group]').forEach(button=>button.onclick=()=>this.moreGroup(state,button.dataset.moreGroup));
  },
  async loadGroups(state) {
    const epoch=state.epoch,sequence=state.peopleToken=(state.peopleToken||0)+1;
    try{
      const result=await this.api({operation:'announcement_reaction_groups',announcementId:state.announcement.id});
      if(!this.active(state)||epoch!==this.epoch||sequence!==state.peopleToken)return;
      state.groups=result.groups||[];state.groupsError='';if(state.reactionsOpen)this.renderReactions(state);
    }catch(error){if(this.active(state)&&epoch===this.epoch){state.groupsError=error.message;if(state.reactionsOpen)this.renderReactions(state);}}
  },
  async moreGroup(state,emoji) {
    const group=state.groups?.find(group=>group.emoji===emoji);if(!group)return;
    if(group.loading)return;group.loading=true;
    const epoch=state.epoch;
    try{
      const result=await this.api({operation:'announcement_reactors',announcementId:state.announcement.id,emoji,offset:group.nextOffset});
      if(!this.active(state)||epoch!==this.epoch||!state.groups?.includes(group))return;
      group.people.push(...result.people);group.nextOffset=result.nextOffset;group.total=result.total;this.renderReactions(state);
    }catch(error){this.status(state,error.message);}finally{group.loading=false;}
  },
  async react(state,emoji) {
    if(!this.session()||(!state.owner&&!state.student))return this.status(state,this.msg('Masuk dengan akun mahasiswa UPN terlebih dahulu.','Sign in with a verified UPN student account first.'));
    if(state.busy)return;
    state.busy=true;this.renderReactions(state);const epoch=state.epoch;
    try{
      const result=await this.api({operation:'announcement_react',announcementId:state.announcement.id,emoji:state.reactions?.mine===emoji?'':emoji});
      if(!this.active(state)||epoch!==this.epoch)return;
      if(result.reactions)state.reactions=result.reactions;
      const summary=this.summaries.get(state.announcement.id);if(summary&&result.reactions){Object.assign(summary,result.reactions);this.paintSummaries();}
      state.groups=null;state.groupsError='';if(state.reactionsOpen)this.loadGroups(state);
    }catch(error){if(epoch===this.epoch)this.status(state,error.message);}
    finally{state.busy=false;if(this.active(state))this.renderReactions(state);}
  },
  draft(state) {
    const form = state.element.querySelector('.an72-composer');
    return form ? {body: form.elements.body.value, anonymous: form.elements.anonymous?.checked || false, displayName: form.elements.displayName?.value || ''} : state.draft || {};
  },
  time(iso) { return new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-GB' : 'id-ID', {timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short'}).format(new Date(iso)) + ' WIB'; },
  commentHTML(state, item, reply = false) {
    if(item.pending){
      const failed=item.pending==='failed';
      return `<article class="an72-comment an74-pending ${reply?'an72-reply':''}"><div class="an72-comment-head"><strong>${item.isLecturer?this.msg('Dosen','Lecturer'):this.esc(item.display)}</strong><span class="an74-send-state">${failed?this.msg('Belum terkirim','Not sent'):this.msg('Mengirim…','Sending…')}</span></div><p>${this.esc(item.body)}</p>${failed?`<button type="button" class="an72-small" data-retry-comment="${this.esc(item.requestId)}">${this.msg('Coba lagi','Retry')}</button>`:''}</article>`;
    }
    const deleted = !!item.deletedAt, hidden = item.hidden;
    return `<article class="an72-comment ${reply ? 'an72-reply' : ''} ${deleted || hidden ? 'an72-archived' : ''}"><div class="an72-comment-head"><strong>${item.isLecturer ? this.msg('Dosen', 'Lecturer') : this.esc(item.display)}</strong><time datetime="${this.esc(item.createdAt)}">${this.esc(this.time(item.createdAt))}</time></div>${state.owner && item.privateEmail ? `<small class="an72-private">${this.esc(item.privateName)} · ${this.esc(item.privateEmail)}</small>` : ''}<p>${this.esc(item.body)}</p><div class="an72-comment-actions">${!deleted && !hidden && state.commentsEnabled && (state.owner || state.student) ? `<button type="button" class="an72-small" data-reply="${this.esc(item.id)}">${this.msg('Balas', 'Reply')}</button>` : ''}${!deleted && (state.owner || item.mine && item.canDeleteUntil > Date.now() + (state.serverOffset || 0)) ? `<button type="button" class="an72-small" data-delete="${this.esc(item.id)}" data-until="${item.canDeleteUntil}">${this.msg('Hapus', 'Delete')}</button>` : ''}${state.owner && !deleted ? `<button type="button" class="an72-small" data-hide="${this.esc(item.id)}" data-hidden="${!hidden}">${this.msg(hidden ? 'Tampilkan' : 'Sembunyikan', hidden ? 'Show' : 'Hide')}</button>` : ''}${deleted || hidden ? `<span>${this.msg(deleted ? 'Dihapus' : 'Disembunyikan', deleted ? 'Deleted' : 'Hidden')}</span>` : ''}</div></article>`;
  },
  renderComments(state,preserveComposer=false) {
    state.draft = this.draft(state);
    const host=state.element.querySelector('.an72-comments'),pending=this.pendingFor(state.announcement.id),items=[...state.comments,...pending],roots=items.filter(item=>!item.parentId||item.pending&&!items.some(parent=>parent.id===item.parentId));
    const listMarkup=roots.map(root => this.commentHTML(state, root) + items.filter(reply => reply.parentId === root.id).map(reply => this.commentHTML(state, reply, true)).join('')).join('') || `<p class="an72-empty">${this.msg('Belum ada komentar.', 'No comments yet.')}</p>`;
    const keep=preserveComposer&&host.querySelector('.an72-comment-list');
    if(keep){
      // Update messages in place so an acknowledgement never replaces the textarea being edited.
      keep.innerHTML=listMarkup;
      host.querySelector('.an72-comments-heading h3 span').textContent=String(state.total+pending.length);
      let more=host.querySelector('[data-more-comments]');
      if(state.nextOffset<state.total){
        if(!more){more=document.createElement('button');more.type='button';more.className='an72-small';more.dataset.moreComments='';host.insertBefore(more,host.querySelector('.an72-composer-host'));}
        more.textContent=this.msg('Lihat komentar lainnya','More comments')+' ('+(state.total-state.nextOffset)+')';
      }else if(more)more.remove();
    }else{
    host.innerHTML = `<div class="an72-comments-heading"><h3>${this.msg('Komentar', 'Comments')} <span>${state.total+pending.length}</span></h3><button type="button" class="an72-small" data-refresh>${this.msg('Muat ulang', 'Refresh')}</button></div><div class="an72-comment-list">${listMarkup}</div>${state.nextOffset < state.total ? `<button type="button" class="an72-small" data-more-comments>${this.msg('Lihat komentar lainnya', 'More comments')} (${state.total - state.nextOffset})</button>` : ''}<div class="an72-composer-host"></div>`;
    }
    host.querySelectorAll('[data-retry-comment]').forEach(button=>button.onclick=()=>this.retryComment(button.dataset.retryComment));
    host.querySelector('[data-refresh]').onclick = () => this.loadThread(state);
    host.querySelectorAll('[data-reply]').forEach(button => button.onclick = () => { state.draft = this.draft(state); state.replyTo = state.comments.find(item => item.id === button.dataset.reply); this.renderComposer(state); });
    host.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => this.moderate(state, button.dataset.delete, 'delete'));
    host.querySelectorAll('[data-hide]').forEach(button => button.onclick = () => this.moderate(state, button.dataset.hide, 'hide', button.dataset.hidden === 'true'));
    const more = host.querySelector('[data-more-comments]'); if (more) more.onclick = () => this.loadThread(state, true);
    if(!keep)this.renderComposer(state);
  },
  renderComposer(state) {
    const host = state.element.querySelector('.an72-composer-host'); if (!host) return;
    if (!state.loaded || !state.commentsEnabled || (!state.owner && !state.student) || !this.session()) {
      host.innerHTML = state.loaded && !state.commentsEnabled ? `<p class="an72-empty">${this.msg('Komentar pada pengumuman ini ditutup.', 'Comments are closed for this announcement.')}</p>` : ''; return;
    }
    const draft = state.draft || {};
    host.innerHTML = `<form class="an72-composer">${state.replyTo ? `<div class="an72-replying">${this.msg('Membalas', 'Replying to')} ${this.esc(state.replyTo.display)} <button type="button" class="an72-small" data-cancel-reply>${this.msg('Batal', 'Cancel')}</button></div>` : ''}${state.owner ? '' : `<div class="an72-composer-options"><label>${this.msg('Nama tampilan', 'Display name')}<input name="displayName" maxlength="50" value="${this.esc(draft.displayName || String(this.session()?.name || '').split(/\s+/)[0])}"></label><label class="an72-anonymous"><input name="anonymous" type="checkbox" ${draft.anonymous ? 'checked' : ''}>${this.msg('Komentar anonim', 'Anonymous comment')}</label></div>`}<label class="an72-comment-label">${this.msg('Tulis komentar', 'Write a comment')}<textarea name="body" rows="3" required maxlength="${state.owner ? 45000 : 1000}" placeholder="${this.msg('Tulis pertanyaan atau komentar…', 'Write a question or comment…')}">${this.esc(draft.body || '')}</textarea></label><button class="an72-primary" type="submit" ${state.busy ? 'disabled' : ''}>${this.msg('Kirim komentar', 'Post comment')}</button></form>`;
    const form = host.querySelector('form'), anonymous = form.elements.anonymous, display = form.elements.displayName;
    if (anonymous && display) { const sync = () => { display.disabled = anonymous.checked; }; anonymous.onchange = sync; sync(); }
    const cancel = host.querySelector('[data-cancel-reply]');
    if (cancel) cancel.onclick = () => { state.draft = this.draft(state); state.replyTo = null; this.renderComposer(state); };
    form.onsubmit = event => this.comment(event, state);
  },
  async comment(event,state) {
    event.preventDefault();
    if(!state.loaded||!state.commentsEnabled||!this.session()||(!state.owner&&!state.student))return;
    const draft=this.draft(state),body=String(draft.body||'').trim();
    if(!body||body.length>(state.owner?45000:1000))return;
    if(this.outbox.length>=50)return this.status(state,this.msg('Antrean penuh. Selesaikan kiriman sebelumnya.','Outbox is full. Resolve earlier messages first.'));
    const suffix=state.actor?.named?.match(/\d{2}-\d{3}$/)?.[0]||'';
    const display=state.owner?'Lecturer':draft.anonymous?(state.actor?.anonymous||'Anonim'):(draft.displayName?draft.displayName.trim()+(suffix?' '+suffix:''):state.actor?.named||this.session().name);
    const item={requestId:this.nonce(),account:this.accountKey(),announcementId:state.announcement.id,parentId:state.replyTo?.id||'',
      body,anonymous:!state.owner&&draft.anonymous===true,displayName:draft.displayName||'',display,createdAt:new Date().toISOString(),status:'queued'};
    this.outbox.push(item);const persisted=this.persistOutbox();
    const form=state.element.querySelector('.an72-composer');if(form)form.elements.body.value='';
    state.draft={anonymous:draft.anonymous,displayName:draft.displayName};state.replyTo=null;
    this.renderComments(state);this.status(state,persisted?'':this.msg('Antrean lokal tidak dapat disimpan. Tunggu konfirmasi sebelum menutup tab.','Local outbox could not be saved. Wait for confirmation before closing.'));
    this.flushOutbox();
  },
  async moderate(state, id, mode, hidden = false) {
    if (state.busy) return;
    if (mode === 'delete' && !confirm(this.msg('Hapus komentar ini?', 'Delete this comment?'))) return;
    state.busy = true;
    try { await this.api({operation: 'announcement_moderate', announcementId: state.announcement.id, itemId: id, mode, hidden}); await this.loadThread(state); }
    catch (error) { this.status(state, error.message); }
    finally {
      state.busy = false;
      if (this.active(state)) { state.draft = this.draft(state); this.renderComposer(state); }
    }
  },
  tickDeletes(state) {
    if (!this.active(state) || state.owner) return;
    state.element.querySelectorAll('[data-delete]').forEach(button => {
      const remaining = Math.max(0, Math.ceil((Number(button.dataset.until) - Date.now() - (state.serverOffset || 0)) / 1000));
      if (!remaining) button.remove(); else button.textContent = this.msg('Hapus ', 'Delete ') + remaining + 's';
    });
  }
};
window.CT66 = AnnouncementTalk;
