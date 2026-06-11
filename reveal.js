(function () {
  'use strict';

  function reveal(el) { el.classList.add('visible'); }

  function init() {
    var elements = document.querySelectorAll('.reveal:not(.visible)');
    if (!elements.length) return;

    // Failsafe: alles im initialen Viewport sofort sichtbar
    var vh = window.innerHeight || document.documentElement.clientHeight;
    elements.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh + 40) reveal(el);
    });

    // IntersectionObserver für den Rest
    if (!('IntersectionObserver' in window)) {
      elements.forEach(reveal); // alter Browser: alles direkt sichtbar
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          reveal(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 60px 0px' });

    document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
      obs.observe(el);
    });

    // Staggered delays (max 5 Schritte, danach kein delay)
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      if (!el.style.transitionDelay) {
        el.style.transitionDelay = (i % 5 * 0.06) + 's';
      }
    });
  }

  function start() {
    init();
    setTimeout(init, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.BSFReveal = { run: init };
})();
