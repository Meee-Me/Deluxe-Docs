# Deluxe Docs

Live at **https://deluxe-docs-qtp5.vercel.app** (Vercel, built from `main`).

A document viewer with a PDF Expert style workspace, that signs in with your Deluxe account (Deluxe Main) and opens your Deluxe Drive files. A static site, no build step: `index.html`, `styles.css`, `app.js` and `config.js`.

- Tabs for several open files, page thumbnails, page jump, zoom, find in PDF
- Highlight, draw and note tools on PDFs (kept while the tab is open)
- Opens PDF, Word (.docx), Excel and CSV, PowerPoint (.pptx), OpenDocument (.odt, .ods, .odp), RTF, images, audio, video, zip archives (file list) and text. An unknown extension that is really text (a log, a config file, source code) opens as text
- Reads the file's own contents to pick the viewer, so links with no extension or the wrong one still open

## Signing in with Deluxe Main

Deluxe Docs uses the Deluxe account from Deluxe Main. **Sign in with Deluxe Main** goes to Deluxe Main,
which signs you in (or makes your account; accounts are only ever made there) and sends you back here
with a one-use code. This browser then gets a key that lasts 30 days and can only **read**: the Deluxe
Drive file list (kept in Deluxe Main) and the files (kept in Deluxe Drive). **Sign out** (top right)
ends it, and so does signing Docs out on Deluxe Main's account page.

Once signed in, **My files** lists the account's folders and files, with search, and opens any of them.

Where things live is set in `config.js`: `mainUrl` (Deluxe Main), `driveUrl` (the Deluxe Drive
server) and `drivePage`. Deluxe Main only signs in websites it knows: this site's addresses are listed
in Deluxe Main's `worker/apps.js`.

## Redirect from Deluxe Drive

Deluxe Drive opens this page with the file's direct link appended:

```
https://YOUR-HOST/deluxe-docs/?url=<file link>&name=report.pdf
```

`url` is the file to open and `name` (optional) sets the tab title. If this browser is not signed in
yet, the file waits until it is, then opens.

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

