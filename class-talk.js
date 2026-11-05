'use strict';
/* Reactions and comments belong to the expanded announcement. No standalone forum or forced scrolling. */
const AnnouncementTalk = {
  emoji: ['👍🏻', '👏🏻', '😁', '😂', '😭', '😱', '🔥'],
  data: null, current: null, epoch: 0, summaries: new Map(), initialized: false,
  esc: value => SITE.escape(value),
  msg(id, en) { return document.documentElement.lang === 'en' ? en : id; },
  session() {
    const session = SITE._v60GuestSession;
    return session?.credential && session.expiresAt > Date.now() + 30000 ? session : null;
  },
  nonce() { return [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, '0')).join(''); },
  api(payload) {
    return new Promise((resolve, reject) => {
      const endpoint = SITE.linkURL(this.data?.profile?.toolGuestbookUrl || '');
      if (!endpoint) return reject(Error(this.msg('Layanan komentar belum tersedia.', 'Comments are not available yet.')));
      const requestId = payload.requestId || this.nonce();
      const frame = document.createElement('iframe'), form = document.createElement('form');
      frame.name = 'announcement-' + requestId; frame.hidden = true; frame.tabIndex = -1; frame.setAttribute('aria-hidden', 'true');
      form.action = endpoint; form.method = 'POST'; form.target = frame.name; form.hidden = true;
      // Counts and the public name list need no token verification; signed thread reads and writes do.
      const publicRead = ['announcement_summary', 'announcement_reactors'].includes(payload.operation);
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
        settled = true; cleanup(); message.ok ? resolve(message) : reject(Error(message.message || 'Request failed.'));
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
    document.addEventListener('pm58-guestbook-identity', () => {
      ++this.epoch; this.summaries.clear();
      this.renderHeaderLogin();
      const state = this.current;
      if (state) {
        state.owner = false; state.student = false; state.replyTo = null; state.comments = [];
        state.reactions = state.reactions ? {...state.reactions, mine: ''} : null;
        state.epoch = this.epoch; state.loaded = false; state.draft = {};
        state.element.querySelector('.an72-comments').replaceChildren();
        this.renderLogin(state); this.renderReactions(state); this.renderComments(state); this.loadThread(state);
      }
      this.refreshSummaries();
    });
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
    element.innerHTML = '<div class="an72-reactions"></div><div class="an72-people" hidden></div><div class="an72-login"></div><div class="an72-comments"></div><div class="an72-status" role="status" aria-live="polite"></div>';
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
      state.total = result.total; state.nextOffset = result.nextOffset; state.commentsEnabled = result.commentsEnabled; state.reactions = result.reactions;
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
    const host = state.element.querySelector('.an72-reactions');
    const counts = state.reactions?.counts || this.emoji.map(emoji => ({emoji, count: 0}));
    host.innerHTML = `<div class="an72-reaction-title">${this.msg('Reaksi', 'Reactions')}</div><div class="an72-reaction-bar">${counts.map(item => `<div class="an72-reaction ${state.reactions?.mine === item.emoji ? 'is-mine' : ''}"><button type="button" data-react="${item.emoji}" aria-pressed="${state.reactions?.mine === item.emoji}" aria-label="${this.msg('Beri reaksi', 'React')} ${item.emoji}" ${state.busy ? 'disabled' : ''}>${item.emoji}</button><button type="button" class="an72-reaction-count" data-people="${item.emoji}" aria-label="${this.msg('Lihat pemberi reaksi', 'See who reacted')} ${item.emoji}: ${item.count}">${item.count}</button></div>`).join('')}</div>`;
    host.querySelectorAll('[data-react]').forEach(button => button.onclick = () => this.react(state, button.dataset.react));
    host.querySelectorAll('[data-people]').forEach(button => button.onclick = () => this.people(state, button.dataset.people));
  },
  async react(state, emoji) {
    if (!this.session() || (!state.owner && !state.student)) return this.status(state, this.msg('Masuk dengan akun mahasiswa UPN terlebih dahulu.', 'Sign in with a verified UPN student account first.'));
    if (state.busy) return;
    state.busy = true; this.renderReactions(state); const epoch = state.epoch;
    try {
      await this.api({operation: 'announcement_react', announcementId: state.announcement.id, emoji: state.reactions?.mine === emoji ? '' : emoji});
      if (!this.active(state) || epoch !== this.epoch) return;
      state.element.querySelector('.an72-people').hidden = true; ++state.peopleToken; await this.loadThread(state);
    } catch (error) { if (epoch === this.epoch) this.status(state, error.message); }
    finally {
      state.busy = false;
      if (this.active(state)) { this.renderReactions(state); state.draft = this.draft(state); this.renderComposer(state); }
    }
  },
  async people(state, emoji, offset = 0) {
    const host = state.element.querySelector('.an72-people'), token = ++state.peopleToken;
    if (!offset) { state.people = []; host.hidden = false; host.textContent = this.msg('Memuat pemberi reaksi…', 'Loading people…'); }
    try {
      const result = await this.api({operation: 'announcement_reactors', announcementId: state.announcement.id, emoji, offset});
      if (!this.active(state) || token !== state.peopleToken) return;
      state.people.push(...result.people);
      host.innerHTML = `<div class="an72-people-heading"><strong>${emoji} · ${result.total}</strong><button type="button" class="an72-small" data-close-people>${this.msg('Tutup', 'Close')}</button></div>${state.people.length ? `<ul>${state.people.map(person => `<li>${this.esc(person.name)}</li>`).join('')}</ul>` : `<p>${this.msg('Belum ada reaksi ini.', 'No one has used this reaction yet.')}</p>`}${result.nextOffset < result.total ? `<button type="button" class="an72-small" data-more-people>${this.msg('Lihat lagi', 'Show more')}</button>` : ''}`;
      host.querySelector('[data-close-people]').onclick = () => { ++state.peopleToken; host.hidden = true; };
      const more = host.querySelector('[data-more-people]'); if (more) more.onclick = () => this.people(state, emoji, result.nextOffset);
    } catch (error) { if (this.active(state) && token === state.peopleToken) host.textContent = error.message; }
  },
  draft(state) {
    const form = state.element.querySelector('.an72-composer');
    return form ? {body: form.elements.body.value, anonymous: form.elements.anonymous?.checked || false, displayName: form.elements.displayName?.value || ''} : state.draft || {};
  },
  time(iso) { return new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-GB' : 'id-ID', {timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short'}).format(new Date(iso)) + ' WIB'; },
  commentHTML(state, item, reply = false) {
    const deleted = !!item.deletedAt, hidden = item.hidden;
    return `<article class="an72-comment ${reply ? 'an72-reply' : ''} ${deleted || hidden ? 'an72-archived' : ''}"><div class="an72-comment-head"><strong>${item.isLecturer ? this.msg('Dosen', 'Lecturer') : this.esc(item.display)}</strong><time datetime="${this.esc(item.createdAt)}">${this.esc(this.time(item.createdAt))}</time></div>${state.owner && item.privateEmail ? `<small class="an72-private">${this.esc(item.privateName)} · ${this.esc(item.privateEmail)}</small>` : ''}<p>${this.esc(item.body)}</p><div class="an72-comment-actions">${!deleted && !hidden && state.commentsEnabled && (state.owner || state.student) ? `<button type="button" class="an72-small" data-reply="${this.esc(item.id)}">${this.msg('Balas', 'Reply')}</button>` : ''}${!deleted && (state.owner || item.mine && item.canDeleteUntil > Date.now() + (state.serverOffset || 0)) ? `<button type="button" class="an72-small" data-delete="${this.esc(item.id)}" data-until="${item.canDeleteUntil}">${this.msg('Hapus', 'Delete')}</button>` : ''}${state.owner && !deleted ? `<button type="button" class="an72-small" data-hide="${this.esc(item.id)}" data-hidden="${!hidden}">${this.msg(hidden ? 'Tampilkan' : 'Sembunyikan', hidden ? 'Show' : 'Hide')}</button>` : ''}${deleted || hidden ? `<span>${this.msg(deleted ? 'Dihapus' : 'Disembunyikan', deleted ? 'Deleted' : 'Hidden')}</span>` : ''}</div></article>`;
  },
  renderComments(state) {
    state.draft = this.draft(state);
    const host = state.element.querySelector('.an72-comments'), roots = state.comments.filter(item => !item.parentId);
    host.innerHTML = `<div class="an72-comments-heading"><h3>${this.msg('Komentar', 'Comments')} <span>${state.total}</span></h3><button type="button" class="an72-small" data-refresh>${this.msg('Muat ulang', 'Refresh')}</button></div><div class="an72-comment-list">${roots.map(root => this.commentHTML(state, root) + state.comments.filter(reply => reply.parentId === root.id).map(reply => this.commentHTML(state, reply, true)).join('')).join('') || `<p class="an72-empty">${this.msg('Belum ada komentar.', 'No comments yet.')}</p>`}</div>${state.nextOffset < state.total ? `<button type="button" class="an72-small" data-more-comments>${this.msg('Lihat komentar lainnya', 'More comments')} (${state.total - state.nextOffset})</button>` : ''}<div class="an72-composer-host"></div>`;
    host.querySelector('[data-refresh]').onclick = () => this.loadThread(state);
    host.querySelectorAll('[data-reply]').forEach(button => button.onclick = () => { state.draft = this.draft(state); state.replyTo = state.comments.find(item => item.id === button.dataset.reply); this.renderComposer(state); });
    host.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => this.moderate(state, button.dataset.delete, 'delete'));
    host.querySelectorAll('[data-hide]').forEach(button => button.onclick = () => this.moderate(state, button.dataset.hide, 'hide', button.dataset.hidden === 'true'));
    const more = host.querySelector('[data-more-comments]'); if (more) more.onclick = () => this.loadThread(state, true);
    this.renderComposer(state);
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
  async comment(event, state) {
    event.preventDefault(); if (state.busy) return;
    const draft = state.draft = this.draft(state), parentId = state.replyTo?.id || '', epoch = state.epoch;
    state.busy = true; this.renderComposer(state);
    try {
      await this.api({operation: 'announcement_comment', announcementId: state.announcement.id, body: draft.body, parentId, anonymous: draft.anonymous === true, displayName: draft.displayName || ''});
      if (!this.active(state) || epoch !== this.epoch) return;
      state.draft = {anonymous: draft.anonymous, displayName: draft.displayName}; state.replyTo = null;
      const form = state.element.querySelector('.an72-composer'); if (form) form.elements.body.value = '';
      await this.loadThread(state); this.status(state, this.msg('Komentar terkirim.', 'Comment posted.'));
    } catch (error) { if (epoch === this.epoch) this.status(state, error.message); }
    finally { state.busy = false; if (this.active(state)) { state.draft = this.draft(state); this.renderComposer(state); } }
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
