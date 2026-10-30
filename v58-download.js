/* V58 - Guestbook download requests: 60-second cooldown and explicit retry.
 * Browser downloads from Google Drive cannot be verified from another origin.
 * Primary method retains V55 hidden iframe behavior. On retry a user gesture
 * opens the real URL in a new tab, allowing Drive to display confirmations.
 * All retry attempts reuse the already-authorized Guestbook URL; no new POST.
 */
(function () {
  'use strict';
  const selector = '#toolRequestFeedback a.v36-download-link, #toolRequestFeedback a[href][class*="download-link"]';
  const seen = new WeakSet();
  const states = window.pm58DownloadStates || (window.pm58DownloadStates = new Map());
  const COOLDOWN_MS = 60000;
  const isEnglish = () => document.documentElement.lang === 'en';
  const word = (id, en) => isEnglish() ? en : id;
  let scanning = false;

  function installStyles() {
    if (document.getElementById('pm58-download-styles')) return;
    const style = document.createElement('style');
    style.id = 'pm58-download-styles';
    style.textContent = `
      .pm58-download-feedback {display:flex;gap:9px;align-items:flex-start;flex-wrap:wrap;
        margin:0 0 12px;color:#175f5e;font-size:13px;line-height:1.55;font-weight:500;}
      .pm58-download-feedback[hidden],.pm58-click-download[hidden],.pm58-retry-download[hidden]{display:none!important}
      .pm58-download-spinner{display:inline-block;flex:0 0 auto;width:16px;height:16px;
        margin-top:2px;border:2px solid rgba(21,114,108,.22);border-top-color:#15726c;
        border-radius:50%;animation:pm58-spin .8s linear infinite}
      .pm58-download-spinner[hidden]{display:none!important}
      @keyframes pm58-spin{to{transform:rotate(360deg)}}
      @media(prefers-reduced-motion:reduce){.pm58-download-spinner{animation:none}}
      .pm58-download-controls{display:block;width:100%;max-width:100%}
      .pm58-click-download,.pm58-retry-download{display:inline-block;cursor:pointer;
        font:inherit;text-decoration:none;border:0;border-radius:9px;padding:10px 16px;
        background:#197e79;color:#fff;font-weight:700;line-height:1.4}
      .pm58-click-download:disabled,.pm58-retry-download:disabled{opacity:.65;cursor:wait}
      .pm58-retry-download{margin-top:6px;background:#f0f7f7;border:1px solid #a9d0cf;
        color:#125f5d}
      .pm58-countdown{font-variant-numeric:tabular-nums;font-weight:750}
    `;
    document.head.appendChild(style);
  }
  function parseURL(url) {
    try {
      const u = new URL(url, location.href);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
      return u;
    } catch (_) { return null; }
  }
  function triggerPrimary(url) {
    const u = parseURL(url);
    if (!u) return false;
    if (u.hostname === 'drive.google.com' && u.pathname === '/uc' && u.searchParams.get('export') === 'download') {
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      frame.style.display = 'none';
      frame.src = u.href;
      document.body.appendChild(frame);
      setTimeout(() => { try { frame.remove(); } catch (_) {} }, 120000);
    } else {
      const anchor = document.createElement('a');
      anchor.href = u.href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
    return true;
  }
  function triggerRetry(url) {
    const u = parseURL(url);
    if (!u) return false;
    // This runs synchronously from a real button click, not from a timer.
    // Open an actual top-level browsing context instead of an invisible iframe.
    const anchor = document.createElement('a');
    anchor.href = u.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  }
  function enhance(root) {
    if (scanning) return;
    scanning = true;
    try {
      (root || document).querySelectorAll(selector).forEach(link => {
        if (seen.has(link)) return;
        seen.add(link);
        const url = link.href;
        if (!parseURL(url)) return;
        installStyles();
        const key = String(link.dataset.downloadResource || url);
        const originalText = link.textContent || 'Download';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pm58-click-download';
        button.textContent = originalText;
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'pm58-retry-download';
        retry.hidden = true;
        const status = document.createElement('div');
        status.className = 'pm58-download-feedback';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.hidden = true;
        const spinner = document.createElement('span');
        spinner.className = 'pm58-download-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        spinner.hidden = true;
        const statusText = document.createElement('span');
        status.append(spinner, statusText);
        const controls = document.createElement('div');
        controls.className = 'pm58-download-controls';
        controls.append(status, button, retry);
        let ticker = null;
        const stopTick = () => { if (ticker !== null) { clearInterval(ticker); ticker = null; } };
        function display() {
          if (!controls.isConnected) { stopTick(); return; }
          const state = states.get(key);
          if (!state) return;
          spinner.hidden = true;
          status.hidden = false;
          button.hidden = true;
          const left = Math.max(0, Math.ceil((state.retryAt - Date.now()) / 1000));
          if (left > 0) {
            statusText.textContent = word(
              `Permintaan unduhan telah dikirim. Mohon tunggu browser Anda memproses file. Jika unduhan tidak dimulai, silakan coba kembali dalam ${left} detik. Anda dapat menutup popup ini.`,
              `The download request has been sent. Please allow your browser to process the file. If the download does not start, you can try again in ${left} seconds. You may close this popup.`
            );
            // Countdown is visible but does not flood screen reader announcements.
            status.setAttribute('aria-live', 'off');
            retry.hidden = true;
          } else {
            statusText.textContent = word(
              'Permintaan unduhan telah dikirim. Mohon tunggu browser Anda memproses file. Jika unduhan tidak dimulai, gunakan tombol Coba unduh lagi. Anda dapat menutup popup ini.',
              'The download request has been sent. Please allow your browser to process the file. If it does not start, use Try downloading again. You may close this popup.'
            );
            retry.textContent = word('↻ Coba unduh lagi', '↻ Try downloading again');
            retry.hidden = false;
            status.setAttribute('aria-live', 'polite');
            stopTick();
          }
        }
        function beginCooldown() {
          states.set(key, {retryAt: Date.now() + COOLDOWN_MS});
          display();
          stopTick();
          ticker = setInterval(display, 250);
        }
        button.addEventListener('click', () => {
          if (button.disabled || states.has(key)) return;
          button.disabled = true;
          button.textContent = word('Menyiapkan unduhan...', 'Preparing download...');
          button.setAttribute('aria-busy', 'true');
          statusText.textContent = word('Unduhan sedang disiapkan, mohon tunggu...', 'Your download is starting, please wait...');
          status.hidden = false;
          spinner.hidden = false;
          let requested = false;
          try { requested = triggerPrimary(url); } catch (_) {}
          if (requested) beginCooldown();
          else {
            spinner.hidden = true;
            statusText.textContent = word('Unduhan tidak dapat dimulai. Silakan coba lagi.', 'The download could not be started. Please try again.');
            button.disabled = false;
            button.textContent = originalText;
            button.removeAttribute('aria-busy');
          }
        });
        retry.addEventListener('click', () => {
          if (retry.disabled || Date.now() < (states.get(key)?.retryAt || 0)) return;
          let requested = false;
          try { requested = triggerRetry(url); } catch (_) {}
          if (requested) beginCooldown();
          else {
            statusText.textContent = word('Gagal membuka unduhan. Silakan coba lagi.', 'Unable to open the download. Please try again.');
          }
        });
        link.replaceWith(controls);
        if (states.has(key)) {
          display();
          if (Date.now() < states.get(key).retryAt) ticker = setInterval(display, 250);
        }
      });
    } finally { scanning = false; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => enhance(document), { once: true });
  else enhance(document);
  new MutationObserver(() => enhance(document)).observe(document.documentElement, {childList:true,subtree:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) enhance(document); });
})();
