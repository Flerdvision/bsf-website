/**
 * subpage.js – BSF Consulting AG: central JS for all subpages.
 * Handles: scroll progress, nav scroll state, hero entrance, scroll reveal.
 */
(function () {
  'use strict';

  /* ── SCROLL PROGRESS ───────────────────────────────────────── */
  var bar = document.getElementById('scroll-progress');
  if (bar) {
    window.addEventListener('scroll', function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
    }, {passive: true});
  }

  /* ── NAV SCROLLED ──────────────────────────────────────────── */
  var nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, {passive: true});
  }

  /* ── HERO ENTRANCE ─────────────────────────────────────────── */
  function animateHero() {
    var content = document.querySelector('.hero-content');
    if (!content) return;
    var children = content.children;
    for (var i = 0; i < children.length; i++) {
      (function (el, idx) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(26px)';
        el.style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)';
        el.style.transitionDelay = (idx * 0.12) + 's';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            el.style.opacity = '1';
            el.style.transform = 'none';
          });
        });
      })(children[i], i);
    }
  }

  /* ── RICH SCROLL REVEAL ────────────────────────────────────── */
  function initReveal() {
    var SELECTORS = [
      '.spot-card', '.act-card', '.rev-card', '.route-card', '.ci-card',
      '.am', '.faq-item', '.section-tag', '.section-title', '.section-sub',
      '.price-incl', '.checkin-row', '.ps-item', '.wine-band',
      '.amenity-feat', '.stat-pill', '.ppanel-head', '.stabs',
      '.addr-box', '.map-iframe-wrap', '.photo-strip',
      '.contact-form-wrap', '.sp-body', '.sp-img',
      '.ts-header .section-tag', '.ts-header .section-title', '.ts-header .section-sub'
    ];

    var elements = document.querySelectorAll(SELECTORS.join(','));
    if (!elements.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, {threshold: 0.06, rootMargin: '0px 0px 60px 0px'});

    var globalIdx = 0;
    elements.forEach(function (el) {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      el.style.transitionDelay = (globalIdx % 8 * 0.065) + 's';
      obs.observe(el);
      globalIdx++;
    });

    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('visible');
      });
    }, 100);
  }

  /* ── INIT ──────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    animateHero();
    setTimeout(initReveal, 50);
  }
})();
