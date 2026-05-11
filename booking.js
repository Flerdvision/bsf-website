/**
 * Camping Sulmsee – 5-Step Booking Wizard
 * Auto-injects modal into page, handles navigation & submission
 */
(function () {
  'use strict';

  /* ── State ─────────────────────────────────────────── */
  var BK = { adults: 2, kids: 0, spot: '', vehicle: 'Wohnmobil', extras: [] };
  var currentStep = 1;

  /* ── Modal HTML ─────────────────────────────────────── */
  var MODAL_HTML = [
    '<div class="modal-bg" id="bookingModal">',
    '<div class="modal bk-modal">',

    /* header */
    '<div class="modal-header">',
    '<div><h2 class="bk-headline">Stellplatz anfragen</h2>',
    '<p class="bk-subtitle">Camping Sulmsee &middot; Saison 2026</p></div>',
    '<button class="modal-close" onclick="closeBooking()">&#x2715;</button>',
    '</div>',

    /* step progress */
    '<div class="bk-progress" id="bk-progress">',
    '<div class="bk-steps">',
    '<div class="bk-step active" id="bkstep-1"><div class="bk-step-dot">1</div><div class="bk-step-lbl">Zeitraum</div></div>',
    '<div class="bk-step-line"></div>',
    '<div class="bk-step" id="bkstep-2"><div class="bk-step-dot">2</div><div class="bk-step-lbl">Stellplatz</div></div>',
    '<div class="bk-step-line"></div>',
    '<div class="bk-step" id="bkstep-3"><div class="bk-step-dot">3</div><div class="bk-step-lbl">Reisende</div></div>',
    '<div class="bk-step-line"></div>',
    '<div class="bk-step" id="bkstep-4"><div class="bk-step-dot">4</div><div class="bk-step-lbl">Kontakt</div></div>',
    '<div class="bk-step-line"></div>',
    '<div class="bk-step" id="bkstep-5"><div class="bk-step-dot">5</div><div class="bk-step-lbl">&Uuml;bersicht</div></div>',
    '</div>',
    '</div>',

    /* body */
    '<div class="modal-body bk-body">',

    /* ── STEP 1: Zeitraum ──────────────────── */
    '<div class="bk-panel active" id="bk-p1">',
    '<h3 class="bk-ptitle">Wann m&ouml;chten Sie reisen?</h3>',
    '<p class="bk-psub">W&auml;hlen Sie Ihren An- und Abreisetag f&uuml;r die Saison 2026.</p>',
    '<div class="form-row">',
    '<div class="form-group"><label>Anreise *</label>',
    '<input type="date" id="bk-arrival" min="2026-04-17" max="2026-10-26" oninput="bkUpdateNights()"></div>',
    '<div class="form-group"><label>Abreise *</label>',
    '<input type="date" id="bk-departure" min="2026-04-18" max="2026-10-26" oninput="bkUpdateNights()"></div>',
    '</div>',
    '<div id="bk-nights-badge" class="bk-nights-badge" style="display:none"></div>',
    '<div class="season-hint" style="margin-top:1rem">',
    '&#x1F331; Saison 17.&nbsp;April &ndash; 26.&nbsp;Oktober 2026 &middot; Mindestaufenthalt 2&nbsp;N&auml;chte',
    '</div>',
    '</div>',

    /* ── STEP 2: Stellplatz ────────────────── */
    '<div class="bk-panel" id="bk-p2">',
    '<h3 class="bk-ptitle">Welchen Stellplatz bevorzugen Sie?</h3>',
    '<p class="bk-psub">W&auml;hlen Sie aus unseren zwei Platzkategorien.</p>',
    '<div class="spot-selector" id="bk-spot-opts">',
    '<div class="spot-opt" data-spot="see" onclick="bkSelectSpot(this)">',
    '<div class="bk-spot-icon">&#x1F30A;</div>',
    '<div class="spot-opt-name">Sulmsee-Stellplatz</div>',
    '<div class="spot-opt-desc">Direkt am Seeufer mit direktem Wasserzugang und Seeblick. Pl&auml;tze 1&ndash;24.</div>',
    '<div class="spot-opt-price">ab &euro;&nbsp;36,&ndash; / Nacht</div>',
    '</div>',
    '<div class="spot-opt" data-spot="silber" onclick="bkSelectSpot(this)">',
    '<div class="bk-spot-icon">&#x1F33F;</div>',
    '<div class="spot-opt-name">Silbersee-Stellplatz</div>',
    '<div class="spot-opt-desc">Ruhige Lage im Gr&uuml;nen mit Blick in die Weinberge. Pl&auml;tze 25&ndash;88.</div>',
    '<div class="spot-opt-price">ab &euro;&nbsp;28,&ndash; / Nacht</div>',
    '</div>',
    '</div>',
    '</div>',

    /* ── STEP 3: Reisende ──────────────────── */
    '<div class="bk-panel" id="bk-p3">',
    '<h3 class="bk-ptitle">Wer reist mit?</h3>',
    '<p class="bk-psub">Anzahl der Reisenden und Ihr Fahrzeug.</p>',
    '<div class="form-row" style="margin-bottom:1.2rem">',
    '<div class="form-group"><label>Erwachsene</label>',
    '<div class="stepper">',
    '<button class="stepper-btn" type="button" onclick="bkAdj(\'adults\',-1)">&#x2212;</button>',
    '<div class="stepper-val" id="bk-adults-val">2</div>',
    '<button class="stepper-btn" type="button" onclick="bkAdj(\'adults\',1)">+</button>',
    '</div></div>',
    '<div class="form-group"><label>Kinder (bis 14&nbsp;J.)</label>',
    '<div class="stepper">',
    '<button class="stepper-btn" type="button" onclick="bkAdj(\'kids\',-1)">&#x2212;</button>',
    '<div class="stepper-val" id="bk-kids-val">0</div>',
    '<button class="stepper-btn" type="button" onclick="bkAdj(\'kids\',1)">+</button>',
    '</div></div>',
    '</div>',
    '<div class="form-group"><label>Fahrzeug / Unterkunft</label>',
    '<select id="bk-vehicle">',
    '<option value="Wohnmobil">Wohnmobil</option>',
    '<option value="Caravan">Caravan / Wohnwagen</option>',
    '<option value="Zelt">Zelt</option>',
    '<option value="Motorrad">Motorrad</option>',
    '<option value="PKW">PKW mit Dachzelt</option>',
    '</select></div>',
    '<div class="extras-grid">',
    '<div class="extra-opt" data-extra="eBike-Verleih" onclick="bkToggleExtra(this)">',
    '<div class="extra-icon">&#x1F6B2;</div>',
    '<div><div class="extra-name">eBike-Verleih</div><div class="extra-price">&euro;&nbsp;25,&ndash; / Tag</div></div>',
    '</div>',
    '<div class="extra-opt" data-extra="Hund" onclick="bkToggleExtra(this)">',
    '<div class="extra-icon">&#x1F415;</div>',
    '<div><div class="extra-name">Hund mitbringen</div><div class="extra-price">&euro;&nbsp;3,&ndash; / Nacht</div></div>',
    '</div>',
    '</div>',
    '</div>',

    /* ── STEP 4: Kontakt ───────────────────── */
    '<div class="bk-panel" id="bk-p4">',
    '<h3 class="bk-ptitle">Ihre Kontaktdaten</h3>',
    '<p class="bk-psub">Damit wir Ihre Anfrage bearbeiten k&ouml;nnen.</p>',
    '<div class="form-row">',
    '<div class="form-group"><label>Vorname *</label><input type="text" id="bk-fname" placeholder="Max" autocomplete="given-name"></div>',
    '<div class="form-group"><label>Nachname *</label><input type="text" id="bk-lname" placeholder="Muster" autocomplete="family-name"></div>',
    '</div>',
    '<div class="form-row">',
    '<div class="form-group"><label>E-Mail *</label><input type="email" id="bk-email" placeholder="max@beispiel.at" autocomplete="email"></div>',
    '<div class="form-group"><label>Telefon</label><input type="tel" id="bk-phone" placeholder="+43 ..." autocomplete="tel"></div>',
    '</div>',
    '<div class="form-group"><label>Nachricht / Sonderw&uuml;nsche</label>',
    '<textarea id="bk-msg" style="min-height:90px" placeholder="Besondere W&uuml;nsche oder Fragen &hellip;"></textarea>',
    '</div>',
    '</div>',

    /* ── STEP 5: Übersicht ─────────────────── */
    '<div class="bk-panel" id="bk-p5">',
    '<h3 class="bk-ptitle">Ihre Anfrage im &Uuml;berblick</h3>',
    '<p class="bk-psub">Bitte &uuml;berpr&uuml;fen Sie Ihre Angaben.</p>',
    '<div class="booking-summary" id="bk-summary"></div>',
    '<p style="font-size:.75rem;color:var(--tl);text-align:center;margin-top:.5rem">* Best&auml;tigung innerhalb von 24&nbsp;Stunden per E-Mail</p>',
    '</div>',

    /* ── Success screen ─────────────────────── */
    '<div class="bk-success-screen" id="bk-success" style="display:none">',
    '<div style="font-size:3.5rem;margin-bottom:1rem">&#x2705;</div>',
    '<h3 style="font-family:\'Lora\',serif;font-size:1.6rem;color:var(--f);margin-bottom:.5rem">Anfrage eingegangen!</h3>',
    '<p style="color:var(--tm);line-height:1.8;max-width:380px;margin:0 auto 1.5rem">Vielen Dank, <strong id="bk-success-name"></strong>! Ihre Buchungsanfrage wurde gespeichert. Wir melden uns innerhalb von 24&nbsp;Stunden per E-Mail bei Ihnen.</p>',
    '<button class="btn btn-green" onclick="closeBooking()">Schlie&szlig;en</button>',
    '</div>',

    '</div>', /* /bk-body */

    /* footer */
    '<div class="modal-footer" id="bk-footer">',
    '<button class="modal-nav-btn" id="bk-back" onclick="bkPrev()" style="visibility:hidden">&#x2190; Zur&uuml;ck</button>',
    '<span id="bk-step-count" style="font-size:.78rem;color:var(--tl);font-weight:600">Schritt 1 von 5</span>',
    '<button class="modal-next-btn" id="bk-next" onclick="bkNext()">Weiter &#x2192;</button>',
    '</div>',

    '</div>', /* /bk-modal */
    '</div>'  /* /modal-bg */
  ].join('\n');

  /* ── Init ───────────────────────────────────────────── */
  function init() {
    if (document.getElementById('bookingModal')) return;
    document.body.insertAdjacentHTML('afterbegin', MODAL_HTML);
    document.getElementById('bookingModal').addEventListener('click', function (e) {
      if (e.target === this) closeBooking();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API ─────────────────────────────────────── */
  window.openBooking = function () {
    init();
    resetBooking();
    document.getElementById('bookingModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeBooking = function () {
    var m = document.getElementById('bookingModal');
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
  };

  /* ── Step Navigation ────────────────────────────────── */
  window.bkNext = function () {
    if (!bkValidate(currentStep)) return;
    if (currentStep === 4) bkBuildSummary();
    if (currentStep < 5) {
      goToStep(currentStep + 1);
    } else {
      bkSubmit();
    }
  };

  window.bkPrev = function () {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  function goToStep(n) {
    for (var i = 1; i <= 5; i++) {
      var s = document.getElementById('bkstep-' + i);
      if (!s) continue;
      s.classList.remove('active', 'done');
      if (i < n) s.classList.add('done');
      else if (i === n) s.classList.add('active');
    }
    document.querySelectorAll('.bk-panel').forEach(function (p) { p.classList.remove('active'); });
    var panel = document.getElementById('bk-p' + n);
    if (panel) panel.classList.add('active');

    var back = document.getElementById('bk-back');
    var next = document.getElementById('bk-next');
    var counter = document.getElementById('bk-step-count');
    if (back) back.style.visibility = n > 1 ? 'visible' : 'hidden';
    if (counter) counter.textContent = 'Schritt ' + n + ' von 5';
    if (next) {
      next.disabled = false;
      if (n === 5) {
        next.textContent = 'Anfrage absenden \u2713';
        next.style.background = 'var(--e)';
      } else {
        next.textContent = 'Weiter \u2192';
        next.style.background = '';
      }
    }
    currentStep = n;
    var modal = document.querySelector('.bk-modal');
    if (modal) modal.scrollTop = 0;
  }

  /* ── Spot selection ─────────────────────────────────── */
  window.bkSelectSpot = function (el) {
    document.querySelectorAll('#bk-spot-opts .spot-opt').forEach(function (o) { o.classList.remove('selected'); });
    el.classList.add('selected');
    BK.spot = el.getAttribute('data-spot');
  };

  /* ── Steppers ───────────────────────────────────────── */
  window.bkAdj = function (field, delta) {
    if (field === 'adults') {
      BK.adults = Math.max(1, Math.min(8, BK.adults + delta));
      var el = document.getElementById('bk-adults-val');
      if (el) el.textContent = BK.adults;
    } else if (field === 'kids') {
      BK.kids = Math.max(0, Math.min(6, BK.kids + delta));
      var el2 = document.getElementById('bk-kids-val');
      if (el2) el2.textContent = BK.kids;
    }
  };

  /* ── Extras ─────────────────────────────────────────── */
  window.bkToggleExtra = function (el) {
    el.classList.toggle('selected');
    var name = el.getAttribute('data-extra');
    var idx = BK.extras.indexOf(name);
    if (idx > -1) BK.extras.splice(idx, 1);
    else BK.extras.push(name);
  };

  /* ── Nights badge ───────────────────────────────────── */
  window.bkUpdateNights = function () {
    var a = document.getElementById('bk-arrival');
    var d = document.getElementById('bk-departure');
    var badge = document.getElementById('bk-nights-badge');
    if (!a || !d || !badge) return;
    if (a.value && d.value) {
      var diff = Math.round((new Date(d.value) - new Date(a.value)) / 86400000);
      if (diff > 0) {
        var fmt = function (s) { return s.split('-').reverse().join('.'); };
        badge.textContent = '\uD83C\uDF19 ' + diff + ' Nacht' + (diff !== 1 ? 'e' : '') +
          ' \u00B7 ' + fmt(a.value) + ' bis ' + fmt(d.value);
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    } else {
      badge.style.display = 'none';
    }
  };

  /* ── Validation ─────────────────────────────────────── */
  function bkValidate(step) {
    var alert = document.getElementById('bk-alert');
    if (alert) alert.remove();
    if (step === 1) {
      var a = document.getElementById('bk-arrival');
      var d = document.getElementById('bk-departure');
      if (!a || !a.value || !d || !d.value) { bkAlert('Bitte An- und Abreisetag ausw\u00E4hlen.'); return false; }
      if (new Date(d.value) <= new Date(a.value)) { bkAlert('Abreise muss nach Anreise liegen.'); return false; }
    }
    if (step === 2) {
      if (!BK.spot) { bkAlert('Bitte einen Stellplatz-Typ ausw\u00E4hlen.'); return false; }
    }
    if (step === 4) {
      var fn = document.getElementById('bk-fname');
      var ln = document.getElementById('bk-lname');
      var em = document.getElementById('bk-email');
      if (!fn || !fn.value.trim() || !ln || !ln.value.trim()) { bkAlert('Bitte Vor- und Nachname eingeben.'); return false; }
      if (!em || !em.value.trim() || em.value.indexOf('@') < 0) { bkAlert('Bitte eine g\u00FCltige E-Mail-Adresse eingeben.'); return false; }
    }
    return true;
  }

  function bkAlert(msg) {
    var el = document.createElement('div');
    el.id = 'bk-alert';
    el.className = 'bk-alert';
    el.innerHTML = '&#x26A0; ' + msg;
    var panel = document.querySelector('.bk-panel.active');
    if (panel) panel.insertBefore(el, panel.firstChild);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 4000);
  }

  /* ── Summary ────────────────────────────────────────── */
  function bkBuildSummary() {
    var a  = document.getElementById('bk-arrival');
    var d  = document.getElementById('bk-departure');
    var fn = document.getElementById('bk-fname');
    var ln = document.getElementById('bk-lname');
    var em = document.getElementById('bk-email');
    var ph = document.getElementById('bk-phone');
    var veh = document.getElementById('bk-vehicle');
    var msg = document.getElementById('bk-msg');

    var nights = (a && d && a.value && d.value)
      ? Math.round((new Date(d.value) - new Date(a.value)) / 86400000) : 0;
    var spotLabel = BK.spot === 'see' ? 'Sulmsee-Stellplatz (am Wasser)' : 'Silbersee-Stellplatz (im Gr\u00FCnen)';
    var basePrice = BK.spot === 'see' ? 36 : 28;
    var fmt = function (s) { return s ? s.split('-').reverse().join('.') : '\u2013'; };

    var rows = [
      ['Zeitraum', fmt(a && a.value) + ' \u2013 ' + fmt(d && d.value) + ' (' + nights + ' N\u00E4chte)'],
      ['Stellplatz', spotLabel],
      ['Reisende', BK.adults + ' Erwachsene' + (BK.kids ? ', ' + BK.kids + ' Kind' + (BK.kids > 1 ? 'er' : '') : '')],
      ['Fahrzeug', veh ? veh.value : '\u2013']
    ];
    if (BK.extras.length) rows.push(['Extras', BK.extras.join(', ')]);
    rows.push(['Name', (fn ? fn.value : '') + ' ' + (ln ? ln.value : '')]);
    rows.push(['E-Mail', em ? em.value : '']);
    if (ph && ph.value) rows.push(['Telefon', ph.value]);
    if (msg && msg.value.trim()) rows.push(['Nachricht', msg.value.trim()]);
    rows.push(['Gesch\u00E4tzte Kosten', 'ab \u20AC\u00A0' + (nights * basePrice) + ',\u2013']);

    var html = '<div class="bs-title">Buchungsdetails</div>';
    rows.forEach(function (r) {
      html += '<div class="bs-row"><span>' + r[0] + '</span><span style="text-align:right;max-width:55%">' + r[1] + '</span></div>';
    });
    var s = document.getElementById('bk-summary');
    if (s) s.innerHTML = html;
  }

  /* ── Submit ─────────────────────────────────────────── */
  function bkSubmit() {
    var next = document.getElementById('bk-next');
    if (next) { next.disabled = true; next.textContent = 'Wird gesendet \u2026'; }

    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var data = {
      fname: g('bk-fname'), lname: g('bk-lname'),
      email: g('bk-email'), phone: g('bk-phone'),
      arrival: g('bk-arrival'), departure: g('bk-departure'),
      spot: BK.spot, adults: BK.adults, kids: BK.kids,
      vehicle: g('bk-vehicle'),
      extras: BK.extras.join(', '),
      message: g('bk-msg')
    };

    fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { if (!r.ok) throw new Error('srv'); return r.json(); })
      .then(function () { bkShowSuccess(data.fname); })
      .catch(function () {
        var subj = 'Buchungsanfrage Camping Sulmsee \u2013 ' + data.fname + ' ' + data.lname;
        var body = 'Name: ' + data.fname + ' ' + data.lname + '\n' +
          'E-Mail: ' + data.email + '\n' +
          'Telefon: ' + (data.phone || '\u2013') + '\n\n' +
          'Anreise: ' + data.arrival + '\nAbreise: ' + data.departure + '\n' +
          'Stellplatz: ' + (data.spot === 'see' ? 'Sulmsee' : 'Silbersee') + '\n' +
          'Erwachsene: ' + data.adults + ', Kinder: ' + data.kids + '\n' +
          'Fahrzeug: ' + (data.vehicle || '\u2013') + '\n' +
          'Extras: ' + (data.extras || '\u2013') + '\n\nNachricht:\n' + (data.message || '\u2013');
        window.location.href = 'mailto:info@flerdvision.com?subject=' +
          encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
        bkShowSuccess(data.fname);
      });
  }

  function bkShowSuccess(name) {
    document.querySelectorAll('.bk-panel').forEach(function (p) { p.classList.remove('active'); });
    var prog = document.getElementById('bk-progress');
    if (prog) prog.style.display = 'none';
    var footer = document.getElementById('bk-footer');
    if (footer) footer.style.display = 'none';
    var suc = document.getElementById('bk-success');
    if (suc) suc.style.display = 'block';
    var sn = document.getElementById('bk-success-name');
    if (sn) sn.textContent = name;
  }

  /* ── Reset ──────────────────────────────────────────── */
  function resetBooking() {
    BK = { adults: 2, kids: 0, spot: '', vehicle: 'Wohnmobil', extras: [] };
    currentStep = 1;
    ['bk-arrival', 'bk-departure', 'bk-fname', 'bk-lname', 'bk-email', 'bk-phone', 'bk-msg'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    var veh = document.getElementById('bk-vehicle'); if (veh) veh.value = 'Wohnmobil';
    var av = document.getElementById('bk-adults-val'); if (av) av.textContent = '2';
    var kv = document.getElementById('bk-kids-val'); if (kv) kv.textContent = '0';
    document.querySelectorAll('.spot-opt,.extra-opt').forEach(function (o) { o.classList.remove('selected'); });
    var badge = document.getElementById('bk-nights-badge'); if (badge) badge.style.display = 'none';
    var al = document.getElementById('bk-alert'); if (al) al.remove();
    document.querySelectorAll('.bk-panel').forEach(function (p) { p.classList.remove('active'); });
    var p1 = document.getElementById('bk-p1'); if (p1) p1.classList.add('active');
    var suc = document.getElementById('bk-success'); if (suc) suc.style.display = 'none';
    var prog = document.getElementById('bk-progress'); if (prog) prog.style.display = '';
    var ftr = document.getElementById('bk-footer'); if (ftr) ftr.style.display = '';
    for (var i = 1; i <= 5; i++) {
      var s = document.getElementById('bkstep-' + i);
      if (s) { s.classList.remove('active', 'done'); if (i === 1) s.classList.add('active'); }
    }
    var back = document.getElementById('bk-back'); if (back) back.style.visibility = 'hidden';
    var next = document.getElementById('bk-next');
    if (next) { next.disabled = false; next.textContent = 'Weiter \u2192'; next.style.background = ''; }
    var cnt = document.getElementById('bk-step-count'); if (cnt) cnt.textContent = 'Schritt 1 von 5';
  }

  /* ── Page Transitions ───────────────────────────────── */
  (function () {
    var TR = 'opacity .15s ease, filter .15s ease';
    // Fade + blur in on load (skip if page-loader present – index.html handles it)
    if (!document.getElementById('page-loader')) {
      document.body.style.cssText += ';opacity:0;filter:blur(6px);transition:none';
      var doIn = function () {
        requestAnimationFrame(function () {
          document.body.style.transition = TR;
          document.body.style.opacity = '1';
          document.body.style.filter = 'blur(0px)';
        });
      };
      if (document.readyState === 'complete') { setTimeout(doIn, 10); }
      else { window.addEventListener('load', function () { setTimeout(doIn, 10); }); }
    }
    // Blur + fade out on navigation
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 ||
        href.indexOf('tel:') === 0 || href.indexOf('http') === 0 ||
        a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      document.body.style.transition = TR;
      document.body.style.opacity = '0';
      document.body.style.filter = 'blur(6px)';
      setTimeout(function () { window.location.href = href; }, 160);
    });
  })();

})();
