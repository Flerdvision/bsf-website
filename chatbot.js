// ============================================================
//  BSF Consulting AG – BSF-Berater Widget
//  Geführter, button-gesteuerter Flow. Einzige Wahrheitsquelle: /api/chat
// ============================================================
(function () {

  // ── i18n-Helfer (überschreibbar via window.__i18nDict.chatbot) ──
  function CB() { return (window.__i18nDict && window.__i18nDict.chatbot) || {}; }
  function t(key, def) {
    var v = CB()[key];
    return (typeof v === 'string' && v) ? v : def;
  }
  // Aktuelle Seitensprache (gleiche Quelle wie der Rest der Seite).
  function cbLang() {
    return (window.__i18nDict && window.__i18nDict.lang) ||
      (window.BSFi18n && typeof window.BSFi18n.detectLang === 'function' && window.BSFi18n.detectLang()) ||
      document.documentElement.getAttribute('lang') || 'de';
  }

  function errMsg() {
    return t('errMsg', 'Aktuell technisch nicht erreichbar. Bitte <a href="tel:+41417603616">+41 41 760 36 16</a> oder <a href="mailto:info@bsfconsulting.ch">info@bsfconsulting.ch</a>.');
  }

  // Sektor-Keys EXAKT wie Backend-Enum (data/sector-multiples.json); i18n-Key je Sektor.
  var SECTOR_OPTS = [
    { key: 'maschinenbau',  i18n: 'secMaschinenbau',  label: 'Maschinen- und Anlagenbau' },
    { key: 'pharma',        i18n: 'secPharma',        label: 'Pharma und Healthcare' },
    { key: 'chemie',        i18n: 'secChemie',        label: 'Chemie' },
    { key: 'energie',       i18n: 'secEnergie',       label: 'Energie' },
    { key: 'bau',           i18n: 'secBau',           label: 'Bau und Baustoffe' },
    { key: 'nahrung',       i18n: 'secNahrung',       label: 'Nahrung und Genuss' },
    { key: 'konsumgueter',  i18n: 'secKonsumgueter',  label: 'Konsumgüter' },
    { key: 'logistik',      i18n: 'secLogistik',      label: 'Logistik' },
    { key: 'software',      i18n: 'secSoftware',      label: 'Software und SaaS' },
    { key: 'elektrotechnik',i18n: 'secElektrotechnik',label: 'Elektrotechnik' },
    { key: 'fahrzeugbau',   i18n: 'secFahrzeugbau',   label: 'Fahrzeugbau' },
    { key: 'textil',        i18n: 'secTextil',        label: 'Textil' },
    { key: 'medien_telekom',i18n: 'secMedienTelekom', label: 'Medien und Telekom' },
    { key: 'handel',        i18n: 'secHandel',        label: 'Handel' }
  ];

  // ── Build DOM (Widget-Shell unverändert) ───────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cb-btn{position:fixed;bottom:24px;right:24px;left:auto;display:flex;align-items:center;gap:.7rem;padding:.8rem 1.3rem .8rem .85rem;border-radius:50px;background:#fbfaf6;border:1px solid rgba(26,43,72,.12);cursor:pointer;z-index:900;box-shadow:0 14px 38px rgba(8,14,28,.45);transition:transform .2s,box-shadow .2s;max-width:calc(100vw - 3rem)}
    #cb-btn:hover{transform:translateY(-2px);box-shadow:0 18px 46px rgba(8,14,28,.55)}
    #cb-btn-ico{width:38px;height:38px;border-radius:50%;background:rgba(26,43,72,.08);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    #cb-btn-txt{text-align:left;line-height:1.2}
    #cb-btn-txt b{display:block;color:#1a2b48;font-size:.86rem;font-weight:700;letter-spacing:.01em;white-space:nowrap}
    #cb-btn-txt span{display:block;color:#D9B23A;font-size:.72rem;margin-top:1px;white-space:nowrap}
    #cb-win{position:fixed;bottom:7rem;right:24px;left:auto;width:420px;max-width:calc(100vw - 2rem);background:#fff;border-radius:16px;box-shadow:0 16px 60px rgba(0,0,0,.18);z-index:901;display:flex;flex-direction:column;overflow:hidden;opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transition:all .28s cubic-bezier(.22,1,.36,1);max-height:660px}
    #cb-win.open{opacity:1;visibility:visible;transform:none}
    #cb-head{background:var(--f,#1a2b48);padding:1rem 1.2rem;display:flex;align-items:center;gap:.8rem;flex-shrink:0}
    #cb-head-avatar{width:36px;height:36px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
    #cb-head-info{flex:1}
    #cb-head-name{color:#fff;font-weight:700;font-size:.9rem}
    #cb-head-status{color:rgba(255,255,255,.55);font-size:.72rem;display:flex;align-items:center;gap:5px}
    #cb-head-status::before{content:'';width:6px;height:6px;background:#4caf50;border-radius:50%;display:inline-block}
    #cb-close{background:none;border:none;color:rgba(255,255,255,.6);font-size:1.1rem;cursor:pointer;padding:4px;transition:color .2s}
    #cb-close:hover{color:#fff}
    #cb-msgs{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.7rem;scroll-behavior:smooth}
    .cb-msg{max-width:85%;padding:.75rem 1rem;border-radius:12px;font-size:.85rem;line-height:1.55;animation:cbMsgIn .25s ease both}
    @keyframes cbMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .cb-msg.bot{background:#f5f5f5;color:#1a1a1a;align-self:flex-start;border-bottom-left-radius:4px}
    .cb-msg.user{background:var(--f,#1a2b48);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
    .cb-msg a{color:inherit;text-decoration:underline}
    #cb-input-row{display:flex;gap:.5rem;padding:.75rem 1rem;border-top:1px solid #f0f0f0;flex-shrink:0}
    #cb-input{flex:1;border:1.5px solid #e0e0e0;border-radius:50px;padding:.5rem 1rem;font-size:.84rem;font-family:inherit;outline:none;transition:border-color .2s}
    #cb-input:focus{border-color:var(--f,#1a2b48)}
    #cb-send{background:var(--f,#1a2b48);border:none;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;transition:background .2s;flex-shrink:0}
    #cb-send:hover{background:var(--fm,#243e63)}
    #cb-typing{padding:.75rem 1rem;background:#f5f5f5;border-radius:12px;display:none;align-self:flex-start;align-items:center;gap:3px}
    #cb-typing.show{display:flex}
    .cb-dot{width:7px;height:7px;background:#aaa;border-radius:50%;animation:cbDot 1.2s infinite}
    .cb-dot:nth-child(2){animation-delay:.2s}
    .cb-dot:nth-child(3){animation-delay:.4s}
    @keyframes cbDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
    @media(max-width:480px){#cb-btn{padding:.7rem 1rem}#cb-btn-txt b{font-size:.78rem}#cb-btn-txt span{font-size:.66rem}#cb-win{left:0;right:0;bottom:0;border-radius:16px 16px 0 0;width:100%;max-height:78vh}}
    #cb-win .cb-valuation{ font-size:.92rem; line-height:1.5; }
    #cb-win .cb-valuation-grid{ display:grid; grid-template-columns:1fr 1fr; gap:.4rem; margin-top:.8rem; }
    #cb-win .cb-valuation-opt{ padding:.55rem .7rem; font-size:.78rem; text-align:left; background:#f5f5f5; border:1px solid #e0e0e0; border-radius:6px; color:#1a1a1a; cursor:pointer; transition:all .15s; }
    #cb-win .cb-valuation-opt:hover{ background:#eef1f6; border-color:var(--f,#1a2b48); }
    #cb-win .cb-typing-wrap{ font-style:italic; font-size:.82rem; color:#888; animation:cbPulse 1.4s ease-in-out infinite; }
    @keyframes cbPulse{ 0%,100%{opacity:.4} 50%{opacity:1} }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'cb-btn';
  btn.innerHTML = '<span id="cb-btn-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1a2b48" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span><span id="cb-btn-txt"><b>Vertrauliche Ersteinschätzung</b><span>mit dem BSF-Berater</span></span>';
  btn.setAttribute('aria-label', 'BSF-Berater öffnen');
  document.body.appendChild(btn);

  const win = document.createElement('div');
  win.id = 'cb-win';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'BSF Consulting Berater');
  win.innerHTML = `
    <div id="cb-head">
      <div id="cb-head-avatar"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
      <div id="cb-head-info">
        <div id="cb-head-name">BSF-Berater</div>
        <div id="cb-head-status">Online – Wir helfen gerne</div>
      </div>
      <button id="cb-close" aria-label="Schliessen">✕</button>
    </div>
    <div id="cb-msgs"></div>
    <div id="cb-input-row">
      <input id="cb-input" type="text" placeholder="Ihre Frage …" maxlength="200" autocomplete="off">
      <button id="cb-send" aria-label="Senden">→</button>
    </div>`;
  document.body.appendChild(win);

  const msgs = win.querySelector('#cb-msgs');
  const input = win.querySelector('#cb-input');
  let opened = false;

  // Statische Widget-Beschriftungen (Button, Kopf, Placeholder, Aria) lokalisieren.
  function localizeShell() {
    var bTitle = btn.querySelector('#cb-btn-txt b');
    var bSub = btn.querySelector('#cb-btn-txt span');
    if (bTitle) bTitle.textContent = t('shellTitle', 'Vertrauliche Ersteinschätzung');
    if (bSub) bSub.textContent = t('shellSub', 'mit dem BSF-Berater');
    btn.setAttribute('aria-label', t('openAria', 'BSF-Berater öffnen'));
    var nm = win.querySelector('#cb-head-name');
    if (nm) nm.textContent = t('headName', 'BSF-Berater');
    var st = win.querySelector('#cb-head-status');
    if (st) st.textContent = t('headStatus', 'Online – Wir helfen gerne');
    var cl = win.querySelector('#cb-close');
    if (cl) cl.setAttribute('aria-label', t('closeAria', 'Schliessen'));
    var sn = win.querySelector('#cb-send');
    if (sn) sn.setAttribute('aria-label', t('sendAria', 'Senden'));
    if (input) input.setAttribute('placeholder', t('inputPlaceholder', 'Ihre Frage …'));
  }
  localizeShell();

  // ── Basis-Helfer (unverändert wiederverwendet) ─────────────
  function addMsg(text, role) {
    const div = document.createElement('div');
    div.className = 'cb-msg ' + role;
    div.innerHTML = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.id = 'cb-typing';
    t.className = 'cb-msg bot show';
    t.innerHTML = '<span class="cb-dot"></span><span class="cb-dot"></span><span class="cb-dot"></span>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
    return t;
  }

  function formatReply(t) {
    return t
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/(\+41[\d\s]{8,})/g, '<a href="tel:$1">$1</a>')
      .replace(/^/, '<p>') + '</p>';
  }

  // ── Button-Reihen (State-Machine UI) ───────────────────────
  // items: [{ label, action } | { label, href }]
  // opts.grid / opts.btn -> CSS-Klassen (Default: cb-qr-grid / cb-qr-btn)
  function renderChoices(items, opts) {
    opts = opts || {};
    // Nur EIN aktiver Auswahl-Block: veraltete Buttons entfernen (z. B. wenn der
    // Nutzer Follow-ups ignoriert und stattdessen Freitext tippt).
    msgs.querySelectorAll('.cb-choice-wrap').forEach(function (w) { w.remove(); });
    var gridClass = opts.grid || 'cb-qr-grid';
    var btnClass = opts.btn || 'cb-qr-btn';
    var wrap = document.createElement('div');
    wrap.className = 'cb-qr-wrap cb-choice-wrap';
    var grid = document.createElement('div');
    grid.className = gridClass;
    items.forEach(function (it) {
      if (it.href) {
        var a = document.createElement('a');
        a.className = btnClass;
        a.href = it.href;
        a.textContent = it.label;
        grid.appendChild(a);
        return;
      }
      var b = document.createElement('button');
      b.className = btnClass;
      b.textContent = it.label;
      b.onclick = function () {
        wrap.remove();
        if (it.echo !== false) addMsg(it.label, 'user');
        it.action();
      };
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  // ── Conversation history für /api/chat (Mehrfach-Turn) ─────
  let conversationHistory = [];

  // userText -> an /api/chat. onReply(reply|null) optional; sonst Standard-Follow-up.
  async function sendToBSF(userText, onReply) {
    conversationHistory.push({ role: 'user', content: userText });
    const typingEl = showTyping();
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory, lang: cbLang() })
      });
      const data = await r.json();
      typingEl.remove();
      if (data.error) {
        addMsg(errMsg(), 'bot');
        if (onReply) onReply(null); else renderFollowup();
        return;
      }
      conversationHistory.push({ role: 'assistant', content: data.reply });
      addMsg(formatReply(data.reply), 'bot');
      if (onReply) onReply(data.reply); else renderFollowup();
    } catch (e) {
      typingEl.remove();
      addMsg(errMsg(), 'bot');
      if (onReply) onReply(null); else renderFollowup();
    }
  }

  // Freitext-Eingabe bleibt aktiv (Punkt 10)
  function send(text) {
    text = (text || input.value).trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');
    sendToBSF(text);
  }

  // Versteckter Prompt an /api/chat (Button-Label wurde bereits als User-Msg gezeigt)
  function askBackend(prompt) {
    sendToBSF(prompt);
  }

  // ── Standard-Follow-up nach jeder Backend-Antwort (Punkt 6) ─
  function renderFollowup() {
    renderChoices([
      { label: t('fuErstgespraech', 'Erstgespräch mit dem Patron'), action: booking },
      { label: t('fuMenu', 'Zur Auswahl'), action: renderMainMenu }
    ]);
  }

  // ── Hauptmenü ──────────────────────────────────────────────
  function renderMainMenu() {
    addMsg(t('greeting', 'Grüezi. Ich bin der BSF-Berater. Worum geht es?'), 'bot');
    renderChoices([
      { label: t('mSell', 'Unternehmen verkaufen / Nachfolge'), action: menuSell },
      { label: t('mBuy', 'Unternehmen kaufen'), action: menuBuy },
      { label: t('mVal', 'Was ist mein Unternehmen wert?'), action: valSector },
      { label: t('mOther', 'Anderes Anliegen'), action: menuOther }
    ]);
  }

  function menuSell() {
    addMsg(t('sellIntro', 'Ein Verkauf läuft bei BSF vertraulich und auf Patron-Niveau — von der Vorbereitung bis zum Closing. Was hilft Ihnen am meisten?'), 'bot');
    renderChoices([
      { label: t('mVal', 'Was ist mein Unternehmen wert?'), action: valSector },
      { label: t('sellReady', 'Bin ich verkaufsbereit?'), action: readyStart },
      { label: t('fuErstgespraech', 'Erstgespräch mit dem Patron'), action: booking }
    ]);
  }

  function menuBuy() {
    addMsg(t('buyIntro', 'Auf der Käuferseite suchen wir gezielt passende Ziele — wir vertreten ausschliesslich Sie, nie zugleich den Verkäufer. Was möchten Sie wissen?'), 'bot');
    renderChoices([
      { label: t('buyTypes', 'Welche Käufertypen sind aktiv?'), action: buyersSize },
      { label: t('fuErstgespraech', 'Erstgespräch mit dem Patron'), action: booking }
    ]);
  }

  function menuOther() {
    addMsg(t('otherIntro', 'Gern. Wählen Sie ein Thema oder tippen Sie Ihre Frage frei ein.'), 'bot');
    renderChoices([
      { label: t('otherHonorar', 'Honorar'), action: function () { askBackend('Erkläre kurz das Honorarmodell von BSF.'); } },
      { label: t('otherStandort', 'Standort'), action: function () { askBackend('Wo sitzt BSF und wie ist der Standort erreichbar?'); } },
      { label: t('otherErst', 'Erstgespräch'), action: booking }
    ]);
  }

  // ── Bewertung (geführt — Rechnung NUR im Backend) ──────────
  var valState = {};

  function valSector() {
    valState = {};
    addMsg(t('valSectorQ', 'Drei Klicks, dann eine indikative Bandbreite. In welchem Sektor sind Sie tätig?'), 'bot');
    renderChoices(
      SECTOR_OPTS.map(function (s) {
        return { label: t(s.i18n, s.label), action: function () { valState.sector = s.key; valEbitda(); } };
      }),
      { grid: 'cb-valuation-grid', btn: 'cb-valuation-opt' }
    );
  }

  function valEbitda() {
    addMsg(t('valEbitdaQ', 'Wie hoch ist Ihr bereinigtes EBITDA pro Jahr?'), 'bot');
    var opts = [
      { label: t('ebitda1', '1–2 Mio. €'), v: 1.5 },
      { label: t('ebitda2', '2–5 Mio. €'), v: 3.5 },
      { label: t('ebitda3', '5–10 Mio. €'), v: 7.5 },
      { label: t('ebitda4', 'Über 10 Mio. €'), v: 15 }
    ];
    renderChoices(opts.map(function (o) {
      return { label: o.label, action: function () { valState.ebitda = o.v; valGrowth(); } };
    }));
  }

  function valGrowth() {
    addMsg(t('valGrowthQ', 'Und wie entwickelt sich das Geschäft?'), 'bot');
    var opts = [
      { label: t('growthDeclining', 'Eher rückläufig'), v: 'declining' },
      { label: t('growthStable', 'Stabil'), v: 'stable' },
      { label: t('growthGrowing', 'Wachsend'), v: 'growing' }
    ];
    renderChoices(opts.map(function (o) {
      return { label: o.label, action: function () { valState.growth = o.v; runValuation(); } };
    }));
  }

  function runValuation() {
    var prompt = 'Berechne eine indikative Unternehmensbewertung mit dem Tool. Sektor: ' + valState.sector +
      '. Bereinigtes EBITDA: ' + valState.ebitda + ' Mio EUR. Wachstumsprofil: ' + valState.growth +
      '. Antworte in zwei bis drei Sätzen: Range, ein Werthebel-Hinweis, der Vorbehalt.';
    sendToBSF(prompt, function (reply) {
      var ev = parseEv(reply);
      if (ev) valState.ev = ev;
      renderChoices([
        { label: t('valBuyers', 'Welche Käufer passen?'), action: buyersFromVal },
        { label: t('fuErstgespraechShort', 'Erstgespräch'), action: booking },
        { label: t('valRecalc', 'Neu berechnen'), action: valSector }
      ]);
    });
  }

  // EV-Median aus Antworttext ableiten (falls möglich)
  function parseEv(text) {
    if (!text) return null;
    var range = text.match(/(\d+(?:[.,]\d+)?)\s*(?:–|-|bis)\s*(\d+(?:[.,]\d+)?)\s*Mio/i);
    if (range) {
      var a = parseFloat(range[1].replace(',', '.'));
      var b = parseFloat(range[2].replace(',', '.'));
      if (!isNaN(a) && !isNaN(b)) return Math.round((a + b) / 2);
    }
    var single = text.match(/(?:rund|ca\.?|etwa|ungefähr)\s*(\d+(?:[.,]\d+)?)\s*Mio/i);
    if (single) {
      var n = parseFloat(single[1].replace(',', '.'));
      if (!isNaN(n)) return Math.round(n);
    }
    return null;
  }

  // ── Käufertypen ────────────────────────────────────────────
  function buyersSize() {
    addMsg(t('buyersSizeQ', 'Wie gross ist das Unternehmen ungefähr (Enterprise Value)?'), 'bot');
    var opts = [
      { label: t('buyersUnder25', 'Unter 25 Mio. €'), v: 15 },
      { label: t('buyers25to100', '25–100 Mio. €'), v: 60 },
      { label: t('buyersOver100', 'Über 100 Mio. €'), v: 150 }
    ];
    renderChoices(opts.map(function (o) {
      return { label: o.label, action: function () { runBuyers(o.v); } };
    }));
  }

  function buyersFromVal() {
    if (valState.ev) { runBuyers(valState.ev); }
    else { buyersSize(); }
  }

  function runBuyers(ev) {
    var prompt = 'Welche Käufertypen sind für einen Enterprise Value von rund ' + ev +
      ' Mio EUR typisch? Nutze das Tool. Zwei bis drei Sätze, keine konkreten Käufernamen.';
    sendToBSF(prompt);
  }

  // ── Verkaufsbereitschaft (frontend-geführt) ────────────────
  function readyQuestions() {
    return [
      t('readyQ1', 'Liegen testierte Abschlüsse der letzten drei Jahre vor?'),
      t('readyQ2', 'Läuft das Geschäft drei Monate ohne Sie als Eigentümer?'),
      t('readyQ3', 'Machen Ihre drei grössten Kunden zusammen unter 40 % des Umsatzes aus?')
    ];
  }

  function readyStart() {
    readyAsk(0, 0);
  }

  function readyAsk(i, score) {
    var qs = readyQuestions();
    if (i >= qs.length) { readyVerdict(score); return; }
    addMsg(qs[i], 'bot');
    renderChoices([
      { label: t('yes', 'Ja'), action: function () { readyAsk(i + 1, score + 1); } },
      { label: t('no', 'Nein'), action: function () { readyAsk(i + 1, score); } }
    ]);
  }

  function readyVerdict(score) {
    var verdict;
    if (score === 3) {
      verdict = t('readyVerdictHigh', 'Solide vorbereitet. Im Erstgespräch verfeinern wir Details und Zeitpunkt.');
    } else if (score === 2) {
      verdict = t('readyVerdictMid', 'Grundsätzlich auf Kurs — ein, zwei Hebel sind noch offen. Vor dem Prozess gut lösbar.');
    } else {
      verdict = t('readyVerdictLow', 'Es lohnt sich, vor einem Verkaufsprozess zu strukturieren. Genau dafür ist das Erstgespräch da.');
    }
    addMsg(verdict, 'bot');
    renderChoices([
      { label: t('fuErstgespraechShort', 'Erstgespräch'), action: booking },
      { label: t('fuMenu', 'Zur Auswahl'), action: renderMainMenu }
    ]);
  }

  // ── Erstgespräch / Booking ─────────────────────────────────
  function booking() {
    if (window.openBooking) window.openBooking();
    addMsg(t('bookingMsg', 'Vertraulich, kostenfrei, auf Wunsch unter NDA — der Patron meldet sich innerhalb eines Werktags.'), 'bot');
    renderChoices([
      { label: t('callLabel', 'Anrufen: +41 41 760 36 16'), href: 'tel:+41417603616' },
      { label: t('fuMenu', 'Zur Auswahl'), action: renderMainMenu }
    ]);
  }

  // ── Öffnen / Schliessen ────────────────────────────────────
  function open() {
    win.classList.add('open');
    opened = true;
    if (msgs.childElementCount === 0) {
      setTimeout(function () { renderMainMenu(); }, 200);
    }
    input.focus();
  }

  function close() { win.classList.remove('open'); }
  window.closeChatbot = close;

  btn.addEventListener('click', () => win.classList.contains('open') ? close() : open());
  win.querySelector('#cb-close').addEventListener('click', close);
  win.querySelector('#cb-send').addEventListener('click', () => send());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  // i18n nachgeladen / Sprache gewechselt: Shell neu beschriften und – falls ein
  // Menü offen ist – die Buttons sofort in der neuen Sprache neu rendern.
  document.addEventListener('i18n:loaded', function () {
    localizeShell();
    if (opened && msgs.querySelector('.cb-choice-wrap')) {
      msgs.querySelectorAll('.cb-choice-wrap').forEach(function (w) { w.remove(); });
      renderMainMenu();
    }
  });

  // Auto-open-Hinweis-Slot (unverändert, ohne Badge)
  if (!sessionStorage.getItem('cb_shown')) {
    setTimeout(() => { sessionStorage.setItem('cb_shown', '1'); }, 8000);
  }
})();
