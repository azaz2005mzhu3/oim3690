export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return Response.json(
        { error: { message: 'Use GET.' } },
        { status: 405 }
      );
    }

    const symbol = new URL(request.url).searchParams.get('symbol')?.trim();
    if (!symbol || !/^[A-Za-z0-9.:-]{1,30}$/.test(symbol)) {
      return Response.json(
        { error: { message: 'Enter a valid stock symbol.' } },
        { status: 400 }
      );
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: { message: 'FINNHUB_API_KEY is not configured on Vercel.' } },
        { status: 503 }
      );
    }

    const url = new URL('https://finnhub.io/api/v1/quote');
    url.searchParams.set('symbol', symbol.toUpperCase());
    url.searchParams.set('token', apiKey);

    try {
      const response = await fetch(url);
      const data = await response.json();
      return Response.json(data, { status: response.status });
    } catch {
      return Response.json(
        { error: { message: 'Could not reach Finnhub. Please try again.' } },
        { status: 502 }
      );
    }
  }
};
