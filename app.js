// ============================================================
//  Cihaz Test PWA v2.2 - Touch & Vibrate Fix
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

function sectionTitle(text) {
  return el('div', 'section-title', text);
}

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

// ---------- Titreşim sarmalayıcı ----------
function safeVibrate(pattern) {
  if (!('vibrate' in navigator)) {
    toast('❌ Titreşim desteklenmiyor');
    return false;
  }
  try {
    const ok = navigator.vibrate(pattern);
    if (!ok) toast('⚠️ Titreşim reddedildi (sessiz mod veya etkileşim yok)');
    return ok;
  } catch (e) {
    toast('Titreşim hatası: ' + e.message);
    return false;
  }
}

// ---------- Online durum ----------
function updateOnline() {
  if (navigator.onLine) {
    onlineChip.classList.remove('offline');
    onlineText.textContent = 'Çevrimiçi';
  } else {
    onlineChip.classList.add('offline');
    onlineText.textContent = 'Çevrimdışı';
  }
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();

// ---------- Kartlar için renk değişkeni ----------
document.querySelectorAll('.card').forEach(card => {
  const c = card.dataset.color;
  if (c) card.style.setProperty('--card-color', c);
});

// ---------- Menü yönlendirme ----------
menu.addEventListener('click', (e) => {
  const btn = e.target.closest('.card');
  if (!btn) return;

  if ('vibrate' in navigator) {
    try { navigator.vibrate(20); } catch (_) {}
  }

  openPanel(btn.dataset.test);
});

backBtn.addEventListener('click', closePanel);

function openPanel(name) {
  panel.classList.remove('hidden');
  panel.setAttribute('aria-hidden', 'false');
  panelBody.innerHTML = '';
  panelBody.scrollTop = 0;
  if (cleanupFn) { cleanupFn(); cleanupFn = null; }

  const tests = {
    colors:  { title: '🎨 Ekran Renkleri', fn: testColors  },
    touch:   { title: '👆 Dokunmatik',     fn: testTouch   },
    speaker: { title: '🔊 Hoparlör',       fn: testSpeaker },
    mic:     { title: '🎤 Mikrofon',       fn: testMic     },
    vibrate: { title: '📳 Titreşim',       fn: testVibrate },
    network: { title: '🌐 İnternet',       fn: testNetwork },
  };
  const t = tests[name];
  if (!t) return;
  panelTitle.textContent = t.title;
  t.fn();
}

function closePanel() {
  if (cleanupFn) { cleanupFn(); cleanupFn = null; }
  panel.classList.add('hidden');
  panel.setAttribute('aria-hidden', 'true');
  panelBody.innerHTML = '';
}

// ============================================================
//  1) RENK TESTİ
// ============================================================
function testColors() {
  const colors = [
    { name: 'Kırmızı',   hex: '#FF0000', text: '#fff' },
    { name: 'Yeşil',     hex: '#00FF00', text: '#000' },
    { name: 'Mavi',      hex: '#0000FF', text: '#fff' },
    { name: 'Beyaz',     hex: '#FFFFFF', text: '#000' },
