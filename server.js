require('dotenv').config();
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── Datenbank ────────────────────────────────────────────────────────────────
const db = new DatabaseSync('sulmsee.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ref         TEXT    UNIQUE,
    created_at  TEXT,
    arrival     TEXT,
    departure   TEXT,
    nights      INTEGER,
    adults      INTEGER,
    youth       INTEGER,
    kids        INTEGER,
    spot        TEXT,
    spot_note   TEXT,
    vehicle     TEXT,
    extras      TEXT,
    fname       TEXT,
    lname       TEXT,
    email       TEXT,
    phone       TEXT,
    street      TEXT,
    city        TEXT,
    country     TEXT,
    message     TEXT,
    payment     TEXT,
    total       REAL,
    status      TEXT DEFAULT 'pending'
  );
  CREATE TABLE IF NOT EXISTS contacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT,
    fname       TEXT,
    lname       TEXT,
    email       TEXT,
    arrival     TEXT,
    departure   TEXT,
    message     TEXT,
    status      TEXT DEFAULT 'new'
  );
`);

// ─── E-Mail ───────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail(opts) {
  if (!process.env.SMTP_USER) return;
  try { await transporter.sendMail(opts); }
  catch (e) { console.error('E-Mail-Fehler:', e.message); }
}

// ─── Multi-Page: Haupt-HTML laden und Sektionen extrahieren ──────────────────
const mainHtmlPath = path.join(__dirname, 'camping-sulmsee-final2.html');
let rawHtml = '';
let navBlock = '', modalBlock = '', footerBlock = '', fctaBlock = '', scriptBlock = '';
const sections = {};

function extractSection(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) return '';
  const end = endMarker ? html.indexOf(endMarker, start) : html.length;
  if (end === -1) return html.slice(start);
  return html.slice(start, end).trim();
}

function loadMainHtml() {
  rawHtml = fs.readFileSync(mainHtmlPath, 'utf8');

  // navBlock includes the mobile-menu overlay that sits just before <nav>
  navBlock    = extractSection(rawHtml, '<div class="mob-menu"', '<!-- ========== BOOKING MODAL');
  modalBlock  = extractSection(rawHtml, '<!-- ========== BOOKING MODAL', '<!-- ========== HERO');
  footerBlock = extractSection(rawHtml, '<!-- ========== FOOTER', null)
                  .replace(/<\/body>\s*<\/html>\s*$/s, '').trim();

  // FCTA floating button
  fctaBlock = extractSection(rawHtml, '<!-- FLOATING CTA', '<script>');

  // Main script block (everything from first <script> after FOOTER marker to </body>)
  const scriptStartIdx = rawHtml.indexOf('<script>', rawHtml.indexOf('<!-- FLOATING CTA'));
  const bodyEndIdx     = rawHtml.lastIndexOf('</body>');
  scriptBlock = rawHtml.slice(scriptStartIdx, bodyEndIdx).trim();

  // Homepage sections
  sections.hero         = extractSection(rawHtml, '<!-- ========== HERO',         '<!-- ========== ABOUT');
  sections.about        = extractSection(rawHtml, '<!-- ========== ABOUT',        '<!-- ========== STELLPLAETZE');
  sections.testimonials = extractSection(rawHtml, '<!-- ========== TESTIMONIALS', '<!-- ========== ANREISE');

  // Sub-page content sections
  sections.stellplaetze = extractSection(rawHtml, '<!-- ========== STELLPLAETZE', '<!-- ========== PREISE');
  sections.preise       = extractSection(rawHtml, '<!-- ========== PREISE',       '<!-- ========== FREIZEIT');
  sections.freizeit     = extractSection(rawHtml, '<!-- ========== FREIZEIT',     '<!-- ========== GALLERY');
  sections.gallery      = extractSection(rawHtml, '<!-- ========== GALLERY',      '<!-- ========== TESTIMONIALS');
  sections.anreise      = extractSection(rawHtml, '<!-- ========== ANREISE',      '<!-- ========== FAQ');
  sections.faq          = extractSection(rawHtml, '<!-- ========== FAQ',          '<!-- ========== CONTACT');
  sections.contact      = extractSection(rawHtml, '<!-- ========== CONTACT',      '<!-- ========== FOOTER');
}

loadMainHtml();

// ─── Sub-Page Builder ─────────────────────────────────────────────────────────
const pageHeroes = {
  stellplaetze: { title: 'Unsere Stellplätze',   sub: '88 Plätze direkt am Wasser – finden Sie Ihren perfekten Platz.' },
  preise:       { title: 'Preise & Tarife',       sub: 'Transparente Preise für unvergessliche Urlaubsmomente.' },
  freizeit:     { title: 'Freizeit & Aktivitäten', sub: 'Natur, Wein und Abenteuer – Südsteiermark erleben.' },
  anreise:      { title: 'Anreise & Lage',        sub: 'So einfach finden Sie uns am malerischen Sulmsee.' },
  kontakt:      { title: 'Kontakt',               sub: 'Wir freuen uns auf Ihre Nachricht. Melden Sie sich gerne.' },
};

const navActive = {
  stellplaetze: 'stellplaetze',
  preise:       'preise',
  freizeit:     'freizeit',
  anreise:      'anreise',
  kontakt:      'kontakt',
};

function buildSubPage(pageKey, contentBlocks) {
  const hero = pageHeroes[pageKey];
  const activeKey = navActive[pageKey];

  // Patch nav links to mark current page active
  const patchedNav = navBlock.replace(
    /(<a[^>]+href="\/([^"]+)"[^>]*)(>)/g,
    (match, before, slug, gt) => {
      if (slug === activeKey) return before + ' class="nav-link-active"' + gt;
      return match;
    }
  );

  const pageHeroHtml = `
