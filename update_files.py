#!/usr/bin/env python3
import re
import os

BASE = '/Users/fabianerdkonig/Downloads/Sulmsee'
FILES = ['index.html', 'freizeit.html', 'preise.html', 'stellplaetze.html', 'anreise.html', 'kontakt.html']

NEW_MODAL = '''<!-- Booking Modal -->
<div class="modal-bg" id="bookingModal">
  <div class="modal" style="max-width:580px">
    <div class="modal-header">
      <div><h2>Stellplatz anfragen</h2><p>Camping Sulmsee · Saison 2026</p></div>
      <button class="modal-close" onclick="closeBooking()">✕</button>
    </div>
    <div class="modal-body" id="bk-form">
      <div class="form-row">
        <div class="form-group"><label>Anreise *</label><input type="date" id="bk-arrival" min="2026-04-17" max="2026-10-26"></div>
        <div class="form-group"><label>Abreise *</label><input type="date" id="bk-departure" min="2026-04-18" max="2026-10-26"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Erwachsene</label><select id="bk-adults"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></div>
        <div class="form-group"><label>Kinder (bis 14)</label><select id="bk-kids"><option selected>0</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
      </div>
      <div class="form-group"><label>Stellplatz-Typ</label>
        <select id="bk-spot">
          <option value="see">Sulmsee-Stellplatz (direkt am Wasser, Plätze 1–24)</option>
          <option value="silber">Silbersee-Stellplatz (im Grünen, Plätze 25–88)</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Vorname *</label><input type="text" id="bk-fname" placeholder="Max"></div>
        <div class="form-group"><label>Nachname *</label><input type="text" id="bk-lname" placeholder="Muster"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>E-Mail *</label><input type="email" id="bk-email" placeholder="max@beispiel.at"></div>
        <div class="form-group"><label>Telefon</label><input type="tel" id="bk-phone" placeholder="+43 ..."></div>
      </div>
      <div class="form-group"><label>Fahrzeug</label><input type="text" id="bk-vehicle" placeholder="Wohnmobil, Caravan, Zelt …"></div>
      <div class="form-group"><label>Nachricht</label><textarea id="bk-msg" style="min-height:70px" placeholder="Besondere Wünsche oder Fragen …"></textarea></div>
      <button id="bk-submit" class="modal-next-btn" style="width:100%;padding:1rem;font-size:.95rem;border-radius:var(--rs);margin-top:.5rem" onclick="submitBookingForm(this)">🗓 Buchungsanfrage absenden</button>
      <p style="font-size:.75rem;color:var(--tl);text-align:center;margin-top:.8rem">* Pflichtfelder · Bestätigung innerhalb von 24 Stunden</p>
    </div>
    <div id="bk-success" style="display:none;text-align:center;padding:2.5rem 2rem">
      <div style="font-size:3.5rem;margin-bottom:1rem">✅</div>
      <h3 style="font-family:'Lora',serif;font-size:1.6rem;color:var(--f);margin-bottom:.5rem">Anfrage eingegangen!</h3>
      <p style="color:var(--tm);line-height:1.8;max-width:380px;margin:0 auto 1.5rem">Vielen Dank, <strong id="bk-success-name"></strong>! Ihre Buchungsanfrage wurde gespeichert. Wir melden uns innerhalb von 24 Stunden per E-Mail.</p>
      <button class="btn btn-green" onclick="closeBooking()">Schließen</button>
    </div>
  </div>
</div>'''

SUBMIT_FUNC = '''async function submitBookingForm(btn){
  const arrival=document.getElementById('bk-arrival').value;
  const departure=document.getElementById('bk-departure').value;
  const fname=document.getElementById('bk-fname').value.trim();
  const lname=document.getElementById('bk-lname').value.trim();
  const email=document.getElementById('bk-email').value.trim();
  if(!arrival||!departure||!fname||!lname||!email){
    alert('Bitte füllen Sie alle Pflichtfelder aus: Anreise, Abreise, Vor- und Nachname, E-Mail.');return;
  }
  if(new Date(departure)<=new Date(arrival)){
    alert('Die Abreise muss nach der Anreise liegen.');return;
  }
  btn.disabled=true;btn.textContent='Wird gesendet …';
  const nights=Math.round((new Date(departure)-new Date(arrival))/86400000);
  const payload={
    fname,lname,email,
    phone:document.getElementById('bk-phone').value,
    arrival,departure,nights,
    adults:+document.getElementById('bk-adults').value,
    youth:0,
    kids:+document.getElementById('bk-kids').value,
    spot:document.getElementById('bk-spot').value,
    vehicle:document.getElementById('bk-vehicle').value,
    message:document.getElementById('bk-msg').value,
    total:0
  };
  try{
    const r=await fetch('/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const j=await r.json();
    if(!r.ok||!j.success)throw new Error(j.error||'Fehler');
    document.getElementById('bk-success-name').textContent=fname;
    document.getElementById('bk-form').style.display='none';
    document.getElementById('bk-success').style.display='block';
  }catch(e){
    btn.disabled=false;btn.textContent='🗓 Buchungsanfrage absenden';
    const s=encodeURIComponent('Buchungsanfrage Camping Sulmsee 2026 – '+fname+' '+lname);
    const b=encodeURIComponent('Name: '+fname+' '+lname+'\\nE-Mail: '+email+'\\nTelefon: '+(document.getElementById('bk-phone').value||'–')+'\\nAnreise: '+arrival+'\\nAbreise: '+departure+' ('+nights+' Nächte)\\nErwachsene: '+document.getElementById('bk-adults').value+'\\nKinder: '+document.getElementById('bk-kids').value+'\\nStellplatz: '+document.getElementById('bk-spot').value+'\\nFahrzeug: '+(document.getElementById('bk-vehicle').value||'–')+'\\n\\nNachricht:\\n'+(document.getElementById('bk-msg').value||'–'));
    window.location.href='mailto:info@flerdvision.com?subject='+s+'&body='+b;
  }
}
'''

