# Keyfall V1.1 — step-by-step deployment

No paid hosting, Node.js, package.json, build process, database, back-end, or API key is required. Deploy the static `keyfall-v1.1` folder. Test using the **HTTPS URL** on your iPad so Safari will allow microphone access.

## Option A — Netlify Drop (fastest)

1. Download the **keyfall-v1.1.zip** archive and extract it on your computer (or in iPad Files).
2. Open [https://app.netlify.com/drop](https://app.netlify.com/drop). Sign in to Netlify if prompted.
3. Drag the **uncompressed `keyfall-v1.1` folder** — not its ZIP file — into the deployment target. Ensure `index.html` is at the folder root.
4. Netlify produces a public `https://<name>.netlify.app` URL. Open it; the **Keyfall V1.1** library should load.
5. Try **Twinkle Twinkle → Wait mode**. Tap an incorrect key then the highlighted key; only the correct key should advance the song.
6. Switch to **Continuous play**, choose `90 BPM`, press **Play** and observe notes moving regardless of key input.
7. On your iPad, open the HTTPS URL in **Safari**, select **Use microphone**, and select **Allow** when prompted. Play notes on a real piano.
8. For later changes, update your deployment by dragging the updated extracted folder back to Netlify; or use a linked Git repo for automatic deployments.

## Option B — GitHub Pages

### First deployment

1. Go to [https://github.com/new](https://github.com/new) and create a repository named `keyfall-piano` (public is simplest for free Pages hosting).
2. Extract `keyfall-v1.1.zip` on your computer. Open the extracted folder.
3. In the new GitHub repository, select **Add file → Upload files**.
4. Upload **the contents of the `keyfall-v1.1` folder**, keeping the relative paths. `index.html` must be at the repository root, with sibling `js/`, `samples/`, `styles.css`, and `assets/`. If GitHub's web upload does not preserve subfolders, use the command-line method below.
5. Commit files to the `main` branch.
6. Navigate to **Settings → Pages**.
7. Under **Build and deployment**, select **Deploy from a branch**.
8. Select branch **main**, folder **/(root)**, and click **Save**.
9. After the build is published, visit `https://YOUR-USERNAME.github.io/keyfall-piano/`.
10. On iPad Safari, use the HTTPS URL and grant microphone permission when requested.

### Alternative: Git command-line upload (preserves folders)

Create the empty GitHub repository on the website first, then execute on your computer from inside the extracted `keyfall-v1.1` folder:

```bash
git init
git add .
git commit -m "Deploy Keyfall V1.1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/keyfall-piano.git
git push -u origin main
```

Then enable Pages in Settings as above. If your repository already contains earlier Keyfall MVP files, **replace** `index.html`, `styles.css`, `js/`, `samples/`, `README.md`, and `DEPLOYMENT.md` with their V1.1 versions, then commit and push. Avoid leaving old and new `app.js` files mixed together.

Official GitHub guide: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Option C — local development on computer

Open Terminal inside the unzipped folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in Chrome, Edge or Safari on **that same computer**. This allows testing the interface, imports, and sometimes the computer's microphone. For iPad remote microphone access, publish over HTTPS as in A or B.

## Test checklist after deployment

- [ ] **Library**: Twinkle, Ode to Joy and 9 additional built-in pieces are available.
- [ ] **Search**: Searching `chord` returns First Piano Chords.
- [ ] **Listen**: Press a song's Listen button; hear a brief simple synthesised preview (if device audio is on).
- [ ] **Wait**: An incorrect key does not advance; a correct note flashes bright green and advances.
- [ ] **Chord**: In First Piano Chords, tap C4, E4 and G4; it advances only after all three.
- [ ] **Continuous**: Choose Continuous → Play; notes keep falling with or without your input.
- [ ] **Continuous correct note**: Tap a target key near its note's timing line; only that correct key flashes bright green.
- [ ] **Tempo**: Change BPM; playback visibly speeds up or slows down.
- [ ] **Pause/Resume**: Pausing stops the notes; resuming continues from the same place.
- [ ] **Guide piano**: With microphone disconnected, check Guide piano sound and play; hear gentle tone notes.
- [ ] **Import**: Upload `tests/piano-midi-test.mid` and a sample `.musicxml` file; both load.
- [ ] **Track selection**: For a multi-track MIDI or multi-part MusicXML file, choose the piano/melody track instead of a full arrangement.
- [ ] **iPad mic**: Safari has HTTPS microphone permission and updates the Heard note text when you play a clear single note.

## Troubleshooting

**Blank screen, missing note lane, or library errors:** Ensure the entire folder was uploaded, including `js/`, `samples/`, and `styles.css`. The website's `index.html` and `/samples/twinkle.musicxml` must be accessible on the same domain. Refresh the deployed page after updating.

**Camera/microphone button does nothing:** Keyfall requires *microphone*, not camera. Open from HTTPS; in Safari's website settings allow Microphone, reload, then tap **Use microphone**. Safari may require another user tap after switching tabs or returning to the app.

**Microphone detects wrong notes:** Use quiet surroundings; turn off external backing/guide sound. Play single clear notes at a moderate volume with a release between repetitions. The microphone is single-note recognition, not chord transcription.

**Web MIDI unavailable on iPad Safari:** Use the mic for acoustic/digital piano; use a supported desktop Chromium browser for Web MIDI keyboard input.

**No notes on a MIDI import or too many notes:** Choose the correct part in **Instrument / MIDI track**. Many online MIDI files include many instrumental parts and are not piano-only. MIDI does not include the printed sheet-music layout.

**Guide audio does not play:** Use the Listen or Play button (a direct user gesture), enable device sound, and ensure microphone is disconnected.

**Online URL fails:** Links to web pages are not direct file URLs, and many hosting sites block CORS. Download the actual `.mid` or `.musicxml` file to device storage and use the Upload tab.

**MusicXML part unsupported:** Export uncompressed partwise MusicXML. PDF, photos, `.mxl` and timewise MusicXML are not accepted in V1.1.

## Data handling / hosting

No backend stores uploads. Imported MIDI/MusicXML are parsed on-device in browser memory. Microphone signal analysis is on-device. Loading a song via an external URL contacts that file host as normal, and external discovery links leave Keyfall.
