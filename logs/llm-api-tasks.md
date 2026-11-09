# LLM API exercises — predictions and verification

Source: https://oim3690.github.io/topics/llm-api/slides/#/13

## Status

Code is prepared for slides 13, 24, 26 and the cost option on slide 29.
The stable Vercel homepage responds, but the live `/api/ask` route currently returns HTTP 500, so no model-response experiment has passed yet.
Predictions below are expectations, not observed model answers.

## Deploy (slide 13)

1. Import `azaz2005mzhu3/oim3690` at https://vercel.com/new.
2. Use the repository root. This is a plain HTML site; select Other if asked for a framework, with no build command.
3. Add `OPENROUTER_API_KEY` using the course key from Canvas. Enter the key only in Vercel, never in HTML, GitHub or a screenshot.
4. Deploy. If the variable was added after deployment, redeploy.
5. Open `https://oim3690.vercel.app/ai-chat.html`.
6. Open DevTools → Network, click Ask, then inspect `ask` → Payload and Response.

Prediction: the response is a JSON object with status, output and usage. The answer should be in an output item whose type is message, with output_text content. Usage should report input/output tokens and possibly cost. A reasoning item may precede the message, so output[0] is not a reliable way to find it. The app adds exercise.toolRuns and exercise.totalCost.

Observed deployment check: the chat page loads at the project URL. A POST to `/api/ask` returned HTTP 500 before a response JSON was available. Redeploy the latest commit and repeat the Network check before recording model output or token counts.

## What the model knows (slide 15)

Use Plain mode with the date tool disabled. Click New Chat before every independent question so old answers do not influence the result.

| Prompt | Repeats | Prediction | Observed answers |
| --- | --- | --- | --- |
| Suggest one name for a coffee shop at Babson College. Answer with the name only. | 3 | Names may vary, though repetition is possible. | Pending |
| What is today’s date? | 2 | Without a clock tool, the model may guess or say it does not know. | Pending |
| What room does this class meet in? | 1 | Without course context, it cannot reliably know the room. | Pending |

Compare actual answers with a classmate if available. Do not invent a classmate comparison.

## Give it the syllabus (slide 17)

For EACH request, paste the instruction below, then the WHOLE syllabus from https://oim3690.github.io/syllabus/, then the question. Start a New Chat between independent tests.

> Answer only from this syllabus. If it does not say, say so.

| Question | Repeats | Source check / prediction | Observed answers |
| --- | --- | --- | --- |
| What room does this class meet in? | 1 | Gerber Hall 102. | Pending |
| When is the final project proposal due? | 2 | Friday, November 20, 2026. November 19 is the proposal studio, not the deadline. | Pending |
| What is the parking policy? | 1 | The syllabus does not specify one; the model should say so. | Pending |

The room and proposal date were checked directly against the syllabus on November 8, 2026. Verify the current source when running the experiment. Providing a whole document is context grounding; a full RAG system also retrieves relevant passages first.

## Personality and product discussion (slides 19, 22)

Optional Recipe mode keeps the three-bullet recipe instructions on the server. Switch back to Plain for the knowledge experiments. Instructions are not secrets or a guarantee of compliance.

My Smart Travel Packing Planner could send destination, trip length and weather data with the question and show packing suggestions. JavaScript should calculate quantities and validate the returned data before changing a packing list.

## Conversation memory (slide 24)

Prediction: keeping messages on screen alone does not create memory. Sending the earlier turns again should let the model recall a name.

1. New Chat → Plain → date tool off.
2. Send `My name is Alice.` then `What is my name?`.
3. Network → second ask → Payload should contain the first user message, its assistant reply, and the second user message.
4. Check the actual answer. Reload, ask again, and check that earlier turns were restored.

Observed answer / Payload evidence: **Pending live test.**

Code explanation: `messages` in ai-chat.html stores user and assistant turns. `localStorage` preserves them across reloads. `JSON.stringify({ messages: outgoing, ... })` resends them on every request. api/ask.js validates and copies the messages into input. The API cannot rely on the browser's display or JavaScript variables; it receives only what is included in a request.

## Date tool and agent discussion (slides 26, 28)

New Chat → enable get_today → ask `What is today's date? Use get_today.`

Prediction: the model requests the function, server code obtains the America/New_York date, sends a function_call_output, and calls the model again. Inspect Response → exercise.toolRuns for the tool result. Plain mode should not have this tool.

Observed tool run and final date: **Pending live test.**

With the tool disabled, this page is a chatbot that returns text. With get_today enabled, it can run a small bounded tool loop. An editor agent such as Copilot agent mode can choose file and command tools and repeat actions to complete a task; inspect its actual tool activity to confirm its level of autonomy.

## Build more (slide 29)

Selected option: **What it cost**. The page shows cost per answer and a running total for this page session. With a tool loop, exercise.totalCost sums all provider calls. Missing cost is shown as not reported, rather than assumed to be zero. A New Chat clears conversation history; reloading resets the page-session cost total.

Additional behavior: preserves the partial answer when status is incomplete, prevents duplicate submissions, uses textContent for safe rendering, keeps the model and output cap on the server, and explains failures. Markdown formatting was not selected as the extension option.

Observed per-answer and cumulative costs: **Pending live test.**

## Local validation

See tests/llm-api.test.mjs for mocked API checks. These validate the code path, not real OpenRouter compatibility, credits, deployment, or model accuracy. Final verification requires the live Vercel URL and real Network responses.
