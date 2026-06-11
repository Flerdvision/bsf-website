// BSF Consulting AG – i18n Module
(function () {
  'use strict';

  var SUPPORTED = ['de', 'en', 'tr'];
  var DEFAULT = 'de';

  function detectLang() {
    var path = window.location.pathname;
    var match = path.match(/^\/(en|tr)(\/|$)/);
    if (match) return match[1];
    try {
      var stored = localStorage.getItem('bsf.lang');
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    } catch (e) {}
    return DEFAULT;
  }

  function resolve(obj, key) {
    var parts = key.replace(/\[(\d+)\]/g, '.$1').split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = resolve(dict, key);
      if (typeof val !== 'string') {
        el.setAttribute('data-i18n-missing', '');
        return;
      }
      el.removeAttribute('data-i18n-missing');

      if (val.indexOf('__TT__') === 0) {
        val = val.replace(/^__TT__\s*/, '').trim();
        el.setAttribute('data-i18n-todo', '');
        el.title = 'Translation pending';
      } else {
        el.removeAttribute('data-i18n-todo');
      }

      // Immer innerHTML: erhält Inline-Tags (em/strong/br/a) UND dekodiert
      // HTML-Entities (z. B. M&amp;A), die in extrahierten Quelltexten vorkommen.
      el.innerHTML = val;
    });

    // Attribute translations: data-i18n-attr="placeholder:key, aria-label:key2"
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var parts = pair.trim().split(':');
        if (parts.length < 2) return;
        var attr = parts[0].trim();
        var key = parts.slice(1).join(':').trim();
        var v = resolve(dict, key);
        if (typeof v === 'string') {
          el.setAttribute(attr, v.replace(/^__TT__\s*/, '').trim());
        }
      });
    });

    document.documentElement.setAttribute('lang', dict.lang || DEFAULT);
    document.body.setAttribute('data-lang-loaded', dict.lang || DEFAULT);
    window.__i18nDict = dict;
    document.dispatchEvent(new CustomEvent('i18n:loaded', { detail: dict }));
  }

  function setupSwitcher(currentLang) {
    document.querySelectorAll('[data-lang-switch]').forEach(function (btn) {
      var target = btn.getAttribute('data-lang-switch');
      if (target === currentLang) btn.classList.add('active');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (target === currentLang) return;
        try { localStorage.setItem('bsf.lang', target); } catch (e2) {}
        window.location.reload();
      });
    });
  }

  function init() {
    var lang = detectLang();

    // file:// fallback: fetch won't work — show default text, wire up switcher
    if (window.location.protocol === 'file:') {
      setupSwitcher(lang);
      return; // translations require a server; run via: node server.js
    }

    fetch('i18n/' + lang + '.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (dict) {
        applyTranslations(dict);
        setupSwitcher(lang);
      })
      .catch(function (err) {
        console.error('[i18n] Failed to load', lang, err);
        if (lang !== DEFAULT) {
          fetch('i18n/' + DEFAULT + '.json')
            .then(function (r) { return r.json(); })
            .then(function (dict) {
              applyTranslations(dict);
              setupSwitcher(DEFAULT);
            })
            .catch(function () {});
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.BSFi18n = { detectLang: detectLang, resolve: resolve };
})();
