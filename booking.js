// BSF Consulting AG – Erstgespräch-Wizard
// 3 Schritte: Anliegen → Unternehmen → Kontakt
// Architektur: Self-injecting modal, Step-Navigation, Validierung, /api/consultation

// === Sulmsee Legacy (auskommentiert beim BSF-Rebrand — nicht löschen, Sulmsee-Basis) ===
/*
var BK_LEGACY = { adults: 2, kids: 0, spot: '', vehicle: 'Wohnmobil', extras: [] };
function bkUpdateNights() { ... }
function bkSelectSpot(el) { ... }
function bkAdj(field, delta) { ... }
function bkToggleExtra(el) { ... }
function bkBuildSummary() { ... }
*/

(function () {
  'use strict';

  var currentStep = 1;
  var TOTAL_STEPS = 3;

  /* ── Modal HTML ─────────────────────────────────────────────────────── */
  var MODAL_HTML = [
    '<div class="modal-bg" id="bookingModal">',
    '<div class="modal bk-modal">',

    /* header */
    '<div class="modal-header">',
    '<div><h2 class="bk-headline">Erstgespräch anfragen</h2>',
    '<p class="bk-subtitle">Vertraulich · unverbindlich · innerhalb eines Werktags</p></div>',
    '<button class="modal-close" onclick="closeBooking()">&#x2715;</button>',
    '</div>',

    /* step progress */
    '<div class="bk-progress" id="bk-progress">',
    '<div class="bk-steps">',
    '<div class="bk-step active" id="bkstep-1"><div class="bk-step-dot">1</div><div class="bk-step-lbl">Anliegen</div></div>',
    '<div class="bk-step-line"></div>',
    '<div class="bk-step" id="bkstep-2"><div class="bk-step-dot">2</div><div class="bk-step-lbl">Unternehmen</div></div>',
    '<div class="bk-step-line"></div>',
    '<div class="bk-step" id="bkstep-3"><div class="bk-step-dot">3</div><div class="bk-step-lbl">Kontakt</div></div>',
    '</div>',
    '</div>',

    /* body */
    '<div class="modal-body bk-body">',

    /* ── STEP 1: Anliegen ──────────────────── */
    '<div class="bk-panel active" id="bk-p1">',
    '<h3 class="bk-ptitle">Womit können wir Ihnen helfen?</h3>',
    '<p class="bk-psub">Keine sensiblen Details nötig — wir klären den Rahmen im persönlichen Gespräch.</p>',
    '<div class="form-group">',
    '<label>Mandatsfeld <span style="color:var(--el)">*</span></label>',
    '<select id="bk-mandate-type" required>',
    '<option value="">Bitte wählen…</option>',
    '<option value="verkauf">Verkauf / Exit</option>',
    '<option value="kauf">Kauf / Akquisition</option>',
    '<option value="nachfolge">Nachfolgeregelung</option>',
    '<option value="fusion">Fusion / Joint Venture</option>',
    '<option value="restrukturierung">Restrukturierung</option>',
    '<option value="andere">Andere / unsicher</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label>Zeitlicher Horizont</label>',
    '<select id="bk-timeframe">',
    '<option value="">Bitte wählen…</option>',
    '<option value="akut">Akut (Entscheidung steht)</option>',
    '<option value="kurz">In den nächsten 6 Monaten</option>',
    '<option value="mittel">In 6–18 Monaten</option>',
    '<option value="lang">Längerfristig / Vorbereitung</option>',
    '<option value="orientierung">Orientierung / unverbindlich</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label>Kurze Beschreibung Ihres Anliegens <span style="color:var(--el)">*</span></label>',
    '<textarea id="bk-brief" rows="4" placeholder="In wenigen Sätzen — worum geht es? Sie müssen keine sensiblen Details nennen." required></textarea>',
    '<small style="color:var(--tl);font-size:.78rem;margin-top:6px;display:block">Vertraulich. Diese Information wird verschlüsselt übermittelt.</small>',
    '</div>',
    '</div>',

    /* ── STEP 2: Unternehmen ───────────────── */
    '<div class="bk-panel" id="bk-p2">',
    '<h3 class="bk-ptitle">Ihr Unternehmen</h3>',
    '<p class="bk-psub">Helfen Sie uns, Ihre Situation besser einzuschätzen.</p>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label>Branche <span style="color:var(--el)">*</span></label>',
    '<select id="bk-sector" required>',
    '<option value="">Bitte wählen…</option>',
    '<option value="industrie">Industrie / Maschinenbau</option>',
    '<option value="konsum">Konsumgüter / Handel</option>',
    '<option value="dienstleistung">Dienstleistung / B2B</option>',
    '<option value="technologie">Technologie / Software</option>',
    '<option value="gesundheit">Gesundheitswesen</option>',
    '<option value="energie">Energie / Versorgung</option>',
    '<option value="immobilien">Immobilien / Bau</option>',
    '<option value="finanz">Finanz / Versicherung</option>',
    '<option value="andere">Andere</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label>Land</label>',
    '<select id="bk-country">',
    '<option value="CH">Schweiz</option>',
    '<option value="DE">Deutschland</option>',
    '<option value="AT">Österreich</option>',
    '<option value="TR">Türkei</option>',
    '<option value="other">Anderes</option>',
    '</select>',
    '</div>',
    '</div>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label>Umsatz (ca.)</label>',
    '<select id="bk-revenue">',
    '<option value="">Möchte ich nicht angeben</option>',
    '<option value="under_5m">Unter CHF 5 Mio.</option>',
    '<option value="5_25m">CHF 5 – 25 Mio.</option>',
    '<option value="25_100m">CHF 25 – 100 Mio.</option>',
    '<option value="100_500m">CHF 100 – 500 Mio.</option>',
    '<option value="over_500m">Über CHF 500 Mio.</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label>Mitarbeitende (ca.)</label>',
    '<select id="bk-employees">',
    '<option value="">Möchte ich nicht angeben</option>',
    '<option value="under_10">Unter 10</option>',
    '<option value="10_50">10 – 50</option>',
    '<option value="50_250">50 – 250</option>',
    '<option value="250_1000">250 – 1’000</option>',
    '<option value="over_1000">Über 1’000</option>',
    '</select>',
    '</div>',
    '</div>',
    '<div class="form-group">',
    '<label>Unternehmensname (optional)</label>',
    '<input type="text" id="bk-company" placeholder="Falls Sie es bereits jetzt nennen möchten — vertraulich" />',
    '<small style="color:var(--tl);font-size:.78rem;margin-top:6px;display:block">Sie können den Namen auch erst im persönlichen Gespräch nennen.</small>',
    '</div>',
    '</div>',

    /* ── STEP 3: Kontakt ───────────────────── */
    '<div class="bk-panel" id="bk-p3">',
    '<h3 class="bk-ptitle">Ihre Kontaktdaten</h3>',
    '<p class="bk-psub">Damit wir einen Termin vereinbaren können.</p>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label>Anrede</label>',
    '<select id="bk-salutation">',
    '<option value="herr">Herr</option>',
    '<option value="frau">Frau</option>',
    '<option value="none">Keine</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label>Funktion <span style="color:var(--el)">*</span></label>',
    '<input type="text" id="bk-role" placeholder="z.B. Inhaber, Geschäftsführer, CFO" required />',
    '</div>',
    '</div>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label>Vorname <span style="color:var(--el)">*</span></label>',
    '<input type="text" id="bk-fname" autocomplete="given-name" required />',
    '</div>',
    '<div class="form-group">',
    '<label>Nachname <span style="color:var(--el)">*</span></label>',
    '<input type="text" id="bk-lname" autocomplete="family-name" required />',
    '</div>',
    '</div>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label>E-Mail <span style="color:var(--el)">*</span></label>',
    '<input type="email" id="bk-email" autocomplete="email" required />',
    '</div>',
    '<div class="form-group">',
    '<label>Telefon</label>',
    '<input type="tel" id="bk-phone" placeholder="+41 …" autocomplete="tel" />',
    '</div>',
    '</div>',
    '<div class="form-group">',
    '<label>Bevorzugte Kontaktart</label>',
    '<select id="bk-pref-contact">',
    '<option value="email">E-Mail (für Terminvorschlag)</option>',
    '<option value="phone">Telefonisch (Sie rufen mich an)</option>',
    '<option value="any">Egal</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label style="display:flex;align-items:flex-start;gap:10px;font-weight:400;cursor:pointer">',
    '<input type="checkbox" id="bk-consent" style="margin-top:4px;flex-shrink:0" />',
    '<span style="font-size:.88rem;line-height:1.5;color:var(--tm)">',
    'Ich nehme zur Kenntnis, dass meine Anfrage vertraulich behandelt wird. BSF Consulting AG verpflichtet sich, keine Informationen an Dritte weiterzugeben. <span style="color:var(--el)">*</span>',
    '</span>',
    '</label>',
    '</div>',
    '</div>',

    /* ── Success screen ─────────────────────── */
    '<div class="bk-success-screen" id="bk-success" style="display:none">',
    '<div style="font-size:3rem;color:var(--el);margin-bottom:1rem">&#x2713;</div>',
    '<h3 style="font-family:\'Lora\',serif;font-size:1.6rem;color:var(--f);margin-bottom:.5rem">Anfrage erhalten</h3>',
    '<p style="color:var(--tm);line-height:1.8;max-width:400px;margin:0 auto 1.5rem" id="bk-success-msg">',
    'Vielen Dank. Wir melden uns innerhalb eines Werktags persönlich bei Ihnen.</p>',
    '<p style="color:var(--tl);font-size:.85rem;margin-bottom:2rem">Sie erhalten in Kürze eine Bestätigung per E-Mail.</p>',
    '<button class="btn btn-green" onclick="closeBooking()">Schließen</button>',
    '</div>',

    '</div>', /* /bk-body */

    /* footer */
    '<div class="modal-footer" id="bk-footer">',
    '<button class="modal-nav-btn" id="bk-back" onclick="bkPrev()" style="visibility:hidden">&#x2190; Zurück</button>',
    '<span id="bk-step-count" style="font-size:.78rem;color:var(--tl);font-weight:600">Schritt 1 von 3</span>',
    '<button class="modal-next-btn" id="bk-next" onclick="bkNext()">Weiter &#x2192;</button>',
    '</div>',

    '</div>', /* /bk-modal */
    '</div>'  /* /modal-bg */
  ].join('\n');

  /* ── Init ────────────────────────────────────────────────────────────── */
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

  /* ── Public API ──────────────────────────────────────────────────────── */
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

  /* ── Step Navigation ─────────────────────────────────────────────────── */
  window.bkNext = function () {
    if (!bkValidate(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    } else {
      bkSubmit();
    }
  };

  window.bkPrev = function () {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  function goToStep(n) {
    for (var i = 1; i <= TOTAL_STEPS; i++) {
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
    if (counter) counter.textContent = 'Schritt ' + n + ' von ' + TOTAL_STEPS;
    if (next) {
      next.disabled = false;
      if (n === TOTAL_STEPS) {
        next.textContent = 'Anfrage absenden ✓';
        next.style.background = 'var(--e)';
      } else {
        next.textContent = 'Weiter →';
        next.style.background = '';
      }
    }
    currentStep = n;
    var modal = document.querySelector('.bk-modal');
    if (modal) modal.scrollTop = 0;
  }

  /* ── Validation ──────────────────────────────────────────────────────── */
  function bkValidate(step) {
    var alert = document.getElementById('bk-alert');
    if (alert) alert.remove();

    if (step === 1) {
      var mandate = document.getElementById('bk-mandate-type');
      var brief = document.getElementById('bk-brief');
      if (!mandate || !mandate.value) {
        bkAlert('Bitte wählen Sie ein Mandatsfeld.');
        return false;
      }
      if (!brief || brief.value.trim().length < 20) {
        bkAlert('Bitte beschreiben Sie Ihr Anliegen in mindestens 20 Zeichen.');
        return false;
      }
    }

    if (step === 2) {
      var sector = document.getElementById('bk-sector');
      if (!sector || !sector.value) {
        bkAlert('Bitte wählen Sie eine Branche.');
        return false;
      }
    }

    if (step === 3) {
      var fname = document.getElementById('bk-fname');
      var lname = document.getElementById('bk-lname');
      var email = document.getElementById('bk-email');
      var role  = document.getElementById('bk-role');
      var consent = document.getElementById('bk-consent');

      if (!fname || !fname.value.trim()) { bkAlert('Bitte Vornamen angeben.'); return false; }
      if (!lname || !lname.value.trim()) { bkAlert('Bitte Nachnamen angeben.'); return false; }
      if (!role  || !role.value.trim())  { bkAlert('Bitte Ihre Funktion angeben.'); return false; }
      if (!email || !email.value.trim() || email.value.indexOf('@') < 0 || email.value.indexOf('.') < 0) {
        bkAlert('Bitte gültige E-Mail-Adresse angeben.');
        return false;
      }
      if (!consent || !consent.checked) {
        bkAlert('Bitte bestätigen Sie die Vertraulichkeitsklausel.');
        return false;
      }
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
    setTimeout(function () { if (el.parentNode) el.remove(); }, 4500);
  }

  /* ── Submit ──────────────────────────────────────────────────────────── */
  function bkSubmit() {
    var next = document.getElementById('bk-next');
    if (next) { next.disabled = true; next.textContent = 'Wird gesendet …'; }

    var g = function (id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };
    var formData = {
      mandate_type:      g('bk-mandate-type'),
      timeframe:         g('bk-timeframe'),
      brief_description: g('bk-brief'),
      sector:            g('bk-sector'),
      country:           g('bk-country'),
      revenue_range:     g('bk-revenue'),
      employees_range:   g('bk-employees'),
      company_name:      g('bk-company'),
      salutation:        g('bk-salutation'),
      role:              g('bk-role'),
      first_name:        g('bk-fname'),
      last_name:         g('bk-lname'),
      email:             g('bk-email'),
      phone:             g('bk-phone'),
      preferred_contact: g('bk-pref-contact'),
    };

    fetch('/api/consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(function (r) { if (!r.ok) throw new Error('srv'); return r.json(); })
      .then(function (result) { bkShowSuccess(result.message || 'Vielen Dank. Wir melden uns innerhalb eines Werktags.'); })
      .catch(function () {
        // Fallback: mailto
        var sal = formData.salutation === 'herr' ? 'Herr' : formData.salutation === 'frau' ? 'Frau' : '';
        var subj = 'Erstgespräch-Anfrage BSF Consulting – ' + formData.first_name + ' ' + formData.last_name;
        var body = 'Mandatsfeld: ' + formData.mandate_type + '\n' +
          'Zeithorizont: ' + (formData.timeframe || '–') + '\n' +
          'Anliegen: ' + formData.brief_description + '\n\n' +
          'Branche: ' + formData.sector + '\n' +
          'Unternehmen: ' + (formData.company_name || '–') + '\n\n' +
          'Name: ' + sal + ' ' + formData.first_name + ' ' + formData.last_name + '\n' +
          'Funktion: ' + formData.role + '\n' +
          'E-Mail: ' + formData.email + '\n' +
          'Telefon: ' + (formData.phone || '–');
        window.location.href = 'mailto:info@bsfconsulting.ch?subject=' +
          encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
        bkShowSuccess('Vielen Dank. Wir melden uns innerhalb eines Werktags bei Ihnen.');
      });
  }

  function bkShowSuccess(message) {
    document.querySelectorAll('.bk-panel').forEach(function (p) { p.classList.remove('active'); });
    var prog = document.getElementById('bk-progress');
    if (prog) prog.style.display = 'none';
    var footer = document.getElementById('bk-footer');
    if (footer) footer.style.display = 'none';
    var suc = document.getElementById('bk-success');
    if (suc) suc.style.display = 'block';
    var msg = document.getElementById('bk-success-msg');
    if (msg) msg.textContent = message;
  }

  /* ── Reset ───────────────────────────────────────────────────────────── */
  function resetBooking() {
    currentStep = 1;
    var ids = ['bk-mandate-type','bk-timeframe','bk-brief','bk-sector','bk-country',
               'bk-revenue','bk-employees','bk-company','bk-salutation','bk-role',
               'bk-fname','bk-lname','bk-email','bk-phone','bk-pref-contact'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = '';
      // selects keep their first option (default)
    });
    var consent = document.getElementById('bk-consent');
    if (consent) consent.checked = false;
    var al = document.getElementById('bk-alert'); if (al) al.remove();
    document.querySelectorAll('.bk-panel').forEach(function (p) { p.classList.remove('active'); });
    var p1 = document.getElementById('bk-p1'); if (p1) p1.classList.add('active');
    var suc = document.getElementById('bk-success'); if (suc) suc.style.display = 'none';
    var prog = document.getElementById('bk-progress'); if (prog) prog.style.display = '';
    var ftr = document.getElementById('bk-footer'); if (ftr) ftr.style.display = '';
    for (var i = 1; i <= TOTAL_STEPS; i++) {
      var s = document.getElementById('bkstep-' + i);
      if (s) { s.classList.remove('active', 'done'); if (i === 1) s.classList.add('active'); }
    }
    var back = document.getElementById('bk-back'); if (back) back.style.visibility = 'hidden';
    var next = document.getElementById('bk-next');
    if (next) { next.disabled = false; next.textContent = 'Weiter →'; next.style.background = ''; }
    var cnt = document.getElementById('bk-step-count'); if (cnt) cnt.textContent = 'Schritt 1 von ' + TOTAL_STEPS;
  }

  /* ── Page Transitions ────────────────────────────────────────────────── */
  (function () {
    var TR = 'opacity .15s ease, filter .15s ease';
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
