import { fetchGitHubProfile, hydrateGitHubStars } from './github.js';
import { applyStoredLanguage, initI18n, refreshSnapshot } from './i18n.js';
import { loadData } from './main.js';
import { createModal, initRevealCards, renderFeaturedGrid } from './projects.js';
import {
    initNav,
    initParallax,
    initRevealAll,
    initTheme,
    initTimeline,
    renderEras,
} from './timeline.js';

async function boot() {
  initI18n();

  const { eras, projects } = await loadData();
  const modal = createModal();

  renderEras(eras, projects, (p) => modal.open(p));
  initTimeline(eras);
  renderFeaturedGrid(projects, eras, (p) => modal.open(p));

  refreshSnapshot();
  applyStoredLanguage();

  initNav();
  initTheme();
  initParallax();
  initRevealAll();

  await hydrateGitHubProfile();
  hydrateGitHubStars();
  initRevealCards();
}

async function hydrateGitHubProfile() {
  const profile = await fetchGitHubProfile();
  if (!profile) return;

  const reposEl = document.getElementById('stat-repos');
  if (reposEl) reposEl.textContent = profile.public_repos;

  const followersEl = document.getElementById('stat-followers');
  if (followersEl) followersEl.textContent = profile.followers;
}

boot();
