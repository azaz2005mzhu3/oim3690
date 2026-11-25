const $ = id => document.getElementById(id);
const DEFAULT_INSTRUCTION = 'Explain this to a first-year student in two sentences:';
// This repo's own Ask AI page is already live here (see README.md); used as
// the default so the feature works before you set your own project URL.
const DEFAULT_API_BASE = 'https://oim3690-tau.vercel.app';

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Ask the content script on the active tab for its current highlight counts.
// Returns null on pages where the content script cannot run (chrome://, etc).
async function loadResult() {
  const tab = await activeTab();
  if (!tab?.id) return null;
  try {
    return await chrome.tabs.sendMessage(tab.id, { type: 'BW_GET_RESULT' });
  } catch {
    return null;
  }
}

function renderBanner(result) {
  $('bannerTotal').textContent = result?.total ?? 0;
  const counts = result?.counts ?? {};
  const words = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  $('breakdown').innerHTML = words.length
    ? ''
    : '<li class="muted">No buzzwords found on this page yet.</li>';
  for (const word of words) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${word}</span><strong>${counts[word]}</strong>`;
    $('breakdown').append(li);
  }
}

// Rank the companies: remember the score for every job posting visited.
async function saveCompanyScore(result) {
  if (!result?.total) return;
  const { companyScores = [] } = await chrome.storage.local.get('companyScores');
  const entry = { company: result.company, score: result.total, url: result.url, title: result.title, updated: Date.now() };
  const index = companyScores.findIndex(e => e.url === result.url);
  if (index >= 0) companyScores[index] = entry; else companyScores.push(entry);
  await chrome.storage.local.set({ companyScores });
}

async function renderRankings() {
  const { companyScores = [] } = await chrome.storage.local.get('companyScores');
  const sorted = [...companyScores].sort((a, b) => b.score - a.score);
  $('rankings').innerHTML = sorted.length
    ? ''
    : '<li class="muted">No companies scored yet. Browse a job posting.</li>';
  for (const entry of sorted) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${entry.url}" target="_blank" rel="noopener">${entry.company}</a><strong>${entry.score}</strong>`;
    $('rankings').append(li);
  }
}

$('clearRankings').addEventListener('click', async () => {
  await chrome.storage.local.remove('companyScores');
  await renderRankings();
});

async function refresh() {
  const result = await loadResult();
  renderBanner(result);
  if (result) await saveCompanyScore(result);
  await renderRankings();
}

// Your own words: stored in sync storage so content.js can merge them in.
async function renderCustomWords() {
  const { customBuzzwords = [] } = await chrome.storage.sync.get('customBuzzwords');
  $('customList').innerHTML = '';
  for (const word of customBuzzwords) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${word}</span><button type="button" class="remove" data-word="${word}">&times;</button>`;
    $('customList').append(li);
  }
}

$('addWordForm').addEventListener('submit', async e => {
  e.preventDefault();
  const input = $('newWord');
  const word = input.value.trim().toLowerCase();
  if (!word) return;
  const { customBuzzwords = [] } = await chrome.storage.sync.get('customBuzzwords');
  if (!customBuzzwords.includes(word)) {
    customBuzzwords.push(word);
    await chrome.storage.sync.set({ customBuzzwords });
  }
  input.value = '';
  await renderCustomWords();
  await refresh();
});

$('customList').addEventListener('click', async e => {
  const button = e.target.closest('button.remove');
  if (!button) return;
  const { customBuzzwords = [] } = await chrome.storage.sync.get('customBuzzwords');
  await chrome.storage.sync.set({ customBuzzwords: customBuzzwords.filter(w => w !== button.dataset.word) });
  await renderCustomWords();
  await refresh();
});

// Plain English settings: where to POST, and what to ask the model to do.
async function getSettings() {
  const { apiBase = DEFAULT_API_BASE, instruction = DEFAULT_INSTRUCTION } = await chrome.storage.sync.get(['apiBase', 'instruction']);
  return { apiBase, instruction };
}

$('settingsForm').addEventListener('submit', async e => {
  e.preventDefault();
  const apiBase = $('apiBase').value.trim().replace(/\/$/, '');
  const instruction = $('instruction').value.trim() || DEFAULT_INSTRUCTION;
  await chrome.storage.sync.set({ apiBase, instruction });
  $('settingsStatus').textContent = 'Saved.';
});

// "Ask About What You Selected": grab the page selection, POST it to
// /api/ask on the deployed Vercel project, and show the model's reply.
$('explainButton').addEventListener('click', async () => {
  const answerEl = $('answer');
  const selectionEl = $('selectedText');
  answerEl.textContent = '';
  selectionEl.textContent = 'Reading your selection…';

  const tab = await activeTab();
  let selection = '';
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });
    selection = (result || '').trim();
  } catch {
    selectionEl.textContent = 'Could not read the page selection here.';
    return;
  }

  if (!selection) {
    selectionEl.textContent = 'Select some text on the page first, then click Explain.';
    return;
  }
  selectionEl.textContent = selection;

  const { apiBase, instruction } = await getSettings();
  if (!apiBase) {
    answerEl.textContent = 'Set your Vercel project URL in Ask AI settings first.';
    return;
  }

  answerEl.textContent = 'Asking the model…';
  try {
    const response = await fetch(`${apiBase}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `${instruction}\n\n${selection}` }),
      signal: AbortSignal.timeout(45000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Request failed: ${response.status}`);
    const text = (data.output ?? [])
      .filter(item => item.type === 'message')
      .flatMap(item => item.content ?? [])
      .filter(part => part.type === 'output_text')
      .map(part => part.text)
      .join('\n');
    answerEl.textContent = text || 'No answer returned.';
  } catch (error) {
    answerEl.textContent = `Error: ${error.message}`;
  }
});

(async () => {
  const { apiBase, instruction } = await getSettings();
  $('apiBase').value = apiBase;
  $('instruction').value = instruction;
  await renderCustomWords();
  await refresh();
})();
