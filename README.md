# Deluxe Docs

A document viewer with a PDF Expert style workspace and Deluxe Drive sign-in. A static site, no build step: `index.html`, `styles.css`, `app.js` and `config.js`.

- Tabs for several open files, page thumbnails, page jump, zoom, find in PDF
- Highlight, draw and note tools on PDFs (kept while the tab is open)
- Opens PDF, Word (.docx), Excel and CSV, PowerPoint (.pptx), images, audio, video and text
- Reads the file's own contents to pick the viewer, so links with no extension or the wrong one still open

## Connecting to Deluxe Drive

No file has to be edited. On the first visit this page shows a **Connect to Deluxe Drive** box:

1. In Deluxe Drive (running with its server), open the account menu → **Connect Deluxe Docs**.
2. Paste this page's address, for example `https://you.github.io/deluxe-docs/`. The drive registers
   it as an OAuth client, which also makes it the redirect address.
3. Press **Copy Docs setup** there, then paste the setup into the box on this page and press
   **Use this setup**. It is kept in this browser and the page signs in straight away.

The setup carries `driveUrl`, `authorizeUrl`, `tokenUrl`, `userInfoUrl`, `clientId` and `scope`.
`config.js` still works for a copy deployed with one fixed drive, and a pasted setup overrides it;
**Use a different Deluxe Drive** clears the pasted one.

The page signs in with OAuth 2.0 authorization code flow plus PKCE, shows the drive's own sign-in
and consent pages, and keeps the access token in `sessionStorage`. The token is sent only to files
on the `driveUrl` origin.

## Redirect from Deluxe Drive

Deluxe Drive opens this page with the file's direct link appended:

```
https://YOUR-HOST/deluxe-docs/?url=<file link>&name=report.pdf
```

`url` is the file to open and `name` (optional) sets the tab title. A signed-out visitor is sent to
Deluxe Drive to sign in first, and the file opens when they come back.

Deluxe Drive file URLs must allow cross-origin reads from the viewer's origin (CORS), including the
`Authorization` header. Share links (`/s/<token>`) already do.

## Limits
- Sign-in controls access to files on Deluxe Drive. The page itself is static, so it is not a place to hide secrets.
- Legacy `.doc` and `.ppt` are not supported. Save as `.docx` / `.pptx`.
- PowerPoint is a close approximation (text, images, basic fills).
- Annotations are not yet written back into the PDF.

## Run it

- **GitHub Pages:** Settings, Pages, deploy from branch `main` (root). The address will be `https://<user>.github.io/<repo>/`.
- **Locally:** `npm start`, or `python3 -m http.server 8000` and open http://localhost:8000.

Sign-in and link opening need an `https` address (or localhost).
