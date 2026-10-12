// ============================================================
//  Cihaz Test PWA v2.3
// ============================================================

const menu        = document.getElementById('menu');
const panel       = document.getElementById('panel');
const panelTitle  = document.getElementById('panelTitle');
const panelBody   = document.getElementById('panelBody');
const backBtn     = document.getElementById('backBtn');
const toastEl     = document.getElementById('toast');
const onlineChip  = document.getElementById('onlineChip');
const onlineText  = document.getElementById('onlineText');

document.getElementById('year').textContent = new Date().getFullYear();

let cleanupFn = null;

// ---------- Yardımcılar ----------
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function sectionTitle(text) { return el('div', 'section-title', text); }
function statCard(rows) {
  const card = el('div', 'stat-card');
  rows.forEach(r => {
    const row = el('div', 'stat-row');
    row.append(
      el('span', 'stat-label', r.label),
      el('span', 'stat-value ' + (r.cls || ''), r.value)
    );
    card.appendChild(row);
  });
  return card;
}

// ---------- Toast ----------
let toastTimer;
function toast(msg, ms = 2000) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ---------- Titreşim ----------
function safeVibrate(pattern) {
  if (!('vibrate' in navigator)) {
    toast('❌ Titreşim desteklenmi
