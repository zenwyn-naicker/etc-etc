# ETC ETC

Team page for ETC ETC: Zenwyn Naicker, Khayden Chetty, Rivaan Kawulesar and Stephane Nsengiyumva.

**Live:** https://zenwyn-naicker.github.io/etc-etc/

The QR code on the back of our business card points to this address, so the repo name must not change.

## Updating team details

Everything about the team lives in [`team.js`](team.js). Edit a member's `email`, `linkedin` or `photo`, commit, and push to `main`. GitHub Pages republishes in about a minute.

- Leave a field as `""` to hide that button.
- Photos go in `assets/photos/`. Use a square image of at least 400 × 400 with the face centred; it is shown as a circle.

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `styles.css` | Layout and colours (charcoal `#171714`, cream `#f7f3f0`, rust `#b63d20`) |
| `app.js` | Builds the team cards, the binary intro animation and the video playback |
| `team.js` | Team details |
| `assets/` | Intro video (720p for phones, 1080p for larger screens), stills, photos and the link preview image |

No build step: GitHub Pages serves the files as they are. To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.
