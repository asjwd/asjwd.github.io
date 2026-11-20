/* V76 — Static GitHub Pages portfolio reader. Keep Apps Script as failover. */
(function () {
  'use strict';
  if (typeof SITE === 'undefined' || !SITE || typeof SITE.read !== 'function') return;
  const previousRead = SITE.read.bind(SITE);
  const STATIC_PATH = '/data/portfolio.json';
  SITE.read = function (kind, board) {
    if (kind !== 'portfolio') return previousRead(kind, board);
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 4500) : null;
    return fetch(STATIC_PATH, {
      cache: 'no-cache',
      credentials: 'omit',
      ...(controller ? { signal: controller.signal } : {})
    }).then(response => {
      if (!response.ok) throw Error('Static portfolio HTTP ' + response.status);
      return response.json();
    }).then(data => {
      if (!data || !data.profile || typeof data.profile !== 'object' || !Array.isArray(data.experiences)) {
        throw Error('Static portfolio schema invalid');
      }
      if (data._v76 && data._v76.kind !== 'portfolio') throw Error('Unexpected static data kind');
      if (window.console && console.info) console.info('[V76] Portfolio loaded from GitHub Pages');
      return data;
    }).catch(error => {
      if (window.console && console.warn) console.warn('[V76] Falling back to Apps Script:', error.message);
      return previousRead(kind, board);
    }).finally(() => { if (timer) clearTimeout(timer); });
  };
})();
