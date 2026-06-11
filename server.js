require('dotenv').config();
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// ─── Lang-prefix routing: /en/, /tr/, /fr/, /it/ → same static files ─────────
app.use(function langPrefix(req, res, next) {
  req.url = req.url.replace(/^\/(en|tr|fr|it)(\/|$)/, '/') || '/';
  next();
});

app.use(express.static(path.join(__dirname), { extensions: ['html'] }));

// ─── Legacy-Redirects (301) ───────────────────────────────────────────────────
app.get('/stellplaetze.html', (req, res) => res.redirect(301, '/leistungen.html'));
app.get('/preise.html',       (req, res) => res.redirect(301, '/honorar.html'));
app.get('/freizeit.html',     (req, res) => res.redirect(301, '/methode.html'));

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
  CREATE TABLE IF NOT EXISTS consultations (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    ref               TEXT    UNIQUE,
    created_at        TEXT,
    mandate_type      TEXT,
    timeframe         TEXT,
    brief_description TEXT,
    sector            TEXT,
    country           TEXT,
    revenue_range     TEXT,
    employees_range   TEXT,
    company_name      TEXT,
    salutation        TEXT,
    role              TEXT,
    first_name        TEXT,
    last_name         TEXT,
    email             TEXT,
    phone             TEXT,
    preferred_contact TEXT,
    status            TEXT DEFAULT 'new'
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



// ─── createConsultation: DB-Insert + beide Mails (gemeinsam genutzt) ─────────
// Einzige Wahrheitsquelle fuer Erstgespraech-Leads: Formular UND Bot-Tool nutzen dies.
async function createConsultation(fields) {
  const {
    mandate_type, timeframe, brief_description,
    sector, country, revenue_range, employees_range, company_name,
    salutation, role, first_name, last_name, email, phone, preferred_contact,
  } = fields;

  const ref = 'BSF-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const createdAt = new Date().toISOString();

  db.prepare(`
      INSERT INTO consultations (
        ref, created_at, mandate_type, timeframe, brief_description,
        sector, country, revenue_range, employees_range, company_name,
        salutation, role, first_name, last_name, email, phone, preferred_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ref, createdAt, mandate_type || '', timeframe || '', brief_description || '',
      sector || '', country || '', revenue_range || '', employees_range || '', company_name || '',
      salutation || '', role || '', first_name || '', last_name || '', email || '', phone || '', preferred_contact || 'email'
    );

    const salLabel = salutation === 'herr' ? 'Herr' : salutation === 'frau' ? 'Frau' : '';
    const createdFormatted = new Date(createdAt).toLocaleString('de-CH');

    const mailToBsf = {
      from: `"BSF Website" <${process.env.SMTP_USER}>`,
      to: process.env.BSF_INBOX || 'info@bsfconsulting.ch',
      replyTo: email,
      subject: `Neue Erstgespräch-Anfrage [${ref}] — ${mandate_type}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto">
          <h2 style="font-family:Georgia,serif;color:#1a2b48;border-bottom:2px solid #D4B976;padding-bottom:10px">
            Neue Erstgespräch-Anfrage
          </h2>
          <p style="color:#777">Referenz: <strong>${ref}</strong> · Eingegangen: ${createdFormatted}</p>
          <h3 style="color:#1a2b48;margin-top:32px">Anliegen</h3>
          <table style="width:100%;border-collapse:collapse">
            ${row('Mandatsfeld', `<strong>${mandate_type}</strong>`)}
            ${row('Zeithorizont', timeframe || '—')}
          </table>
          <p style="background:#f5f7fb;padding:16px;border-left:3px solid #D4B976;margin-top:16px">
            ${(brief_description || '').replace(/\n/g, '<br>')}
          </p>
          <h3 style="color:#1a2b48;margin-top:32px">Unternehmen</h3>
          <table style="width:100%;border-collapse:collapse">
            ${row('Unternehmen', company_name || '— (nicht angegeben)')}
            ${row('Branche', sector)}
            ${row('Land', country || '—')}
            ${row('Umsatz', revenue_range || '—')}
            ${row('Mitarbeitende', employees_range || '—')}
          </table>
          <h3 style="color:#1a2b48;margin-top:32px">Kontakt</h3>
          <table style="width:100%;border-collapse:collapse">
            ${row('Name', `<strong>${salLabel} ${first_name} ${last_name}</strong>`)}
            ${row('Funktion', role)}
            ${row('E-Mail', `<a href="mailto:${email}">${email}</a>`)}
            ${row('Telefon', phone || '—')}
            ${row('Kontaktart', preferred_contact)}
          </table>
          <p style="color:#777;margin-top:32px;font-size:.88rem">
            Reply-To dieser E-Mail führt direkt zum Anfrager.
          </p>
        </div>
      `,
    };

    const mailToClient = {
      from: `"BSF Consulting AG" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Ihre Anfrage bei BSF Consulting [${ref}]`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="font-family:Georgia,serif;color:#1a2b48;font-weight:400">
            ${salutation === 'herr' ? 'Sehr geehrter Herr' : salutation === 'frau' ? 'Sehr geehrte Frau' : 'Guten Tag'} ${last_name},
          </h2>
          <p style="line-height:1.7;color:#444">
            vielen Dank für Ihre Anfrage. Wir haben Ihre Nachricht erhalten und werden uns innerhalb eines Werktags persönlich bei Ihnen melden.
          </p>
          <p style="line-height:1.7;color:#444">
            Ihre Anfrage ist unter der Referenz <strong>${ref}</strong> bei uns registriert. Alle übermittelten Informationen werden vertraulich behandelt.
          </p>
          <p style="line-height:1.7;color:#444;margin-top:32px">
            Mit freundlichen Grüssen<br>
            <strong>BSF Consulting AG</strong>
          </p>
          <div style="border-top:1px solid #e0ddd6;margin-top:32px;padding-top:16px;color:#777;font-size:.85rem;line-height:1.6">
            BSF Consulting AG · Gubelstrasse 12 · CH-6300 Zug<br>
            +41 41 760 36 16 · info@bsfconsulting.ch
          </div>
        </div>
      `,
    };

    await Promise.all([
      sendMail(mailToBsf),
      sendMail(mailToClient),
    ]);

  return { ref };
}

// ─── POST /api/consultation (BSF Erstgespräch) ───────────────────────────────
app.post('/api/consultation', async (req, res) => {
  try {
    const {
      mandate_type, brief_description, sector, first_name, last_name, email, role,
    } = req.body;

    if (!mandate_type || !brief_description || !sector || !first_name || !last_name || !email || !role) {
      return res.status(400).json({ ok: false, error: 'missing_required_fields' });
    }

    const { ref } = await createConsultation(req.body);

    res.json({
      ok: true,
      ref,
      message: 'Vielen Dank. Wir melden uns innerhalb eines Werktags. Eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet.',
    });
  } catch (err) {
    console.error('Consultation error:', err);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// ─── POST /api/contact (Kontaktformular) ─────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  try {
    const { fname, lname, company, role, email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ ok: false, error: 'missing_required_fields' });
    }

    const ref = 'BSF-K-' + Date.now().toString(36).toUpperCase();
    const createdAt = new Date().toISOString();
    const createdFormatted = new Date(createdAt).toLocaleString('de-CH');
    const fullName = `${fname || ''} ${lname || ''}`.trim() || '— (nicht angegeben)';

    // Unternehmen und Funktion oben in die Nachricht schreiben (keine eigenen Spalten)
    const metaLines = [`Referenz: ${ref}`];
    if (company) metaLines.push(`Unternehmen: ${company}`);
    if (role) metaLines.push(`Funktion: ${role}`);
    const storedMessage = metaLines.join('\n') + '\n\n' + message;

    db.prepare(`
      INSERT INTO contacts (created_at, fname, lname, email, arrival, departure, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(createdAt, fname || '', lname || '', email, '', '', storedMessage, 'new');

    const mailToBsf = {
      from: `"BSF Website" <${process.env.SMTP_USER}>`,
      to: process.env.BSF_INBOX || 'info@bsfconsulting.ch',
      replyTo: email,
      subject: `Neue Kontaktanfrage [${ref}] — ${fullName}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto">
          <h2 style="font-family:Georgia,serif;color:#1a2b48;border-bottom:2px solid #D4B976;padding-bottom:10px">
            Neue Kontaktanfrage
          </h2>
          <p style="color:#777">Referenz: <strong>${ref}</strong> · Eingegangen: ${createdFormatted}</p>
          <h3 style="color:#1a2b48;margin-top:32px">Kontakt</h3>
          <table style="width:100%;border-collapse:collapse">
            ${row('Name', `<strong>${fullName}</strong>`)}
            ${row('E-Mail', `<a href="mailto:${email}">${email}</a>`)}
            ${row('Unternehmen', company || '—')}
            ${row('Funktion', role || '—')}
          </table>
          <h3 style="color:#1a2b48;margin-top:32px">Nachricht</h3>
          <p style="background:#f5f7fb;padding:16px;border-left:3px solid #D4B976;margin-top:16px">
            ${(message || '').replace(/\n/g, '<br>')}
          </p>
          <p style="color:#777;margin-top:32px;font-size:.88rem">
            Reply-To dieser E-Mail führt direkt zum Anfrager.
          </p>
        </div>
      `,
    };

    const mailToClient = {
      from: `"BSF Consulting AG" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Ihre Nachricht bei BSF Consulting [${ref}]`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="font-family:Georgia,serif;color:#1a2b48;font-weight:400">
            ${(fname || lname) ? 'Guten Tag ' + `${fname || ''} ${lname || ''}`.trim() : 'Guten Tag'},
          </h2>
          <p style="line-height:1.7;color:#444">
            vielen Dank für Ihre Nachricht. Wir haben sie erhalten und melden uns innerhalb eines Werktags persönlich bei Ihnen.
          </p>
          <p style="line-height:1.7;color:#444">
            Ihre Anfrage ist unter der Referenz <strong>${ref}</strong> bei uns registriert. Alle übermittelten Informationen werden vertraulich behandelt.
          </p>
          <p style="line-height:1.7;color:#444;margin-top:32px">
            Mit freundlichen Grüssen<br>
            <strong>BSF Consulting AG</strong>
          </p>
          <div style="border-top:1px solid #e0ddd6;margin-top:32px;padding-top:16px;color:#777;font-size:.85rem;line-height:1.6">
            BSF Consulting AG · Gubelstrasse 12 · CH-6300 Zug<br>
            +41 41 760 36 16 · info@bsfconsulting.ch
          </div>
        </div>
      `,
    };

    await Promise.all([
      sendMail(mailToBsf),
      sendMail(mailToClient),
    ]);

    res.json({ ok: true, ref });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// ─── Admin-Endpunkte ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const pass = process.env.ADMIN_PASS;
  if (!pass) {
    console.error('ADMIN_PASS ist nicht gesetzt — Admin-Zugang gesperrt.');
    return res.status(503).send('Admin nicht konfiguriert');
  }
  const expected = 'Basic ' + Buffer.from(`admin:${pass}`).toString('base64');
  if (req.headers.authorization !== expected) {
    res.set('WWW-Authenticate', 'Basic realm="BSF Consulting Admin"');
    return res.status(401).send('Nicht autorisiert');
  }
  next();
}

app.get('/api/consultations', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM consultations ORDER BY created_at DESC').all());
});


