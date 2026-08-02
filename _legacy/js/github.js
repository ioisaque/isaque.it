const CACHE_PREFIX = 'gh-stars-';
const CACHE_TTL = 3600000;

export async function hydrateGitHubStars() {
  const els = document.querySelectorAll('.project-card__stars[data-repo]');

  for (const el of els) {
    const repo = el.dataset.repo;
    if (!repo) {
      el.style.display = 'none';
      continue;
    }

    const countEl = el.querySelector('.project-card__star-count');
    const cached = getCache(repo);
    if (cached !== null) {
      countEl.textContent = cached;
      continue;
    }

    try {
      const res = await fetch(`https://api.github.com/repos/ioisaque/${repo}`);
      if (!res.ok) {
        el.style.display = 'none';
        continue;
      }
      const data = await res.json();
      const stars = data.stargazers_count ?? 0;
      countEl.textContent = stars;
      setCache(repo, stars);
    } catch {
      el.style.display = 'none';
    }
  }
}

function getCache(repo) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + repo);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return value;
  } catch {
    return null;
  }
}

function setCache(repo, value) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + repo, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    /* ignore quota */
  }
}

export async function fetchGitHubProfile() {
  try {
    const res = await fetch('https://api.github.com/users/ioisaque');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
