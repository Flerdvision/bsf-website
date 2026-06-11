#!/usr/bin/env node
// ============================================================
//  BSF Consulting AG – i18n Build-Tool (lückenlose Abdeckung)
//
//  Deutsch im HTML ist die einzige Quelle. JEDER sichtbare Textknoten
//  (beliebige Tiefe, egal ob Hintergrundbild/Overlay/position:absolute)
//  wird erfasst und abgedeckt: entweder per data-i18n am Inline-Eltern
//  oder per <span data-i18n> direkt um den Textknoten. Danach Übersetzung
//  nach EN/TR via Anthropic. --verify ist ein hartes Tor.
//
//  Modi:
//    node scripts/i18n.mjs --scan     Bericht, keine Writes
//    node scripts/i18n.mjs --apply    Abdeckung erzwingen + übersetzen + schreiben
//    node scripts/i18n.mjs --verify   hartes Tor (exit 1 bei Lücke)
// ============================================================
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { load } from 'cheerio';
import 'dotenv/config'; // ANTHROPIC_API_KEY aus .env laden

const ROOT = process.cwd();
const I18N_DIR = path.join(ROOT, 'i18n');
const SOURCES_FILE = path.join(I18N_DIR, '.sources.json');
const LANGS = ['en', 'tr'];
const MODEL = 'claude-sonnet-4-5';
const MODE = process.argv.includes('--apply') ? 'apply'
  : process.argv.includes('--verify') ? 'verify'
  : 'scan';

// ── ALLOWLIST: Werte, bei denen DE==EN/TR erlaubt ist ─────
// (Marke, Eigennamen, Fachbegriffe, Adresse, Kontakt, Codes, reine Zahlen)
// Hinweis: Allowlist überschreibt NIE eine bereits vorhandene, echte
// Übersetzung – sie erlaubt nur, dass ein Wert identisch zum DE bleibt.
const ALLOWLIST = [
  'BSF Consulting AG', 'BSF Consulting', 'BSF',
  'Thilo Hergott', 'Hergott', 'Closing', 'M&A', 'M&amp;A', 'DACH',
  'DE', 'EN', 'TR',
  'Gubelstrasse 12', 'CH-6300 Zug', 'Gubelstrasse 12, CH-6300 Zug',
  'info@bsfconsulting.ch', '+41 41 760 36 16', '+41 79 600 97 97',
  // Sprachübergreifend identische (Fach-)Begriffe / Eigennamen:
  'Mergers & Acquisitions', 'Mergers & Acquisitions.', 'Mergers &amp; Acquisitions',
  'International', 'Navigation', 'Joint Ventures',
  'Retainer', 'Retainer (optional)', 'Telefon',
];
// Tokens, die beim „ist alles nicht-übersetzbar?"-Test entfernt werden
// (inkl. Währungs-/Größeneinheiten, damit reine Zahlen wie „CHF 0.–" oder
//  „5–200 Mio. €" als nicht-übersetzbar gelten).
const NONTRANS_TOKENS = [
  'BSF Consulting AG', 'BSF Consulting', 'BSF', 'Thilo Hergott', 'Thilo', 'Hergott',
  'Closing', 'M&amp;A', 'M&A', 'DACH', 'Gubelstrasse 12', 'CH-6300 Zug',
  '6300 Zug', 'Zug', 'info@bsfconsulting.ch', 'DE', 'EN', 'TR',
  'CHF', 'EUR', 'Mio', 'Mrd',
  // Sprachübergreifend identische (Fach-)Begriffe, Eigennamen, Aufzähler:
  'Patron', 'T·H', 'Optional', 'International', 'Navigation',
  'MBO', 'MBI', 'Lower Mid-Cap', 'Mid-Cap', 'Management-Buy-out',
  'Buy-out', 'Buy-in', 'Joint Ventures', 'Joint Venture',
  'Mergers', 'Acquisitions', 'Retainer',
];

