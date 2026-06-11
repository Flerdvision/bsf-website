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

  /* ── i18n-Helfer ──────────────────────────────────────────────────────────
     Das Modal wird per JS injiziert und vom statischen i18n-Scan nicht erfasst.
     Übersetzungen kommen daher zur Laufzeit aus window.__i18nDict (gesetzt von
     i18n.js). t() liefert einen String, localizeModal() übersetzt das gesamte
     injizierte Modal (inkl. data-i18n / data-i18n-attr). Fallback = Deutsch. */
  function bkDict() { return window.__i18nDict || null; }
  function t(key, fallback) {
    var d = bkDict();
    if (d && window.BSFi18n && typeof window.BSFi18n.resolve === 'function') {
      var v = window.BSFi18n.resolve(d, key);
      if (typeof v === 'string' && v) return v.replace(/^__TT__\s*/, '');
    }
    return fallback;
  }
  function localizeModal() {
    var modal = document.getElementById('bookingModal');
    var d = bkDict();
    if (!modal || !d || !window.BSFi18n) return;
    modal.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = window.BSFi18n.resolve(d, el.getAttribute('data-i18n'));
      if (typeof v === 'string') el.innerHTML = v.replace(/^__TT__\s*/, '');
    });
    modal.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var i = pair.indexOf(':'); if (i < 0) return;
        var attr = pair.slice(0, i).trim(), key = pair.slice(i + 1).trim();
        var v = window.BSFi18n.resolve(d, key);
        if (typeof v === 'string') el.setAttribute(attr, v.replace(/^__TT__\s*/, ''));
      });
    });
    bkSyncDynamicLabels();
  }
  // Footer-/Counter-Beschriftungen (dynamisch, kein statisches data-i18n)
  function bkSyncDynamicLabels() {
    var next = document.getElementById('bk-next');
    if (next && !next.disabled) {
      next.textContent = (currentStep === TOTAL_STEPS)
        ? t('booking.submitBtn', 'Anfrage absenden ✓')
        : t('booking.nextBtn', 'Weiter →');
    }
    var cnt = document.getElementById('bk-step-count');
    if (cnt) cnt.textContent = t('booking.stepWord', 'Schritt') + ' ' + currentStep + ' ' + t('booking.ofWord', 'von') + ' ' + TOTAL_STEPS;
    var back = document.getElementById('bk-back');
    if (back) back.textContent = t('booking.backBtn', '← Zurück');
  }
  // Sobald die Sprachdatei geladen ist, Modal nachübersetzen.
  document.addEventListener('i18n:loaded', localizeModal);

  /* ── Modal HTML ─────────────────────────────────────────────────────── */
  var MODAL_HTML = [
    '<div class="modal-bg" id="bookingModal">',
    '<div class="modal bk-modal">',

    /* header */
    '<div class="modal-header">',
    '<div><h2 class="bk-headline" data-i18n="booking.headline">Erstgespräch anfragen</h2>',
    '<p class="bk-subtitle" data-i18n="booking.subtitle">Vertraulich · unverbindlich · innerhalb eines Werktags</p></div>',
    '<button class="modal-close" onclick="closeBooking()">&#x2715;</button>',
    '</div>',

    /* step progress */
    '<div class="bk-progress" id="bk-progress">',
    '<div class="bk-steps">',
    '<div class="bk-step active" id="bkstep-1"><div class="bk-step-dot">1</div><div class="bk-step-lbl" data-i18n="booking.stepAnliegen">Anliegen</div></div>',
    '<div class="bk-step-line"></div>',
    '<div class="bk-step" id="bkstep-2"><div class="bk-step-dot">2</div><div class="bk-step-lbl" data-i18n="booking.stepUnternehmen">Unternehmen</div></div>',
    '<div class="bk-step-line"></div>',
    '<div class="bk-step" id="bkstep-3"><div class="bk-step-dot">3</div><div class="bk-step-lbl" data-i18n="booking.stepKontakt">Kontakt</div></div>',
    '</div>',
    '</div>',

    /* body */
    '<div class="modal-body bk-body">',

    /* ── STEP 1: Anliegen ──────────────────── */
    '<div class="bk-panel active" id="bk-p1">',
    '<h3 class="bk-ptitle" data-i18n="booking.p1Title">Womit können wir Ihnen helfen?</h3>',
    '<p class="bk-psub" data-i18n="booking.p1Sub">Keine sensiblen Details nötig — wir klären den Rahmen im persönlichen Gespräch.</p>',
    '<div class="form-group">',
    '<label><span data-i18n="booking.mandateLabel">Mandatsfeld</span> <span style="color:var(--el)">*</span></label>',
    '<select id="bk-mandate-type" required>',
    '<option value="" data-i18n="booking.optChoose">Bitte wählen…</option>',
    '<option value="verkauf" data-i18n="booking.mandVerkauf">Verkauf / Exit</option>',
    '<option value="kauf" data-i18n="booking.mandKauf">Kauf / Akquisition</option>',
    '<option value="nachfolge" data-i18n="booking.mandNachfolge">Nachfolgeregelung</option>',
    '<option value="fusion" data-i18n="booking.mandFusion">Fusion / Joint Venture</option>',
    '<option value="restrukturierung" data-i18n="booking.mandRestrukt">Restrukturierung</option>',
    '<option value="andere" data-i18n="booking.mandAndere">Andere / unsicher</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label data-i18n="booking.tfLabel">Zeitlicher Horizont</label>',
    '<select id="bk-timeframe">',
    '<option value="" data-i18n="booking.optChoose">Bitte wählen…</option>',
    '<option value="akut" data-i18n="booking.tfAkut">Akut (Entscheidung steht)</option>',
    '<option value="kurz" data-i18n="booking.tfKurz">In den nächsten 6 Monaten</option>',
    '<option value="mittel" data-i18n="booking.tfMittel">In 6–18 Monaten</option>',
    '<option value="lang" data-i18n="booking.tfLang">Längerfristig / Vorbereitung</option>',
    '<option value="orientierung" data-i18n="booking.tfOrientierung">Orientierung / unverbindlich</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label><span data-i18n="booking.briefLabel">Kurze Beschreibung Ihres Anliegens</span> <span style="color:var(--el)">*</span></label>',
    '<textarea id="bk-brief" rows="4" data-i18n-attr="placeholder:booking.briefPh" placeholder="In wenigen Sätzen — worum geht es? Sie müssen keine sensiblen Details nennen." required></textarea>',
    '<small style="color:var(--tl);font-size:.78rem;margin-top:6px;display:block" data-i18n="booking.briefNote">Vertraulich. Diese Information wird verschlüsselt übermittelt.</small>',
    '</div>',
    '</div>',

    /* ── STEP 2: Unternehmen ───────────────── */
    '<div class="bk-panel" id="bk-p2">',
    '<h3 class="bk-ptitle" data-i18n="booking.p2Title">Ihr Unternehmen</h3>',
    '<p class="bk-psub" data-i18n="booking.p2Sub">Helfen Sie uns, Ihre Situation besser einzuschätzen.</p>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label><span data-i18n="booking.secLabel">Branche</span> <span style="color:var(--el)">*</span></label>',
    '<select id="bk-sector" required>',
    '<option value="" data-i18n="booking.optChoose">Bitte wählen…</option>',
    '<option value="industrie" data-i18n="booking.secIndustrie">Industrie / Maschinenbau</option>',
    '<option value="konsum" data-i18n="booking.secKonsum">Konsumgüter / Handel</option>',
    '<option value="dienstleistung" data-i18n="booking.secDienst">Dienstleistung / B2B</option>',
    '<option value="technologie" data-i18n="booking.secTech">Technologie / Software</option>',
    '<option value="gesundheit" data-i18n="booking.secGesund">Gesundheitswesen</option>',
    '<option value="energie" data-i18n="booking.secEnergie">Energie / Versorgung</option>',
    '<option value="immobilien" data-i18n="booking.secImmo">Immobilien / Bau</option>',
    '<option value="finanz" data-i18n="booking.secFinanz">Finanz / Versicherung</option>',
    '<option value="andere" data-i18n="booking.secAndere">Andere</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label data-i18n="booking.countryLabel">Land</label>',
    '<select id="bk-country">',
    '<option value="CH" data-i18n="booking.cCH">Schweiz</option>',
    '<option value="DE" data-i18n="booking.cDE">Deutschland</option>',
    '<option value="AT" data-i18n="booking.cAT">Österreich</option>',
    '<option value="TR" data-i18n="booking.cTR">Türkei</option>',
    '<option value="other" data-i18n="booking.cOther">Anderes</option>',
    '</select>',
    '</div>',
    '</div>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label data-i18n="booking.revLabel">Umsatz (ca.)</label>',
    '<select id="bk-revenue">',
    '<option value="" data-i18n="booking.revNone">Möchte ich nicht angeben</option>',
    '<option value="under_5m" data-i18n="booking.revU5">Unter CHF 5 Mio.</option>',
    '<option value="5_25m" data-i18n="booking.rev5">CHF 5 – 25 Mio.</option>',
    '<option value="25_100m" data-i18n="booking.rev25">CHF 25 – 100 Mio.</option>',
    '<option value="100_500m" data-i18n="booking.rev100">CHF 100 – 500 Mio.</option>',
    '<option value="over_500m" data-i18n="booking.revO500">Über CHF 500 Mio.</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label data-i18n="booking.empLabel">Mitarbeitende (ca.)</label>',
    '<select id="bk-employees">',
    '<option value="" data-i18n="booking.revNone">Möchte ich nicht angeben</option>',
    '<option value="under_10" data-i18n="booking.empU10">Unter 10</option>',
    '<option value="10_50" data-i18n="booking.emp10">10 – 50</option>',
    '<option value="50_250" data-i18n="booking.emp50">50 – 250</option>',
    '<option value="250_1000" data-i18n="booking.emp250">250 – 1’000</option>',
    '<option value="over_1000" data-i18n="booking.empO1000">Über 1’000</option>',
    '</select>',
    '</div>',
    '</div>',
    '<div class="form-group">',
    '<label data-i18n="booking.compLabel">Unternehmensname (optional)</label>',
    '<input type="text" id="bk-company" data-i18n-attr="placeholder:booking.compPh" placeholder="Falls Sie es bereits jetzt nennen möchten — vertraulich" />',
    '<small style="color:var(--tl);font-size:.78rem;margin-top:6px;display:block" data-i18n="booking.compNote">Sie können den Namen auch erst im persönlichen Gespräch nennen.</small>',
    '</div>',
    '</div>',

    /* ── STEP 3: Kontakt ───────────────────── */
    '<div class="bk-panel" id="bk-p3">',
    '<h3 class="bk-ptitle" data-i18n="booking.p3Title">Ihre Kontaktdaten</h3>',
    '<p class="bk-psub" data-i18n="booking.p3Sub">Damit wir einen Termin vereinbaren können.</p>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label data-i18n="booking.salLabel">Anrede</label>',
    '<select id="bk-salutation">',
    '<option value="herr" data-i18n="booking.salHerr">Herr</option>',
    '<option value="frau" data-i18n="booking.salFrau">Frau</option>',
    '<option value="none" data-i18n="booking.salNone">Keine</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label><span data-i18n="booking.roleLabel">Funktion</span> <span style="color:var(--el)">*</span></label>',
    '<input type="text" id="bk-role" data-i18n-attr="placeholder:booking.rolePh" placeholder="z.B. Inhaber, Geschäftsführer, CFO" required />',
    '</div>',
    '</div>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label><span data-i18n="booking.fnameLabel">Vorname</span> <span style="color:var(--el)">*</span></label>',
    '<input type="text" id="bk-fname" autocomplete="given-name" required />',
    '</div>',
    '<div class="form-group">',
    '<label><span data-i18n="booking.lnameLabel">Nachname</span> <span style="color:var(--el)">*</span></label>',
    '<input type="text" id="bk-lname" autocomplete="family-name" required />',
    '</div>',
    '</div>',
    '<div class="form-row">',
    '<div class="form-group">',
    '<label><span data-i18n="booking.emailLabel">E-Mail</span> <span style="color:var(--el)">*</span></label>',
    '<input type="email" id="bk-email" autocomplete="email" required />',
    '</div>',
    '<div class="form-group">',
    '<label data-i18n="booking.phoneLabel">Telefon</label>',
    '<input type="tel" id="bk-phone" data-i18n-attr="placeholder:booking.phonePh" placeholder="+41 …" autocomplete="tel" />',
    '</div>',
    '</div>',
    '<div class="form-group">',
    '<label data-i18n="booking.prefLabel">Bevorzugte Kontaktart</label>',
    '<select id="bk-pref-contact">',
    '<option value="email" data-i18n="booking.prefEmail">E-Mail (für Terminvorschlag)</option>',
    '<option value="phone" data-i18n="booking.prefPhone">Telefonisch (Sie rufen mich an)</option>',
    '<option value="any" data-i18n="booking.prefAny">Egal</option>',
    '</select>',
    '</div>',
    '<div class="form-group">',
    '<label style="display:flex;align-items:flex-start;gap:10px;font-weight:400;cursor:pointer">',
    '<input type="checkbox" id="bk-consent" style="margin-top:4px;flex-shrink:0" />',
    '<span style="font-size:.88rem;line-height:1.5;color:var(--tm)">',
    '<span data-i18n="booking.consentText">Ich nehme zur Kenntnis, dass meine Anfrage vertraulich behandelt wird. BSF Consulting AG verpflichtet sich, keine Informationen an Dritte weiterzugeben.</span> <span style="color:var(--el)">*</span>',
    '</span>',
    '</label>',
    '</div>',
    '</div>',

    /* ── Success screen ─────────────────────── */
    '<div class="bk-success-screen" id="bk-success" style="display:none">',
    '<div style="font-size:3rem;color:var(--el);margin-bottom:1rem">&#x2713;</div>',
    '<h3 style="font-family:\'Lora\',serif;font-size:1.6rem;color:var(--f);margin-bottom:.5rem" data-i18n="booking.successTitle">Anfrage erhalten</h3>',
    '<p style="color:var(--tm);line-height:1.8;max-width:400px;margin:0 auto 1.5rem" id="bk-success-msg" data-i18n="booking.successMsg">',
    'Vielen Dank. Wir melden uns innerhalb eines Werktags persönlich bei Ihnen.</p>',
    '<p style="color:var(--tl);font-size:.85rem;margin-bottom:2rem" data-i18n="booking.successNote">Sie erhalten in Kürze eine Bestätigung per E-Mail.</p>',
    '<button class="btn btn-green" onclick="closeBooking()" data-i18n="booking.closeBtn">Schliessen</button>',
    '</div>',

    '</div>', /* /bk-body */

    /* footer */
    '<div class="modal-footer" id="bk-footer">',
    '<button class="modal-nav-btn" id="bk-back" onclick="bkPrev()" style="visibility:hidden" data-i18n="booking.backBtn">&#x2190; Zurück</button>',
    '<span id="bk-step-count" style="font-size:.78rem;color:var(--tl);font-weight:600">Schritt 1 von 3</span>',
    '<button class="modal-next-btn" id="bk-next" onclick="bkNext()" data-i18n="booking.nextBtn">Weiter &#x2192;</button>',
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
    localizeModal();
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
    localizeModal();
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
    if (counter) counter.textContent = t('booking.stepWord', 'Schritt') + ' ' + n + ' ' + t('booking.ofWord', 'von') + ' ' + TOTAL_STEPS;
    if (next) {
      next.disabled = false;
      if (n === TOTAL_STEPS) {
        next.textContent = t('booking.submitBtn', 'Anfrage absenden ✓');
        next.style.background = 'var(--e)';
      } else {
        next.textContent = t('booking.nextBtn', 'Weiter →');
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
        bkAlert(t('booking.alMandate', 'Bitte wählen Sie ein Mandatsfeld.'));
        return false;
      }
      if (!brief || brief.value.trim().length < 20) {
        bkAlert(t('booking.alBrief', 'Bitte beschreiben Sie Ihr Anliegen in mindestens 20 Zeichen.'));
        return false;
      }
    }

    if (step === 2) {
      var sector = document.getElementById('bk-sector');
      if (!sector || !sector.value) {
        bkAlert(t('booking.alSector', 'Bitte wählen Sie eine Branche.'));
        return false;
      }
    }

    if (step === 3) {
      var fname = document.getElementById('bk-fname');
      var lname = document.getElementById('bk-lname');
      var email = document.getElementById('bk-email');
      var role  = document.getElementById('bk-role');
      var consent = document.getElementById('bk-consent');

      if (!fname || !fname.value.trim()) { bkAlert(t('booking.alFname', 'Bitte Vornamen angeben.')); return false; }
      if (!lname || !lname.value.trim()) { bkAlert(t('booking.alLname', 'Bitte Nachnamen angeben.')); return false; }
      if (!role  || !role.value.trim())  { bkAlert(t('booking.alRole', 'Bitte Ihre Funktion angeben.')); return false; }
      if (!email || !email.value.trim() || email.value.indexOf('@') < 0 || email.value.indexOf('.') < 0) {
        bkAlert(t('booking.alEmail', 'Bitte gültige E-Mail-Adresse angeben.'));
        return false;
      }
      if (!consent || !consent.checked) {
        bkAlert(t('booking.alConsent', 'Bitte bestätigen Sie die Vertraulichkeitsklausel.'));
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
    if (next) { next.disabled = true; next.classList.add('is-loading'); next.textContent = t('booking.sendingBtn', 'Wird gesendet …'); }

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
      .then(function (result) { bkShowSuccess(t('booking.successMsg', result.message || 'Vielen Dank. Wir melden uns innerhalb eines Werktags.')); })
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
        bkShowSuccess(t('booking.successMsg', 'Vielen Dank. Wir melden uns innerhalb eines Werktags bei Ihnen.'));
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
    if (next) { next.disabled = false; next.textContent = t('booking.nextBtn', 'Weiter →'); next.style.background = ''; }
    var cnt = document.getElementById('bk-step-count'); if (cnt) cnt.textContent = t('booking.stepWord', 'Schritt') + ' 1 ' + t('booking.ofWord', 'von') + ' ' + TOTAL_STEPS;
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
