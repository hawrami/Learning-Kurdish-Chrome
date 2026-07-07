// Kurdish Learning Extension — Popup

let deck = [];
let currentIndex = 0;
let isFlipped = false;
let isShuffled = false;

// ── Helpers ──────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Flashcard Logic ──────────────────────────────────

function loadCard(index) {
  const letter = deck[index];
  isFlipped = false;
  document.getElementById('card-inner').classList.remove('flipped');

  document.getElementById('fc-letter').textContent      = letter.letter;
  document.getElementById('fc-letter-back').textContent = letter.letter;
  document.getElementById('fc-name').textContent        = letter.sound;
  document.getElementById('fc-pron').textContent        = letter.pronunciation;
  document.getElementById('fc-ipa').textContent         = `/${letter.ipa}/`;

  const total = deck.length;
  document.getElementById('fc-progress').textContent    = `${index + 1} / ${total}`;
  document.getElementById('progress-fill').style.width  = `${((index + 1) / total) * 100}%`;

  document.getElementById('btn-prev').disabled = index === 0;
  document.getElementById('btn-next').disabled = index === total - 1;
}

function flipCard() {
  isFlipped = !isFlipped;
  document.getElementById('card-inner').classList.toggle('flipped', isFlipped);
}

function advance() {
  if (currentIndex < deck.length - 1) loadCard(++currentIndex);
}

// ── Browse Grid ──────────────────────────────────────

function buildGrid() {
  const grid = document.getElementById('alphabet-grid');
  grid.innerHTML = '';

  kurdishAlphabet.forEach(info => {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';

    const glyph  = document.createElement('div');
    glyph.className = 'grid-letter';
    glyph.textContent = info.letter;

    const name = document.createElement('div');
    name.className = 'grid-name';
    name.textContent = info.sound;

    cell.appendChild(glyph);
    cell.appendChild(name);

    cell.addEventListener('click', () => {
      const isOpen = cell.classList.toggle('open');
      // Remove any existing detail first
      const existing = cell.querySelector('.grid-detail');
      if (existing) { existing.remove(); }

      if (isOpen) {
        const detail = document.createElement('div');
        detail.className = 'grid-detail';
        detail.textContent = `${info.pronunciation}  /${info.ipa}/`;
        cell.appendChild(detail);
      }
    });

    grid.appendChild(cell);
  });
}

// ── Reading Mode Settings ────────────────────────────

const RM_KEY = 'klrState';
const RM_DEFAULTS = { enabled: false, fade: 25, autoFade: true, mastery: {} };
const MASTERED_AT = 4;                     // mastery (0..5) that counts as "graduated"
let rmState = { ...RM_DEFAULTS };

function rmLoad() {
  return new Promise(resolve => {
    chrome.storage.local.get(RM_KEY, res => {
      rmState = { ...RM_DEFAULTS, ...(res[RM_KEY] || {}) };
      rmState.mastery = rmState.mastery || {};
      resolve();
    });
  });
}

function rmSave() { chrome.storage.local.set({ [RM_KEY]: rmState }); }

function rmRender() {
  document.getElementById('rm-enabled').checked  = rmState.enabled;
  document.getElementById('rm-autofade').checked = rmState.autoFade;
  document.getElementById('rm-fade').value       = rmState.fade;
  document.getElementById('rm-fade-val').textContent = `${rmState.fade}% native`;

  const total = kurdishAlphabet.length;
  const mastered = kurdishAlphabet.filter(l => (rmState.mastery[l.letter] || 0) >= MASTERED_AT).length;
  document.getElementById('rm-mastered').textContent = `${mastered} / ${total}`;
  document.getElementById('rm-mastered-fill').style.width = `${(mastered / total) * 100}%`;
}

function initReadingMode() {
  document.getElementById('rm-enabled').addEventListener('change', e => {
    rmState.enabled = e.target.checked; rmSave();
  });

  const fade = document.getElementById('rm-fade');
  fade.addEventListener('input', e => {
    rmState.fade = parseInt(e.target.value, 10);
    document.getElementById('rm-fade-val').textContent = `${rmState.fade}% native`;
  });
  fade.addEventListener('change', () => rmSave());   // persist (and re-render page) on release

  document.getElementById('rm-autofade').addEventListener('change', e => {
    rmState.autoFade = e.target.checked; rmSave();
  });

  document.getElementById('rm-reset').addEventListener('click', () => {
    rmState.mastery = {}; rmSave(); rmRender();
  });

  // Reflect live mastery/fade changes coming from the content script.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[RM_KEY]) {
      rmState = { ...RM_DEFAULTS, ...(changes[RM_KEY].newValue || {}) };
      rmState.mastery = rmState.mastery || {};
      rmRender();
    }
  });
}

// ── Init ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  rmLoad().then(rmRender);
  initReadingMode();

  // Home buttons
  document.getElementById('btn-flashcards').addEventListener('click', () => {
    deck = [...kurdishAlphabet];
    isShuffled = false;
    document.getElementById('btn-shuffle').classList.remove('active');
    currentIndex = 0;
    loadCard(currentIndex);
    showScreen('flashcard-screen');
  });

  document.getElementById('btn-reading').addEventListener('click', () => {
    rmRender();
    showScreen('reading-screen');
  });

  document.getElementById('btn-browse').addEventListener('click', () => {
    buildGrid();
    showScreen('browse-screen');
  });

  // Back buttons (shared class)
  document.querySelectorAll('.js-back').forEach(btn => {
    btn.addEventListener('click', () => showScreen('home-screen'));
  });

  // Flashcard interactions
  document.getElementById('card').addEventListener('click', flipCard);

  document.getElementById('btn-prev').addEventListener('click', () => {
    if (currentIndex > 0) loadCard(--currentIndex);
  });

  document.getElementById('btn-next').addEventListener('click', advance);

  document.getElementById('btn-got').addEventListener('click', advance);

  document.getElementById('btn-again').addEventListener('click', () => {
    // Put current card at the end of the deck so it comes back around
    const missed = deck.splice(currentIndex, 1)[0];
    deck.push(missed);
    // Stay at same index (now points to next card), or wrap to last if at end
    if (currentIndex >= deck.length) currentIndex = deck.length - 1;
    loadCard(currentIndex);
  });

  document.getElementById('btn-shuffle').addEventListener('click', () => {
    isShuffled = !isShuffled;
    document.getElementById('btn-shuffle').classList.toggle('active', isShuffled);
    deck = isShuffled ? shuffle(kurdishAlphabet) : [...kurdishAlphabet];
    currentIndex = 0;
    loadCard(currentIndex);
  });
});