// Leaf-Key-Namen, die reine Maschinenwerte tragen (IDs, Hrefs, Action-Enums,
// Icons, URLs) und NIE übersetzt werden – unabhängig vom Inhalt. Greift nur
// auf JS-/JSON-Keys; HTML-Textknoten sind davon nicht betroffen.
const NON_TRANS_KEY_LEAVES = new Set([
  'id', 'ctaaction', 'ctahref', 'secondaryhref', 'href', 'action',
  'icon', 'url', 'slug', 'type', 'target', 'rel', 'class', 'src',
]);
const isMachineKey = (key) => NON_TRANS_KEY_LEAVES.has(key.split('.').pop().toLowerCase());

// Tags ohne übersetzbaren Inhalt – nie betreten:
const SKIP_TAGS = new Set(['script', 'style', 'code', 'svg', 'noscript', 'template']);
// Inline-Tags: ihr Vorkommen macht ein Element zu einem „Inline-Blatt"
const INLINE = new Set(['a', 'em', 'strong', 'b', 'i', 'u', 'span', 'small', 'sub', 'sup', 'br', 'mark', 'abbr', 'time', 'q', 'cite', 'wbr', 'bdi', 's', 'ins', 'del', 'label']);
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const BRAND_EXACT = new Set(['bsf consulting', 'bsf consulting ag', 'bsf']);

