# oim3690 2026 FALL

## About this course 

1. AI-native
2. Learn and build in public
3. Hands-on, project-based learning 
4. Be creative

## Projects

- MP1: Website for Someone Else — [repo](https://github.com/azaz2005mzhu3/ariel-portfolio) | [live](https://azaz2005mzhu3.github.io/ariel-portfolio/)
- MP2: GPA & Grade Calculator — [repo](https://github.com/azaz2005mzhu3/gpa-grade-calculator) | [live](https://azaz2005mzhu3.github.io/gpa-grade-calculator/)


## LLM API lab

- [Ask AI](https://oim3690.vercel.app/ai-chat.html): open the deployed chat. Its server function runs at `/api/ask`.
- [Exercises, predictions and live verification checklist](logs/llm-api-tasks.md).
- `api/ask.js` reads `OPENROUTER_API_KEY` from Vercel Environment Variables. Never add the course key to this repository.
- Local mocked checks: `node tests/llm-api.test.mjs`.
- GitHub Pages and Live Server serve the HTML but cannot run `/api/ask`.
