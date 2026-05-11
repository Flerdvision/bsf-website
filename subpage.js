/**
 * subpage.js – Central JS hub for all Camping Sulmsee subpages.
 * Handles: scroll progress, nav, mobile menu, rich scroll reveals,
 *          hero entrance, ticker, testimonial carousel, CTA banner.
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
    var content = document.querySelector('.ph-content');
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

    // Group by parent for stagger
    var groups = {};
    elements.forEach(function (el) {
      var parent = el.parentElement;
      var key = parent ? (parent.className || 'root') + parent.childElementCount : 'solo';
      if (!groups[key]) groups[key] = [];
      groups[key].push(el);
    });

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
      if (el.classList.contains('reveal')) return; // already tagged by inline JS
      el.classList.add('reveal');
      el.style.transitionDelay = (globalIdx % 8 * 0.065) + 's';
      obs.observe(el);
      globalIdx++;
    });

    // Immediate reveal for elements already in viewport
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('visible');
      });
    }, 100);
  }

  /* ── TICKER ─────────────────────────────────────────────────── */
  function injectTicker() {
    var hero = document.querySelector('.page-hero-photo');
    if (!hero || document.querySelector('.sub-ticker')) return;
    var items = [
      '88 Stellplätze direkt am See',
      '24 Seeufer-Plätze · Direkter Wasserzugang',
      'Perfekt für Familien mit Kindern & Hunden',
      'Saison: 17. April – 26. Oktober 2026',
      'Kostenfreies WLAN · Moderne Sanitäranlagen',
      'eBike-Verleih · Weinberge · Buschenschanken'
    ];
    var html = '<div class="sub-ticker"><div class="ticker-track">';
    for (var r = 0; r < 2; r++) {
      items.forEach(function (t) {
        html += '<span class="ticker-item"><span class="tdot"></span>' + t + '</span>';
      });
    }
    html += '</div></div>';
    hero.insertAdjacentHTML('afterend', html);
  }

  /* ── REVIEWS DATA ───────────────────────────────────────────── */
  var REVIEWS = [
    {text: 'Unser absoluter Lieblingsplatz! Die Kinder lieben den direkten Seezugang und wir genießen die Ruhe der Weinberge. Werden jedes Jahr wiederkommen.', name: 'Familie Hofer', loc: 'Wien', date: 'September 2025', ini: 'FH', col: '#3d7a5c'},
    {text: 'Traumhafter Campingplatz in wunderschöner Lage. Sanitäranlagen sind modern und blitzsauber, das WLAN funktioniert überall einwandfrei. Top Organisation!', name: 'Markus & Julia B.', loc: 'Graz', date: 'August 2025', ini: 'MJ', col: '#8b5e3c'},
    {text: 'Der Seeufer-Stellplatz war ein absoluter Traum – morgens mit Seeblick aufwachen ist einfach unbezahlbar. Die eBikes für Weinberg-Touren sind perfekt.', name: 'Thomas K.', loc: 'München', date: 'Juli 2025', ini: 'TK', col: '#5c7a3d'},
    {text: 'Wir waren zum dritten Mal hier und es wird immer besser. Das Team ist herzlich, der Platz gepflegt und die Lage einfach unvergleichlich schön.', name: 'Familie Müller', loc: 'Linz', date: 'Juni 2025', ini: 'FM', col: '#7a3d5c'},
    {text: 'Als Hundebesitzerin war ich begeistert – überall willkommen, herrliche Wanderwege direkt ab Platz. Die Buschenschanken in den Weinbergen sind Highlight!', name: 'Sandra P.', loc: 'Salzburg', date: 'Mai 2025', ini: 'SP', col: '#3d5c7a'},
    {text: 'Perfekte Familienatmosphäre, tolle Infrastruktur und ein See, der zum Baden einlädt. Unsere Kinder hatten die beste Zeit. Klare Weiterempfehlung!', name: 'Andreas & Maria R.', loc: 'Klagenfurt', date: 'August 2025', ini: 'AR', col: '#7a5c3d'},
    {text: 'Die Weinstraße direkt vor der Tür, der See gleich daneben – Camping Sulmsee verbindet Natur, Kulinarik und Entspannung auf einzigartige Weise.', name: 'Petra & Hans W.', loc: 'Innsbruck', date: 'September 2025', ini: 'PW', col: '#4a7a5c'},
    {text: 'Ruhig, sauber, wunderschön gelegen. Der Platz am See ist jeden Euro wert. Die Betreiber sind sehr freundlich und immer zur Hilfe bereit.', name: 'Klaus & Monika F.', loc: 'Stuttgart', date: 'Juli 2025', ini: 'KF', col: '#5c3d7a'}
  ];

  /* ── TESTIMONIAL CAROUSEL ───────────────────────────────────── */
  function injectCarousel() {
    var footer = document.querySelector('footer');
    if (!footer || document.querySelector('.ts-section')) return;

    var cards = REVIEWS.map(function (r) {
      return '<div class="ts-card">' +
        '<div class="ts-stars">★★★★★</div>' +
        '<p class="ts-text">' + r.text + '</p>' +
        '<div class="ts-author">' +
          '<div class="ts-av" style="background:' + r.col + '">' + r.ini + '</div>' +
          '<div><div class="ts-name">' + r.name + ' <span style="font-weight:400;color:rgba(255,255,255,.45)">· ' + r.loc + '</span></div>' +
          '<div class="ts-date">' + r.date + '</div></div>' +
        '</div></div>';
    }).join('');

    var html =
      '<section class="ts-section">' +
        '<div class="ts-inner">' +
          '<div class="ts-header">' +
            '<div class="section-tag">Gästestimmen</div>' +
            '<h2 class="section-title">Was unsere Gäste <em style="font-style:italic;color:#c49a6c">sagen</em></h2>' +
            '<p class="section-sub">Echte Erfahrungen – von Familien aus ganz Europa.</p>' +
          '</div>' +
          '<div class="ts-viewport"><div class="ts-track" id="ts-track">' + cards + '</div></div>' +
          '<div class="ts-controls">' +
            '<button class="ts-arr" id="ts-prev">&#8592;</button>' +
            '<div class="ts-dots" id="ts-dots"></div>' +
            '<button class="ts-arr" id="ts-next">&#8594;</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    footer.insertAdjacentHTML('beforebegin', html);
    initCarousel();
  }

  function initCarousel() {
    var track = document.getElementById('ts-track');
    var prev  = document.getElementById('ts-prev');
    var next  = document.getElementById('ts-next');
    var wrap  = document.getElementById('ts-dots');
    if (!track || !prev || !next || !wrap) return;

    var cards = track.querySelectorAll('.ts-card');
    var total = cards.length;
    var getVis = function () { return window.innerWidth > 900 ? 3 : window.innerWidth > 600 ? 2 : 1; };
    var vis = getVis();
    var max = Math.max(0, total - vis);
    var cur = 0, timer = null;

    for (var i = 0; i <= max; i++) {
      var dot = document.createElement('button');
      dot.className = 'ts-dot' + (i === 0 ? ' active' : '');
      (function (idx) { dot.addEventListener('click', function () { go(idx); reset(); }); })(i);
      wrap.appendChild(dot);
    }

    function go(idx) {
      cur = Math.max(0, Math.min(idx, max));
      var w = cards[0].offsetWidth + 21;
      track.style.transform = 'translateX(' + (-cur * w) + 'px)';
      wrap.querySelectorAll('.ts-dot').forEach(function (d, i) { d.classList.toggle('active', i === cur); });
    }
    function reset() {
      clearInterval(timer);
      timer = setInterval(function () { go(cur < max ? cur + 1 : 0); }, 4500);
    }

    prev.addEventListener('click', function () { go(cur > 0 ? cur - 1 : max); reset(); });
    next.addEventListener('click', function () { go(cur < max ? cur + 1 : 0); reset(); });

    var sx = 0;
    track.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].screenX; }, {passive: true});
    track.addEventListener('touchend', function (e) {
      var d = sx - e.changedTouches[0].screenX;
      if (Math.abs(d) > 40) { go(d > 0 ? cur + 1 : cur - 1); reset(); }
    }, {passive: true});

    window.addEventListener('resize', function () {
      vis = getVis(); max = Math.max(0, total - vis); go(Math.min(cur, max));
    });

    go(0); reset();
  }

  /* ── CTA BANNER ─────────────────────────────────────────────── */
  function injectCTA() {
    var ts = document.querySelector('.ts-section');
    if (!ts || document.querySelector('.sp-cta')) return;
    var imgs = ['sulmsee_sommer21-25.jpg', 'Campingplatz2.jpg', 'sulmsee_sommer21-3.jpg'];
    var bg = imgs[Math.floor(Math.random() * imgs.length)];
    var html =
      '<div class="sp-cta">' +
        '<div class="sp-cta-bg" style="background-image:url(\'' + bg + '\')"></div>' +
        '<div class="sp-cta-overlay"></div>' +
        '<div class="sp-cta-content">' +
          '<div class="section-tag" style="color:var(--el);justify-content:center;margin-bottom:1rem">' +
            '<span style="width:24px;height:2px;background:var(--el);border-radius:2px;display:inline-block;margin-right:8px;vertical-align:middle"></span>Jetzt Platz sichern' +
          '</div>' +
          '<h2>Ihr Traumurlaub am<br><em>Sulmsee</em> wartet</h2>' +
          '<p>Saisonstart 17. April 2026 – sichern Sie sich jetzt Ihren Wunsch-Stellplatz. Die besten Seeufer-Plätze sind schnell vergeben.</p>' +
          '<div class="sp-cta-btns">' +
            '<button class="btn btn-green" onclick="openBooking()" style="font-size:.95rem;padding:.9rem 2.2rem">🗓 Stellplatz anfragen</button>' +
            '<a href="kontakt.html" class="btn btn-outline">Fragen? Kontakt</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    ts.insertAdjacentHTML('beforebegin', html);
  }

  /* ── INIT ──────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    animateHero();
    injectTicker();
    injectCarousel();
    injectCTA();
    // Slight delay so inline scroll reveal doesn't double-tag
    setTimeout(initReveal, 50);
  }
})();
