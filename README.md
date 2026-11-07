# Deluxe Docs

A document viewer with a PDF Expert style workspace and Deluxe Drive sign-in. A static site, no build step: `index.html`, `styles.css`, `app.js` and `config.js`.

- Tabs for several open files, page thumbnails, page jump, zoom, find in PDF
- Highlight, draw and note tools on PDFs (kept while the tab is open)
- Opens PDF, Word (.docx), Excel and CSV, PowerPoint (.pptx), images, audio, video and text
- Reads the file's own contents to pick the viewer, so links with no extension or the wrong one still open

## Deluxe Drive sign-in

The page signs in with OAuth 2.0 authorization code flow plus PKCE. Fill in `config.js`:

```js
{
  "driveName": "Deluxe Drive",
  "driveUrl": "https://drive.example.com",
  "authorizeUrl": "https://drive.example.com/oauth/authorize",
  "tokenUrl": "https://drive.example.com/oauth/token",
  "userInfoUrl": "https://drive.example.com/oauth/userinfo",
  "clientId": "your-public-client-id",
  "scope": "openid profile"
}
```

In Deluxe Drive, register this page's address (for example `https://you.github.io/deluxe-docs/`) as an allowed redirect URI for that client. Until `authorizeUrl`, `tokenUrl` and `clientId` are set, the page shows a setup notice and offers a preview mode.

The access token is kept in `sessionStorage` and is sent only to files on the `driveUrl` origin.

## Redirect from Deluxe Drive

Set Deluxe Drive's "open with" address to `https://YOUR-HOST/deluxe-docs/?url=` and let it append the file's direct link. Optional `&name=report.pdf` sets the tab title. Unsigned visitors are sent to sign in first, then the file opens.

Deluxe Drive file URLs must allow cross-origin reads from the viewer's origin (CORS), including the `Authorization` header.

## Limits
- Sign-in controls access to files on Deluxe Drive. The page itself is static, so it is not a place to hide secrets.
- Legacy `.doc` and `.ppt` are not supported. Save as `.docx` / `.pptx`.
- PowerPoint is a close approximation (text, images, basic fills).
- Annotations are not yet written back into the PDF.

## Run it

- **GitHub Pages:** Settings, Pages, deploy from branch `main` (root). The address will be `https://<user>.github.io/<repo>/`.
- **Locally:** `npm start`, or `python3 -m http.server 8000` and open http://localhost:8000.

Sign-in and link opening need an `https` address (or localhost).
