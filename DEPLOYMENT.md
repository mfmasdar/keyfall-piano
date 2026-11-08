# Deploy Keyfall V1.2 from a Windows / macOS desktop

The app is static HTML, CSS, JavaScript, MusicXML and MP3 files. **Preserve the folder structure.** Publishing only `index.html` will break the score loading and audio sampler.

## Option 1 — GitHub Desktop + GitHub Pages (recommended)

### 1. Download and unzip

Download `keyfall-v1.2.zip`, right-click **Extract All** (Windows), and open the extracted `keyfall-v1.2` folder. You should see `index.html`, `styles.css`, `styles-v12.css`, `js`, `assets`, and `samples`.

### 2. Create a local Git repository

1. Install **GitHub Desktop** from https://desktop.github.com/.
2. Sign in to your GitHub account.
3. In the GitHub Desktop menu, choose **File → Add local repository**.
4. Choose the extracted `keyfall-v1.2` folder.
5. If it says it is not a repository, select **Create a repository here**. Name it `keyfall`, select the correct local folder, and create it.
6. At bottom left, enter the commit message `Keyfall V1.2 - studio and electric piano sound`, then select **Commit to main**.
7. Select **Publish repository**. Choose whether to keep it private (GitHub Pages availability depends on your plan). A public repository is the simplest for a publicly accessible demo.

### 3. Activate GitHub Pages

1. Open the newly published repository on GitHub.com.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Under **Branch**, select **main** and **/(root)**, then press **Save**.
5. Your app URL should look like `https://YOUR-USERNAME.github.io/keyfall/`. GitHub Pages may take a few minutes to publish.

### 4. Future updates

Edit or replace files inside the same local `keyfall-v1.2` folder; GitHub Desktop will detect them. Add a commit message, press **Commit to main**, then **Push origin**. Pages will rebuild automatically.

## Option 2 — GitHub website (desktop Chrome / Edge)

1. Create or open a GitHub repository.
2. Choose **Add file → Upload files**.
3. In File Explorer / Finder, open the extracted `keyfall-v1.2` folder and drag its **contents** into GitHub's upload area. Include the `js`, `assets`, and `samples` directories. Depending on your browser, folders may not transfer correctly; **GitHub Desktop is the more reliable option**.
4. Review the upload file list and verify that nested file paths such as `js/app.js`, `samples/twinkle.musicxml`, and `assets/electric-piano/60.mp3` are present.
5. Commit to `main` and enable Pages as above.

**Do not put the `keyfall-v1.2` wrapper folder inside the repository root** unless you deliberately set the Pages publishing path. The `index.html` must be at the root of the published folder.

## Option 3 — Netlify Drop (no Git workflow)

1. Go to https://app.netlify.com/drop.
2. Drag the extracted folder `keyfall-v1.2` into the Netlify Drop area.
3. Open the generated HTTPS URL. All nested folders remain available.

## Local preview before publishing

On Windows, open Command Prompt in `keyfall-v1.2` and run:

```bash
py -m http.server 8000
```

If `py` is unavailable, use `python -m http.server 8000`. Open http://localhost:8000. Close the command prompt or press Ctrl+C to stop.

## Quick verification checklist

1. The **Setup** page displays 11 starter songs.
2. Click **Test the sound**: hear four electric-piano notes.
3. Choose **Wait for correct note**, then click **Enter practice studio**.
4. Click the wrong on-screen note, e.g. D4. It **sounds** but does **not** advance.
5. Click the highlighted C4. It **sounds**, lights green and advances to the next step.
6. Click **Back to setup**, choose **Continuous play**, return to the studio and click **Play**. Notes keep moving even when you do not play.
7. Upload a `.musicxml` or `.mid` from your own computer to check imports.
8. On iPad Safari use HTTPS, tap **Use microphone** from Setup and allow access. For MIDI input use a compatible browser, typically desktop Chrome / Edge.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Page is blank or music never loads | A folder was missed. Verify `js/app.js` and `samples/twinkle.musicxml` in the published repository. |
| Piano keys make no sound | Check device volume, the **Sound on mouse/touch/computer** checkbox, and the sound slider. Press **Test the sound** to unlock audio. Verify `assets/electric-piano/*.mp3` exists. |
| A note sounds synthetic on the first tap | The first tap can use a fallback while local audio files decode. Choose **Enter practice studio** to preload all sound samples. |
| Microphone connection fails | Use `https://` or localhost and grant microphone permissions. |
| The microphone hears app playback | Disable **Guide piano sound** while using microphone input. |
| MIDI device cannot connect | Use a desktop browser with Web MIDI (Chrome/Edge) and plug in the keyboard first. |
| Online score URL doesn't import | The remote server may block browser CORS. Download the `.mid`/`.musicxml` and use **Upload a score** instead. |
| `index.html` works locally but not on Pages | Check the publishing branch and root directory; ensure `index.html` is in repository root and `.nojekyll` is present. |

## Reference documentation

- GitHub Pages: https://docs.github.com/en/pages/quickstart
- GitHub Desktop: https://docs.github.com/en/desktop
- Web Audio browser interaction requirement: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
