// ============================================================
//  Cihaz Test PWA v2.3 - TAM
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

// ---------- Titreşim ----------
function safeVibrate(pattern) {
  if (!('vibrate' in navigator)) {
    toast('❌ Titreşim desteklenmiyor');
    return false;
  }
  try {
    const ok = navigator.vibrate(pattern);
    if (!ok) toast('⚠️ Titreşim reddedildi (sessiz mod?)');
    return ok;
  } catch (e) {
    toast('Titreşim hatası: ' + e.message);
    return false;
  }
}

// ---------- Online ----------
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

// ---------- Kart renkleri ----------
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
    { name: 'Siyah',     hex: '#000000', text: '#fff' },
    { name: 'Sarı',      hex: '#FFFF00', text: '#000' },
    { name: 'Camgöbeği', hex: '#00FFFF', text: '#000' },
    { name: 'Macenta',   hex: '#FF00FF', text: '#fff' },
    { name: 'Turuncu',   hex: '#FF7A00', text: '#000' },
    { name: 'Gri',       hex: '#808080', text: '#fff' },
    { name: 'Lacivert',  hex: '#000080', text: '#fff' },
    { name: 'Bordo',     hex: '#800000', text: '#fff' },
  ];

  panelBody.append(
    el('p', 'stat', 'Bir renge dokunun → tam ekran. Çıkmak için ekrana tekrar dokunun.')
  );

  const grid = el('div', 'color-btns');
  colors.forEach(c => {
    const b = el('button', 'color-btn', c.name);
    b.style.background = c.hex;
    b.style.color = c.text;
    b.onclick = () => fullScreenColor(c.name, c.hex, c.text);
    grid.appendChild(b);
  });
  panelBody.appendChild(grid);
}

