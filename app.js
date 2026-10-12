// ============================================================
//  Cihaz Test PWA v2.0 - Modern
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

// ---------- Toast ----------
let toastTimer;
function toast(msg, ms = 2000) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
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
  if (navigator.vibrate) navigator.vibrate(15);
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

// Yardımcılar
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

  const counter = el('div', 'stat');
  let touches = 0, maxTouch = 0;
  counter.textContent = 'Toplam dokunma: 0';

  const info = el('div', 'stat-card');
  info.innerHTML = `
    <div class="stat-row"><span class="stat-label">Maks. eşzamanlı</span><span class="stat-value" id="maxT">0</span></div>
    <div class="stat-row"><span class="stat-label">Toplam</span><span class="stat-value" id="totT">0</span></div>
  `;

  panelBody.append(
    el('p', 'stat', 'Parmağınızı ekranda gezdirin. Çoklu dokunma desteklenir.'),
    info,
    pad
  );

  function handleTouch(e) {
    const rect = pad.getBoundingClientRect();
    const active = e.touches.length;
    if (active > maxTouch) {
      maxTouch = active;
      panelBody.querySelector('#maxT').textContent = maxTouch;
    }

    for (const t of e.changedTouches) {
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;

      const dot = el('div', 'dot');
      dot.style.left = x + 'px';
      dot.style.top  = y + 'px';
      pad.appendChild(dot);
      pad.classList.add('has-touch');
      setTimeout(() => dot.remove(), 900);
      touches++;
    }
    panelBody.querySelector('#totT').textContent = touches;
  }

  pad.addEventListener('touchstart', handleTouch, { passive: true });
  pad.addEventListener('touchmove',  handleTouch, { passive: true });

  cleanupFn = () => {
    pad.removeEventListener('touchstart', handleTouch);
    pad.removeEventListener('touchmove',  handleTouch);
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
  freq.min = 100; freq.max = 15000; freq.value = 440;
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

  const btn = el('button', 'btn block', '🎤 Kaydı Başlat');

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
      status.textContent = '❌ İzin reddedildi veya hata: ' + err.message;
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

  btn.classList.add('green');
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

  panelBody.append(info, card, sectionTitle('DESENLER'));

  function makeBtn(label, pattern, cls = 'btn block') {
    const b = el('button', cls, label);
    b.onclick = () => {
      if (!supported) { toast('Titreşim desteklenmiyor'); return; }
      navigator.vibrate(pattern);
      toast('📳 ' + label);
    };
    return b;
  }

  panelBody.append(
    makeBtn('Kısa — 100ms', 100),
    makeBtn('Uzun — 800ms', 800),
    makeBtn('Çift — 100-100-100', [100, 100, 100]),
    makeBtn('SOS — ···———···', [100,100,100, 300,300,300, 100,100,100]),
    makeBtn('Kalp Atışı', [80, 80, 80, 400, 80, 80, 80, 400], 'btn block red')
  );

  const stopBtn = el('button', 'btn block gray', '⏹ Durdur');
  stopBtn.onclick = () => {
    if (supported) navigator.vibrate(0);
    toast('Durduruldu');
  };
  panelBody.appendChild(stopBtn);
}

// ============================================================
//  6) İNTERNET TESTİ
// ============================================================
function testNetwork() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  const card = statCard([
    { label: 'Durum', value: navigator.onLine ? 'Bağlı' : 'Bağlı değil',
      cls: navigator.onLine ? 'status-ok' : 'status-bad' },
    { label: 'Bağlantı tipi', value: conn?.effectiveType?.toUpperCase() || 'bilinmiyor' },
    { label: 'Downlink', value: conn?.downlink ? conn.downlink + ' Mbps' : '—' },
    { label: 'RTT', value: conn?.rtt ? conn.rtt + ' ms' : '—' },
    { label: 'Save-Data', value: conn?.saveData ? 'Açık' : 'Kapalı' },
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
      speedOut.innerHTML = `Hız: <span class="status-ok">~${mbps.toFixed(2)} Mbps</span> (${sec.toFixed(2)} sn)`;
    } catch (e) {
      speedOut.innerHTML = 'Hız testi: <span class="status-bad">❌ ' + e.message + '</span>';
    }
  };

  const pingBtn = el('button', 'btn block', '📡 Ping Testi');
  pingBtn.onclick = async () => {
    pingOut.textContent = 'Ping: ölçülüyor...';
    const t0 = performance.now();
    try {
      await fetch('https://speed.cloudflare.com/__down?bytes=10&t=' + Date.now(), { cache: 'no-store' });
      pingOut.innerHTML = `Ping: <span class="status-ok">${(performance.now() - t0).toFixed(0)} ms</span>`;
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