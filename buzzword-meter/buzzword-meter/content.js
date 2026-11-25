// Highlights every buzzword on the page, counts occurrences, guesses the
// company name, and answers requests from the popup.
(function () {
  const HIGHLIGHT_CLASS = 'buzzword-meter-highlight';
  const SKIP_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'MARK'];

  let counts = {};
  let scanning = false;
  let observer = null;
  let debounceTimer = null;

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Longest words first so multi-word phrases match before short substrings.
  function buildRegex(words) {
    const escaped = [...new Set(words.map(w => w.toLowerCase().trim()))]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp);
    return escaped.length ? new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi') : null;
  }

  function removeHighlights() {
    document.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`).forEach(mark => {
      mark.replaceWith(document.createTextNode(mark.textContent));
    });
    document.body?.normalize();
  }

  function highlightNode(node, regex) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      if (!text || !text.trim()) return;
      regex.lastIndex = 0;
      if (!regex.test(text)) return;

      regex.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(text))) {
        if (match.index > lastIndex) frag.append(text.slice(lastIndex, match.index));
        const mark = document.createElement('mark');
        mark.className = HIGHLIGHT_CLASS;
        mark.textContent = match[0];
        frag.append(mark);
        const key = match[0].toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
        lastIndex = regex.lastIndex;
      }
      frag.append(text.slice(lastIndex));
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TAGS.includes(node.tagName)) return;
      if (node.classList?.contains(HIGHLIGHT_CLASS)) return;
      Array.from(node.childNodes).forEach(child => highlightNode(child, regex));
    }
  }

  // Best-effort guess: og:site_name meta tag, then schema.org JobPosting
  // JSON-LD, then the page title, then the hostname.
  function guessCompanyName() {
    const og = document.querySelector('meta[property="og:site_name"]')?.content?.trim();
    if (og) return og;

    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const org = item?.hiringOrganization?.name;
          if (org) return org;
        }
      } catch {
        // Not valid JSON-LD; ignore and keep looking.
      }
    }

    const title = document.title.split(/[-|–]/)[0]?.trim();
    return title || location.hostname;
  }

  async function getActiveWords() {
    const { customBuzzwords = [] } = await chrome.storage.sync.get('customBuzzwords');
    return [...DEFAULT_BUZZWORDS, ...customBuzzwords];
  }

  async function scanPage() {
    if (scanning) return;
    scanning = true;
    observer?.disconnect();

    removeHighlights();
    counts = {};
    const regex = buildRegex(await getActiveWords());
    if (regex && document.body) highlightNode(document.body, regex);

    scanning = false;
    if (document.body) {
      observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  function scheduleScan() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scanPage, 800);
  }

  function init() {
    scanPage();
    observer = new MutationObserver(() => {
      if (!scanning) scheduleScan();
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-scan immediately when the popup adds or removes a custom word.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.customBuzzwords) scanPage();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'BW_GET_RESULT') {
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      sendResponse({
        counts,
        total,
        company: guessCompanyName(),
        url: location.href,
        title: document.title
      });
    }
  });
})();
