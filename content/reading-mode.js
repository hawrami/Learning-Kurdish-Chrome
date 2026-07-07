// Kurdish Learning Extension — Reading Mode (faded transliteration)
// Depends on data/alphabet.js being loaded first (see manifest.json).
//
// Idea: on any page, render Kurdish Sorani text with a *mix* of native letters
// and their Latin transliteration, switched intermittently letter-by-letter.
// When you hit a native letter you can't yet recall, the transliterated letters
// around it give you the phonetic context to reconstruct it — scaffolded
// retrieval practice that fades toward all-native as your per-letter mastery
// grows. See README "Reading Mode" and RESEARCH.md for the pedagogy.

// ─────────────────────────────────────────────────────────────────────────────
// Pure core (no DOM) — kept dependency-free so it can be unit-tested under Node.
// ─────────────────────────────────────────────────────────────────────────────
function makeCore(alphabet) {
  const LETTER_INFO = new Map(alphabet.map(l => [l.letter, l]));

  // Perso-Arabic ranges covering Sorani letters, marks, and joiners.
  const ARABIC_RANGE = '\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF';
  const WORD_SRC = '[' + ARABIC_RANGE + ']+';

  // Split a text string into alternating {type:'word'} (a maximal run of
  // Arabic-range characters) and {type:'other'} (everything else, untouched).
  function segment(text) {
    const re = new RegExp(WORD_SRC, 'g');
    const parts = [];
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parts.push({ type: 'other', text: text.slice(last, m.index) });
      parts.push({ type: 'word', text: m[0] });
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ type: 'other', text: text.slice(last) });
    return parts;
  }

  // Probability that a given letter is rendered in NATIVE script (a retrieval
  // test) rather than transliterated (a scaffold). Unknown letters stay mostly
  // scaffolded, with rare native flashes so hard items still get retrieval
  // practice (desirable difficulty); mastered letters go mostly native. The
  // whole thing is scaled by the global `fade` (0 = all training wheels, 100 =
  // all native).
  function pNative(letter, mastery, fade) {
    const m = mastery[letter] || 0;                 // 0..5
    const mf = Math.max(0, Math.min(1, m / 5));
    const f  = Math.max(0, Math.min(1, fade / 100));
    return f * (0.15 + 0.85 * mf);
  }

  // Turn one word (string of Arabic-range chars) into an ordered token list.
  // Consecutive native letters (and any combining marks / unknown chars) are
  // COALESCED into a single native run so the browser can shape them with
  // correct cursive joining — only a transliterated letter breaks a run.
  // rng() must return a float in [0,1).
  // A letter counts as readable "context" if it's transliterated (the scaffold)
  // or a native letter the learner already knows well.
  const KNOWN_ENOUGH = 3;  // mastery (0..5) at which a native letter reads as context

  function renderWord(word, mastery, fade, rng) {
    const classed = [];
    for (const ch of word) {
      const info = LETTER_INFO.get(ch);
      if (!info) { classed.push({ ch, kind: 'passthrough' }); continue; }
      const native = rng() < pNative(ch, mastery, fade);
      classed.push({ ch, info, kind: native ? 'native' : 'translit' });
    }

    // Comprehensibility guard (Krashen i+1): never leave a word so full of
    // unknown native letters that nothing anchors the inference. Keep at least
    // ~40% of a word's letters readable by demoting the hardest native letters
    // back to transliteration (the hardest letter becomes the anchor others
    // are inferred from). All-native words made of already-known letters are
    // left alone — those are the desirable full-native test exposures.
    const letters = classed.filter(c => c.kind !== 'passthrough');
    if (letters.length > 1) {
      const isContext = c => c.kind === 'translit' || (mastery[c.ch] || 0) >= KNOWN_ENOUGH;
      const need = Math.max(1, Math.ceil(letters.length * 0.4));
      let context = letters.filter(isContext).length;
      while (context < need) {
        // demote the lowest-mastery, still-hard native letter to translit
        let pick = null, lowest = Infinity;
        for (const c of classed) {
          if (c.kind === 'native' && (mastery[c.ch] || 0) < KNOWN_ENOUGH) {
            const m = mastery[c.ch] || 0;
            if (m < lowest) { lowest = m; pick = c; }
          }
        }
        if (!pick) break;            // no hard native letters left to demote
        pick.kind = 'translit';
        context++;
      }
    }

    const tokens = [];
    let run = null;
    for (const c of classed) {
      if (c.kind === 'translit') {
        run = null;
        tokens.push({ type: 'translit', ch: c.ch, info: c.info });
      } else {
        if (!run) { run = { type: 'native', text: '', letters: [] }; tokens.push(run); }
        run.text += c.ch;
        if (c.info) run.letters.push({ ch: c.ch, info: c.info });
      }
    }
    return tokens;
  }

  return { LETTER_INFO, segment, pNative, renderWord };
}

