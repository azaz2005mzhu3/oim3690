const MODEL = 'deepseek/deepseek-v4.1-flash-1017';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: { message: 'Use POST.' } });
  }

  const body = request.body;
  if (JSON.stringify(body ?? {}).length > 80000) {
    return response.status(413).json({
      error: { message: 'Conversation too long. Start a New Chat.' }
    });
  }

  const messages = body?.messages ?? [{ role: 'user', content: body?.prompt }];
  if (
    !Array.isArray(messages) ||
    !messages.length ||
    messages.length > 100 ||
    messages.some(
      message =>
        !message ||
        !['user', 'assistant'].includes(message.role) ||
        typeof message.content !== 'string' ||
        !message.content.trim()
    ) ||
    messages.at(-1).role !== 'user'
  ) {
    return response.status(400).json({
      error: { message: 'Send a nonempty user message, or start a New Chat.' }
    });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return response.status(503).json({
      error: {
        message:
          'Add OPENROUTER_API_KEY in Vercel Environment Variables, then redeploy.'
      }
    });
  }

  const payload = {
    model: MODEL,
    max_output_tokens: 1000,
    reasoning: { effort: 'none' },
    input: messages.map(({ role, content }) => ({ role, content }))
  };
  if (body.mode === 'recipe') {
    payload.instructions =
      'You are a recipe assistant. Always answer in exactly three short bullet points.';
  }
  if (body.useDateTool === true) {
    payload.tools = [
      {
        type: 'function',
        name: 'get_today',
        description: 'Get today’s date in America/New_York.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: false
        },
        strict: true
      }
    ];
  }

  const toolRuns = [];
  let totalCost = 0;
  let costKnown = true;

  try {
    for (let turn = 0; turn < 4; turn++) {
      const providerResponse = await fetch(
        'https://openrouter.ai/api/v1/responses',
        {
          method: 'POST',
          signal: AbortSignal.timeout(45000),
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      const data = await providerResponse.json();
      if (!providerResponse.ok) {
        return response.status(providerResponse.status).json({
          error: {
            message: `Provider request failed (${providerResponse.status}). Check the key, credits and model access.`
          }
        });
      }

      if (typeof data.usage?.cost === 'number') {
        totalCost += data.usage.cost;
      } else {
        costKnown = false;
      }

      const calls = (data.output ?? []).filter(
        item => item.type === 'function_call'
      );
      if (!calls.length) {
        return response.status(200).json({
          ...data,
          exercise: {
            toolRuns,
            totalCost: costKnown ? totalCost : null
          }
        });
      }
      if (!payload.tools) {
        return response
          .status(502)
          .json({ error: { message: 'Unexpected tool request.' } });
      }

      payload.input.push(...data.output);
      for (const call of calls) {
        if (call.name !== 'get_today') {
          return response
            .status(502)
            .json({ error: { message: 'Unknown tool.' } });
        }
        const date = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date());
        const result = { date, timezone: 'America/New_York' };
        toolRuns.push({ name: call.name, result });
        payload.input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result)
        });
      }
    }

    return response
      .status(502)
      .json({ error: { message: 'Tool call limit reached. Try a simpler question.' } });
  } catch (error) {
    const message =
      error.name === 'TimeoutError'
        ? 'The model took too long. Please try again.'
        : 'Could not reach the model provider. Please try again.';
    return response.status(502).json({ error: { message } });
  }
}
