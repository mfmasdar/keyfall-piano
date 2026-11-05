# Keyfall V1.1 — tested scenarios

Validated using browser automation in Chromium on 1 November 2026 against the V1.1 HTML/CSS/JavaScript with local sample-file responses. The shipped website remains standard ES modules for static hosting.

| Scenario | Result |
| --- | --- |
| Load all 11 bundled MusicXML practice pieces | PASS — all produced playable notes |
| Search bundled library for `chord` | PASS — matched First Piano Chords |
| Wait mode: wrong note must not advance | PASS |
| Wait mode: correct note flashes bright green and advances | PASS |
| Wait mode: chord advances only after C4, E4 and G4 | PASS |
| Continuous mode moves forward without any input | PASS |
| Continuous mode correct note flashes bright green and playback continues | PASS |
| Continuous mode Play/Pause freezes/resumes the song position | PASS |
| MIDI file import (`tests/piano-midi-test.mid`) | PASS |
| Two-track MIDI file: switch Piano Right / Bass Line | PASS |
| Two-staff MusicXML: right / left / both hands | PASS |
| Listen preview and optional guide tone initialise | PASS in Chromium automation |
| Mobile layout at 390 px | PASS — no page-level horizontal overflow |
| JS errors during tested interactions | NONE |

Physical acoustic-piano microphone accuracy and real USB-MIDI hardware on iPad/desktop were **not** validated with actual instruments; microphone and MIDI hooks from the MVP are preserved. Browser restrictions can vary by OS, device and permissions.
