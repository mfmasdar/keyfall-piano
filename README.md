# Keyfall V1.1 — guided piano practice

**Every note, a little easier.** Static, responsive piano-learning website, with two practical learning modes. Open `DEPLOYMENT.md` for publishing instructions.

## What's new in V1.1

| Feature | How it works |
| --- | --- |
| **Wait for correct note** | Falling notes pause at the keyboard. Wrong notes do not move the piece; completing all notes in the target chord advances it. |
| **Continuous play** | Falling notes advance on their own according to the selected tempo, whether the learner hits a note or misses it. Play/Pause controls the moving timeline. |
| **Correct-note light** | The corresponding physical target key on screen flashes vivid green when a correctly timed note is detected in **either** mode. Other notes do not cause green feedback. |
| **Tempo controls** | Choose 50, 70, 90, 110, or 130 beats/minute in Continuous mode. |
| **Optional guide sound** | A quiet synthesised piano-like tone plays the chosen track in Continuous mode. Optional and OFF by default; automatically turned off when the microphone connects to avoid false microphone recognition. |
| **Searchable song library** | 11 bundled beginner pieces: familiar songs, classical melody, and original exercises. Filter and search; select a song or tap Listen for a short audio preview. |
| **Track and hand selection** | Select MIDI track / MusicXML part. In multi-staff MusicXML, select right (staff 1), left (staff 2), or both. Drums are ignored on MIDI import. |
| **Import** | Drag/drop or upload MusicXML (`.xml`, `.musicxml`), MIDI (`.mid`, `.midi`), or enter a direct file URL with working CORS. |
| **Keyboard input** | On-screen touch/mouse, microphone pitch detection for acoustic piano, Web MIDI on supported desktop browsers. A-W-S-E-D-F-T-G-Y-H-U-J-K also maps C4–C5 for testing. |

No scoring, login, database, API key, remote MIDI provider, dependencies, package manager, or build pipeline. Audio analysis is local to the learner's browser.

## Supported formats and repertoire

| Built-in piece | Type |
| --- | --- |
| Twinkle, Twinkle, Little Star | Traditional melody |
| Ode to Joy | Beethoven melody |
| Mary Had a Little Lamb | Traditional melody |
| Frère Jacques | Traditional melody |
| London Bridge | Traditional melody |
| Row, Row, Row Your Boat | Traditional melody |
| Jingle Bells (chorus) | Public-domain composition, simplified melody |
| When the Saints Go Marching In | Traditional melody |
| C Major Scale | Original learning exercise |
| C Major Arpeggio | Original learning exercise |
| First Piano Chords | Original learning exercise |

These are **self-contained demonstration arrangements**, with simple timing and melody; not reproductions of commercial score editions or licensed recordings.

The Library also provides outbound links to [Mutopia](https://www.mutopiaproject.org/), [OpenScore](https://openscore.cc/), and [BitMidi](https://bitmidi.com/). They are discovery links: users download eligible MIDI/MusicXML files themselves and import them, rather than being scraped by this app. MIDI files for modern songs are often multi-instrument; use **Instrument / MIDI track** after import. Check redistribution rights before bundling any third-party file into a public app.

## Two modes — precise behavior

### Mode A — Wait for correct note (initial/default)

1. Each next note or chord is shown on the staff and falling-note lane; the corresponding physical piano keys are highlighted pale mint.
2. On any correct target note, the corresponding key flashes **bright green**.
3. A chord requires all displayed notes, in any order. The phone/iPad microphone can recognise only one pitch at a time, so MIDI is best for simultaneous chords.
4. Upon completion, the notes animate to the next step. Wrong keys never cause the song to advance.

### Mode B — Continuous play

1. Choose Continuous Play, set a tempo and press **Play**.
2. The note highway moves autonomously. Every MusicXML/MIDI note onset is placed according to its relative beat-time; MIDI's original tempo-map is not reproduced.
3. Correct keypresses within **±0.5 seconds** of the expected onset flash vivid green, as do their falling-note bars. Each note onset is matched separately, including repeated pitches.
4. Missed notes are skipped without penalty or interruption. Press **Pause** to hold the position and **Play** to resume. Press **Restart** to return to the first note.
5. Optional guide piano sound plays a simple built-in waveform, not recorded backing music or the original commercial song.

**Switching between modes restarts the piece** to make the practice position predictable.

## Use on iPad

Deploy to HTTPS; iPad Safari can use **Use microphone**. Allow the microphone on request, then play single, distinct piano notes with a brief release between repeated notes. Acoustic note recognition is approximate; microphone performance depends on noise, room echo, and the instrument. For best polyphonic accuracy on a digital keyboard, use a compatible Web MIDI browser/device (e.g. desktop Chrome or Edge).

If you enable guide sound while using a microphone, it could detect the guide notes instead of your piano. Keyfall deliberately prevents this combination.

## Known V1.1 limitations

- PDF, JPG, scanned scores and compressed `.mxl` are **not imported**. Convert them to uncompressed MusicXML first with an OMR/conversion tool.
- The sheet preview shows pitches in a **simplified staff strip**, not faithful original score engraving, clefs, repeats, dynamics, pedal, tempo ramps or voice-specific notation.
- The metronomic Continuous mode uses the **selected tempo for all music**. It deliberately does not reproduce advanced rubato and MIDI tempo-change maps.
- The microphone uses a **single-note** pitch estimator. Chords, loud speaker playback and noisy environments can impair detection.
- No per-user state persisted between reloads; exported/library scores are loaded from the static website; user uploads stay in browser memory only.
- Direct cross-origin score URLs can fail when a hosting service blocks CORS. Download/upload is the fallback.
- No live API search for copyrighted popular songs is included: third-party archives must be accessed through their websites or user-provided direct files.

## Project files

```text
keyfall-v1.1/
├── index.html               Browser app / UI
├── styles.css               Mobile/desktop design and learning feedback
├── js/
│   ├── app.js               Modes, playback clock, library, input and UI
│   ├── music.js             MusicXML / MIDI reading, track selection, score strip
│   └── pitch.js             Acoustic pitch detection with silence gating
├── samples/                 11 MusicXML practice pieces
├── tests/                   Chord and short MIDI fixtures
├── assets/favicon.svg
├── .nojekyll                GitHub Pages compatibility
├── README.md
└── DEPLOYMENT.md
```

To test locally:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` from the *same computer*. For iPad microphone testing, deploy to HTTPS first. See [DEPLOYMENT.md](DEPLOYMENT.md).
