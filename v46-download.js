/* V47 — Download feedback after successful Guestbook submission.
 * The spinner appears ONLY beside "Your download is starting, please wait...".
 * The button shows "Preparing download..." without an icon or spinner.
 * A short reset means download was requested, NOT verified completed.
 */
(function () {
  'use strict';
  const selector = '#toolRequestFeedback a.v36-download-link, #toolRequestFeedback a[href][class*="download-link"]';
  const seen = new WeakSet();
  const FEEDBACK_MS = 4500;
  let scanning = false;

  function installStyles() {
    if (document.getElementById('v47-download-styles')) return;
    const style = document.createElement('style');
    style.id = 'v47-download-styles';
    style.textContent = `
      .v47-download-feedback {display:flex;align-items:center;gap:9px;flex-wrap:wrap;
        margin:0 0 11px;color:#175f5e;font-size:13px;line-height:1.45;font-weight:500;}
      .v47-download-feedback[hidden] {display:none !important;}
      .v47-download-spinner {display:inline-block;flex:none;width:17px;height:17px;
        border:2px solid rgba(21,114,108,.22);border-top-color:#15726c;
        border-radius:50%;animation:v47-download-spin .8s linear infinite;}
      @keyframes v47-download-spin {to{transform:rotate(360deg)}}
      @media(prefers-reduced-motion: reduce){.v47-download-spinner{animation:none}}
      button.v46-click-download:disabled {opacity:.85;cursor:wait !important;}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function triggerDownload(url) {
    let parsed;
    try { parsed = new URL(url, window.location.href); }
    catch (_) { return false; }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const isDrive = parsed.hostname === 'drive.google.com' &&
      parsed.pathname === '/uc' && parsed.searchParams.get('export') === 'download';
    if (isDrive) {
      // Preserve V46: request Google Drive download via hidden iframe.
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      frame.style.display = 'none';
      frame.src = parsed.href;
      document.body.appendChild(frame);
      window.setTimeout(() => { try { frame.remove(); } catch (_) {} }, 120000);
    } else {
      // Preserve V46: other hosts open their existing URL unchanged.
      const link = document.createElement('a');
      link.href = parsed.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    return true;
  }

  function enhance(root) {
    if (scanning) return;
    scanning = true;
    try {
      (root || document).querySelectorAll(selector).forEach(function (link) {
        if (seen.has(link)) return;
        seen.add(link);
        const url = link.href;
        let parsed;
        try { parsed = new URL(url); } catch (_) { return; }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;

        installStyles();
        const button = document.createElement('button');
        button.type = 'button';
        const originalText = link.textContent || 'Download';
        button.textContent = originalText;
        button.className = link.className + ' v46-click-download';
        button.style.cssText = 'cursor:pointer;font:inherit;text-decoration:none;border:0;border-radius:9px;padding:10px 16px;background:#197e79;color:#fff;font-weight:700;';
        button.setAttribute('aria-label', originalText);
        button.addEventListener('contextmenu', e => e.preventDefault());

        // Independent status line ABOVE the button; spinner is never on button.
        const status = document.createElement('div');
        status.className = 'v47-download-feedback';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.hidden = true;
        const spinner = document.createElement('span');
        spinner.className = 'v47-download-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        const statusText = document.createElement('span');
        statusText.textContent = 'Your download is starting, please wait...';
        status.append(spinner, statusText);

        const controls = document.createElement('div');
        controls.className = 'v47-download-controls';
        controls.append(status, button);

        let timer;
        function reset() {
          window.clearTimeout(timer);
          button.disabled = false;
          button.textContent = originalText;
          button.setAttribute('aria-label', originalText);
          button.removeAttribute('aria-busy');
          status.hidden = true;
        }
        button.addEventListener('click', function () {
          if (button.disabled) return;
          statusText.textContent = 'Your download is starting, please wait...';
          status.hidden = false;
          button.disabled = true;
          button.textContent = 'Preparing download...';
          button.setAttribute('aria-busy', 'true');
          let requested = false;
          try { requested = triggerDownload(url); } catch (_) { requested = false; }
          if (!requested) {
            reset();
            status.hidden = false;
            statusText.textContent = 'Unable to start download. Please try again.';
            spinner.style.display = 'none';
            return;
          }
          timer = window.setTimeout(reset, FEEDBACK_MS);
        });
        link.replaceWith(controls);
      });
    } finally { scanning = false; }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhance(document), { once: true });
  } else enhance(document);
  new MutationObserver(() => enhance(document)).observe(document.documentElement,
    { childList: true, subtree: true });
})();