// Export the pure core for Node tests; harmless in the browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { makeCore };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM layer (browser only) — everything below is skipped under Node.
// ─────────────────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && typeof kurdishAlphabet !== 'undefined') {
  (function () {
    if (window.__klrReadingMode) return;         // guard against double injection
    window.__klrReadingMode = true;

    const core = makeCore(kurdishAlphabet);
    const HAS_ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
    const STORE_KEY = 'klrState';
    const DEFAULTS = { enabled: false, fade: 25, autoFade: true, mastery: {} };
    let state = { ...DEFAULTS };
    let applied = { enabled: false, fade: 25 };   // what's currently on the page
    let observer = null;
    let rescanTimer = null;

    // ── Storage ────────────────────────────────────────────────────────────
    function loadState() {
      return new Promise(resolve => {
        chrome.storage.local.get(STORE_KEY, res => {
          state = { ...DEFAULTS, ...(res[STORE_KEY] || {}) };
          state.mastery = state.mastery || {};
          resolve();
        });
      });
    }
    function saveState() {
      selfWrite = true;                            // suppress our own onChanged echo
      chrome.storage.local.set({ [STORE_KEY]: state });
    }
    let selfWrite = false;

    // ── Styles (injected into the page, namespaced) ──────────────────────────
    function injectStyle() {
      if (document.getElementById('klr-style')) return;
      const style = document.createElement('style');
      style.id = 'klr-style';
      style.textContent = `
        /* Transliterated and native letters both inherit the page's own font,
           size and colour so the text reads as one flowing line. The Latin vs
           Perso-Arabic script is itself the only cue you need for which is which;
           interactivity is revealed on hover instead of with a persistent box. */
        .klr-word { unicode-bidi: isolate; }
        .klr-native, .klr-pill {
          font: inherit;
          color: inherit;
          cursor: pointer;
          border-radius: 3px;
          transition: background .12s;
        }
        .klr-pill { direction: ltr; unicode-bidi: isolate; }
        .klr-native:hover, .klr-pill:hover { background: rgba(74,124,255,.16); }
        .klr-pulse { animation: klrPulse .55s ease; }
        @keyframes klrPulse { 0%{background:rgba(74,124,255,.35);} 100%{background:transparent;} }
      `;
      (document.head || document.documentElement).appendChild(style);
    }

    // ── Popover (its own shadow root, like content.js) ───────────────────────
    let popHost = null, popEl = null;
    function buildPopover() {
      const host = document.createElement('div');
      host.id = 'klr-pop-host';
      host.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;';
      const shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        .pop {
          position:absolute; pointer-events:auto;
          background:#12141f; color:#e0e0e0;
          border:1px solid #2e3266; border-radius:10px;
          padding:10px 12px; min-width:180px; max-width:280px;
          box-shadow:0 6px 24px rgba(0,0,0,.55);
          font-family:'Segoe UI',Arial,sans-serif;
        }
        .pop .translit { text-align:center; font-size:18px; font-weight:700;
          color:#a8b8ff; letter-spacing:1px; padding-bottom:8px; margin-bottom:8px;
          border-bottom:1px solid #2a2d4a; }
        .pop .row { display:flex; align-items:center; gap:10px; }
        .pop .row + .row { margin-top:6px; }
        .pop .g { font-size:26px; color:#a8b8ff; min-width:30px; text-align:center; }
        .pop .s { font-size:13px; font-weight:700; color:#fff; }
        .pop .p { font-size:11px; color:#9a9a9a; line-height:1.35; }
        .pop .btns { display:flex; gap:8px; margin-top:10px; }
        .pop button { flex:1; padding:7px 4px; border-radius:8px; font-size:12px;
          cursor:pointer; border:1px solid; background:transparent; }
        .pop .knew { color:#7aff7a; border-color:#1f4a1f; }
        .pop .knew:hover { background:#142814; }
        .pop .peek { color:#ff7a7a; border-color:#4a1f1f; }
        .pop .peek:hover { background:#2a1414; }
      `;
      shadow.appendChild(style);
      const div = document.createElement('div');
      div.className = 'pop';
      div.style.display = 'none';
      shadow.appendChild(div);
      document.body.appendChild(host);
      popHost = host; popEl = div;
    }

    function openPopover(run, x, y) {
      if (!popEl) buildPopover();
      const combined = run.letters.map(l => l.info.sound).join('');
      let html = `<div class="translit">${escapeHtml(combined)}</div>`;
      html += run.letters.map(l => `
        <div class="row">
          <div class="g">${escapeHtml(l.ch)}</div>
          <div>
            <div class="s">${escapeHtml(l.info.sound)} &nbsp;<span style="color:#5a8aff">/${escapeHtml(l.info.ipa)}/</span></div>
            <div class="p">${escapeHtml(l.info.pronunciation)}</div>
          </div>
        </div>`).join('');
      html += `<div class="btns">
          <button class="peek">✗ Peeked</button>
          <button class="knew">✓ Knew it</button>
        </div>`;
      popEl.innerHTML = html;
      popEl.querySelector('.knew').addEventListener('click', () => { gradeRun(run, +1); closePopover(); });
      popEl.querySelector('.peek').addEventListener('click', () => { gradeRun(run, -1); closePopover(); });

      popEl.style.display = 'block';
      popEl.style.left = '-9999px'; popEl.style.top = '-9999px';
      requestAnimationFrame(() => {
        const w = popEl.offsetWidth, h = popEl.offsetHeight;
        let left = x + 12, top = y - h - 12;
        if (left + w > window.innerWidth - 8) left = x - w - 12;
        if (left < 8) left = 8;
        if (top < 8) top = y + 20;
        if (top + h > window.innerHeight - 8) top = window.innerHeight - h - 8;
        popEl.style.left = left + 'px';
        popEl.style.top = top + 'px';
      });
    }
    function closePopover() { if (popEl) popEl.style.display = 'none'; }

    // ── Mastery grading ──────────────────────────────────────────────────────
    function gradeRun(run, delta) {
      for (const l of run.letters) {
        const cur = state.mastery[l.ch] || 0;
        state.mastery[l.ch] = Math.max(0, Math.min(5, cur + delta));
      }
      // Auto-fade: reward correct recall by nudging the whole page a touch more
      // native over time; a peek nudges it slightly back toward the scaffold.
      if (state.autoFade) {
        state.fade = Math.max(0, Math.min(100, state.fade + (delta > 0 ? 1 : -1)));
        applied.fade = state.fade;                 // keep in sync; no full re-render
      }
      saveState();
    }

    // ── Transform / revert ───────────────────────────────────────────────────
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT',
      'SELECT', 'OPTION', 'CODE', 'PRE', 'KBD']);

    function shouldSkip(node) {
      let el = node.parentElement;
      while (el) {
        if (SKIP_TAGS.has(el.tagName)) return true;
        if (el.isContentEditable) return true;
        if (el.classList && el.classList.contains('klr-word')) return true;
        if (el.id === 'klr-pop-host' || el.id === 'kurdish-ext-host') return true;
        el = el.parentElement;
      }
      return false;
    }

    function makeWordEl(word) {
      const span = document.createElement('span');
      span.className = 'klr-word';
      span.setAttribute('dir', 'rtl');
      const tokens = core.renderWord(word, state.mastery, state.fade, Math.random);
      for (const tk of tokens) {
        if (tk.type === 'native') {
          const s = document.createElement('span');
          s.className = 'klr-native';
          s.textContent = tk.text;
          s._klrRun = tk;                          // stash for click handling
          span.appendChild(s);
        } else {
          const p = document.createElement('span');
          p.className = 'klr-pill';
          p.textContent = tk.info.sound;
          p.dataset.klrNative = tk.ch;
          p.dataset.klrSound = tk.info.sound;
          span.appendChild(p);
        }
      }
      return span;
    }

    function transformTextNode(node) {
      const text = node.nodeValue;
      const parts = core.segment(text);
      if (!parts.some(p => p.type === 'word')) return;  // no Kurdish here
      const wrap = document.createElement('span');
      wrap.className = 'klr-wrap';
      wrap.dataset.klrOrig = text;
      for (const part of parts) {
        if (part.type === 'word') wrap.appendChild(makeWordEl(part.text));
        else wrap.appendChild(document.createTextNode(part.text));
      }
      node.parentNode.replaceChild(wrap, node);
    }

    function walk(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue || !HAS_ARABIC.test(n.nodeValue))
            return NodeFilter.FILTER_REJECT;
          if (shouldSkip(n)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const targets = [];
      let n;
      while ((n = walker.nextNode())) targets.push(n);
      targets.forEach(transformTextNode);
    }

    function revert() {
      document.querySelectorAll('.klr-wrap').forEach(wrap => {
        const orig = wrap.dataset.klrOrig || wrap.textContent;
        wrap.parentNode.replaceChild(document.createTextNode(orig), wrap);
      });
      closePopover();
    }

    function enable() {
      injectStyle();
      walk(document.body);
      if (!observer) {
        observer = new MutationObserver(muts => {
          for (const mu of muts) {
            for (const added of mu.addedNodes) {
              if (added.nodeType === 3 || added.nodeType === 1) { scheduleRescan(); return; }
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
      applied = { enabled: true, fade: state.fade };
    }

    function scheduleRescan() {
      clearTimeout(rescanTimer);
      rescanTimer = setTimeout(() => { if (applied.enabled) walk(document.body); }, 400);
    }

    function disable() {
      if (observer) { observer.disconnect(); observer = null; }
      revert();
      applied = { enabled: false, fade: state.fade };
    }

    function reRender() { revert(); walk(document.body); applied.fade = state.fade; }

    // ── Interaction (delegated) ──────────────────────────────────────────────
    document.addEventListener('click', e => {
      const pill = e.target.closest && e.target.closest('.klr-pill');
      if (pill) {
        e.preventDefault(); e.stopPropagation();
        const revealed = pill.classList.toggle('klr-revealed');
        pill.textContent = revealed ? pill.dataset.klrNative : pill.dataset.klrSound;
        pill.classList.remove('klr-pulse'); void pill.offsetWidth; pill.classList.add('klr-pulse');
        return;
      }
      const nat = e.target.closest && e.target.closest('.klr-native');
      if (nat && nat._klrRun && nat._klrRun.letters.length) {
        e.preventDefault(); e.stopPropagation();
        openPopover(nat._klrRun, e.clientX, e.clientY);
        return;
      }
      if (popEl && popHost && !popHost.contains(e.target)) closePopover();
    }, true);

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover(); });

    // ── React to settings changes from the popup ─────────────────────────────
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[STORE_KEY]) return;
      if (selfWrite) { selfWrite = false; return; }   // ignore our own mastery writes
      const prevFade = state.fade;
      state = { ...DEFAULTS, ...(changes[STORE_KEY].newValue || {}) };
      state.mastery = state.mastery || {};
      if (state.enabled && !applied.enabled) enable();
      else if (!state.enabled && applied.enabled) disable();
      else if (state.enabled && state.fade !== prevFade) reRender();
    });

    // ── Boot ─────────────────────────────────────────────────────────────────
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    loadState().then(() => { if (state.enabled) enable(); });
  })();
}
