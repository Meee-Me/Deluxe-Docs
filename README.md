# Deluxe Docs

A document viewer with a PDF Expert style workspace and Deluxe Drive sign-in. A static site, no build step: `index.html`, `styles.css`, `app.js` and `config.js`.

- Tabs for several open files, page thumbnails, page jump, zoom, find in PDF
- Highlight, draw and note tools on PDFs (kept while the tab is open)
- Opens PDF, Word (.docx), Excel and CSV, PowerPoint (.pptx), OpenDocument (.odt, .ods, .odp), RTF, images, audio, video, zip archives (file list) and text. An unknown extension that is really text (a log, a config file, source code) opens as text
- Reads the file's own contents to pick the viewer, so links with no extension or the wrong one still open

## Connecting to Deluxe Drive

No file has to be edited. On the first visit this page shows a **Connect to Deluxe Drive** box:

1. In Deluxe Drive (running with its server), open the account menu → **Connect Deluxe Docs**.
2. Paste this page's address, for example `https://deluxe-docs.deluxelordd.workers.dev`. The drive registers it
   as an OAuth client, which is also its redirect address.
3. Copy the **Link ID** the drive shows (or use **Link for Deluxe Docs** in the account menu), paste
   it into the box on this page and press **Use this setup**. The page reads the link, names its own
   address as the redirect, and the drive registers a client for it — so the same account's id
   works on any copy of the viewer. It is kept in this browser and signs in straight away.

The link looks like `https://your-drive.example/connect/ab12cd34` and holds nothing secret: the
client id is public and signing in still happens on the drive's own pages. It is made per account —
each person on the drive copies their own — and the account it belongs to is offered by name on the
drive's sign-in page. `config.js` still works for a copy deployed with one fixed drive, and a pasted
link overrides it; **Use a different Deluxe Drive** clears it.

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
- Legacy `.doc` and `.ppt`, and Apple Pages / Numbers / Keynote files, are not supported. Save as `.docx` / `.pptx`, or export to PDF.
- RTF opens as text only. OpenDocument text and slides show text, lists, tables and images, not exact layout.
- PowerPoint is a close approximation (text, images, basic fills).
- Annotations are not yet written back into the PDF.

## Run it

- **Cloudflare (Workers):** this repository has a `wrangler.jsonc`, so `npx wrangler deploy` (or Workers Builds on
  this repository, deploy command `npx wrangler deploy`) publishes it as the `deluxe-docs` Worker, for example
  `https://deluxe-docs.deluxelordd.workers.dev`. There is no server code; the files are served as they are.
- **GitHub Pages:** Settings, Pages, deploy from branch `main` (root).
- **Locally:** `npm start`, or `python3 -m http.server 8000` and open http://localhost:8000.

Sign-in and link opening need an `https` address (or localhost).

The Deluxe Drive it connects to must allow this page's address. On Cloudflare that is
`ALLOWED_DOCS_ORIGINS` in the drive's `wrangler.jsonc`, which already lists
`https://deluxe-docs.deluxelordd.workers.dev`.
