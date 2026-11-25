# oim3690 2026 FALL

## About this course 

1. AI-native
2. Learn and build in public
3. Hands-on, project-based learning 
4. Be creative

## Projects

- MP1: Website for Someone Else — [repo](https://github.com/azaz2005mzhu3/ariel-portfolio) | [live](https://azaz2005mzhu3.github.io/ariel-portfolio/)
- MP2: GPA & Grade Calculator — [repo](https://github.com/azaz2005mzhu3/gpa-grade-calculator) | [live](https://azaz2005mzhu3.github.io/gpa-grade-calculator/)
- MP3: Smart Travel Packing Planner — [repo](https://github.com/azaz2005mzhu3/smart-travel-packing-planner)  | [live](https://azaz2005mzhu3.github.io/smart-travel-packing-planner/)
- MP4: YouTube Study Focus — [repo](https://github.com/azaz2005mzhu3/youtube-study-focus) | [live](https://azaz2005mzhu3.github.io/youtube-study-focus/)



## LLM API lab

- [Ask AI · OIM3690](https://oim3690-tau.vercel.app/ai-chat.html): the chat page calls the Vercel server function at `/api/ask`.
- [Exercises, predictions and live verification checklist](logs/llm-api-tasks.md).
- `api/ask.js` reads `OPENROUTER_API_KEY` from Vercel Environment Variables. Never add the course key to this repository.
- Local mocked checks: `node tests/llm-api.test.mjs`.
- GitHub Pages and Live Server serve the HTML but cannot run `/api/ask`.

## Buzzword Meter extension

- [buzzword-meter/](buzzword-meter/buzzword-meter) is a Manifest V3 Chrome
  extension: highlights buzzwords on any page, lets you add your own words,
  ranks companies by buzzword score, and can ask the AI model to explain a
  selected sentence in plain English via `/api/ask`.
- Load it unpacked from `chrome://extensions` → Developer mode → Load
  unpacked → select `buzzword-meter/buzzword-meter`.
- See [buzzword-meter/buzzword-meter/README.md](buzzword-meter/buzzword-meter/README.md)
  for setup, the `host_permissions` predict-and-check exercise, and ideas for
  making the Plain English feature your own.

## Stock quote API lab

- [Stock Quote](quote.html) calls the server-side function at `/api/quote`. The current Vercel deployment does not yet include this page or function.
- `api/quote.js` reads `FINNHUB_API_KEY` from the Vercel project environment; the browser never receives the key.
- Add a separate Finnhub key for this project in Vercel under **Settings → Environment Variables**, for both Production and Preview, then redeploy.
- After deploying successfully, open `https://<your-project>.vercel.app/quote.html` and check `/api/quote?symbol=AAPL` in DevTools → Network.
- Keep `config.js` as a local placeholder only. It is ignored by Git and is not used by the quote page.
- GitHub Pages and Live Server cannot run `/api/quote`; test the deployed Vercel URL.
