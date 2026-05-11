// ============================================================
//  BSF Consulting AG – Concierge Widget
// ============================================================
(function () {
  const KB = [
    // Erstgespräch
    { k: ['erstgespräch','erstgespraech','beratung','termin','kennenlernen','gespräch','sprechen','treffen','anfang','start'],
      r: 'Ein Erstgespräch ist kostenfrei, vertraulich und unverbindlich. Wir sondieren Ihre Lage und geben eine klare Empfehlung. <a href="kontakt.html" style="color:var(--el)">Termin anfragen →</a>' },

    // Mandate / Was BSF macht
    { k: ['mandat','was macht','was tut','dienstleistung','service','m&a','ma','beraten','angebot','leistung'],
      r: 'Wir begleiten Übergänge — Verkauf, Kauf, Nachfolge, Restrukturierung, Joint Ventures. Eine Seite pro Mandat, exklusiv, mit verifizierten Partnern. <a href="stellplaetze.html" style="color:var(--el)">Mandate ansehen →</a>' },

    // Verkauf
    { k: ['verkauf','verkaufen','unternehmensverkauf','exit','sale','veräussern'],
      r: 'Verkaufsmandate führen wir typisch über 6–18 Monate. Vom Erstgespräch über Datenraum und Marktansprache bis zum Closing. <a href="stellplaetze.html" style="color:var(--el)">Mehr →</a>' },

    // Kauf
    { k: ['kauf','kaufen','akquisition','übernahme','buyside','zukauf','akquirieren'],
      r: 'Buy-Side-Mandate: Strategische Akquisitionen für Schweizer Mittelständler, oft mit Targets in DACH oder der Türkei. <a href="stellplaetze.html" style="color:var(--el)">Mehr →</a>' },

    // Nachfolge
    { k: ['nachfolge','übergabe','generation','familie','familienunternehmen','erbe','erbfolge'],
      r: 'Nachfolgemandate beginnen oft Jahre vor der eigentlichen Übergabe. Wir begleiten innerfamiliäre Lösungen, Management-Buyouts und externe Käufer. <a href="stellplaetze.html" style="color:var(--el)">Nachfolge →</a>' },

    // Restrukturierung
    { k: ['restruktur','umstrukturier','sanierung','holding','umwandlung','neuausrichtung'],
      r: 'Restrukturierung kann präventiv oder reaktiv sein. Wir ordnen Gesellschaftsstrukturen — bevor sie ordnungsbedürftig werden. <a href="stellplaetze.html" style="color:var(--el)">Mehr →</a>' },

    // Joint Ventures
    { k: ['joint venture','jointventure','kooperation','partnerschaft','allianz','zusammenarbeit'],
      r: 'Grenzüberschreitende Joint Ventures insbesondere zwischen DACH und der Türkei. Wir begleiten Struktur, Verhandlung und Vereinbarung. <a href="stellplaetze.html" style="color:var(--el)">Mehr →</a>' },

    // Honorar
    { k: ['honorar','kosten','preis','was kostet','konditionen','fee','provision','prozent','vergütung'],
      r: 'Unser Honorar setzt sich zusammen aus monatlichem Retainer und Erfolgskomponente. Konkrete Konditionen vereinbaren wir nach dem Erstgespräch — schriftlich. <a href="preise.html" style="color:var(--el)">Honorarstruktur →</a>' },

    // Erstgespräch Kosten
    { k: ['erstgespräch kostenlos','kostenlos','gratis','umsonst','free','ohne kosten'],
      r: 'Das Erstgespräch ist kostenfrei. Wir vereinbaren konkrete Konditionen erst, wenn ein Mandat sinnvoll erscheint — beidseits.' },

    // Mindestauftrag
    { k: ['mindest','minimum','klein','grösse','volumen','wie gross','wie hoch','ab wann'],
      r: 'Wir konzentrieren uns auf Mandate ab ca. CHF 5 Millionen Transaktionsvolumen. Bei Nachfolgesituationen mit besonderer Geschichte auch kleiner. <a href="kontakt.html" style="color:var(--el)">Im Erstgespräch klären →</a>' },

    // Diskretion
    { k: ['diskret','vertraulich','geheim','nda','vertraulichkeit','geheimhaltung','anonym'],
      r: 'Vertraulichkeit ist die Voraussetzung unseres Geschäfts. NDA ab dem ersten Wort. Wir nennen keine Klienten und veröffentlichen keine Referenzen.' },

    // Sitz / Standort
    { k: ['wo','sitz','adresse','standort','büro','zug','schweiz','gubelstrasse'],
      r: 'Wir sitzen in Zug — Gubelstrasse 12, CH-6300. Fünf Minuten vom Bahnhof, dreissig vom Flughafen Zürich. <a href="anreise.html" style="color:var(--el)">Anreise →</a>' },

    // Reichweite
    { k: ['länder','wo arbeitet','international','türkei','deutschland','österreich','dach','reichweite','markt'],
      r: 'Unsere Reichweite umfasst DACH (Schweiz, Deutschland, Österreich) und die Türkei. Mandate in anderen Ländern führen wir auf Anfrage mit lokalen Partnern.' },

    // Erfahrung / Track Record
    { k: ['erfahrung','wie lange','seit wann','seit','gegründet','tradition','track record','referenzen'],
      r: 'BSF Consulting AG besteht seit 1998. Wir haben über 200 Mandate begleitet, in 12 Sektoren, mit einem Transaktionsvolumen von rund EUR 2,4 Milliarden.' },

    // Sektoren
    { k: ['sektor','branche','industrie','was für firmen','welche unternehmen','spezialisiert','fokus'],
      r: 'Wir arbeiten branchenoffen mit Schwerpunkten in Industrie, Konsumgüter, Energie, Technologie und Gesundheitswesen. Sektoranalyse halbjährlich in unserer Transaktionsuhr.' },

    // Transaktionsuhr
    { k: ['transaktionsuhr','uhr','zyklus','marktanalyse','timing','wann verkaufen','marktphase'],
      r: 'Unsere Transaktionsuhr zeigt halbjährlich die Marktphase für 12 Sektoren — Hoch, Abkühlung, Tief, Aufschwung. Kostenfrei nach Erstgespräch. <a href="kontakt.html" style="color:var(--el)">Ausgabe anfragen →</a>' },

    // Kontakt
    { k: ['kontakt','telefon','email','mail','anrufen','schreiben','erreichen'],
      r: 'Erreichbar unter:<br>📞 <a href="tel:+41417603616" style="color:var(--el)">+41 41 760 36 16</a><br>✉️ <a href="mailto:info@bsfconsulting.ch" style="color:var(--el)">info@bsfconsulting.ch</a>' },

    // Begrüssung
    { k: ['hallo','hi','guten tag','guten morgen','servus','grüezi','grüss','guten abend'],
      r: 'Grüezi! Ich bin der Concierge der BSF Consulting AG. Wie kann ich Ihnen helfen? Sie können nach Mandaten, Honorar, Standort oder anderen Themen fragen.' },

    // Danke
    { k: ['danke','dankeschön','super','perfekt','klasse','top','toll','gut gemacht'],
      r: 'Gerne. Wenn Sie ein konkretes Anliegen besprechen möchten: <a href="kontakt.html" style="color:var(--el)">Erstgespräch vereinbaren →</a>' },
  ];

  const FALLBACK = 'Dazu habe ich keine direkte Antwort. Bitte kontaktieren Sie uns:<br>📞 <a href="tel:+41417603616" style="color:var(--el)">+41 41 760 36 16</a> oder ✉️ <a href="mailto:info@bsfconsulting.ch" style="color:var(--el)">info@bsfconsulting.ch</a>';

  const QUICK = [
    { l: '🤝 Erstgespräch', q: 'Wie läuft ein Erstgespräch ab?' },
    { l: '💼 Mandate', q: 'Was für Mandate begleitet BSF?' },
    { l: '💰 Honorar', q: 'Was kostet ein Mandat?' },
    { l: '🔒 Diskretion', q: 'Wie diskret ist BSF?' },
    { l: '📍 Standort', q: 'Wo ist BSF ansässig?' },
    { l: '📊 Transaktionsuhr', q: 'Was ist die Transaktionsuhr?' },
  ];

  function answer(msg) {
    const low = msg.toLowerCase();
    for (const entry of KB) {
      if (entry.k.some(k => low.includes(k))) return entry.r;
    }
    return FALLBACK;
  }

  // ── Build DOM ──────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cb-btn{position:fixed;bottom:2rem;left:2rem;width:54px;height:54px;border-radius:50%;background:var(--f,#1a2b48);border:none;cursor:pointer;z-index:900;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:1.4rem;transition:transform .2s,box-shadow .2s;animation:cbBounce 3s ease-in-out 2s both}
    #cb-btn:hover{transform:scale(1.08);box-shadow:0 8px 28px rgba(0,0,0,.3)}
    @keyframes cbBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
    #cb-badge{position:absolute;top:-4px;right:-4px;background:#e74c3c;color:#fff;font-size:.6rem;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;animation:none}
    #cb-win{position:fixed;bottom:7rem;left:2rem;width:340px;max-width:calc(100vw - 2rem);background:#fff;border-radius:16px;box-shadow:0 16px 60px rgba(0,0,0,.18);z-index:901;display:flex;flex-direction:column;overflow:hidden;opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transition:all .28s cubic-bezier(.22,1,.36,1);max-height:520px}
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
    #cb-quick{display:flex;flex-wrap:wrap;gap:.4rem;padding:.6rem 1rem;border-top:1px solid #f0f0f0;flex-shrink:0}
    .cb-q{background:none;border:1px solid #e0e0e0;border-radius:50px;padding:.3rem .75rem;font-size:.75rem;color:#444;cursor:pointer;transition:all .18s;font-family:inherit;white-space:nowrap}
    .cb-q:hover{background:var(--fp,#eaeef5);border-color:var(--fl,#4a6788);color:var(--f,#1a2b48)}
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
    @media(max-width:480px){#cb-win{left:0;bottom:0;border-radius:16px 16px 0 0;width:100%;max-height:75vh}}
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'cb-btn';
  btn.innerHTML = '🎙<span id="cb-badge">1</span>';
  btn.setAttribute('aria-label', 'Concierge öffnen');
  document.body.appendChild(btn);

  const win = document.createElement('div');
  win.id = 'cb-win';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'BSF Consulting Concierge');
  win.innerHTML = `
    <div id="cb-head">
      <div id="cb-head-avatar">🏛️</div>
      <div id="cb-head-info">
        <div id="cb-head-name">BSF Concierge</div>
        <div id="cb-head-status">Online – Wir helfen gerne</div>
      </div>
      <button id="cb-close" aria-label="Schließen">✕</button>
    </div>
    <div id="cb-msgs"></div>
    <div id="cb-quick"></div>
    <div id="cb-input-row">
      <input id="cb-input" type="text" placeholder="Ihre Frage …" maxlength="200" autocomplete="off">
      <button id="cb-send" aria-label="Senden">➤</button>
    </div>`;
  document.body.appendChild(win);

  const msgs = win.querySelector('#cb-msgs');
  const input = win.querySelector('#cb-input');
  const quickBar = win.querySelector('#cb-quick');
  let opened = false;

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

  function buildQuick() {
    quickBar.innerHTML = '';
    QUICK.forEach(q => {
      const b = document.createElement('button');
      b.className = 'cb-q';
      b.textContent = q.l;
      b.onclick = () => send(q.q);
      quickBar.appendChild(b);
    });
  }

  function send(text) {
    text = (text || input.value).trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');
    const typing = showTyping();
    setTimeout(() => {
      typing.remove();
      addMsg(answer(text), 'bot');
    }, 600 + Math.random() * 400);
  }

  function open() {
    win.classList.add('open');
    btn.querySelector('#cb-badge').style.display = 'none';
    opened = true;
    if (msgs.childElementCount === 0) {
      setTimeout(() => addMsg('Grüezi! Ich bin der Concierge der <strong>BSF Consulting AG</strong>. Wie kann ich Ihnen helfen?', 'bot'), 200);
      buildQuick();
    }
    input.focus();
  }

  function close() { win.classList.remove('open'); }

  btn.addEventListener('click', () => win.classList.contains('open') ? close() : open());
  win.querySelector('#cb-close').addEventListener('click', close);
  win.querySelector('#cb-send').addEventListener('click', () => send());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  // Auto-open hint after 8s on first visit
  if (!sessionStorage.getItem('cb_shown')) {
    setTimeout(() => {
      sessionStorage.setItem('cb_shown', '1');
      if (!opened) btn.querySelector('#cb-badge').style.animation = 'cbBounce .5s ease infinite alternate';
    }, 8000);
  } else {
    btn.querySelector('#cb-badge').style.display = 'none';
  }
})();
