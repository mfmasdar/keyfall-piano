# Keyfall · Piano learning MVP

**Every note, a little easier.**

A deployable, dependency-free website for learning beginner piano pieces with falling notes. A new note only moves forward after the learner plays the highlighted piano key(s). No scoring, timers, lives, subscriptions, accounts, analytics, or server are involved.

## Features

- **Choose music:** Three included public-domain / traditional beginner melodies; upload a `.musicxml` / `.xml` score; upload `.mid` / `.midi`; or paste a direct MusicXML/MIDI URL.
- **Read along:** A simplified staff-based preview shows current and upcoming notes; the falling note lanes are aligned to a real piano layout with black keys and labeled C keys.
- **Wait mode:** Nothing advances because of elapsed time. Wrong keys do not advance. The animation proceeds to the next note only after all required pitch(es) have been heard or tapped.
- **Input:** Microphone detection for acoustic/digital piano, Web MIDI for supported browsers, and tap/click support on the on-screen keys. An optional QWERTY test mapping is available (`a w s e d f t g y h u j k` from C4 to C5).
- **Chords:** Multiple target keys are highlighted. They can be completed in any order within the same step. Microphone detection is monophonic and should be played one note at a time for chord steps.
- **Safe default:** Audio is analyzed entirely within the browser. It is not sent to a remote server. Imported scores are processed locally. Using the URL importer fetches the chosen file from the URL as expected.

## Quick start

Open [DEPLOYMENT.md](DEPLOYMENT.md) for detailed **Netlify Drop**, **GitHub Pages** and **local server** steps.

```bash
cd keyfall-mvp
python3 -m http.server 8000
```

Visit `http://localhost:8000`. For a public deployment, upload the entire folder to Netlify Drop or GitHub Pages; no build step is required.

## Suggested online score sources

| Source | What it provides | How to use it with Keyfall |
|---|---|---|
| [OpenScore Lieder](https://musescore.com/openscore-lieder-corpus) | Classical / historic vocal scores, many offered as MusicXML from linked MuseScore pages | Download MusicXML if offered and upload |
| [Mutopia Project](https://www.mutopiaproject.org/) | Public-domain / permissively licensed scores, often with MIDI downloads | Download `.mid` and upload (MIDI lacks original printed notation) |
| [IMSLP](https://imslp.org/) | Extensive historic sheet-music PDF library | Convert an eligible PDF with an OMR app, then upload MusicXML |
| [PlayScore 2](https://www.playscore.co/) | Scans PDF and photographed sheet music and exports MusicXML | Convert the score and upload the resulting MusicXML |

A direct URL can work only when it points to a downloadable `.musicxml`, `.xml`, `.mid`, or `.midi` file and its host permits browser cross-origin requests (CORS). Linking to a score *web page* is not the same as linking to its actual file. No scraping or paid content bypass is included.

## Architecture

```text
keyfall-mvp/
├── index.html             Interface
├── styles.css             Responsive appearance
├── js/
│   ├── app.js             Learner interaction / animation / inputs
│   ├── music.js           MusicXML and SMF MIDI parsing; staff preview
│   └── pitch.js           Microphone analysis / monophonic pitch detection
├── samples/               Three built-in MusicXML scores
├── tests/                 A short chord score and a tiny MIDI example
├── assets/favicon.svg
├── DEPLOYMENT.md
└── README.md
```

Built with HTML, CSS, JavaScript, Web Audio and browser APIs. No `npm install`, bundling, external CDN, account, backend, or API key needed.

## MVP scope and limitations

- Uncompressed MusicXML (`.musicxml` / `.xml`) and standard beat-based MIDI (`.mid` / `.midi`) are supported. **Not supported yet:** PDF/JPG/PNG scans, compressed `.mxl`, MusicXML timewise, and MIDI with SMPTE timing.
- The staff strip is a **simplified pitch preview**, not a faithful rendering of uploaded score pages. Rests, expression markings, full notation, clef changes, tempo changes, repeats, and some advanced notation are not engraved or played back as printed. Timing is deliberately learner-driven rather than time-driven.
- A piano part is chosen when present; otherwise the first MusicXML part / a suitable MIDI track is used. The training mode groups pitches with matching onsets into a chord.
- Microphone detection is **single pitch at a time**, approximate, and best for clear beginner melodies. Chords are collected sequentially; use Web MIDI for best note accuracy on supported desktops.
- On repeated same-pitch notes, the learner must release and replay the note; this prevents a held key from automatically advancing through duplicate notes.
- The on-screen keyboard is for testing as well as for learners who do not yet have an instrument. It does not synthesize audio.
- Imported content stays in memory for the session; reloading resets the score selection to the first built-in song.

## License

The bundled beginner melody examples are provided for demo use and are based on public-domain / traditional melodies. The original Keyfall code in this folder may be modified and deployed by its recipient.
