const form = document.querySelector('#quote-form');
const symbolInput = document.querySelector('#symbol');
const result = document.querySelector('#quote-result');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async event => {
  event.preventDefault();
  const symbol = symbolInput.value.trim();
  if (!symbol) {
    result.textContent = 'Enter a stock symbol to continue.';
    symbolInput.focus();
    return;
  }

  submitButton.disabled = true;
  result.textContent = 'Loading quote...';

  try {
    const response = await fetch(
      `/api/quote?symbol=${encodeURIComponent(symbol)}`
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Request failed: ${response.status}`);
    }
    if (typeof data.c !== 'number' || typeof data.pc !== 'number' || data.c === 0) {
      throw new Error(`No quote was found for ${symbol.toUpperCase()}.`);
    }

    result.textContent =
      `${symbol.toUpperCase()}: $${data.c.toFixed(2)} ` +
      `(previous close $${data.pc.toFixed(2)})`;
  } catch (error) {
    result.textContent = error.message || 'Could not load the quote.';
  } finally {
    submitButton.disabled = false;
  }
});