// ── Helfer ─────────────────────────────────────────────────
const hash8 = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Ist dieser Text ein übersetzbarer Knoten (muss abgedeckt werden)?
function isTranslatable(text) {
  const t = norm(text);
  if (!t || !/\p{L}/u.test(t)) return false;            // mind. ein Buchstabe
  if (BRAND_EXACT.has(t.toLowerCase())) return false;   // exakt Marke
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return false; // E-Mail
  if (/^(https?:\/\/|www\.|mailto:|tel:)\S*$/i.test(t)) return false; // URL
  if (/^[+(]?[\d][\d\s/().+-]{5,}$/.test(t)) return false; // Telefon
  return true;
}

// Tags durch Leerzeichen ersetzen (verhindert Wort-Verklebung wie
// "Thilo<br>Hergott" -> "ThiloHergott"). Gültiges Römisch-Muster.
const stripTagsSp = (s) => s.replace(/<[^>]+>/g, ' ');
const ROMAN = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
// Tokens absteigend nach Länge: längste zuerst entfernen.
const NONTRANS_SORTED = [...NONTRANS_TOKENS].sort((a, b) => b.length - a.length);

// Darf der Wert in allen Sprachen gleich bleiben?
// Reihenfolge-unabhängig: erst Strukturelles (E-Mail/URL/Telefon), dann
// römische Aufzähler/Einzelbuchstaben, dann Marken-/Begriff-Tokens NUR an
// Wortgrenzen (kein Substring-Treffer wie "BSF" in "bsfconsulting"), zuletzt
// HTML-Entities. Bleibt danach kein Buchstabe übrig -> nicht übersetzbar.
function isAllowlisted(de) {
  const raw = de.trim();
  const stripped = norm(stripTagsSp(de));
  if (ALLOWLIST.includes(raw) || ALLOWLIST.includes(stripped) || ALLOWLIST.includes(de.trim())) return true;
  let s = stripped
    .replace(/[^\s]+@[^\s]+\.[a-z]{2,}/gi, ' ')          // E-Mails
    .replace(/\b(?:https?:\/\/|www\.|mailto:|tel:)\S+/gi, ' ') // URLs
    .replace(/[+(]?\d[\d\s/().+–-]{4,}\d/g, ' ');   // Telefon/lange Nummern
  const canon = s.trim();
  if (/^[A-Z]$/.test(canon)) return true;                // einzelner Großbuchstabe
  if (canon && ROMAN.test(canon)) return true;           // römische Ziffer (I–VI …)
  const letterWords = canon.replace(/[^\p{L}]+/gu, ' ').trim();
  if (letterWords && letterWords.split(' ').every((w) => w.length === 1)) return true; // Initialen/Aufzähler (T · H)
  let r = ' ' + s + ' ';
  for (const tok of NONTRANS_SORTED) {
    r = r.replace(new RegExp('(?<![\\p{L}])' + esc(tok) + '(?![\\p{L}])', 'giu'), ' ');
  }
  r = r.replace(/&[a-z]+;/gi, ' ');                       // HTML-Entities (&amp; …)
  r = r.replace(/[^\p{L}]/gu, '');                        // alle Nicht-Buchstaben weg
  return r.length === 0;                                  // nichts Übersetzbares übrig
}

function hasBlockDescendant(node) {
  for (const c of node.children || []) {
    if (c.type === 'tag') {
      const n = c.name.toLowerCase();
      if (SKIP_TAGS.has(n)) return true;        // svg etc. -> opak
      if (!INLINE.has(n)) return true;          // Block-Tag
      if (hasBlockDescendant(c)) return true;
    }
  }
  return false;
}
function hasMarkedDescendant(node) {
  for (const c of node.children || []) {
    if (c.type === 'tag') {
      if (c.attribs && (c.attribs['data-i18n'] != null || c.attribs['data-no-i18n'] != null)) return true;
      if (hasMarkedDescendant(c)) return true;
    }
  }
  return false;
}

// ── Analyse einer Datei ────────────────────────────────────
// Liefert { units:[{key,de,type,attr,covered}], edits:[...] }
function analyzeFile(file, raw) {
  const $ = load(raw, { decodeEntities: false, _useHtmlParser2: true, withStartIndices: true, withEndIndices: true });
  const units = [];
  const attrInsert = new Map(); // startIndex -> [strings]
  const textEdits = [];         // {start,end,replacement}

  const tagNameLen = (el) => {
    const m = raw.slice(el.startIndex).match(/^<([a-zA-Z0-9:-]+)/);
    return m ? m[1].length : el.name.length;
  };
  const queueAttr = (el, str) => {
    const pos = el.startIndex + 1 + tagNameLen(el);
    if (!attrInsert.has(pos)) attrInsert.set(pos, []);
    attrInsert.get(pos).push(str);
  };

  function handleAttrs(el) {
    const name = el.name.toLowerCase();
    const a = el.attribs || {};
    const mapped = {};
    if (a['data-i18n-attr']) a['data-i18n-attr'].split(',').forEach((p) => { const i = p.indexOf(':'); if (i > 0) mapped[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
    const list = name === 'meta' ? (a['name'] === 'description' ? ['content'] : []) : ATTRS;
    for (const attr of list) {
      const v = a[attr];
      if (v == null || !isTranslatable(v)) continue;
      if (mapped[attr]) {
        units.push({ key: mapped[attr], de: v, file, type: 'attr', attr, covered: true });
      } else {
        const key = 'auto.' + hash8(`${name}|${attr}|${v}`);
        units.push({ key, de: v, file, type: 'attr', attr, covered: false });
        queueAttr(el, `data-i18n-attr="${attr}:${key}"`);
      }
    }
  }

  function wrapText(node) {
    const txt = raw.slice(node.startIndex, node.endIndex + 1);
    const lead = txt.match(/^\s*/)[0];
    const trail = txt.match(/\s*$/)[0];
    const core = txt.slice(lead.length, txt.length - trail.length);
    const key = 'auto.' + hash8(core);
    units.push({ key, de: core, file, type: 'content', covered: false });
    textEdits.push({ start: node.startIndex, end: node.endIndex + 1, replacement: `${lead}<span data-i18n="${key}">${core}</span>${trail}` });
  }

  // inBody: true sobald wir im <body>-Teilbaum sind. Strukturändernde Edits
  // (Span-Wrapping von Textknoten) sind NUR im Body erlaubt – der <head> und
  // alles ausserhalb des Body bleiben byte-genau (höchstens byte-sichere
  // Attribut-Einfügungen an <title>/<meta>).
  function processEl(el, inBody) {
    const name = (el.name || '').toLowerCase();
    if (name && SKIP_TAGS.has(name)) return;
    if (el.attribs && el.attribs['data-no-i18n'] != null) return;
    const within = inBody || name === 'body';

    if (name) handleAttrs(el);

    if (el.attribs && el.attribs['data-i18n'] != null) {
      const de = ($(el).html() || '').trim();
      units.push({ key: el.attribs['data-i18n'], de, file, type: 'content', covered: true });
      return; // Einheit – nicht absteigen
    }

    const inlineLeaf = !hasBlockDescendant(el);
    if (inlineLeaf && !hasMarkedDescendant(el)) {
      const de = ($(el).html() || '').trim();
      if (isTranslatable(stripTags(de))) {
        const key = 'auto.' + hash8(de);
        units.push({ key, de, file, type: 'content', covered: false });
        queueAttr(el, `data-i18n="${key}"`); // Attribut – byte-sicher, auch im <head> ok
        return; // gewrappt – nicht absteigen
      }
      return; // Inline-Blatt ohne übersetzbaren Text (z. B. nur E-Mail)
    }

    // Container / gemischt: jeden direkten Textknoten wrappen, Kinder rekursiv.
    // Span-Wrapping nur im Body (head bleibt strukturell unangetastet).
    for (const c of el.children || []) {
      if (c.type === 'text') { if (within && isTranslatable(c.data)) wrapText(c); }
      else if (c.type === 'tag') processEl(c, within);
    }
  }

  processEl($.root()[0], false);

  // Edits zusammenführen (Attribut-Inserts + Text-Wraps), von hinten anwenden
  const edits = [];
  for (const [pos, arr] of attrInsert) edits.push({ start: pos, end: pos, replacement: ' ' + arr.join(' ') });
  for (const e of textEdits) edits.push(e);
  edits.sort((a, b) => b.start - a.start);

  return { units, edits };
}

function applyEdits(raw, edits) {
  let out = raw;
  for (const e of edits) out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  return out;
}

// ── Kopf-Integritäts-Wächter ───────────────────────────────
// Garantiert, dass das Patchen den Dokumentkopf (alles bis <body>) byte-genau
// lässt – einzig erlaubte Differenz: hinzugefügte data-i18n(-attr)-Attribute
// an <title>/<meta>. Bei jeder anderen Abweichung (DOCTYPE/<link>/<head> kaputt
// oder neu serialisiert) wird der Schreibvorgang abgebrochen, nichts geschrieben.
const headRegion = (s) => { const i = s.search(/<body[\s>]/i); return i < 0 ? s : s.slice(0, i); };
const stripI18nAttrs = (s) => s.replace(/\s+data-i18n(?:-attr)?="[^"]*"/g, '');
function assertHeadUntouched(file, raw, out) {
  const dRaw = (/^﻿?\s*<!DOCTYPE[^>]*>/i.exec(raw) || [''])[0];
  const dOut = (/^﻿?\s*<!DOCTYPE[^>]*>/i.exec(out) || [''])[0];
  if (dRaw !== dOut) throw new Error(`[${file}] DOCTYPE wurde verändert – Abbruch (nichts geschrieben).`);
  if (stripI18nAttrs(headRegion(raw)) !== stripI18nAttrs(headRegion(out))) {
    throw new Error(`[${file}] Dokumentkopf (<head>/<link>/<meta>/<title>) wurde strukturell verändert – Abbruch (nichts geschrieben).`);
  }
}

// ── JSON-Pfad-Helfer ───────────────────────────────────────
function setPath(rootObj, dotted, value) {
  const parts = dotted.replace(/\[(\d+)\]/g, '.$1').split('.');
  let o = rootObj;
  for (let i = 0; i < parts.length - 1; i++) { const p = parts[i]; if (o[p] == null || typeof o[p] !== 'object') o[p] = {}; o = o[p]; }
  o[parts[parts.length - 1]] = value;
}
function getPath(rootObj, dotted) {
  const parts = dotted.replace(/\[(\d+)\]/g, '.$1').split('.');
  let o = rootObj;
  for (const p of parts) { if (o == null) return undefined; o = o[p]; }
  return o;
}
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (prefix === '' && k === 'lang') continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (v && typeof v === 'object') flatten(v, key, out);
  }
  return out;
}
const isEmpty = (v) => typeof v !== 'string' || v.trim() === '';
async function readJson(p, fb) { try { return JSON.parse(await fs.readFile(p, 'utf-8')); } catch { return fb; } }
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

// ── Übersetzung ────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RULES = [
  'Preserve inline HTML tags exactly (<em>, <strong>, <br>, <a ...> with all attributes) and HTML entities (e.g. &amp;).',
  'Do NOT translate: "BSF Consulting AG", proper names (Thilo Hergott), "Closing", "M&A", "DACH", e-mail addresses, phone numbers, postal addresses, pure numbers.',
  'Keep it concise and natural; match the formal, understated tone.',
];

async function callModel(client, system, userContent) {
  const res = await client.messages.create({ model: MODEL, max_tokens: 8192, system, messages: [{ role: 'user', content: userContent }] });
  return (res.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

// Robustes JSON-Extrahieren aus der Modellantwort (Codefences/Prosa tolerant).
function extractJson(txt) {
  let t = txt.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  return null;
}

// Einzelstring per Plain-Text-Protokoll: keine JSON-Hülle -> eingebettete
// Anführungszeichen in <a href="…"> brechen nichts. Gibt null bei Fehlschlag.
async function translateOne(client, lang, de) {
  const langName = lang === 'en' ? 'English' : 'Turkish';
  const system = [
    `You translate a single UI string for a Swiss M&A boutique (private-banking register: formal, discreet, high-end) from German into ${langName}.`,
    'Return ONLY the translated string itself — no JSON, no quotes around it, no prose, no markdown, no explanation.',
    ...RULES,
  ].join('\n');
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      let out = await callModel(client, system, de);
      out = out.replace(/^```\w*/i, '').replace(/```$/, '').trim();
      if (out) return out;
    } catch (e) {
      process.stderr.write(`  [retry-one ${attempt + 1}/4 ${lang}] ${e.message}\n`);
      await sleep(Math.min(1500 * (attempt + 1), 9000));
    }
  }
  return null;
}

// Batch-Übersetzung mit Retry/Backoff; bei wiederholtem Parse-Fehler wird der
// Batch rekursiv halbiert, bis runter zu Einzelstrings (Plain-Text-Fallback).
// Wirft NIE — fehlgeschlagene Keys fehlen einfach und werden von --verify erkannt.
async function translateBatch(client, lang, entries) {
  if (entries.length === 0) return {};
  if (entries.length === 1) {
    const [k, de] = entries[0];
    const v = await translateOne(client, lang, de);
    return v == null ? {} : { [k]: v };
  }
  const langName = lang === 'en' ? 'English' : 'Turkish';
  const obj = {}; for (const [k, de] of entries) obj[k] = de;
  const system = [
    `You translate UI strings for a Swiss M&A boutique (private-banking register: formal, discreet, high-end) from German into ${langName}.`,
    'Input is a JSON object {key: germanText}. Return ONLY a JSON object with the SAME keys and translated values. No prose, no markdown.',
    'Escape every double quote inside a value as \\" so the result is valid JSON.',
    ...RULES,
  ].join('\n');
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const txt = await callModel(client, system, JSON.stringify(obj));
      const parsed = extractJson(txt);
      if (parsed && typeof parsed === 'object') return parsed;
      throw new Error('JSON nicht parsebar');
    } catch (e) {
      process.stderr.write(`  [retry ${attempt + 1}/4 ${lang}, ${entries.length} Strings] ${e.message}\n`);
      await sleep(Math.min(1500 * (attempt + 1), 9000));
    }
  }
  // Aufteilen und rekursiv erneut versuchen (isoliert den fehlerhaften String).
  const mid = Math.floor(entries.length / 2);
  process.stderr.write(`  [split ${lang}] ${entries.length} -> ${mid} + ${entries.length - mid}\n`);
  const ra = await translateBatch(client, lang, entries.slice(0, mid));
  const rb = await translateBatch(client, lang, entries.slice(mid));
  return { ...ra, ...rb };
}

