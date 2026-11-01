# Keyfall MVP — Deployment guide

Keyfall is a **static browser app**. It does not need npm, React, hosting APIs, a database, keys, or a build command. The unzipped `keyfall-mvp` folder is the finished website.

## OPTION A — Netlify Drop (quickest)

1. Download `keyfall-mvp.zip` and **unzip** it.
2. Open **https://app.netlify.com/drop** in a desktop browser. Sign in if you want to manage the site over time.
3. Drag the **entire unzipped `keyfall-mvp` folder** to the deploy zone. Do not drag only `index.html`, because the `js`, `assets`, `samples`, and CSS files are required.
4. Netlify publishes a site with a generated `.netlify.app` HTTPS URL.
5. Open that HTTPS URL on your iPad or computer. Choose a starter melody, then click **Use microphone** and allow microphone access.
6. To update the app later, edit the local files and drag the updated folder into the site's Deploys page.

The app is already built: there is nothing to install or compile.

## OPTION B — GitHub Pages (best for version control)

1. Sign in to **https://github.com** and choose **New repository**.
2. Name the repository, e.g. `keyfall-piano`; choose **Public** on GitHub Free.
3. In the repository, choose **Add file → Upload files**.
4. Unzip `keyfall-mvp.zip`. Upload the files and folders **inside `keyfall-mvp/`** into the repository **root**:
   ```text
   keyfall-piano/
     index.html
     styles.css
     .nojekyll
     js/
     assets/
     samples/
     tests/
     README.md
     DEPLOYMENT.md
   ```
   Note: GitHub's web uploader may not include hidden files like `.nojekyll`. That's optional for this app, but helpful if using Git-based publishing.
5. Commit changes to the `main` branch.
6. Select repository **Settings → Pages**.
7. Under **Build and deployment**, choose **Source: Deploy from a branch**.
8. Choose **Branch: main** and **Folder: /(root)**; click **Save**.
9. After GitHub Pages publishes, your app URL is typically:
   `https://YOUR-USERNAME.github.io/keyfall-piano/`
10. Open your HTTPS app URL on iPad Safari (microphone) or desktop Chrome/Edge (microphone or MIDI).

No custom GitHub Actions, secrets, or npm dependencies are required.

## OPTION C — Run locally on a laptop

1. Unzip the project.
2. Open Terminal and navigate to its directory:
   ```bash
   cd path/to/keyfall-mvp
   ```
3. Run:
   ```bash
   python3 -m http.server 8000
   ```
   On Windows, use `py -m http.server 8000` if `python3` is unavailable.
4. In a browser on **that same computer**, open `http://localhost:8000`.
5. Allow microphone access when asked.

**Do not double-click `index.html` for normal use.** Browser security may block local `fetch()` of bundled songs. Use localhost or an HTTPS deployment.

## Testing your deployment

1. **Starter library:** choose “Twinkle, Twinkle.” It should show `NOTE 1 OF 42` with the `C4` key highlighted.
2. **Wrong note:** tap `D4`; the melody must stay on note 1.
3. **Right note:** tap `C4`; the note animation should advance to note 2 after a short transition.
4. **Repeated note:** tap `C4` again; it should move to note 3 (`G4`).
5. **Upload:** use Upload to select `tests/chord-practice.musicxml` (C4+E4, followed by G4). The first step only advances after both C4 and E4 have been played.
6. **MIDI file import:** upload `tests/piano-midi-test.mid`; it should show 3 note steps.
7. **Microphone:** choose Use microphone, grant permission, play one clean C4 note, release, then repeat. Try reducing noise and moving the device closer to the piano if detection is inconsistent.

## Device compatibility

| Device/browser | Microphone | Direct MIDI device |
|---|---|---|
| iPad Safari | Yes, on HTTPS and with permission | No native Web MIDI support |
| iPhone Safari | Yes, on HTTPS and with permission | No native Web MIDI support |
| Desktop Chrome / Edge | Yes | Supported with compatible MIDI devices |
| Desktop Firefox | Yes | Browser and OS-dependent; test device compatibility |

The microphone detector recognizes **one clearly played pitch at a time**. Chords can be completed by playing each target pitch separately; MIDI is preferable for reliable chord input. If you use a digital keyboard with built-in speakers, the microphone can listen to its audible sound.

## Troubleshooting

| Symptom | Check |
|---|---|
| App shows a blank page | Verify `js/app.js`, `js/music.js` and `js/pitch.js` are present next to `index.html` in their folder; serve over localhost or HTTPS. |
| Starter songs don't load | Ensure the `samples/` directory was uploaded; inspect browser developer console. |
| Microphone permission not requested | Use HTTPS or localhost; tap the Use microphone button (permission is requested only after this gesture). |
| Microphone says denied | In browser/site settings permit microphone access, then reload. |
| Notes don't register | Move closer to the instrument, play isolated notes, avoid background sound, use built-in or wired microphone, or switch to MIDI/onscreen keys. |
| Repeated notes don't advance | With microphone input, briefly release the piano key and wait for the sound to drop before playing the same pitch again. |
| MIDI Connect is unavailable on iPad | Expected browser limitation; use microphone input instead. |
| A direct online file URL fails | The remote server probably blocks cross-origin browser downloads. Download `.musicxml` or `.mid` locally and use Upload. |
| A PDF, photo or `.mxl` file won't import | Convert or export it to uncompressed MusicXML, or use MIDI. |
| A complex orchestral score looks incomplete | The MVP selects a piano part when possible; otherwise it uses the first part. Export a standalone piano part. |

## Future feature additions

- Sheet-music scan-to-notes (PDF/JPG optical music recognition).
- Full engraving of imported sheet music (rather than the simplified staff preview).
- Smart multi-pitch acoustic chord detection and more robust pitch confidence.
- A searchable online catalog / partner APIs for permitted score downloads.
- Looping measures and optional hand selection.

**Important for accuracy:** This MVP processes MusicXML and MIDI locally in the browser. It does **not** parse sheet-music PDF images or provide a reliable polyphonic acoustic-piano transcription engine.