// ============================================================
// BSF BERATER - Chat-API mit Anthropic Claude (sechs Tools)
// ============================================================

const Anthropic = require('@anthropic-ai/sdk');
const rateLimit = require('express-rate-limit');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Daten laden
const SYSTEM_PROMPT = fs.readFileSync('./data/system-prompt.txt', 'utf-8');
const SECTOR_MULTIPLES = JSON.parse(fs.readFileSync('./data/sector-multiples.json', 'utf-8'));
const TRANSAKTIONSUHR = JSON.parse(fs.readFileSync('./data/transaktionsuhr.json', 'utf-8'));
const BUYER_TYPES = JSON.parse(fs.readFileSync('./data/buyer-types.json', 'utf-8'));
const PREPARATION_CHECK = JSON.parse(fs.readFileSync('./data/preparation-check.json', 'utf-8'));
const SECTOR_NARRATIVES = JSON.parse(fs.readFileSync('./data/sector-narratives.json', 'utf-8'));

const SECTORS = Object.keys(SECTOR_MULTIPLES.sectors);

// ============================================================
// TOOL-DEFINITIONEN (sechs Tools)
// ============================================================

const BSF_TOOLS = [
  {
    name: 'calculate_valuation',
    description: 'Berechnet indikative Unternehmensbewertung (Enterprise Value) basierend auf DACH-Mid-Market-Multiples 2025/2026. Verwende dieses Tool wenn der Nutzer nach einer Bewertung, einem Verkaufspreis oder dem Wert seines Unternehmens fragt.',
    input_schema: {
      type: 'object',
      properties: {
        sector: { type: 'string', enum: SECTORS, description: 'Sektor des Unternehmens' },
        annual_ebitda_eur_million: { type: 'number', description: 'Annual EBITDA in EUR Million (bereinigt)' },
        growth_profile: { type: 'string', enum: ['declining', 'stable', 'growing', 'high_growth'], description: 'Wachstumsprofil der letzten Jahre' }
      },
      required: ['sector', 'annual_ebitda_eur_million', 'growth_profile']
    }
  },
  {
    name: 'analyze_werthebel',
    description: 'Erlaeutert die fuenf Multiple-Werthebel (Wachstum, Margen, Eigentuemer-Abhaengigkeit, Kundenkonzentration, IP-Schutz) fuer einen Sektor und zeigt welcher in einer typischen Situation am staerksten zieht. Verwende dies wenn der Nutzer verstehen will warum der Multiple bei seinem Unternehmen am oberen oder unteren Ende liegen koennte.',
    input_schema: {
      type: 'object',
      properties: {
        sector: { type: 'string', enum: SECTORS },
        ebitda_eur_million: { type: 'number' }
      },
      required: ['sector']
    }
  },
  {
    name: 'lookup_transaktionsuhr',
    description: 'Liefert die aktuelle Marktphase eines Sektors aus der BSF-Transaktionsuhr (Verkaeufermarkt vs. Kaeufermarkt) plus aktuelles Sektor-Narrativ. Verwende dies wenn der Nutzer nach dem richtigen Verkaufs- oder Kaufzeitpunkt oder der Marktlage fragt.',
    input_schema: {
      type: 'object',
      properties: {
        sector: { type: 'string', enum: SECTORS }
      },
      required: ['sector']
    }
  },
  {
    name: 'map_buyer_types',
    description: 'Liefert die drei relevanten Kaeufertypen (Strategisch, PE-Mid-Market, Family Office) fuer eine bestimmte Unternehmensgroesse mit Multiple-Ranges, typischem Prozess und typischen Forderungen. Verwende dies wenn der Nutzer wissen will welche Kaeufer fuer sein Unternehmen in Frage kommen.',
    input_schema: {
      type: 'object',
      properties: {
        ev_estimate_eur_million: { type: 'number', description: 'Geschaetzter Enterprise Value in EUR Million' },
        sector: { type: 'string', enum: SECTORS, description: 'Sektor, optional fuer Kontext' }
      },
      required: ['ev_estimate_eur_million']
    }
  },
  {
    name: 'preparation_check',
    description: 'Liefert die 12-Punkte-Vorbereitungs-Diagnostik fuer Verkaeufer-Mandate. Kann gefiltert werden nach Kategorie (Finanzen, Organisation, Kunden, Recht/IP). Wenn keine Kategorie genannt, liefert alle 12 Punkte mit ihren Buyer-Perspectives. Verwende dies wenn der Nutzer wissen will wie verkaufsbereit sein Unternehmen ist oder welche Vorbereitungen vor einem Verkaufs-Prozess noetig sind.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['finanzen', 'organisation', 'kunden', 'recht_ip', 'alle'], description: 'Filter nach Kategorie. Default: alle.' }
      },
      required: []
    }
  },
  {
    name: 'schedule_consultation',
    description: 'Sendet Anfrage fuer ein vertrauliches Erstgespraech mit dem Patron Thilo Hergott. Erfasse Kontaktdaten und Anliegen. Verwende dies wenn der Nutzer mit Hergott sprechen moechte oder wenn die Frage ueber die anderen Tools hinausgeht.',
    input_schema: {
      type: 'object',
      properties: {
        contact_name: { type: 'string' },
        contact_company: { type: 'string' },
        contact_email: { type: 'string' },
        contact_phone: { type: 'string' },
        inquiry_type: { type: 'string', enum: ['verkauf', 'kauf', 'nachfolge', 'restrukturierung', 'jointventure', 'sonstige'] },
        urgency: { type: 'string', enum: ['sofort', 'innerhalb_3_monate', 'sondierung'] },
        notes: { type: 'string', description: 'Kurze Beschreibung des Anliegens' }
      },
      required: ['contact_name', 'contact_email', 'inquiry_type']
    }
  }
];

