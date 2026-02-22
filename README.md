# Kurdish Sorani Learning — Chrome Extension

A Chrome extension for learning the Kurdish Sorani alphabet. Highlight letters on any webpage to see how they sound, and use the built-in flashcard mode to memorise all 33 letters.

---

## Features

### Highlight Tooltip
Select any Kurdish Sorani text on a webpage and a tooltip appears showing:
- **Single letter** — the sound it makes, pronunciation description, and IPA symbol
- **Multiple letters / word** — a rough transliteration at the top (sounds combined in order), followed by a breakdown of each unique letter

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
│   └── content.js         # Highlight tooltip (runs on every webpage)
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Flashcard & browse logic
├── background/
│   └── background.js      # Service worker
└── icons/                 # Extension icons (add your own PNGs)
```

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
