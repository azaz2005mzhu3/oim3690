# Buzzword Meter

A minimal Chrome extension (Manifest V3, plain JavaScript) that counts
corporate buzzwords on a [Lever](https://jobs.lever.co) job posting and
shows the total in a banner at the top of the page.

## Files

- [manifest.json](./manifest.json) — declares the extension and restricts
  the content script to `https://jobs.lever.co/*`. No `permissions` or
  `host_permissions` are requested; matching that one site in
  `content_scripts` is enough.
- [content.js](./content.js) — defines the buzzword list, counts
  case-insensitive occurrences (including multi-word phrases) in
  `document.body`'s text, then inserts the banner. The text is read and
  counted *before* the banner is added, so the banner's own text is never
  included in the count.
- [content.css](./content.css) — styles the banner. It sits in the normal
  page flow (`position: static`) at the very top of `<body>`, so it pushes
  the page content down instead of covering any links, buttons, or the
  application form.

## How to load it

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this `buzzword-meter` folder.

## How to test it

1. Open any posting on `https://jobs.lever.co/...` (e.g. search
   "site:jobs.lever.co" for a live listing, since postings change often).
2. Confirm a yellow banner appears at the very top reading
   `Buzzword Meter: N buzzwords found in this posting`.
3. Open DevTools → Elements and confirm `#buzzword-meter-banner` is the
   first child of `<body>`, and that its own text is not double-counted
   (it isn't, since counting happens before the banner is inserted).
4. Click links, buttons, and try the application form on the page to
   confirm nothing is broken or covered by the banner.
5. Visit a non-Lever site (e.g. any other page) and confirm the content
   script does not run there (no banner, no console errors) — this checks
   that `matches` in `manifest.json` is scoping it correctly.
6. Edit the `BUZZWORDS` list in `content.js`, reload the extension at
   `chrome://extensions`, and refresh the posting to see the count change.
