#!/usr/bin/env python3
"""
Clean up booking modal from all HTML pages and wire in booking.js
"""
import re, os

BASE = '/Users/fabianerdkonig/Downloads/Sulmsee'
PAGES = ['index.html', 'freizeit.html', 'stellplaetze.html', 'preise.html', 'anreise.html', 'kontakt.html']

for fname in PAGES:
    path = os.path.join(BASE, fname)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content

    # 1. Fix nav-link-active → nav-active (index.html)
    content = content.replace('class="nav-link-active"', 'class="nav-active"')

    # 2. Remove embedded booking modal HTML block
    # Matches from <!-- Booking Modal --> up to (but not including) <footer> or <!-- Hero -->
    content = re.sub(
        r'<!-- Booking Modal -->\s*<div class="modal-bg" id="bookingModal">.*?</div>\s*\n?</div>',
        '',
        content,
        flags=re.DOTALL
    )

    # 3. Remove booking JS block (comment + openBooking + closeBooking + addEventListener)
    content = re.sub(
        r'// Booking modal[^\n]*\n.*?document\.getElementById\(\'bookingModal\'\)\.addEventListener\([^;]+;\n?',
        '',
        content,
        flags=re.DOTALL
    )

    # 4. Remove submitBookingForm async function (index.html only, but safe for all)
    content = re.sub(
        r'async function submitBookingForm\(.*?\n\}\n?',
        '',
        content,
        flags=re.DOTALL
    )

    # 5. Fix double braces {{ }} in script blocks (Python f-string escape artefact)
    def fix_braces_in_scripts(text):
        def replacer(m):
            return m.group(0).replace('{{', '{').replace('}}', '}')
        return re.sub(r'<script[^>]*>.*?</script>', replacer, text, flags=re.DOTALL)
    content = fix_braces_in_scripts(content)

    # 6. Add booking.js before chatbot.js (if not already present)
    if 'booking.js' not in content:
        content = content.replace(
            '<script src="chatbot.js">',
            '<script src="booking.js"></script>\n<script src="chatbot.js">'
        )

    if content != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'[updated] {fname}')
    else:
        print(f'[no change] {fname}')

print('Done.')
