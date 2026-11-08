# Deluxe Docs

A document viewer with a PDF Expert style workspace, connected to Deluxe Drive by a link ID. A static site, no build step: `index.html`, `styles.css`, `app.js` and `config.js`.

- Tabs for several open files, page thumbnails, page jump, zoom, find in PDF
- Highlight, draw and note tools on PDFs (kept while the tab is open)
- Opens PDF, Word (.docx), Excel and CSV, PowerPoint (.pptx), OpenDocument (.odt, .ods, .odp), RTF, images, audio, video, zip archives (file list) and text. An unknown extension that is really text (a log, a config file, source code) opens as text
- Reads the file's own contents to pick the viewer, so links with no extension or the wrong one still open

## Connecting to Deluxe Drive

1. In Deluxe Drive, open the account menu → **Connect Deluxe Docs** → **Generate link ID**.
   A code like `62EJ-CBTD-V98W` appears and is copied.
2. Paste it into the **Link ID** box on this page within 60 seconds. It connects as soon as a whole
   code is pasted (spaces, dashes and lower case are fine).

The drive finds the account the code belongs to and gives this browser a key that can only read that
account's files. The key lasts 30 days and is kept in this browser; **Disconnect** (top right) ends it.
A code works once, and a newer code ends an older one.

Once connected, the **Deluxe Drive** button lists the account's folders and files, with search, and
opens any of them in a new tab.

Which drive this page connects to is set in `config.js` (`driveUrl`, by default
`https://deluxe-drive-xi.vercel.app`, the drive on Vercel; its server is a Vercel Function there).

## Redirect from Deluxe Drive

Deluxe Drive opens this page with the file's direct link appended:

```
https://YOUR-HOST/deluxe-docs/?url=<file link>&name=report.pdf
```

`url` is the file to open and `name` (optional) sets the tab title. If this browser is not connected
yet, the file waits until a link ID has been pasted, then opens.

Deluxe Drive file URLs must allow cross-origin reads from the viewer's origin (CORS), including the
`Authorization` header. Share links (`/s/<token>`) already do.

## Limits
- Sign-in controls access to files on Deluxe Drive. The page itself is static, so it is not a place to hide secrets.
- Legacy `.doc` and `.ppt`, and Apple Pages / Numbers / Keynote files, are not supported. Save as `.docx` / `.pptx`, or export to PDF.
- RTF opens as text only. OpenDocument text and slides show text, lists, tables and images, not exact layout.
- PowerPoint is a close approximation (text, images, basic fills).
- Annotations are not yet written back into the PDF.

## Run it

- **Vercel (live):** https://deluxe-docs-iota.vercel.app. A static site: Vercel publishes the repository as
  it is. The drive it connects to is on Vercel too (see `config.js`).
- **Cloudflare (Workers):** this repository has a `wrangler.jsonc`, so `npx wrangler deploy` (or Workers Builds on
  this repository, deploy command `npx wrangler deploy`) publishes it as the `deluxe-docs` Worker, for example
  `https://deluxe-docs.deluxelordd.workers.dev`. There is no server code; the files are served as they are.
- **GitHub Pages:** Settings, Pages, deploy from branch `main` (root).
- **Locally:** `npm start`, or `python3 -m http.server 8000` and open http://localhost:8000.

Sign-in and link opening need an `https` address (or localhost).