// ============================================================
// TOOL-AUSFUEHRUNG
// ============================================================

async function executeBsfTool(name, input) {
  try {
    if (name === 'calculate_valuation') {
      const meta = SECTOR_MULTIPLES.metadata;
      const sector = SECTOR_MULTIPLES.sectors[input.sector];
      if (!sector) return { error: 'Sektor unbekannt' };
      const ebitda = input.annual_ebitda_eur_million;
      let sizeAdj = 0;
      if (ebitda < 0.5) sizeAdj = meta.discount_micro_vs_mid;
      else if (ebitda > 10) sizeAdj = meta.premium_upper_mid_vs_mid;
      const growthAdj = meta.growth_adjustment[input.growth_profile] || 0;
      const totalAdj = 1 + sizeAdj + growthAdj;
      const multLow = sector.low * totalAdj;
      const multMed = sector.median * totalAdj;
      const multHigh = sector.high * totalAdj;
      return {
        sector: sector.name,
        ebitda_input_eur_mio: ebitda,
        growth_profile: input.growth_profile,
        adjustments: { size: sizeAdj, growth: growthAdj, total_factor: totalAdj.toFixed(2) },
        multiple_range: { low: multLow.toFixed(1) + 'x', median: multMed.toFixed(1) + 'x', high: multHigh.toFixed(1) + 'x' },
        enterprise_value_eur_mio: { low: (ebitda * multLow).toFixed(1), median: (ebitda * multMed).toFixed(1), high: (ebitda * multHigh).toFixed(1) },
        sector_note: sector.note,
        source: SECTOR_MULTIPLES.metadata.source,
        caveat: 'Indikative Range. Konkrete Bewertung haengt von Wachstum, Kundenbindung, Eigentuemerabhaengigkeit und Kaeuferpassung ab. Kein Angebot.'
      };
    }

    if (name === 'analyze_werthebel') {
      const sector = SECTOR_MULTIPLES.sectors[input.sector];
      if (!sector) return { error: 'Sektor unbekannt' };
      return {
        sector: sector.name,
        werthebel: [
          { name: 'Wachstum', impact: 'Sektor-Spread durch Wachstum bis zu 25 Prozent zwischen declining und high_growth Profilen.', typical_question: 'Hat das Unternehmen ueber die letzten 3 Jahre konstant Wachstum gezeigt?' },
          { name: 'EBITDA-Margen-Qualitaet', impact: 'Bereinigtes EBITDA ist entscheidend. Unbereinigte Eigentuemer-Verguetung und Einmalposten reduzieren den verwertbaren Multiple-Wert.', typical_question: 'Wie hoch waere das EBITDA mit marktueblichem Geschaeftsfuehrer-Gehalt und ohne Einmaleffekte?' },
          { name: 'Eigentuemer-Abhaengigkeit', impact: 'Der staerkste Multiple-Druecker. Hohe Eigentuemer-Abhaengigkeit kostet typischerweise 1 bis 2 EBITDA-Multiples.', typical_question: 'Wie laeuft das Unternehmen 3 Monate ohne den Patron?' },
          { name: 'Kundenkonzentration', impact: 'Top-3-Kunden ueber 40 Prozent Umsatzanteil ist rote Flagge fuer Kaeufer. Ueber 60 Prozent oft Deal-Breaker.', typical_question: 'Welcher Anteil entfaellt auf die drei groessten Kunden?' },
          { name: 'IP-Schutz und Differenzierung', impact: 'Klar geschuetztes IP (Patente, Marken, proprietaere Prozesse) hebt den Multiple-Korridor.', typical_question: 'Ist das geistige Eigentum sauber im Unternehmen gehalten und geschuetzt?' }
        ],
        sector_specific_note: sector.note,
        recommendation: 'Im Erstgespraech mit Hergott werden diese Hebel fuer das konkrete Unternehmen ausgewertet und priorisiert.'
      };
    }

    if (name === 'lookup_transaktionsuhr') {
      const sektorPhase = TRANSAKTIONSUHR.sectors[input.sector];
      if (!sektorPhase) return { error: 'Sektor unbekannt' };
      const narrativ = SECTOR_NARRATIVES.sectors[input.sector] || 'Kein Narrativ verfuegbar.';
      const phasenErklaerung = TRANSAKTIONSUHR.phasen_erklaerung[sektorPhase.phase];
      let recommendation;
      if (sektorPhase.phase === 'hoch') recommendation = 'Aktuell guenstiger Zeitpunkt fuer Verkaeufer. Multiples nahe Zyklus-Hoch.';
      else if (sektorPhase.phase === 'aufschwung') recommendation = 'Aufwaertsphase. Vorbereitungen jetzt starten, um in 6 bis 12 Monaten optimal zu verkaufen.';
      else if (sektorPhase.phase === 'abkuehlung') recommendation = 'Multiples sinken. Verkaeufer sollten Prozess-Geschwindigkeit pruefen. Kaeufer haben mehr Verhandlungsraum.';
      else recommendation = 'Kaeufermarkt. Verkaufsprozesse dauern laenger, Multiples gedrueckt. Strategische Kaeufer mit Cash im Vorteil.';
      return {
        sector: input.sector,
        ausgabe: TRANSAKTIONSUHR.ausgabe,
        stand: TRANSAKTIONSUHR.stand,
        phase: sektorPhase.phase,
        phase_beschreibung: phasenErklaerung,
        index_value: sektorPhase.value,
        trend: sektorPhase.trend,
        change_qoq: sektorPhase.change_qoq,
        sektor_narrativ: narrativ,
        empfehlung: recommendation
      };
    }

    if (name === 'map_buyer_types') {
      const ev = input.ev_estimate_eur_million;
      let bracket;
      if (ev < 25) bracket = 'lower_mid';
      else if (ev <= 100) bracket = 'mid';
      else bracket = 'upper_mid';
      const bracketData = BUYER_TYPES.size_brackets[bracket];
      const relevantTypes = bracketData.dominant_buyer_types.map(t => ({ key: t, ...BUYER_TYPES.types[t] }));
      return {
        ev_input_eur_mio: ev,
        size_bracket: bracketData.label,
        bracket_note: bracketData.note,
        relevant_buyer_types: relevantTypes,
        sector_context: input.sector ? SECTOR_NARRATIVES.sectors[input.sector] : null,
        caveat: 'Anonyme Kaeufertypen-Profile. Konkrete Kaeufer-Identifikation erfolgt unter NDA durch den Patron Thilo Hergott.'
      };
    }

    if (name === 'preparation_check') {
      const cat = input.category || 'alle';
      if (cat === 'alle') {
        return {
          gesamt: 'Vorbereitungs-Check umfasst 12 Punkte in 4 Kategorien',
          kategorien: PREPARATION_CHECK.categories,
          hinweis: 'Diese Diagnostik ist eine Strukturierungs-Hilfe, kein Audit. Eine konkrete Verkaufsbereitschaft beurteilt der Patron Thilo Hergott im Erstgespraech.'
        };
      }
      const catData = PREPARATION_CHECK.categories[cat];
      if (!catData) return { error: 'Kategorie unbekannt' };
      return { kategorie: catData, hinweis: PREPARATION_CHECK.metadata.hinweis };
    }

    if (name === 'schedule_consultation') {
      const inquiryMap = {
        verkauf: 'Unternehmensverkauf', kauf: 'Unternehmenskauf',
        nachfolge: 'Nachfolge', restrukturierung: 'Restrukturierung',
        jointventure: 'Joint Venture', sonstige: 'Allgemeine Anfrage'
      };
      const urgencyMap = {
        sofort: 'Sofort / akut', innerhalb_3_monate: 'Innerhalb 3 Monate',
        sondierung: 'Sondierung / unverbindlich'
      };

      // contact_name -> first_name / last_name splitten
      const rawName = (input.contact_name || '').trim();
      const tokens = rawName.split(/\s+/).filter(Boolean);
      let first_name = '', last_name = rawName;
      if (tokens.length >= 2) {
        last_name = tokens[tokens.length - 1];
        first_name = tokens.slice(0, tokens.length - 1).join(' ');
      }

      // lean Tool-Input auf Tabellenfelder mappen
      const fields = {
        mandate_type: (inquiryMap[input.inquiry_type] || 'Allgemeine Anfrage') + ' (via BSF-Berater)',
        timeframe: urgencyMap[input.urgency] || '',
        brief_description: input.notes || '',
        sector: '', country: '', revenue_range: '', employees_range: '',
        company_name: input.contact_company || '',
        salutation: '', role: '',
        first_name, last_name,
        email: input.contact_email || '',
        phone: input.contact_phone || '',
        preferred_contact: 'email'
      };

      const successResponse = (ref) => ({
        confirmation_id: ref,
        status: 'received',
        next_steps: 'Der Patron Thilo Hergott meldet sich innerhalb eines Werktags persoenlich zurueck. Erstgespraech vertraulich, auf Wunsch unter NDA.',
        contact_fallback: 'Bei Dringlichkeit: +41 41 760 36 16 oder info@bsfconsulting.ch'
      });

      try {
        const { ref } = await createConsultation(fields);
        return successResponse(ref);
      } catch (e) {
        // Lead darf nie verloren gehen: jsonl-Fallback + Fehler loggen
        console.error('[schedule_consultation] createConsultation fehlgeschlagen, Fallback auf jsonl:', e);
        const fallbackRef = 'BSF-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        try {
          if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', { recursive: true });
          fs.appendFileSync('./logs/consultations.jsonl', JSON.stringify({ timestamp: new Date().toISOString(), ref: fallbackRef, ...fields }) + '\n');
        } catch (e2) {
          console.error('[schedule_consultation] jsonl-Fallback fehlgeschlagen:', e2);
        }
        return successResponse(fallbackRef);
      }
    }

    return { error: 'Tool unbekannt: ' + name };
  } catch (e) {
    console.error('[tool error]', name, e);
    return { error: 'Tool-Fehler: ' + e.message };
  }
}

