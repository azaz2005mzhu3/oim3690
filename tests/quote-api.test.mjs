import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../api/quote.js', import.meta.url), 'utf8');
const { default: handler } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
const makeRequest = (url, method = 'GET') =>
  new Request(`https://example.test${url}`, { method });
const originalFetch = globalThis.fetch;
const originalKey = process.env.FINNHUB_API_KEY;

try {
  let response = await handler.fetch(makeRequest('/api/quote', 'POST'));
  assert.equal(response.status, 405);

  response = await handler.fetch(makeRequest('/api/quote'));
  assert.equal(response.status, 400);

  response = await handler.fetch(
    makeRequest('/api/quote?symbol=https%3A%2F%2Fexample.test')
  );
  assert.equal(response.status, 400);

  delete process.env.FINNHUB_API_KEY;
  response = await handler.fetch(makeRequest('/api/quote?symbol=AAPL'));
  assert.equal(response.status, 503);

  process.env.FINNHUB_API_KEY = 'test-placeholder';
  let requestedUrl;
  globalThis.fetch = async url => {
    requestedUrl = new URL(url);
    return Response.json({ c: 190.25, pc: 188.75 });
  };
  response = await handler.fetch(makeRequest('/api/quote?symbol=aapl'));
  assert.equal(response.status, 200);
  assert.equal(requestedUrl.searchParams.get('symbol'), 'AAPL');
  assert.equal(requestedUrl.searchParams.get('token'), 'test-placeholder');
  assert.deepEqual(await response.json(), { c: 190.25, pc: 188.75 });

  globalThis.fetch = async () => {
    throw new Error('network failure');
  };
  response = await handler.fetch(makeRequest('/api/quote?symbol=AAPL'));
  assert.equal(response.status, 502);

  console.log('PASS: method and symbol validation, server-only key, quote forwarding, network errors.');
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) {
    delete process.env.FINNHUB_API_KEY;
  } else {
    process.env.FINNHUB_API_KEY = originalKey;
  }
}