function fullScreenColor(name, hex, textColor) {
  const div = el('div', 'color-full');
  div.style.background = hex;
  div.style.color = textColor;
  div.innerHTML = `${name}<div class="hint">Çıkmak için dokun</div>`;

  const exit = () => {
    div.remove();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  div.onclick = exit;

  document.body.appendChild(div);
  if (div.requestFullscreen) div.requestFullscreen().catch(() => {});

  const obs = new MutationObserver(() => {
    if (!document.body.contains(div)) obs.disconnect();
  });
  obs.observe(document.body, { childList: true });
}

// ============================================================
//  2) DOKUNMATİK TESTİ
// ============================================================
function testTouch() {
  const pad = el('div', 'touch-pad');
  const placeholder = el('div', 'placeholder', 'Parmağınızı ekranda gezdirin');
  pad.appendChild(placeholder);

  const info = el('div', 'stat-card');
  info.innerHTML = `
    <div class="stat-row"><span class="stat-label">Aktif dokunma</span><span class="stat-value" id="actT">0</span></div>
    <div class="stat-row"><span class="stat-label">Maks. eşzamanlı</span><span class="stat-value" id="maxT">0</span></div>
    <div class="stat-row"><span class="stat-label">Toplam</span><span class="stat-value" id="totT">0</span></div>
    <div class="stat-row"><span class="stat-label">Son koordinat</span><span class="stat-value" id="posT">—</span></div>
    <div class="stat-row"><span class="stat-label">Olay tipi</span><span class="stat-value" id="evtT">—</span></div>
  `;

  panelBody.append(
    el('p', 'stat', 'Parmağınızı sarı alanda gezdirin. Çoklu dokunma desteklenir.'),
    info,
    pad
  );

  let touches = 0;
  let maxTouch = 0;
  const activeIds = new Set();
  const dotMap = new Map();

  const $act = () => panelBody.querySelector('#actT');
  const $max = () => panelBody.querySelector('#maxT');
  const $tot = () => panelBody.querySelector('#totT');
  const $pos = () => panelBody.querySelector('#posT');
  const $evt = () => panelBody.querySelector('#evtT');

  function idKey(t) {
    return String(t.identifier);
  }

  function getPos(t) {
    const rect = pad.getBoundingClientRect();
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function spawnDot(x, y, key) {
    const dot = el('div', 'dot');
    dot.style.left = x + 'px';
    dot.style.top  = y + 'px';
    pad.appendChild(dot);
    dotMap.set(key, dot);
    pad.classList.add('has-touch');
  }

  function moveDot(dot, x, y) {
    if (!dot) return;
    dot.style.left = x + 'px';
    dot.style.top  = y + 'px';
  }

  function removeDot(key) {
    const dot = dotMap.get(key);
    if (dot) {
      dot.style.transition = 'opacity .35s, transform .35s';
      dot.style.opacity = '0';
      dot.style.transform = 'translate(-50%, -50%) scale(1.6)';
      setTimeout(() => dot.remove(), 400);
      dotMap.delete(key);
    }
  }

  function onStart(e) {
    e.preventDefault();
    $evt().textContent = 'touchstart';

    const activeNow = activeIds.size + e.changedTouches.length;
    if (activeNow > maxTouch) {
      maxTouch = activeNow;
      $max().textContent = maxTouch;
    }

    for (const t of e.changedTouches) {
      const key = idKey(t);
      if (activeIds.has(key)) continue;
      const { x, y } = getPos(t);
      spawnDot(x, y, key);
      activeIds.add(key);
      touches++;
      $pos().textContent = `${Math.round(x)}, ${Math.round(y)}`;
    }

    $act().textContent = activeIds.size;
    $tot().textContent = touches;
  }

  function onMove(e) {
    e.preventDefault();
    $evt().textContent = 'touchmove';

    for (const t of e.changedTouches) {
      const key = idKey(t);
      if (!activeIds.has(key)) continue;
      const { x, y } = getPos(t);
      moveDot(dotMap.get(key), x, y);
      $pos().textContent = `${Math.round(x)}, ${Math.round(y)}`;
    }
  }

  function onEnd(e) {
    e.preventDefault();
    $evt().textContent = e.type === 'touchcancel' ? 'touchcancel' : 'touchend';

    for (const t of e.changedTouches) {
      const key = idKey(t);
      activeIds.delete(key);
      removeDot(key);
    }

    $act().textContent = activeIds.size;
    if (activeIds.size === 0) pad.classList.remove('has-touch');
  }

  const opts = { passive: false };
  pad.addEventListener('touchstart',  onStart, opts);
  pad.addEventListener('touchmove',   onMove,  opts);
  pad.addEventListener('touchend',    onEnd,   opts);
  pad.addEventListener('touchcancel', onEnd,   opts);

  // Fare desteği (masaüstü test için)
  let mouseDown = false;

  function onMouseDown(e) {
    mouseDown = true;
    const rect = pad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spawnDot(x, y, 'mouse');
    touches++;
    $tot().textContent = touches;
    $pos().textContent = `${Math.round(x)}, ${Math.round(y)}`;
    $evt().textContent = 'mousedown';
  }

  function onMouseMove(e) {
    if (!mouseDown) return;
    const rect = pad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    moveDot(dotMap.get('mouse'), x, y);
    $pos().textContent = `${Math.round(x)}, ${Math.round(y)}`;
    $evt().textContent = 'mousemove';
  }

  function onMouseUp() {
    if (!mouseDown) return;
    mouseDown = false;
    removeDot('mouse');
    $evt().textContent = 'mouseup';
  }

  pad.addEventListener('mousedown', onMouseDown);
  pad.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  cleanupFn = () => {
    pad.removeEventListener('touchstart',  onStart);
    pad.removeEventListener('touchmove',   onMove);
    pad.removeEventListener('touchend',    onEnd);
    pad.removeEventListener('touchcancel', onEnd);
    pad.removeEventListener('mousedown', onMouseDown);
    pad.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    dotMap.clear();
    activeIds.clear();
  };
}

// ============================================================
//  3) HOPARLÖR TESTİ
// ============================================================
function testSpeaker() {
  let ctx = null, osc = null;

  const info = el('p', 'stat', 'Sol/Sağ kanal testi ve frekans üreteci. Ses açık olsun.');
  const freqLabel = el('div', 'stat');
  freqLabel.textContent = 'Frekans: 440 Hz';

  const freq = document.createElement('input');
  freq.type = 'range';
  freq.min = 100;
  freq.max = 15000;
  freq.value = 440;
  freq.oninput = () => {
    freqLabel.textContent = 'Frekans: ' + freq.value + ' Hz';
    if (osc) osc.frequency.value = +freq.value;
  };

  function beep(pan = 0, seconds = 1.5) {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      if (osc) { try { osc.stop(); } catch (_) {} }

      osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      osc.type = 'sine';
      osc.frequency.value = +freq.value;
      gain.gain.value = 0.2;

      if (panner) {
        panner.pan.value = pan;
        osc.connect(gain).connect(panner).connect(ctx.destination);
      } else {
        osc.connect(gain).connect(ctx.destination);
      }

      osc.start();
      osc.stop(ctx.currentTime + seconds);
      osc.onended = () => { osc = null; };
    } catch (e) {
      toast('Ses hatası: ' + e.message);
    }
  }

  const bLeft  = el('button', 'btn', '◀ Sol Kanal');
  const bBoth  = el('button', 'btn green', '🔊 Her İki Kanal');
  const bRight = el('button', 'btn', 'Sağ Kanal ▶');
  const bSweep = el('button', 'btn amber', '🎵 Frekans Taraması');

  bLeft.onclick  = () => beep(-1);
  bBoth.onclick  = () => beep(0);
  bRight.onclick = () => beep(1);
  bSweep.onclick = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(100, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(15000, ctx.currentTime + 4);
    g.gain.value = 0.15;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 4);
  };

  panelBody.append(
    info,
    sectionTitle('FREKANS'),
    freqLabel,
    freq,
    sectionTitle('KANAL TESTİ'),
    bLeft, bBoth, bRight, bSweep
  );

  cleanupFn = () => {
    if (osc) { try { osc.stop(); } catch (_) {} osc = null; }
    if (ctx) { ctx.close().catch(() => {}); ctx = null; }
  };
}