# closeBooking replacement — we need two versions: single-brace (index.html) and double-brace (others)
CLOSE_SINGLE = "function closeBooking(){document.getElementById('bookingModal').classList.remove('open');document.body.style.overflow='';}"
CLOSE_DOUBLE = "function closeBooking(){{document.getElementById('bookingModal').classList.remove('open');document.body.style.overflow='';}}"

NEW_CLOSE_SINGLE = """function closeBooking(){
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow='';
  // reset form
  const f=document.getElementById('bk-form');
  const s=document.getElementById('bk-success');
  const btn=document.getElementById('bk-submit');
  if(f)f.style.display='';
  if(s)s.style.display='none';
  if(btn){btn.disabled=false;btn.textContent='🗓 Buchungsanfrage absenden';}
}"""

NEW_CLOSE_DOUBLE = """function closeBooking(){{
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow='';
  // reset form
  const f=document.getElementById('bk-form');
  const s=document.getElementById('bk-success');
  const btn=document.getElementById('bk-submit');
  if(f)f.style.display='';
  if(s)s.style.display='none';
  if(btn){{btn.disabled=false;btn.textContent='🗓 Buchungsanfrage absenden';}}
}}"""

for filename in FILES:
    path = os.path.join(BASE, filename)
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()

    original = content

    # ── Task 1: Replace all "2025" with "2026" ──────────────────────────────
    count_2025 = content.count('2025')
    content = content.replace('2025', '2026')
    print(f"[{filename}] Task 1: replaced {count_2025} occurrences of '2025' → '2026'")

    # ── Task 2: Replace booking modal block ────────────────────────────────
    # Match from <!-- Booking Modal (optional suffix) --> up through </div>\n</div>
    # that closes the .modal-bg > .modal pair
    modal_pattern = re.compile(
        r'<!-- Booking Modal.*?-->\s*\n<div class="modal-bg".*?</div>\s*\n</div>',
        re.DOTALL
    )
    match = modal_pattern.search(content)
    if match:
        content = content[:match.start()] + NEW_MODAL + content[match.end():]
        print(f"[{filename}] Task 2: booking modal replaced")
    else:
        print(f"[{filename}] Task 2: WARNING – modal block NOT found!")

    # ── Task 3a: Add submitBookingForm before openBooking ──────────────────
    # Handle both single-brace and double-brace variants
    if 'submitBookingForm' in content:
        print(f"[{filename}] Task 3a: submitBookingForm already present, skipping insert")
    else:
        # Try double-brace first, then single
        if 'function openBooking(){{' in content:
            content = content.replace('function openBooking(){{', SUBMIT_FUNC + 'function openBooking(){{', 1)
            print(f"[{filename}] Task 3a: submitBookingForm inserted before openBooking() (double-brace)")
        elif 'function openBooking(){' in content:
            content = content.replace('function openBooking(){', SUBMIT_FUNC + 'function openBooking(){', 1)
            print(f"[{filename}] Task 3a: submitBookingForm inserted before openBooking() (single-brace)")
        else:
            print(f"[{filename}] Task 3a: WARNING – openBooking() NOT found!")

    # ── Task 3b: Replace closeBooking ─────────────────────────────────────
    # After Task 1 the year in closeBooking text (if any) is already 2026.
    # The function bodies we target don't contain year strings so no conflict.
    # Try double-brace first
    if CLOSE_DOUBLE in content:
        content = content.replace(CLOSE_DOUBLE, NEW_CLOSE_DOUBLE, 1)
        print(f"[{filename}] Task 3b: closeBooking replaced (double-brace)")
    elif CLOSE_SINGLE in content:
        content = content.replace(CLOSE_SINGLE, NEW_CLOSE_SINGLE, 1)
        print(f"[{filename}] Task 3b: closeBooking replaced (single-brace)")
    else:
        print(f"[{filename}] Task 3b: WARNING – closeBooking() pattern NOT found!")

    if content != original:
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"[{filename}] Written to disk.\n")
    else:
        print(f"[{filename}] No changes made.\n")

print("Done.")
