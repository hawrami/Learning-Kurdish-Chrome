# Research: Mixed-Script Transliteration Scaffolding for Learning to Read Sorani Kurdish

This document records the pedagogical research behind **Reading Mode** (faded
transliteration). It answers: *is intermittently switching individual letters
between native script and transliteration a real, studied learning method?* —
and translates the findings into the feature's design.

## Executive summary

The feature idea — randomly swapping individual letters in a word between the
native Perso-Arabic script and its Latin transliteration, so a reader who stalls
on an unknown native letter can reconstruct it from the surrounding
transliterated context — is **not a named, directly-studied method**, but it
sits at the intersection of several well-evidenced learning phenomena. The
mechanism is essentially **grapheme-level cloze retrieval practice fused with
fading scaffolding**. The cognitive-science support for both is strong. The
biggest risk to manage is the **crutch / dependency effect** documented across
furigana, pinyin, and Hebrew niqqud research: transliteration reliably helps
beginners but, if it persists, becomes a shortcut that lets learners *avoid*
processing the native script.

## 1. Is this a studied method?

**The exact idea is novel, but every component maps onto an established construct:**

- **Fading / scaffolding / gradual release** — the direct pedagogical parent.
  Support is given early and systematically thinned as competence grows
  (Vygotsky's ZPD; "most-to-least prompting" / errorless learning in
  skill-acquisition practice). "Start mostly transliterated, thin the Latin
  letters over time" is textbook prompt-fading.
- **"Faded transliteration" as a cognitive scaffold** is explicitly named in a
  recent Arabic-numeracy framework (ARQAMified, IJRISS 2025) that "employs
  transliteration as a primary cognitive scaffold, with the prominence fading as
  the learner demonstrates mastery" — the closest published articulation of this
  thesis.
- **Cloze / partial-cue reading** — our mechanism is a cloze deletion at the
  grapheme level, where the "blank" is filled by a phonetic hint (the Latin
  letter) rather than nothing.
- **Code-mixing for L2 reading** — interleaving two codes in one text is studied;
  learners "infer conceptual meanings through context," supporting the central
  bet that known surroundings constrain the unknown element.
- **Desirable difficulties (Bjork & Bjork, 2011)** — spacing, interleaving,
  **retrieval practice**, the **generation effect**, and varied practice all
  improve long-term retention even though they slow initial acquisition.
  Reconstructing a native letter from context *before* confirming is a
  generation + retrieval event — "even a failed attempt strengthens retrieval
  pathways."

**Direct analogues (the "training wheels" problem):**

- **Japanese furigana** — "training wheels, not a permanent crutch." Great for
  early reading speed, but persistent furigana means readers "never have to learn
  to recognise the kanji." Structured programs deliberately remove it after a
  base is built.
- **Chinese pinyin** — beginners comprehended **5.8/30 words without pinyin vs.
  25.5/30 with** it (huge dependency signal). Yet pinyin only activates character
  orthography in *advanced* learners — its payoff comes only after real
  native-script exposure is banked.
- **Hebrew niqqud** — the clearest crutch-then-shed pattern: 2nd-graders rely on
  vowel diacritics; by 4th grade they no longer help and can *slow* fluent
  readers. Adult Hebrew is largely unpointed.
- **Arabic harakat** — same shape: essential for beginners, omitted by native
  readers who infer vowels from morphology and context.

**Spaced repetition & interleaving for graphemes** — distributed practice on
alphabet knowledge "significantly reduced the number of students at risk for
reading failure" vs. one-letter-per-week teaching; interleaving confusable
grapheme–phoneme correspondences "augments learning and retention." Supports
tracking mastery *per grapheme*.

## 2. What does the evidence say about efficacy?

1. **The scaffold reliably helps beginners** (the pinyin 5.8 → 25.5 jump).
2. **Persistent annotation becomes a crutch** that suppresses native-script
   acquisition — the strongest cautionary finding. The native script is only
   learned to the extent the learner is *forced* to process it.