// ── Hauptlauf ──────────────────────────────────────────────
async function main() {
  const files = (await fs.readdir(ROOT)).filter((f) => f.endsWith('.html')).sort();

  // Pre-Check: Key nur für --apply zwingend
  if (MODE === 'apply' && !process.env.ANTHROPIC_API_KEY) {
    console.error('FEHLER: ANTHROPIC_API_KEY fehlt (in .env setzen). Abbruch.');
    process.exitCode = 1; return;
  }

  // 1) Analyse (ggf. Abdeckung erzwingen)
  const fileUnits = new Map();
  let totalNodes = 0, totalUncovered = 0, wrapped = 0;
  for (const f of files) {
    const abs = path.join(ROOT, f);
    let raw = await fs.readFile(abs, 'utf-8');
    let { units, edits } = analyzeFile(f, raw);
    if (MODE === 'apply' && edits.length) {
      const original = raw;
      const patched = applyEdits(raw, edits);
      assertHeadUntouched(f, original, patched); // wirft, falls Kopf verändert -> nichts schreiben
      raw = patched;
      await fs.writeFile(abs, raw);
      wrapped += edits.length;
      // nach dem Schreiben neu analysieren -> alles covered
      ({ units } = analyzeFile(f, raw));
    }
    fileUnits.set(f, units);
    totalNodes += units.length;
    totalUncovered += units.filter((u) => !u.covered).length;
  }

  // 2) DE-Master = bestehendes de.json (JS-Keys bleiben) + HTML-Deutsch
  const deJson = await readJson(path.join(I18N_DIR, 'de.json'), { lang: 'de' });
  const enJson = await readJson(path.join(I18N_DIR, 'en.json'), { lang: 'en' });
  const trJson = await readJson(path.join(I18N_DIR, 'tr.json'), { lang: 'tr' });
  const sources = await readJson(SOURCES_FILE, {});

  const htmlDE = new Map();
  for (const units of fileUnits.values()) for (const u of units) {
    if (u.de && u.de.trim() && !htmlDE.has(u.key)) htmlDE.set(u.key, u.de.trim());
  }
  const deMerged = JSON.parse(JSON.stringify(deJson));
  for (const [k, de] of htmlDE) setPath(deMerged, k, de);
  const deFlat = flatten(deMerged);
  // Maschinen-Keys (IDs, Hrefs, Action-Enums …) werden komplett ausgeschlossen:
  // weder übersetzt noch vom Tor geprüft.
  const deKeys = Object.keys(deFlat).filter((k) => !isMachineKey(k));

  // 3) Übersetzungsbedarf bestimmen
  const need = { en: [], tr: [] };
  const allowSet = { en: [], tr: [] };
  for (const key of deKeys) {
    const de = deFlat[key];
    const h = hash8(de);
    const allow = isAllowlisted(de);
    for (const lang of LANGS) {
      const cur = getPath(lang === 'en' ? enJson : trJson, key);
      // Allowlist: nur leere Ziele mit DE füllen – vorhandene (evtl. echte)
      // Übersetzungen NIE überschreiben.
      if (allow) { if (isEmpty(cur)) allowSet[lang].push([key, de]); continue; }
      const drift = (key in sources) && sources[key] !== h;
      if (isEmpty(cur) || cur === de || (typeof cur === 'string' && cur.startsWith('__TT__')) || drift) need[lang].push([key, de]);
    }
  }

  // ── Bericht ──
  const rule = '─'.repeat(64);
  console.log(`\nBSF i18n – Modus: ${MODE.toUpperCase()}`);
  console.log(rule);
  console.log(`HTML-Dateien:                 ${files.length}`);
  console.log(`Übersetzbare Textknoten/Attr: ${totalNodes}`);
  console.log(`  • noch nicht abgedeckt:     ${totalUncovered}`);
  console.log(`DE-Keys gesamt (inkl. JS):    ${deKeys.length}`);
  console.log(`Neu zu übersetzen EN:         ${need.en.length}  (+ ${allowSet.en.length} Allowlist=DE)`);
  console.log(`Neu zu übersetzen TR:         ${need.tr.length}  (+ ${allowSet.tr.length} Allowlist=DE)`);
  console.log(rule);

  if (MODE === 'scan') {
    for (const f of files) {
      const u = fileUnits.get(f).filter((x) => !x.covered);
      if (!u.length) continue;
      console.log(`\n[${f}] ${u.length} unabgedeckt:`);
      for (const x of u.slice(0, 12)) {
        const t = norm(stripTags(x.de)).slice(0, 70);
        console.log(`  ${x.type === 'attr' ? '@' + x.attr : '·'}  «${t}»`);
      }
      if (u.length > 12) console.log(`  … und ${u.length - 12} weitere`);
    }
    console.log('\nNur-Bericht (--scan): nichts geschrieben.\n');
    return;
  }

  if (MODE === 'verify') {
    let fail = false;
    const uncov = [];
    for (const f of files) for (const u of fileUnits.get(f)) if (!u.covered) uncov.push(`[${f}] ${u.type === 'attr' ? '@' + u.attr + ' ' : ''}«${norm(stripTags(u.de)).slice(0, 60)}»`);
    if (uncov.length) {
      fail = true;
      console.log(`(A) ${uncov.length} unabgedeckte(r) Textknoten/Attr:`);
      uncov.slice(0, 50).forEach((m) => console.log('  ' + m));
      if (uncov.length > 50) console.log(`  … und ${uncov.length - 50} weitere`);
    }
    const miss = [];
    for (const key of deKeys) {
      const de = deFlat[key];
      const allow = isAllowlisted(de);
      for (const lang of LANGS) {
        const cur = getPath(lang === 'en' ? enJson : trJson, key);
        if (isEmpty(cur)) miss.push(`${lang} fehlt: ${key}  «${norm(stripTags(de)).slice(0, 50)}»`);
        else if (typeof cur === 'string' && cur.startsWith('__TT__')) miss.push(`${lang} __TT__: ${key}`);
        else if (cur === de && !allow) miss.push(`${lang}==de: ${key}  «${norm(stripTags(de)).slice(0, 50)}»`);
      }
    }
    if (miss.length) {
      fail = true;
      console.log(`\n(B) ${miss.length} fehlende/identische Übersetzung(en):`);
      miss.slice(0, 60).forEach((m) => console.log('  ' + m));
      if (miss.length > 60) console.log(`  … und ${miss.length - 60} weitere`);
    }
    if (fail) { process.exitCode = 1; console.log('\n✗ i18n-Tor: ROT\n'); }
    else console.log('\n✓ i18n-Tor: GRÜN\n');
    return;
  }

  // ── APPLY: Allowlist setzen + übersetzen + schreiben ──
  // Inkrementell persistieren: de.json sofort, jede Sprach-JSON nach jedem
  // Batch — ein späterer Fehler verwirft so keine bereits fertige Arbeit.
  const writeJson = (p, obj) => fs.writeFile(p, JSON.stringify(obj, null, 2) + '\n');
  const langPath = (l) => path.join(I18N_DIR, `${l}.json`);

  let translated = { en: 0, tr: 0 };
  for (const lang of LANGS) {
    const target = lang === 'en' ? enJson : trJson;
    for (const [k, de] of allowSet[lang]) setPath(target, k, de); // DE==Wert
  }
  deMerged.lang = 'de'; enJson.lang = 'en'; trJson.lang = 'tr';
  await writeJson(path.join(I18N_DIR, 'de.json'), deMerged);

  if (need.en.length || need.tr.length) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    for (const lang of LANGS) {
      const target = lang === 'en' ? enJson : trJson;
      const batches = chunk(need[lang], 25);
      console.log(`Übersetze ${need[lang].length} Strings -> ${lang.toUpperCase()} (${batches.length} Batches) …`);
      for (let i = 0; i < batches.length; i++) {
        const res = await translateBatch(client, lang, batches[i]);
        let ok = 0;
        for (const [k] of batches[i]) {
          const v = res[k];
          if (typeof v === 'string' && v.trim()) { setPath(target, k, v); translated[lang]++; ok++; }
        }
        await writeJson(langPath(lang), target); // inkrementell sichern
        process.stdout.write(`  ${lang} Batch ${i + 1}/${batches.length} (${ok}/${batches[i].length} ok)\n`);
      }
    }
  } else {
    await writeJson(langPath('en'), enJson);
    await writeJson(langPath('tr'), trJson);
  }

  for (const key of deKeys) sources[key] = hash8(deFlat[key]);
  await writeJson(SOURCES_FILE, sources);

  console.log(`\nZusammenfassung:`);
  console.log(`  Textknoten/Attr gesamt:  ${totalNodes}`);
  console.log(`  neu gewrappt/injiziert:  ${wrapped}`);
  console.log(`  neu übersetzt EN:        ${translated.en}  (+ ${allowSet.en.length} Allowlist)`);
  console.log(`  neu übersetzt TR:        ${translated.tr}  (+ ${allowSet.tr.length} Allowlist)`);
  console.log(`  de/en/tr.json geschrieben.\n`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