// ============================================================
//  4) MİKROFON TESTİ
// ============================================================
async function testMic() {
  const info = el('p', 'stat', 'Mikrofon izni istenecek. Ses seviyesi canlı ölçülür.');

  const meter = el('div', 'meter');
  const fill = el('div', 'meter-fill');
  meter.appendChild(fill);

  const status = el('div', 'stat');
  status.textContent = 'Bekleniyor...';

  const btn = el('button', 'btn block green', '🎤 Kaydı Başlat');

  panelBody.append(info, meter, status, btn);

  let stream, actx, analyser, raf;

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const src = actx.createMediaStreamSource(stream);
      analyser = actx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);

      const buf = new Uint8Array(analyser.frequencyBinCount);
      let peak = 0;

      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const pct = Math.min(100, rms * 300);
        if (pct > peak) peak = pct;
        fill.style.width = pct + '%';
        status.textContent = `Seviye: ${pct.toFixed(0)}%  |  Zirve: ${peak.toFixed(0)}%`;
        raf = requestAnimationFrame(loop);
      };
      loop();

      btn.textContent = '⏹ Durdur';
      btn.classList.remove('green');
      btn.classList.add('red');
      btn.onclick = stop;
      toast('Mikrofon aktif');
    } catch (err) {
      status.textContent = '❌ Hata: ' + err.message;
      status.classList.add('status-bad');
      toast('Mikrofon izni gerekli');
    }
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (actx) actx.close().catch(() => {});
    fill.style.width = '0%';
    status.textContent = 'Durduruldu.';
    status.classList.remove('status-bad');
    btn.textContent = '🎤 Kaydı Başlat';
    btn.classList.remove('red');
    btn.classList.add('green');
    btn.onclick = start;
  }

  btn.onclick = start;
  cleanupFn = stop;
}