<section class="page-hero" style="background:linear-gradient(135deg,var(--f) 0%,var(--fm,#2c5c46) 100%);padding:7rem 2rem 4rem;text-align:center;color:#fff;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:url('sulmsee_sommer21-25.jpg') center/cover no-repeat;opacity:.18"></div>
  <div style="position:relative;z-index:1;max-width:700px;margin:0 auto">
    <h1 style="font-family:'Lora',serif;font-size:clamp(2rem,5vw,3.2rem);margin-bottom:.75rem;text-shadow:0 2px 12px rgba(0,0,0,.35)">${hero.title}</h1>
    <p style="font-size:1.1rem;opacity:.88;max-width:520px;margin:0 auto">${hero.sub}</p>
  </div>
</section>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${hero.title} – Camping Sulmsee</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Nunito:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<style>
  .nav-link-active{color:var(--e,#c8a84b)!important;font-weight:700}
  .page-hero{padding-top:calc(var(--nav-h,72px) + 4rem)!important}
</style>
</head>
<body>
<div class="page-loader" id="loader"><div class="loader-bar"></div></div>
<div class="scroll-progress" id="scrollProgress"></div>
${patchedNav}
${modalBlock}
${pageHeroHtml}
${contentBlocks.join('\n')}
${fctaBlock}
${footerBlock}
${scriptBlock}
<script src="/chatbot.js"></script>
</body>
</html>`;
}

// ─── POST /api/booking ────────────────────────────────────────────────────────
app.post('/api/booking', async (req, res) => {
  try {
    const d = req.body;

    if (!d.fname || !d.lname || !d.email || !d.arrival || !d.departure) {
      return res.status(400).json({ success: false, error: 'Pflichtfelder fehlen.' });
    }

    const ref = 'CS-2025-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO bookings
        (ref, created_at, arrival, departure, nights, adults, youth, kids,
         spot, spot_note, vehicle, extras, fname, lname, email, phone,
         street, city, country, message, payment, total)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ref, now,
      d.arrival, d.departure, d.nights,
      d.adults, d.youth, d.kids,
      d.spot, d.spotNote || '',
      d.vehicle || '',
      JSON.stringify(d.extras || []),
      d.fname, d.lname, d.email, d.phone || '',
      d.street || '', d.city || '', d.country || '',
      d.message || '',
      d.payment || '',
      d.total || 0,
    );

    await sendMail({
      from:    `"Camping Sulmsee" <${process.env.SMTP_USER}>`,
      to:      d.email,
      subject: `Buchungsanfrage ${ref} – Camping Sulmsee`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;color:#1a1a1a">
          <h2 style="color:#1e4032">Vielen Dank für Ihre Buchungsanfrage!</h2>
          <p>Liebe/r ${d.fname} ${d.lname},</p>
          <p>wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden
             mit Ihrer Buchungsbestätigung.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            ${row('Buchungsreferenz', `<strong>${ref}</strong>`)}
            ${row('Anreise', d.arrival)}
            ${row('Abreise', d.departure)}
            ${row('Nächte', d.nights)}
            ${row('Personen', `${d.adults} Erw., ${d.youth} Jug., ${d.kids} Ki.`)}
            ${row('Stellplatz', d.spot === 'sulmsee' ? 'Sulmsee (1–24)' : 'Silbersee (25–88)')}
            ${row('Gesamtbetrag (exkl. Ortstaxe)', `EUR ${Number(d.total).toFixed(2)}`)}
          </table>
          <p>Die Zahlung erfolgt vor Ort beim Check-in.</p>
          <p style="margin-top:24px">Mit freundlichen Grüßen,<br>
             <strong>Ihr Team vom Camping Sulmsee</strong></p>
        </div>`,
    });

    await sendMail({
      from:    `"Camping Sulmsee Website" <${process.env.SMTP_USER}>`,
      to:      process.env.OWNER_EMAIL || process.env.SMTP_USER,
      subject: `Neue Buchungsanfrage ${ref} – ${d.fname} ${d.lname}`,
      html: `
        <div style="font-family:sans-serif;color:#1a1a1a">
          <h2 style="color:#1e4032">Neue Buchungsanfrage</h2>
          <table style="border-collapse:collapse;width:100%;max-width:560px">
            ${row('Referenz', ref)}
            ${row('Gast', `${d.fname} ${d.lname}`)}
            ${row('E-Mail', d.email)}
            ${row('Telefon', d.phone || '–')}
            ${row('Adresse', [d.street, d.city, d.country].filter(Boolean).join(', ') || '–')}
            ${row('Anreise', d.arrival)}
            ${row('Abreise', d.departure)}
            ${row('Nächte', d.nights)}
            ${row('Personen', `${d.adults} Erw., ${d.youth} Jug., ${d.kids} Ki.`)}
            ${row('Stellplatz', d.spot)}
            ${row('Fahrzeug', d.vehicle || '–')}
            ${row('Extras', (d.extras || []).join(', ') || '–')}
            ${row('Zahlung', d.payment || '–')}
            ${row('Gesamtbetrag', `EUR ${Number(d.total).toFixed(2)}`)}
            ${row('Nachricht', d.message || '–')}
            ${row('Zeitpunkt', now)}
          </table>
        </div>`,
    });

    res.json({ success: true, ref });
  } catch (err) {
    console.error('Buchungsfehler:', err);
    res.status(500).json({ success: false, error: 'Interner Serverfehler.' });
  }
});

