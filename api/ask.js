// Adapted from https://oim3690.github.io/downloads/ask.js.
// Vercel runs this on the server. Never send the key to the browser.
const MODEL = 'deepseek/deepseek-v4.1-flash-1017';
const json = (data, status = 200) => Response.json(data, { status });
export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: { message: 'Use POST.' } }, 405);
    let body;
    try {
      const raw = await request.text();
      if (raw.length > 80000) return json({ error: { message: 'Conversation too long. Start a New Chat.' } }, 413);
      body = JSON.parse(raw);
    } catch { return json({ error: { message: 'Invalid JSON.' } }, 400); }
    const messages = body?.messages ?? [{ role: 'user', content: body?.prompt }];
    if (!Array.isArray(messages) || !messages.length || messages.length > 100 ||
        messages.some(m => !m || !['user', 'assistant'].includes(m.role) ||
          typeof m.content !== 'string' || !m.content.trim()) || messages.at(-1).role !== 'user') {
      return json({ error: { message: 'Send a nonempty user message, or start a New Chat.' } }, 400);
    }
    if (!process.env.OPENROUTER_API_KEY) return json({ error: { message: 'Add OPENROUTER_API_KEY in Vercel Environment Variables, then redeploy.' } }, 503);
    // Copy allowed fields only; visitors cannot override the model or token cap.
    const payload = { model: MODEL, max_output_tokens: 1000, reasoning: { effort: 'none' },
      input: messages.map(({ role, content }) => ({ role, content })) };
    // Plain mode has no instructions or tools (slide 15).
    if (body.mode === 'recipe') payload.instructions = 'You are a recipe assistant. Always answer in exactly three short bullet points.';
    if (body.useDateTool === true) payload.tools = [{ type: 'function', name: 'get_today',
      description: 'Get today’s date in America/New_York.',
      parameters: { type: 'object', properties: {}, required: [], additionalProperties: false }, strict: true }];
    const toolRuns = [];
    let totalCost = 0, costKnown = true;
    try {
      // Bound the loop so a model cannot request unlimited paid calls.
      for (let turn = 0; turn < 4; turn++) {
        const response = await fetch('https://openrouter.ai/api/v1/responses', {
          method: 'POST', signal: AbortSignal.timeout(45000),
          headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) return json({ error: { message: `Provider request failed (${response.status}). Check the key, credits and model access.` } }, response.status);
        if (typeof data.usage?.cost === 'number') totalCost += data.usage.cost;
        else costKnown = false;
        const calls = (data.output ?? []).filter(item => item.type === 'function_call');
        if (!calls.length) return json({ ...data, exercise: { toolRuns, totalCost: costKnown ? totalCost : null } });
        if (!payload.tools) return json({ error: { message: 'Unexpected tool request.' } }, 502);
        payload.input.push(...data.output);
        for (const call of calls) {
          if (call.name !== 'get_today') return json({ error: { message: 'Unknown tool.' } }, 502);
          const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
          const result = { date, timezone: 'America/New_York' };
          toolRuns.push({ name: call.name, result });
          payload.input.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
        }
      }
      return json({ error: { message: 'Tool call limit reached. Try a simpler question.' } }, 502);
    } catch (error) {
      return json({ error: { message: error.name === 'TimeoutError' ? 'The model took too long. Please try again.' : 'Could not reach the model provider. Please try again.' } }, 502);
    }
  }
};