// ============================================================
//  5) TİTREŞİM TESTİ
// ============================================================
function testVibrate() {
  const supported = 'vibrate' in navigator;

  const info = el('p', 'stat',
    supported
      ? 'Titreşim destekleniyor. Bir desen seçin.'
      : 'Bu tarayıcıda titreşim API\'si yok.'
  );

  const card = statCard([
    { label: 'API Desteği', value: supported ? '✅ Var' : '❌ Yok',
      cls: supported ? 'status-ok' : 'status-bad' },
    { label: 'Platform', value: navigator.platform || '—' },
  ]);

  const visual = el('div', 'vibrate-visual');
  for (let i = 0; i < 9; i++) visual.appendChild(el('div', 'bar'));

  panelBody.append(info, card, visual, sectionTitle('DESENLER'));

  function vibrateWithVisual(pattern, duration) {
    const ok = safeVibrate(pattern);
    if (!ok) return;
    visual.classList.add('active');
    clearTimeout(vibrateWithVisual._t);
    vibrateWithVisual._t = setTimeout(() => {
      visual.classList.remove('active');
    }, duration || 800);
  }

  function makeBtn(label, pattern, duration, cls = 'btn block') {
    const b = el('button', cls, label);
    b.addEventListener('click', () => {
      vibrateWithVisual(pattern, duration);
    });
    return b;
  }

  panelBody.append(
    makeBtn('Kısa — 100ms', 100, 100),
    makeBtn('Uzun — 800ms', 800, 800),
    makeBtn('Çift — 100-100-100', [100, 100, 100], 300),
    makeBtn('SOS — ···———···', [100, 100, 100, 300, 300, 300, 100, 100, 100], 900),
    makeBtn('Kalp Atışı', [80, 80, 80, 400, 80, 80, 80, 400], 1600, 'btn block amber'),
    makeBtn('Kademeli (50→500ms)', [50, 100, 200, 300, 500], 1150, 'btn block')
  );

  const stopBtn = el('button', 'btn block red', '⏹ Durdur');
  stopBtn.addEventListener('click', () => {
    safeVibrate(0);
    visual.classList.remove('active');
  });
  panelBody.appendChild(stopBtn);

  cleanupFn = () => {
    safeVibrate(0);
    visual.classList.remove('active');
  };
}

// ============================================================
//  6) İNTERNET TESTİ
// ============================================================
function testNetwork() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  const card = statCard([
    { label: 'Durum', value: navigator.onLine ? 'Bağlı' : 'Bağlı değil',
      cls: navigator.onLine ? 'status-ok' : 'status-bad' },
    { label: 'Bağlantı tipi', value: conn && conn.effectiveType ? conn.effectiveType.toUpperCase() : 'bilinmiyor' },
    { label: 'Downlink', value: conn && conn.downlink ? conn.downlink + ' Mbps' : '—' },
    { label: 'RTT', value: conn && conn.rtt ? conn.rtt + ' ms' : '—' },
    { label: 'Save-Data', value: conn && conn.saveData ? 'Açık' : 'Kapalı' },
  ]);

  const speedOut = el('div', 'stat');
  speedOut.textContent = 'Hız testi: hazır.';

  const pingOut = el('div', 'stat');
  pingOut.textContent = 'Ping: hazır.';

  const speedBtn = el('button', 'btn block green', '⚡ Hız Testi (1 MB)');
  speedBtn.onclick = async () => {
    speedOut.textContent = 'Hız testi: ölçülüyor...';
    try {
      const url = 'https://speed.cloudflare.com/__down?bytes=1000000&t=' + Date.now();
      const t0 = performance.now();
      const res = await fetch(url, { cache: 'no-store' });
      await res.arrayBuffer();
      const sec = (performance.now() - t0) / 1000;
      const mbps = (1 * 8) / sec;
      speedOut.innerHTML = 'Hız: <span class="status-ok">~' + mbps.toFixed(2) + ' Mbps</span> (' + sec.toFixed(2) + ' sn)';
    } catch (e) {
      speedOut.innerHTML = 'Hız: <span class="status-bad">❌ ' + e.message + '</span>';
    }
  };

  const pingBtn = el('button', 'btn block', '📡 Ping Testi');
  pingBtn.onclick = async () => {
    pingOut.textContent = 'Ping: ölçülüyor...';
    const t0 = performance.now();
    try {
      await fetch('https://speed.cloudflare.com/__down?bytes=10&t=' + Date.now(), { cache: 'no-store' });
      pingOut.innerHTML = 'Ping: <span class="status-ok">' + (performance.now() - t0).toFixed(0) + ' ms</span>';
    } catch (e) {
      pingOut.innerHTML = 'Ping: <span class="status-bad">başarısız</span>';
    }
  };

  panelBody.append(card, speedBtn, speedOut, pingBtn, pingOut);

  const onl = () => { toast('🌐 Çevrimiçi'); updateOnline(); };
  const off = () => { toast('📴 Çevrimdışı'); updateOnline(); };
  window.addEventListener('online', onl);
  window.addEventListener('offline', off);

  cleanupFn = () => {
    window.removeEventListener('online', onl);
    window.removeEventListener('offline', off);
  };
}

// ============================================================
//  SERVICE WORKER KAYDI
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('✅ SW kayıtlı:', reg.scope))
      .catch(err => console.warn('❌ SW kayıt hatası:', err));
  });
}
