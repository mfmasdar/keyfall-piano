# Keyfall V1.2 — browser test report

Date: 6 November 2026

Testing was performed with headless Chromium using the actual app HTML and styles and the unmodified JavaScript bodies combined in a test harness. The test harness serves bundled fixtures and audio samples from browser memory because this testing environment blocks browser navigation to local HTTP hosts. JavaScript source files independently passed `node --check`. This is a **functional smoke test**, not acoustic or physical hardware certification.

| Scenario | Result |
|---|---|
| Setup shown, Studio hidden on launch | PASS |
| Starter library displays 11 songs | PASS |
| Electric piano sound samples decode | PASS — 21/21 |
| Sound preview loads and starts Web Audio | PASS |
| Enter Studio displays focused stage and keyboard | PASS |
| Wrong on-screen key doesn't advance Wait mode | PASS |
| Correct on-screen key advances Wait mode | PASS |
| Continuous mode has Play and advances without key input | PASS |
| Back to Setup and re-enter Studio | PASS |
| Two-staff MusicXML import and left-hand selection | PASS |
| Mobile Setup and Studio views render at 390px width | PASS |
| No uncaught JavaScript errors during tested flows | PASS |
| MIDI keyboard hardware | Not tested with physical device |
| Acoustic-piano microphone | Not tested with physical piano |
| Safari audio playback on iPad | Needs physical-device test |

The `tests/` folder provides MIDI, chord and MusicXML files for further manual testing. Running the app under HTTPS on real devices remains the next check for microphone and hardware input.
