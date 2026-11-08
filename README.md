# Keyfall V1.2 — Piano learning studio

**Keyfall** is a static web app for learning piano with falling notes, a highlighted piano keyboard and feedback on correct keys. It has **two separate screens**:

1. **Setup:** choose a song, upload MusicXML/MIDI, search the starter library, select a MIDI track or MusicXML hand, choose *Wait for Correct Note* or *Continuous Play*, set tempo and keyboard sound, and connect microphone or MIDI keyboard.
2. **Studio:** distraction-free falling notes, optional simplified staff display, playable on-screen piano, correct-key lighting, restart, full-screen on supporting browsers, and a button to return to Setup.

## What changed in V1.2

- Clicking or touching the on-screen keys **plays an audible piano tone**, including wrong notes. Keys also light up when played correctly.
- The computer keyboard (A W S E D F T G Y H U J K) can play notes and produce sound.
- The sound is now produced by **21 locally stored, original electric-piano-style audio samples** instead of the previous basic triangle oscillator. A physical-model fallback is available while the audio files load. This is **an electronic piano simulation**, not recordings of a commercial Rhodes or Wurlitzer.
- Choose **Bright tine** or **Warm & mellow**, adjust volume, toggle sound for on-screen/computer keys, and play a C-major tone preview.
- Continuous mode has an optional guide melody in the same electric piano sound. Wait mode moves only when correct notes are played.
- Assets are separate, for easy upload from a desktop to GitHub.

## Supported input

- On-screen piano: desktop mouse, touch and multitouch; always available.
- Computer keyboard: A W S E D F T G Y H U J K, mapped chromatically from C4 through C5.
- USB MIDI input: browsers exposing the Web MIDI API, typically Chrome / Edge desktop. Input is checked but not automatically sent to the app's sound synthesizer, because the connected piano normally generates its own sound.
- Microphone: acoustic and digital pianos. Requires HTTPS or localhost. One-note pitch detection is best in quiet environments; simultaneous chord detection via microphone is not supported.

## File formats

- `.musicxml`, `.xml` — recommended for actual notation and staff selection
- `.mid`, `.midi` — piano roll and selectable tracks (MIDI does not preserve printed notation)
- Remote direct URL — when a host allows cross-origin browser requests (CORS)
- Not supported directly: `.pdf`, photographed scores, `.mxl`; convert to MusicXML first.

## Starter songs

Eleven included pieces/exercises are stored as real MusicXML files in `samples/` and playable without an external API. The app also links to Mutopia, OpenScore, and BitMidi for further imports. Ensure proper rights before redistributing copyrighted songs with a publicly hosted app.

## Run locally

Because browsers restrict JavaScript modules and file requests from `file://` pages, **serve the folder**, rather than double-clicking `index.html`:

```bash
cd keyfall-v1.2
python -m http.server 8000
```

Open `http://localhost:8000` in your browser. No `npm`, Node, build process or database needed.

## Folder structure

```text
keyfall-v1.2/
  index.html
  styles.css
  styles-v12.css
  js/
    app.js       # app UI, sheet loading, gameplay and inputs
    music.js     # MusicXML and MIDI parsing
    pitch.js     # microphone pitch detection
    sound.js     # electric-piano sampler and first-note fallback
  samples/       # 11 bundled MusicXML starter pieces
  assets/
    favicon.svg
    electric-piano/  # 21 local MP3 samples
  tools/
    generate_soundbank.py  # optional reproducible audio generation
  tests/         # MusicXML and MIDI import fixtures
  .nojekyll
  DEPLOYMENT.md
  TEST_REPORT.md
```

## Audio provenance

The 21 samples were created from scratch by the included `tools/generate_soundbank.py`. They use damped harmonic partials, time-varying tine harmonics, a short key-click transient, tremolo and amplitude envelopes; **no third-party sound recordings or sample banks are embedded**. You may modify or re-render these original generated assets. Sound preview plays a short arpeggio; the main gameplay offers optional guide audio only in Continuous mode.

For realistic commercial quality in a subsequent release, substitute a licensed, multi-velocity, recorded keyboard sample library in `assets/electric-piano/` and adapt `js/sound.js` sample mapping.

## Known limitations

- Simplified staff preview, not professional sheet engraving.
- Continuous mode uses a simple time-based transport and approximate timing window.
- Microphone listens for monophonic pitch; acoustic chords and noisy rooms need an improved detection pipeline.
- Web MIDI support varies by browser; iPad Safari can use microphone or touch.
- Browser audio requires an initial tap/click to unlock the AudioContext.
- Full-screen depends on device/browser support; it is hidden when unsupported.

See `DEPLOYMENT.md` for GitHub Desktop, GitHub Pages and Netlify setup.
