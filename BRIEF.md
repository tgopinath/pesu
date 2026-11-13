# Pesu (பேசு, "speak") — brief

**Problem.** Phrasebooks and word-list apps teach vocabulary, not the sentences people need on day one of a trip, and they rarely make you say anything out loud or bring back what you forgot.

**User.** An adult preparing for travel or a first conversation in English, Spanish, French, German, Japanese, Hindi or Tamil, with ten minutes a day on a phone or laptop.

**Jobs to be done.**
- Hear and read the handful of phrases a real situation needs (ordering, directions, trouble).
- Say them out loud and get a sense of how close they were.
- Be tested in varied ways so the phrase is recognised, understood and produced.
- Have missed phrases come back at the right time without planning it.

**v1 screens.** Language picker; Home (scenes grid, daily goal ring, streak, Super Memory card); Learn (scene card, normal and slow audio, tap-a-word, Say it with match score); Practice (listen and pick the picture, pick the phrase, build from tiles, type what you hear, match pairs; misses re-queued until right); Done (score, XP, confetti).

**Content and tech.** 7 scenes × 8 phrases × 7 languages, written by hand, with romanisation for Japanese, Hindi and Tamil; English learners see Tamil meanings. Audio and speech recognition use the browser's Web Speech API (no server, no keys). Leitner spaced repetition (10 min, 1, 3, 7, 21 days) and progress stored per language in localStorage. One self-contained HTML file.

**Method credit.** Learn → test → Super Memory loop inspired by Loecsen's free phrase method.

**Success.** A first-time user finishes a scene (learn + test) in under five minutes, every exercise works by keyboard, and a phrase missed today returns in the next review.

**Out of scope.** Accounts and sync, recorded native-speaker audio, grammar lessons, more languages, Tamil interface.
