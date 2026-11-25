// Buzzword Meter: counts corporate buzzwords on a Lever job posting page
// and shows the total in a banner at the top of the page.
(function () {
  // Words and phrases to look for (checked case-insensitively).
  const BUZZWORDS = [
    'synergy', 'synergize', 'synergies', 'rockstar', 'ninja', 'guru',
    'disruptive', 'disruptor', 'self-starter', 'go-getter', 'fast-paced',
    'wear many hats', 'detail-oriented', 'team player',
    'think outside the box', 'hit the ground running', 'dynamic',
    'passionate', 'results-driven', 'proactive', 'innovative',
    'cutting-edge', 'best-in-class', 'world-class', 'game-changer',
    'thought leader', 'value-add', 'bandwidth', 'low-hanging fruit',
    'circle back', 'leverage', 'scalable', 'growth mindset', 'culture fit',
    'unicorn', 'move the needle', 'mission-critical', 'bleeding-edge',
    'empower', 'holistic', 'ecosystem', 'seamless', 'agile'
  ];

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Longest phrases first so multi-word matches win over short substrings.
  function buildRegex(words) {
    const pattern = [...words]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join('|');
    return new RegExp(`\\b(${pattern})\\b`, 'gi');
  }

  function countBuzzwords(text, regex) {
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  function addBanner(total) {
    const banner = document.createElement('div');
    banner.id = 'buzzword-meter-banner';
    banner.textContent =
      `Buzzword Meter: ${total} buzzword${total === 1 ? '' : 's'} found in this posting`;
    document.body.prepend(banner);
  }

  const regex = buildRegex(BUZZWORDS);
  // Read and count the posting's text before the banner is ever added, so
  // the banner's own text can't be picked up by the count.
  const postingText = document.body.innerText || document.body.textContent || '';
  const total = countBuzzwords(postingText, regex);

  addBanner(total);
})();
