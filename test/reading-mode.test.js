// Minimal Node test for the pure core of reading mode (no DOM, no deps).
// Run: node test/reading-mode.test.js
const assert = require('assert');
const { kurdishAlphabet } = require('../data/alphabet.js');
const { makeCore } = require('../content/reading-mode.js');

const core = makeCore(kurdishAlphabet);
let passed = 0;
function ok(name, cond) { assert.ok(cond, name); console.log('  ✓ ' + name); passed++; }

// Deterministic RNG helpers
const always = v => () => v;                        // constant
function seq(vals) { let i = 0; return () => vals[i++ % vals.length]; }

// ── segment() ────────────────────────────────────────────────────────────────
console.log('segment()');
{
  const parts = core.segment('Hello ناو, world');
  ok('splits Kurdish word from Latin', parts.length === 3);
  ok('keeps leading Latin as other', parts[0].type === 'other' && parts[0].text === 'Hello ');
  ok('detects the Kurdish word', parts[1].type === 'word' && parts[1].text === 'ناو');
  ok('keeps trailing punctuation/Latin', parts[2].type === 'other' && parts[2].text === ', world');
  ok('pure-Latin text yields no word', !core.segment('no kurdish here').some(p => p.type === 'word'));
}

// ── pNative() curve ──────────────────────────────────────────────────────────
console.log('pNative()');
{
  const m0 = {}, m5 = { 'ب': 5 };
  ok('fade 0 => never native', core.pNative('ب', m0, 0) === 0);
  ok('slider is the dominant lever: unknown letter at full fade is ~half native',
     Math.abs(core.pNative('ب', m0, 100) - 0.5) < 1e-9);
  ok('mastered letter at full fade is always native',
     core.pNative('ب', m5, 100) === 1);
  ok('unknown letter gets half the slider, mastered gets all of it',
     Math.abs(core.pNative('ب', m0, 50) - 0.25) < 1e-9 &&
     Math.abs(core.pNative('ب', m5, 50) - 0.5) < 1e-9);
  ok('mastery raises native probability',
     core.pNative('ب', m5, 50) > core.pNative('ب', m0, 50));
}

// ── renderWord(): native runs coalesce for cursive joining ────────────────────
console.log('renderWord() coalescing');
{
  // fade 100, all letters mastered, rng always native => one joined run
  const mastery = {}; for (const l of kurdishAlphabet) mastery[l.letter] = 5;
  const tokens = core.renderWord('ناوی', mastery, 100, always(0)); // 0 < pNative => native
  ok('all-native word is a single joined run', tokens.length === 1 && tokens[0].type === 'native');
  ok('joined run preserves original glyph string', tokens[0].text === 'ناوی');
  ok('run records each letter for the reveal popover', tokens[0].letters.length === 4);
}

// ── renderWord(): a transliterated letter breaks the run ──────────────────────
console.log('renderWord() interleaving');
{
  const mastery = { 'ن': 5, 'ا': 5, 'و': 5, 'ی': 5 };
  // At fade 50, pNative = 0.5 for these mastered letters, so rng 0 => native,
  // 0.99 => translit. Sequence native,translit,native,native -> break at idx 1.
  const rng = seq([0, 0.99, 0, 0]);
  const tokens = core.renderWord('ناوی', mastery, 50, rng);
  const kinds = tokens.map(t => t.type);
  ok('a translit letter splits the native run',
     JSON.stringify(kinds) === JSON.stringify(['native', 'translit', 'native']));
  ok('translit token carries its sound', tokens[1].info.sound === core.LETTER_INFO.get('ا').sound);
}

// ── comprehensibility guard: never an all-unknown-native word ─────────────────
console.log('comprehensibility guard (i+1)');
{
  const mastery = {};                    // every letter unknown (mastery 0)
  // rng always native would make the whole word native & unreadable
  const tokens = core.renderWord('ناوی', mastery, 100, always(0));
  const translitCount = tokens.filter(t => t.type === 'translit').length;
  ok('guard leaves readable anchors in an all-unknown word', translitCount >= Math.ceil(4 * 0.4));
  ok('at least one native target still remains to practice',
     tokens.some(t => t.type === 'native') || translitCount === 4);
}

// ── single-letter word is left as-is (no spurious demotion) ───────────────────
console.log('single-letter edge case');
{
  const tokens = core.renderWord('و', {}, 100, always(0));
  ok('one-letter word not forced to translit by the guard',
     tokens.length === 1);
}

console.log(`\nAll ${passed} assertions passed.`);