3. **The benefit is proficiency-dependent and transfer is not automatic** — it
   must be engineered; learners who coast on Latin may never cross into
   automatic native reading.
4. **Forcing reconstruction beats reading a gloss.** Furigana/pinyin place the
   answer there to be read passively; *withholding* the native letter and making
   the reader generate it converts a passive aid into an active
   retrieval/generation event — the single strongest theoretical reason this
   feature could outperform conventional overlays, **if** it forces effortful
   generation and isn't just skimmed.
5. **Keep it comprehensible** (Krashen i+1): if too many letters in a word are
   simultaneously unknown-native, the word becomes noise and no inference is
   possible.

**Net verdict:** sound *if and only if* it (a) forces active reconstruction,
(b) fades based on mastery, and (c) drives toward full native script.

## 3. How the research shaped this feature

| Research finding | What Reading Mode does |
|---|---|
| Fade by **mastery**, not pure chance | `P(native)` rises with each letter's mastery score; a controlled random component on top keeps rendering varied (varied-practice desirable difficulty) and stops learners memorizing page layout instead of letters. |
| Make it **retrieval, not reading** | Tap a native letter → self-graded reveal popover ("Knew it" / "Peeked") feeds that grapheme's mastery. Tap a Latin pill → peek the native glyph. Every native letter is a low-stakes retrieval trial. |
| **Crutch effect** is the top risk | Default starts heavily transliterated and **auto-fade** eases the whole page toward native as you succeed; peeks nudge it back. Mastered letters render native almost always (support strongest where you're weakest). |
| **Cursive joining** must not break | Sorani is cursive Perso-Arabic with up to four positional letter forms. Consecutive native letters are **coalesced into one run** so the browser shapes them with correct joins; only a transliterated letter breaks a run. Words render in `dir="rtl"` isolated boxes. (This is option 1 — "keep native runs contiguous" — from the join-handling recommendations.) |
| **i+1 comprehensibility** | A guard keeps ≥40% of each word readable (transliterated or already-known), demoting the hardest native letters back to Latin so an anchor always remains. All-native words made of *known* letters are left alone — the desirable full-native test exposures. |
| **Per-grapheme mastery** | Mastery stored per letter (0–5) in `chrome.storage.local`; a simple counter now, upgradeable to SM-2/FSRS spaced repetition later. |

**Known simplifications / future work** (from the research, not yet built):
full SM-2/FSRS spaced-repetition scheduling per grapheme and per positional
variant; deliberate interleaving of confusable letters; forced periodic
full-native "test" passages; treating the unwritten short *i* as an explicit
vowel-insertion skill.

## 4. Other high-value methods to add (ranked by evidence)

Ranking follows Dunlosky et al. (2013) and a 242-study meta-analysis
(top techniques: distributed practice and practice testing).

1. **Practice testing / active recall (HIGH)** — best-supported; the existing
   flashcard mode and Reading Mode's reveal mechanic are both this.
2. **Spaced / distributed practice (HIGH)** — schedule letters/words/sessions on
   expanding intervals (SM-2/FSRS). Proven to cut reading-failure risk.
3. **Interleaving (MODERATE–HIGH)** — mix confusable letters and native/translit.
4. **Generation + feedback (MODERATE–HIGH)** — produce before revealing; the
   feature's edge over furigana.
5. **Comprehensible input / graded reading (MODERATE)** — pair with an i+1
   graded-text library.
6. **Dual coding (MODERATE)** — pair words with *relevant* images for vocabulary
   (not for the letter drill).
7. **Explicit scaffolding + fade** — formalize with diagnosis-driven withdrawal.
8. **Avoid as primary strategies (LOW)** — highlighting and rereading.

## Sources

- ARQAMified: Learning Arabic Numbers (faded transliteration scaffold), IJRISS 2025 — https://rsisinternational.org/journals/ijriss/uploads/vol9-iss25-pg219-227-202511_pdf.pdf
- Bjork & Bjork, Creating Desirable Difficulties to Enhance Learning (2011) — https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf
- Bjork, Desirable Difficulties Perspective on Learning — https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/07/RBjork_inpress.pdf
- Structural Learning – Desirable Difficulties — https://www.structural-learning.com/post/desirable-difficulties
- UNH – Introducing Desirable Difficulties into Practice — https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-introducing-desirable-difficulties-into-practice-and-instruction-bjork-and-bjork.pdf
- Structural Learning – Scaffolding: A Teacher's Guide — https://www.structural-learning.com/post/scaffolding-in-education-a-teachers-guide
- Insendi – Modelling, Fading, and Scaffolding — https://insights.insendi.com/read/scaffolding-modelling-and-fading-in-learning-design
- Mastermind Behavior – Prompting and Fading in ABA — https://www.mastermindbehavior.com/post/how-to-effectively-use-prompting-and-fading-in-aba-therapy
- Lee & Macaro – Code-switched reading tasks, System — https://www.sciencedirect.com/science/article/abs/pii/S0346251X17309338
- StoryLearning – What Is Furigana — https://storylearning.com/learn/japanese/japanese-tips/what-is-furigana
- Japanese Complete – Research-Based Methods / JP1K — https://japanesecomplete.com/articles/?p=1282
- Kanji and non-homophonous furigana (ScienceDirect) — https://www.sciencedirect.com/science/article/abs/pii/S2211695818303751
- Investigating CFL Learners' Dependency on Pinyin, Pertanika JSSH 2020 — http://journals-jd.upm.edu.my/resources/files/Pertanika%20PAPERS/JSSH%20Vol.%2028%20(S2)%202020/13%20JSSH(S)-1262-2019.pdf
- Reading Pinyin Activates Character Orthography for Experienced Learners (Cambridge) — https://www.cambridge.org/core/journals/bilingualism-language-and-cognition/article/abs/reading-pinyin-activates-character-orthography-for-highly-experienced-learners-of-chinese/20B74CCBBBA28B3E1C5735833A3FD9E1
- The Importance of Vowel Diacritics for Reading in Hebrew, Reading & Writing (Springer) — https://link.springer.com/article/10.1023/b:read.0000044299.63726.10
- Talkpal – Reading Arabic Without Harakat — https://talkpal.ai/mastering-reading-arabic-without-harakat-a-simple-guide-for-beginners/
- Kalimah – Arabic Harakat, Tashkeel & Diacritics — https://kalimah-center.com/arabic-harakat-tashkeel-diacritics/
- Systematic Instruction in Phoneme–Grapheme Correspondence (ResearchGate) — https://www.researchgate.net/publication/311528386_Systematic_Instruction_in_Phoneme-Grapheme_Correspondence_for_Students_With_Reading_Disabilities
- Simultaneous Training on Overlapping GPCs Augments Learning (PMC) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7069098/
- Krashen, Principles and Practice in Second Language Acquisition (PDF) — https://sdkrashen.com/content/books/principles_and_practice.pdf
- Testing Krashen's Input Hypothesis with AI, Frontiers 2025 — https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1614680/full
- Dunlosky et al., Improving Students' Learning with Effective Learning Techniques (PubMed) — https://pubmed.ncbi.nlm.nih.gov/26173288/
- A Meta-Analysis of Ten Learning Techniques, Frontiers 2021 — https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2021.581216/full
- Dual-Coding Theory (Wikipedia) — https://en.wikipedia.org/wiki/Dual-coding_theory
- Structural Learning – Dual Coding — https://www.structural-learning.com/post/dual-coding-a-teachers-guide
- Kurdish Alphabets (Wikipedia) — https://en.wikipedia.org/wiki/Kurdish_alphabets
- Sorani Orthography Notes (r12a.github.io) — https://r12a.github.io/scripts/arab/ckb.html
- Omniglot – Kurdish Language and Alphabets — https://www.omniglot.com/writing/kurdish.htm
