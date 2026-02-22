// Kurdish Learning Extension — Content Script
// Depends on data/alphabet.js being loaded first (see manifest.json)

let tooltipHost = null;
let tooltipEl = null;

function buildTooltipDOM() {
  const host = document.createElement('div');
  host.id = 'kurdish-ext-host';
  host.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .tooltip {
      position: absolute;
      background: #12141f;
      color: #e0e0e0;
      border: 1px solid #2e3266;
      border-radius: 10px;
      padding: 12px 14px;
      min-width: 220px;
      max-width: 300px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.6);
      font-family: 'Segoe UI', Arial, sans-serif;
      pointer-events: auto;
    }
    .translit {
      font-size: 20px;
      font-weight: 700;
      color: #a8b8ff;
      text-align: center;
      letter-spacing: 1.5px;
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: 1px solid #2a2d4a;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .row + .row {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #222;
    }
    .glyph {
      font-size: 36px;
      line-height: 1;
      color: #a8b8ff;
      min-width: 40px;
      text-align: center;
    }
    .info {}
    .name {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
    }
    .pron {
      font-size: 12px;
      color: #aaa;
      line-height: 1.4;
    }
    .ipa {
      font-size: 11px;
      color: #5a8aff;
      margin-top: 2px;
    }
  `;
  shadow.appendChild(style);

  const div = document.createElement('div');
  div.className = 'tooltip';
  div.style.display = 'none';
  shadow.appendChild(div);

  document.body.appendChild(host);
  tooltipHost = host;
  tooltipEl = div;
}

function buildTransliteration(text) {
  let result = '';
  for (const char of text) {
    const info = kurdishAlphabet.find(l => l.letter === char);
    if (info) {
      result += info.sound;
    } else if (char === ' ' || char === '\u00a0') {
      result += ' ';
    }
    // skip punctuation and non-Kurdish chars
  }
  return result.trim();
}

function showTooltip(letters, transliteration, clientX, clientY) {
  if (!tooltipEl) buildTooltipDOM();

  let html = '';

  if (letters.length > 1 && transliteration) {
    html += `<div class="translit">${transliteration}</div>`;
  }

  html += letters.map(info => `
    <div class="row">
      <div class="glyph">${info.letter}</div>
      <div class="info">
        <div class="name">${info.sound}</div>
        <div class="pron">${info.pronunciation}</div>
        <div class="ipa">/${info.ipa}/</div>
      </div>
    </div>
  `).join('');

  tooltipEl.innerHTML = html;
  tooltipEl.style.display = 'block';
  tooltipEl.style.left = '-9999px';
  tooltipEl.style.top = '-9999px';

  requestAnimationFrame(() => {
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = clientX + 12;
    let top  = clientY - th - 12;

    if (left + tw > vw - 8)  left = clientX - tw - 12;
    if (left < 8)             left = 8;
    if (top < 8)              top  = clientY + 20;
    if (top + th > vh - 8)   top  = vh - th - 8;

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top  = top  + 'px';
  });
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = 'none';
}

document.addEventListener('mouseup', (e) => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) { hideTooltip(); return; }

  const text = sel.toString();
  if (!text.trim()) { hideTooltip(); return; }

  // Build transliteration preserving character order (including repeats)
  const transliteration = buildTransliteration(text);

  // Collect unique Kurdish letters in order of first appearance
  const seen = new Set();
  const found = [];
  for (const char of text) {
    if (!seen.has(char)) {
      const info = kurdishAlphabet.find(l => l.letter === char);
      if (info) { found.push(info); seen.add(char); }
    }
  }

  if (found.length === 0) { hideTooltip(); return; }

  showTooltip(found, transliteration, e.clientX, e.clientY);
});

document.addEventListener('mousedown', (e) => {
  if (tooltipHost && !tooltipHost.contains(e.target)) hideTooltip();
});