// ============================================================
// RATE LIMITING
// ============================================================

const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte einen Moment warten.' }
});

// ============================================================
// CHAT-ENDPOINT (BSF Berater)
// ============================================================

app.post('/api/chat', chatRateLimit, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages-Array erforderlich' });
    }

    // Ausgabesprache: vom Berater-Widget mitgesendet (de/en/tr). Die Button-
    // Prompts sind intern deutsch formuliert – diese Anweisung erzwingt, dass
    // der Bot dennoch in der Seitensprache antwortet.
    const LANG_NAMES = { de: 'Deutsch (Schweizer Hochdeutsch, ss statt ß)', en: 'Englisch (English)', tr: 'Türkisch (Turkish)' };
    const lang = (typeof req.body.lang === 'string' && LANG_NAMES[req.body.lang]) ? req.body.lang : 'de';
    const langInstruction =
      `### VERBINDLICHE AUSGABESPRACHE\n` +
      `Diese Regel hat Vorrang vor jeder Sprach-Erkennung im obigen Prompt. ` +
      `Die Sprache der bisherigen Nachrichten ist IRRELEVANT für deine Antwortsprache: ` +
      `Auch wenn Nutzer- oder Button-Prompts auf Deutsch formuliert sind, antwortest du ` +
      `AUSSCHLIESSLICH auf ${LANG_NAMES[lang]} und übersetzt deine gesamte Antwort vollständig ` +
      `in diese Sprache. Verwende in keiner Sprache Emojis.`;
    const systemBlocks = [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: langInstruction }
    ];

    // Zusätzlich zur System-Anweisung die Sprach-Direktive an die letzte
    // Nutzernachricht hängen — darauf reagiert das Modell am zuverlässigsten,
    // gerade wenn der deutsche Button-Prompt sonst die Sprache "vorgibt".
    const messagesForApi = messages.map((m) => ({ ...m }));
    if (lang !== 'de') {
      for (let i = messagesForApi.length - 1; i >= 0; i--) {
        if (messagesForApi[i].role === 'user' && typeof messagesForApi[i].content === 'string') {
          messagesForApi[i] = {
            ...messagesForApi[i],
            content: messagesForApi[i].content + `\n\n(Antworte ausschliesslich auf ${LANG_NAMES[lang]}.)`
          };
          break;
        }
      }
    }

    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemBlocks,
      tools: BSF_TOOLS,
      messages: messagesForApi
    });

    let currentMessages = [...messagesForApi];
    let toolCallCount = 0;
    const MAX_TOOL_CALLS = 5;

    while (response.stop_reason === 'tool_use' && toolCallCount < MAX_TOOL_CALLS) {
      toolCallCount++;
      currentMessages.push({ role: 'assistant', content: response.content });

      const toolResults = await Promise.all(
        response.content
          .filter(b => b.type === 'tool_use')
          .map(async (toolUse) => ({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(await executeBsfTool(toolUse.name, toolUse.input))
          }))
      );

      currentMessages.push({ role: 'user', content: toolResults });

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: systemBlocks,
        tools: BSF_TOOLS,
        messages: currentMessages
      });
    }

    const finalText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    res.json({
      message: finalText,
      reply: finalText,
      tools_used: toolCallCount,
      stop_reason: response.stop_reason
    });

  } catch (e) {
    console.error('[chat error]', e);
    res.status(500).json({
      message: 'Technisches Problem. Bitte direkt an info@bsfconsulting.ch oder +41 41 760 36 16.',
      reply: 'Technisches Problem. Bitte direkt an info@bsfconsulting.ch oder +41 41 760 36 16.',
      error: e.message
    });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BSF Consulting läuft auf http://localhost:${PORT}`);
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