// ─── POST /api/contact ────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  try {
    const d = req.body;

    if (!d.email || !d.message) {
      return res.status(400).json({ success: false, error: 'E-Mail und Nachricht erforderlich.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO contacts (created_at, fname, lname, email, arrival, departure, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(now, d.fname || '', d.lname || '', d.email, d.arrival || null, d.departure || null, d.message);

    await sendMail({
      from:    `"Camping Sulmsee" <${process.env.SMTP_USER}>`,
      to:      d.email,
      subject: 'Ihre Anfrage beim Camping Sulmsee',
      html: `
        <div style="font-family:sans-serif;color:#1a1a1a">
          <h2 style="color:#1e4032">Vielen Dank für Ihre Nachricht!</h2>
          <p>Liebe/r ${d.fname || ''} ${d.lname || ''},</p>
          <p>wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden.</p>
          <p style="margin-top:24px">Mit freundlichen Grüßen,<br>
             <strong>Ihr Team vom Camping Sulmsee</strong></p>
        </div>`,
    });

    await sendMail({
      from:    `"Camping Sulmsee Website" <${process.env.SMTP_USER}>`,
      to:      process.env.OWNER_EMAIL || process.env.SMTP_USER,
      subject: `Kontaktanfrage von ${d.fname || ''} ${d.lname || ''}`,
      html: `
        <div style="font-family:sans-serif;color:#1a1a1a">
          <h2 style="color:#1e4032">Neue Kontaktanfrage</h2>
          <table style="border-collapse:collapse;width:100%;max-width:560px">
            ${row('Name', `${d.fname || ''} ${d.lname || ''}`)}
            ${row('E-Mail', d.email)}
            ${d.arrival  ? row('Anreise',  d.arrival)  : ''}
            ${d.departure ? row('Abreise', d.departure) : ''}
            ${row('Nachricht', (d.message || '').replace(/\n/g, '<br>'))}
            ${row('Zeitpunkt', now)}
          </table>
        </div>`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Kontaktfehler:', err);
    res.status(500).json({ success: false, error: 'Interner Serverfehler.' });
  }
});

// ─── Admin-Endpunkte ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const expected = 'Basic ' + Buffer.from(`admin:${process.env.ADMIN_PASS || 'sulmsee2025'}`).toString('base64');
  if (req.headers.authorization !== expected) {
    res.set('WWW-Authenticate', 'Basic realm="Camping Sulmsee Admin"');
    return res.status(401).send('Nicht autorisiert');
  }
  next();
}

app.get('/api/bookings', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all());
});

app.get('/api/contacts', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all());
});

