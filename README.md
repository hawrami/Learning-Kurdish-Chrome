# Kurdish Sorani Learning — Chrome Extension

A Chrome extension for learning the Kurdish Sorani alphabet. Highlight letters on any webpage to see how they sound, and use the built-in flashcard mode to memorise all 33 letters.

---

## Features

### Highlight Tooltip
Select any Kurdish Sorani text on a webpage and a tooltip appears showing:
- **Single letter** — the sound it makes, pronunciation description, and IPA symbol
- **Multiple letters / word** — a rough transliteration at the top (sounds combined in order), followed by a breakdown of each unique letter

### Reading Mode — faded transliteration
Turn on Reading Mode from the popup and Kurdish text on any webpage is rendered
as a **mix of native letters and their Latin transliteration, switched letter by
letter**. When you hit a native letter you can't read yet, sound out the
transliterated letters around it to figure out what it must be — then confirm.

- **Training-wheels slider** — from *all transliterated* (max scaffold) to *all
  native*. Start high on training wheels; lower it as you improve.
- **Auto-fade** — the page eases off the transliteration automatically as you
  correctly recall letters, and eases back when you peek.
- **On the page** — tap a **Latin pill** to peek the native letter; tap a
  **native letter** to check yourself and mark it *Knew it* or *Peeked*. Each
  answer updates that letter's mastery, so letters you know show up in native
  script more and more often.
- **Mastery** is tracked per letter and drives which letters switch to native —
  support stays strongest on the letters you're weakest at.

This is scaffolded retrieval practice with mastery-driven fading, grounded in
language-learning research. Two safeguards worth noting: consecutive native
letters are kept contiguous so Sorani's **cursive joining renders correctly**,
and every word keeps at least one readable anchor so it never becomes
unguessable.

### Flashcard Mode
A full flashcard deck covering all 33 letters of the Sorani alphabet:
- Tap a card to flip and reveal the sound, pronunciation, and IPA
- Navigate with previous / next arrows
- **Got it** moves forward; **Again** re-queues the card at the end so it comes back around
- **Shuffle** randomises the deck order

### Browse All Letters
A grid view of all 33 letters — tap any cell to expand its pronunciation detail.

---

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select this folder
5. Add icon images (`icon16.png`, `icon48.png`, `icon128.png`) to the `icons/` folder to clear icon warnings

---

## Project Structure

```
├── manifest.json          # Chrome Extension Manifest V3
├── data/
│   └── alphabet.js        # All 33 Sorani letters with sounds, pronunciation & IPA
├── content/
│   ├── content.js         # Highlight tooltip (runs on every webpage)
│   └── reading-mode.js    # Reading Mode — faded transliteration overlay
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Flashcard, reading-mode settings & browse logic
├── background/
│   └── background.js      # Service worker
├── test/
│   ├── reading-mode.test.js  # Node unit tests for the reading-mode core
│   └── demo.html             # Standalone Reading Mode demo (open in a browser)
└── icons/                 # Extension icons (add your own PNGs)
```

Run the tests with `node test/reading-mode.test.js`. Try Reading Mode without
installing the extension by opening `test/demo.html` in a browser.

---

## The Sorani Alphabet

Kurdish Sorani uses a modified Perso-Arabic script and is written right to left. The alphabet has 33 letters. This extension covers all of them, including sounds unique to Kurdish such as:

| Letter | Sound | Example approximation |
|--------|-------|-----------------------|
| ڕ | rr | Trilled r, like Spanish *perro* |
| ڵ | ll | Thick l, like the l in *ball* |
| خ | kh | Like ch in Scottish *loch* |
| ژ | zh | Like s in *measure* |
| غ | gh | Gargled r, like French r |
| ق | q | Deep k from the back of the throat |
