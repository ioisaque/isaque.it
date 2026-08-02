const CACHE_PREFIX = 'i18n-pt-';
const BATCH_SIZE = 8;

let enSnapshot = null;
let currentLang = 'en';

export function initI18n() {
  const enBtn = document.getElementById('lang-en');
  const ptBtn = document.getElementById('lang-pt');

  enBtn?.addEventListener('click', () => setLanguage('en'));
  ptBtn?.addEventListener('click', () => setLanguage('pt'));
}

export function applyStoredLanguage() {
  takeSnapshot();
  const stored = sessionStorage.getItem('portfolio-lang');
  if (stored === 'pt') setLanguage('pt');
}

function takeSnapshot() {
  enSnapshot = new Map();
  collectTextNodes(document.body).forEach(({ node, text }) => {
    enSnapshot.set(node, text);
  });
}

function collectTextNodes(root) {
  const result = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      const text = node.textContent.trim();
      if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
      if (/^[\d\s★—↗×·]+$/.test(text)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n;
  while ((n = walker.nextNode())) {
    result.push({ node: n, text: n.textContent });
  }
  return result;
}

async function setLanguage(lang) {
  if (lang === currentLang) return;
  currentLang = lang;

  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.getElementById('lang-en')?.classList.toggle('active', lang === 'en');
  document.getElementById('lang-pt')?.classList.toggle('active', lang === 'pt');
  document.getElementById('lang-en')?.setAttribute('aria-pressed', lang === 'en');
  document.getElementById('lang-pt')?.setAttribute('aria-pressed', lang === 'pt');
  sessionStorage.setItem('portfolio-lang', lang);

  if (lang === 'en') {
    restoreEnglish();
    return;
  }

  document.body.classList.add('is-translating');
  try {
    const nodes = collectTextNodes(document.body);
    const batches = chunk(nodes, BATCH_SIZE);

    for (const batch of batches) {
      await Promise.all(
        batch.map(async ({ node, text }) => {
          const trimmed = text.trim();
          const cached = getCache(trimmed);
          if (cached) {
            node.textContent = preserveWhitespace(text, cached);
            return;
          }
          const translated = await translateText(trimmed);
          if (translated) {
            setCache(trimmed, translated);
            node.textContent = preserveWhitespace(text, translated);
          }
        })
      );
    }
  } finally {
    document.body.classList.remove('is-translating');
  }
}

function preserveWhitespace(original, translated) {
  const lead = original.match(/^\s*/)[0];
  const trail = original.match(/\s*$/)[0];
  return lead + translated + trail;
}

async function translateText(text) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt-BR`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.responseStatus !== 200) return null;
    return data.responseData?.translatedText || null;
  } catch {
    return null;
  }
}

function restoreEnglish() {
  if (!enSnapshot) return;
  enSnapshot.forEach((text, node) => {
    if (node.isConnected) node.textContent = text;
  });
}

function getCache(text) {
  try {
    return sessionStorage.getItem(CACHE_PREFIX + hash(text));
  } catch {
    return null;
  }
}

function setCache(text, translated) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + hash(text), translated);
  } catch {
    /* ignore */
  }
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return String(h);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function refreshSnapshot() {
  takeSnapshot();
}
