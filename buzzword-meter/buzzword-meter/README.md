# Buzzword Meter

A Chrome extension (Manifest V3) that highlights corporate buzzwords on any
page, lets you add your own words, ranks the companies you've browsed by
buzzword score, and can ask an AI model to explain a selected sentence in
plain English.

## Load it in Chrome

1. Go to `chrome://extensions`, turn on **Developer mode**.
2. Click **Load unpacked** and select this folder (`buzzword-meter/buzzword-meter`).
3. Open any job posting and click the toolbar icon to see the popup.

## Features and where they live

- **Highlight them** — [content.js](./content.js) wraps every buzzword in a
  `<mark>` on the page; the popup banner in [popup.html](./popup.html) /
  [popup.js](./popup.js) shows the total and a per-word breakdown.
- **Your own words** — the "Your own words" form in the popup saves words to
  `chrome.storage.sync` (`customBuzzwords`); `content.js` merges them with
  [words.js](./words.js) and re-scans automatically when the list changes.
- **Rank the companies** — every time you open the popup on a scored page,
  `popup.js` saves `{ company, score, url }` to `chrome.storage.local`
  (`companyScores`) and lists them highest score first.
- **Plain English** — click "Explain selected text" in the popup. It reads
  your current page selection, POSTs it to `/api/ask` on your deployed
  Vercel project (set the URL under **Ask AI settings**), and shows the
  model's two-sentence answer.

## Setup for "Plain English"

The popup defaults to this repo's own deployment, `https://oim3690-tau.vercel.app`
(see the main [README.md](../../README.md)), so it should work immediately.
To point it at a different Vercel project instead:

1. Deploy the repo to Vercel (`api/ask.js` must be live with
   `OPENROUTER_API_KEY` set).
2. Open the popup → **Ask AI settings** → paste your
   `https://<project>.vercel.app` URL → **Save**.
3. Select a sentence on any page, reopen the popup, click **Explain selected
   text**.

## Predict, then check: `host_permissions`

`manifest.json` has:

```json
"host_permissions": ["https://*.vercel.app/*"]
```

This is what lets the popup's `fetch` call reach your Vercel function without
being blocked by CORS (extensions with a matching host permission can make
cross-origin requests that a normal webpage couldn't).

**Try it:**
1. Predict what will happen if this line is removed.
2. Delete the `host_permissions` line from `manifest.json`.
3. Go to `chrome://extensions` and reload the extension.
4. Select text, click **Explain selected text**, and read the error in the
   popup and in the popup's DevTools console (right-click the popup →
   Inspect).
5. Put the line back and reload again to confirm it works.

## Make it yours

Try it on a job requirement, a contract clause, or a paragraph of financial
news, then open **Ask AI settings** and change the "Ask the model to…" text
(e.g. "List the three biggest risks in plain English:") to change what the
popup asks the model to do — no code edit required.