app.patch('/api/bookings/:ref', requireAdmin, (req, res) => {
  const { status } = req.body;
  const info = db.prepare('UPDATE bookings SET status = ? WHERE ref = ?').run(status, req.params.ref);
  if (info.changes === 0) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json({ success: true });
});

// ─── Seiten ausliefern ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const patchedNav = navBlock.replace(
    /(<a[^>]+href="\/"[^>]*)(>)/g,
    (match, before, gt) => before + ' class="nav-link-active"' + gt
  );

  const teaserSection = `
<section style="background:var(--bg,#faf8f3);padding:5rem 2rem">
  <div style="max-width:1100px;margin:0 auto;text-align:center">
    <div class="section-tag">Entdecken Sie mehr</div>
    <h2 class="section-title" style="margin-bottom:3rem">Alles auf einen Blick</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem">
      ${[
        { href:'/stellplaetze', icon:'⛺', title:'Stellplätze',  desc:'88 Plätze direkt am See' },
        { href:'/preise',       icon:'💶', title:'Preise',        desc:'Faire Tarife für 2025' },
        { href:'/freizeit',     icon:'🚴', title:'Freizeit',      desc:'Radeln, Wandern, Wein' },
        { href:'/anreise',      icon:'🗺️', title:'Anreise',       desc:'So finden Sie uns' },
        { href:'/kontakt',      icon:'✉️', title:'Kontakt',        desc:'Fragen & Buchungsanfrage' },
      ].map(c => `
      <a href="${c.href}" style="display:block;background:#fff;border-radius:16px;padding:2rem 1.5rem;text-decoration:none;color:var(--f,#1e4032);box-shadow:0 2px 16px rgba(0,0,0,.07);border:1.5px solid var(--bd,#e8e3d8);transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 30px rgba(0,0,0,.13)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 16px rgba(0,0,0,.07)'">
        <div style="font-size:2.2rem;margin-bottom:.75rem">${c.icon}</div>
        <div style="font-family:'Lora',serif;font-size:1.1rem;font-weight:600;margin-bottom:.4rem">${c.title}</div>
        <div style="font-size:.85rem;color:#666">${c.desc}</div>
      </a>`).join('')}
    </div>
  </div>
</section>`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Camping Sulmsee – Urlaub in der Südsteiermark</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Nunito:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<style>.nav-link-active{color:var(--e,#c8a84b)!important;font-weight:700}</style>
</head>
<body>
<div class="page-loader" id="loader"><div class="loader-bar"></div></div>
<div class="scroll-progress" id="scrollProgress"></div>
${patchedNav}
${modalBlock}
${sections.hero}
${sections.about}
${teaserSection}
${sections.testimonials}
${fctaBlock}
${footerBlock}
${scriptBlock}
<script src="/chatbot.js"></script>
</body>
</html>`;
  res.send(html);
});

app.get('/stellplaetze', (req, res) => {
  // Lightbox HTML for gallery
  const lightboxHtml = `
<div id="lightbox" class="lightbox-bg">
  <button id="lb-close" class="lb-close">✕</button>
  <button id="lb-prev"  class="lb-arrow lb-prev">‹</button>
  <img id="lb-img" src="" alt="">
  <div id="lb-counter" class="lb-counter"></div>
  <button id="lb-next"  class="lb-arrow lb-next">›</button>
</div>`;
  res.send(buildSubPage('stellplaetze', [sections.stellplaetze, sections.gallery, lightboxHtml]));
});

app.get('/preise', (req, res) => {
  res.send(buildSubPage('preise', [sections.preise]));
});

app.get('/freizeit', (req, res) => {
  res.send(buildSubPage('freizeit', [sections.freizeit]));
});

app.get('/anreise', (req, res) => {
  res.send(buildSubPage('anreise', [sections.anreise]));
});

app.get('/kontakt', (req, res) => {
  res.send(buildSubPage('kontakt', [sections.faq, sections.contact]));
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Camping Sulmsee läuft auf http://localhost:${PORT}`);
  if (!process.env.SMTP_USER) {
    console.log('⚠️  SMTP nicht konfiguriert – E-Mails werden nicht gesendet. Siehe .env.example');
  }
});

// ─── Hilfsfunktion für E-Mail-Tabellen ───────────────────────────────────────
function row(label, value) {
  return `<tr>
    <td style="padding:6px 12px;border:1px solid #ddd;background:#f9f9f9;white-space:nowrap"><strong>${label}</strong></td>
    <td style="padding:6px 12px;border:1px solid #ddd">${value ?? '–'}</td>
  </tr>`;
}
