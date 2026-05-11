// ============================================================
//  Camping Sulmsee – Chatbot Widget
// ============================================================
(function () {
  const KB = [
    // Buchung
    { k: ['buchen','buchung','reservier','anfrage','verfügbar'], r: 'Sie können direkt über unser <a href="/" style="color:var(--el)">Buchungsformular</a> buchen – oder rufen Sie uns an: <strong>+43 3452 82866</strong>. Wir bestätigen innerhalb von 24 Stunden.' },
    // Preise
    { k: ['preis','kosten','was kostet','wie viel','tarif','günstig','teuer'], r: 'Unsere Preise 2025: Stellplatz ab <strong>€ 12,10/Nacht</strong>, Erwachsene ab <strong>€ 8,00/Nacht</strong>. Alle Details auf der <a href="/preise" style="color:var(--el)">Preisseite</a>.' },
    // Öffnungszeiten
    { k: ['öffnung','geöffnet','saison','wann','datum','april','oktober'], r: 'Unsere Saison 2025 läuft vom <strong>17. April bis 26. Oktober 2025</strong>. Check-in Mo–Do 9–12 &amp; 14–18 Uhr, Fr–So bis 19 Uhr.' },
    // Anfahrt
    { k: ['anfahrt','anreise','wie komm','wo ist','adresse','navigation','route','navi','gps'], r: 'Wir befinden uns: <strong>Sulmsee 1, 8430 Leibnitz</strong>. Mit dem Auto: A9, Ausfahrt Leibnitz. Alle Details auf der <a href="/anreise" style="color:var(--el)">Anreiseseite</a>.' },
    // Stellplätze
    { k: ['stellplatz','platz','sulmsee','silbersee','seeblick','seeufer','camping'], r: 'Wir haben <strong>88 Stellplätze</strong> auf 100–150 m², davon 24 direkt am See (Sulmsee-Plätze) und 64 im grünen Herz des Platzes (Silbersee-Plätze). <a href="/stellplaetze" style="color:var(--el)">Mehr Info</a>' },
    // WLAN
    { k: ['wlan','wifi','internet','netz'], r: '<strong>Kostenloses WLAN</strong> ist auf dem gesamten Campinggelände verfügbar – für alle Gäste inklusive.' },
    // Hunde
    { k: ['hund','hunde','tier','haustier','pet'], r: 'Hunde sind herzlich willkommen! Bis zu <strong>2 Hunde pro Stellplatz</strong>, Gebühr: € 4,20/Hund/Nacht. Bitte immer angeleint halten.' },
    // Kinder
    { k: ['kinder','kind','baby','familie','familien'], r: 'Wir sind sehr familienfreundlich! Kinder (3–9 J.) zahlen ab <strong>€ 4,80/Nacht</strong>. Der See bietet sicheres Baden, es gibt Spielmöglichkeiten und viel Platz.' },
    // Strom
    { k: ['strom','elektrizität','stromanschluss','elektro','ampere'], r: '10 Ampere Stromanschluss optional buchbar für <strong>€ 5,00/Nacht</strong>. Bitte bei der Buchung angeben.' },
    // Restaurant
    { k: ['restaurant','essen','küche','gaststätte','speisen','frühstück'], r: 'Unser Restaurant ist <strong>ab 1. Mai</strong> geöffnet. Frische, regionale Küche – direkt am Campingplatz.' },
    // Freizeit
    { k: ['fahrrad','rad','ebike','wandern','freizeit','aktivität','ausflug','wein','buschenschank'], r: 'Rund um den Sulmsee gibt es viel zu erleben: Radtouren, eBike-Verleih, Wandern, Buschenschanken und mehr. <a href="/freizeit" style="color:var(--el)">Alle Aktivitäten</a>' },
    // Sanitär
    { k: ['sanitär','dusche','toilette','wc','bad','waschraum'], r: 'Wir haben <strong>moderne Sanitäranlagen</strong> mit Duschen, WC und Waschräumen – alles sauber und gepflegt. Inklusive im Stellplatzpreis.' },
    // Check-in/out
    { k: ['check-in','checkin','anmeldung','eincheck','check out','abreise','abmeldung'], r: '<strong>Check-in</strong> Mo–Do: 9–12 &amp; 14–18 Uhr | Fr–So: 9–12 &amp; 14–19 Uhr<br><strong>Check-out</strong> täglich bis 12:00 Uhr.' },
    // Zahlung
    { k: ['zahlen','zahlung','bezahlen','kartenzahlung','bar','kreditkarte','ec'], r: 'Zahlung vor Ort beim Check-in: <strong>Bar, EC/Maestro, Visa, Mastercard, American Express</strong>.' },
    // Kontakt
    { k: ['kontakt','telefon','email','mail','rückruf','sprechen'], r: 'Erreichen Sie uns unter:<br>📞 <a href="tel:004334528286" style="color:var(--el)">+43 3452 82866</a><br>✉️ <a href="mailto:office@sulmsee.at" style="color:var(--el)">office@sulmsee.at</a>' },
    // Danke
    { k: ['danke','dankeschön','super','perfekt','toll','klasse'], r: 'Sehr gerne! Wir freuen uns auf Ihren Besuch am Sulmsee. 🌊 Haben Sie noch eine Frage?' },
    // Grüße
    { k: ['hallo','hi','guten tag','guten morgen','servus','hej'], r: 'Hallo! Willkommen beim Camping Sulmsee 👋 Wie kann ich Ihnen helfen? Sie können mir gerne eine Frage stellen!' },
  ];

  const FALLBACK = 'Entschuldigung, darauf habe ich keine direkte Antwort. Bitte kontaktieren Sie uns direkt:<br>📞 <strong>+43 3452 82866</strong> oder ✉️ <a href="mailto:office@sulmsee.at" style="color:var(--el)">office@sulmsee.at</a>';

  const QUICK = [
    { l: '💰 Preise', q: 'Was kostet ein Stellplatz?' },
    { l: '📅 Saison', q: 'Wann ist Saison?' },
    { l: '🐕 Hunde', q: 'Sind Hunde erlaubt?' },
    { l: '📶 WLAN', q: 'Gibt es WLAN?' },
    { l: '🗓 Buchen', q: 'Wie kann ich buchen?' },
    { l: '🗺️ Anfahrt', q: 'Wie komme ich hin?' },
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
    #cb-btn{position:fixed;bottom:2rem;left:2rem;width:54px;height:54px;border-radius:50%;background:var(--f,#1e4032);border:none;cursor:pointer;z-index:900;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:1.4rem;transition:transform .2s,box-shadow .2s;animation:cbBounce 3s ease-in-out 2s both}
    #cb-btn:hover{transform:scale(1.08);box-shadow:0 8px 28px rgba(0,0,0,.3)}
    @keyframes cbBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
    #cb-badge{position:absolute;top:-4px;right:-4px;background:#e74c3c;color:#fff;font-size:.6rem;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;animation:none}
    #cb-win{position:fixed;bottom:7rem;left:2rem;width:340px;max-width:calc(100vw - 2rem);background:#fff;border-radius:16px;box-shadow:0 16px 60px rgba(0,0,0,.18);z-index:901;display:flex;flex-direction:column;overflow:hidden;opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transition:all .28s cubic-bezier(.22,1,.36,1);max-height:520px}
    #cb-win.open{opacity:1;visibility:visible;transform:none}
    #cb-head{background:var(--f,#1e4032);padding:1rem 1.2rem;display:flex;align-items:center;gap:.8rem;flex-shrink:0}
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
    .cb-msg.user{background:var(--f,#1e4032);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
    .cb-msg a{color:inherit;text-decoration:underline}
    #cb-quick{display:flex;flex-wrap:wrap;gap:.4rem;padding:.6rem 1rem;border-top:1px solid #f0f0f0;flex-shrink:0}
    .cb-q{background:none;border:1px solid #e0e0e0;border-radius:50px;padding:.3rem .75rem;font-size:.75rem;color:#444;cursor:pointer;transition:all .18s;font-family:inherit;white-space:nowrap}
    .cb-q:hover{background:var(--fp,#eaf4ee);border-color:var(--fl,#3d7a5c);color:var(--f,#1e4032)}
    #cb-input-row{display:flex;gap:.5rem;padding:.75rem 1rem;border-top:1px solid #f0f0f0;flex-shrink:0}
    #cb-input{flex:1;border:1.5px solid #e0e0e0;border-radius:50px;padding:.5rem 1rem;font-size:.84rem;font-family:inherit;outline:none;transition:border-color .2s}
    #cb-input:focus{border-color:var(--f,#1e4032)}
    #cb-send{background:var(--f,#1e4032);border:none;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;transition:background .2s;flex-shrink:0}
    #cb-send:hover{background:var(--fm,#2c5c46)}
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
  btn.innerHTML = '💬<span id="cb-badge">1</span>';
  btn.setAttribute('aria-label', 'Chat öffnen');
  document.body.appendChild(btn);

  const win = document.createElement('div');
  win.id = 'cb-win';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Camping Sulmsee Chatbot');
  win.innerHTML = `
    <div id="cb-head">
      <div id="cb-head-avatar">🏕️</div>
      <div id="cb-head-info">
        <div id="cb-head-name">Camping Sulmsee</div>
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
      setTimeout(() => addMsg('Willkommen beim <strong>Camping Sulmsee</strong>! 🌊 Ich bin hier um Ihnen zu helfen. Was möchten Sie wissen?', 'bot'), 200);
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
