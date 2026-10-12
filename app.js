// ============================================================
//  2) DOKUNMATİK TESTİ — v3 (kesin çalışan)
// ============================================================
function testTouch() {
  const pad = el('div', 'touch-pad');
  // ✅ Placeholder artık bir DOM elementi (::before değil)
  const placeholder = el('div', 'placeholder', 'Parmağınızı ekranda gezdirin');
  pad.appendChild(placeholder);

  const info = el('div', 'stat-card');
  info.innerHTML = `
    <div class="stat-row">
      <span class="stat-label">Aktif dokunma</span>
      <span class="stat-value" id="actT">0</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Maks. eşzamanlı</span>
      <span class="stat-value" id="maxT">0</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Toplam</span>
      <span class="stat-value" id="totT">0</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Son koordinat</span>
      <span class="stat-value" id="posT">—</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Olay tipi</span>
      <span class="stat-value" id="evtT">—</span>
    </div>
  `;

  panelBody.append(
    el('p', 'stat', 'Parmağınızı sarı alanda gezdirin. Çoklu dokunma desteklenir.'),
    info,
    pad
  );

  // ---------- Durum ----------
  let touches = 0;
  let maxTouch = 0;
  const activeIds = new Set();          // aktif dokunma id'leri
  const dotMap = new Map();             // id → DOM elementi

  const $act = () => panelBody.querySelector('#actT');
  const $max = () => panelBody.querySelector('#maxT');
  const $tot = () => panelBody.querySelector('#totT');
  const $pos = () => panelBody.querySelector('#posT');
  const $evt = () => panelBody.querySelector('#evtT');

  // ---------- Yardımcı: dokunma id'sini string yap ----------
  // ✅ KRİTİK: t.identifier sayı olabilir; CSS selector'da sorun çıkarır.
  //    Bu yüzden Map ile yönetiyoruz, querySelector kullanmıyoruz.
  function idKey(t) {
    return String(t.identifier);
  }

  function getPos(t) {
    const rect = pad.getBoundingClientRect();
    return {
      x: t.clientX - rect.left,
      y: t.clientY - rect.top,
    };
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

  // ---------- Olay işleyiciler ----------
  function onStart(e) {
    e.preventDefault();   // ✅ passive: false olmalı
    $evt().textContent = 'touchstart';

    // Maks. eşzamanlı takibi
    const activeNow = activeIds.size + e.changedTouches.length;
    if (activeNow > maxTouch) {
      maxTouch = activeNow;
      $max().textContent = maxTouch;
    }

    for (const t of e.changedTouches) {
      const key = idKey(t);
      if (activeIds.has(key)) continue;   // zaten aktif

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

    if (activeIds.size === 0) {
      pad.classList.remove('has-touch');
    }
  }

  // ✅ KRİTİK: passive: false → preventDefault çalışsın
  const opts = { passive: false };
  pad.addEventListener('touchstart',  onStart, opts);
  pad.addEventListener('touchmove',   onMove,  opts);
  pad.addEventListener('touchend',    onEnd,   opts);
  pad.addEventListener('touchcancel', onEnd,   opts);

  // ---------- Masaüstü (fare) desteği ----------
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
    pad.classList.add('has-touch');
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
    if (activeIds.size === 0) pad.classList.remove('has-touch');
  }

  pad.addEventListener('mousedown', onMouseDown);
  pad.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // ---------- Temizlik ----------
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
