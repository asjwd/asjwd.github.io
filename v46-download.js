/* V46 — Convert a post-Guestbook download anchor into a click-only button.
 * No URLs are placed in HTML attributes; the click handler holds the URL.
 * This intentionally DOES NOT claim to prevent sharing of a URL after it is returned.
 */
(function () {
  'use strict';
  const selector = '#toolRequestFeedback a.v36-download-link, #toolRequestFeedback a[href][class*="download-link"]';
  const seen = new WeakSet();
  let scanning = false;

  function triggerDownload(url) {
    let parsed;
    try { parsed = new URL(url, window.location.href); }
    catch (_) { return; }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return;
    const isDrive = parsed.hostname === 'drive.google.com' &&
      parsed.pathname === '/uc' && parsed.searchParams.get('export') === 'download';
    if (isDrive) {
      // Request in a hidden frame: downloads generally start without leaving the page.
      // Google's large-file/interstitial checks can still block direct downloads.
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      frame.style.display = 'none';
      frame.src = parsed.href;
      document.body.appendChild(frame);
      window.setTimeout(() => { try { frame.remove(); } catch (_) {} }, 120000);
    } else {
      // For other hosts keep their existing URL; the browser/host chooses preview
      // versus attachment. This opens only after a user clicks the button.
      const link = document.createElement('a');
      link.href = parsed.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  function enhance(root) {
    if (scanning) return;
    scanning = true;
    try {
      (root || document).querySelectorAll(selector).forEach(function (link) {
        if (seen.has(link)) return;
        seen.add(link);
        const url = link.href;
        let u;
        try { u = new URL(url); } catch (_) { return; }
        if (!['http:', 'https:'].includes(u.protocol)) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = link.textContent || 'Download';
        button.className = link.className + ' v46-click-download';
        button.style.cssText = 'cursor:pointer;font:inherit;text-decoration:none;border:0;border-radius:9px;padding:10px 16px;background:#197e79;color:#fff;font-weight:700;';
        button.setAttribute('aria-label', button.textContent);
        button.addEventListener('click', () => triggerDownload(url));
        button.addEventListener('contextmenu', e => e.preventDefault());
        link.replaceWith(button);
      });
    } finally { scanning = false; }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhance(document), { once: true });
  } else enhance(document);
  new MutationObserver(() => enhance(document)).observe(document.documentElement,
    { childList: true, subtree: true });
})();
