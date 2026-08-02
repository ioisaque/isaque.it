const LANG_CLASS_MAP = {
  TypeScript: 'typescript',
  JavaScript: 'javascript',
  PHP: 'php',
  Python: 'python',
  HTML: 'html',
};

export function renderFeaturedGrid(projects, eras, openModal) {
  const grid = document.getElementById('featured-grid');
  const filters = document.getElementById('era-filters');
  if (!grid) return;

  const featured = projects.filter((p) => p.featured);

  if (filters) {
    filters.innerHTML = `
      <button type="button" class="era-filter__btn is-active" data-era="all">All</button>
      ${eras
        .sort((a, b) => a.order - b.order)
        .map(
          (e) =>
            `<button type="button" class="era-filter__btn" data-era="${e.id}" style="--filter-color: ${e.color}">${e.label}</button>`
        )
        .join('')}
    `;

    filters.querySelectorAll('.era-filter__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        filters.querySelectorAll('.era-filter__btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const era = btn.dataset.era;
        grid.querySelectorAll('.project-card').forEach((card) => {
          card.hidden = era !== 'all' && card.dataset.era !== era;
        });
      });
    });
  }

  grid.innerHTML = featured.map((p) => cardHtml(p)).join('');

  grid.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', () => {
      const slug = card.dataset.slug;
      const project = projects.find((pr) => pr.slug === slug);
      if (project) openModal(project);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

function cardHtml(p) {
  const langKey = LANG_CLASS_MAP[p.language] || 'default';
  return `
    <article
      class="project-card reveal"
      data-slug="${p.slug}"
      data-era="${p.era}"
      tabindex="0"
      role="button"
      aria-label="View ${p.title}"
    >
      <div class="project-card__header">
        <div class="project-card__title-row">
          <img class="project-card__icon" src="${p.icon}" alt="" width="20" height="20">
          <h3 class="project-card__title">${p.title}</h3>
        </div>
        <span class="project-card__stars" data-repo="${repoName(p.repoUrl) || ''}">
          <svg viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.203-.612L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
          <span class="project-card__star-count">—</span>
        </span>
      </div>
      <p class="project-card__desc">${p.description}</p>
      <div class="project-card__footer">
        <span class="lang-pill">
          <span class="lang-pill__dot lang-pill__dot--${langKey}"></span>
          ${p.language || '—'}
        </span>
      </div>
    </article>
  `;
}

function repoName(url) {
  if (!url) return null;
  const m = url.match(/github\.com\/[^/]+\/([^/?#]+)/);
  return m ? m[1] : null;
}

export function createModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'project-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel">
      <button type="button" class="modal__close" data-close aria-label="Close">&times;</button>
      <h2 class="modal__title" id="modal-title"></h2>
      <p class="modal__desc" id="modal-desc"></p>
      <div class="modal__links" id="modal-links"></div>
      <div class="modal__tech" id="modal-tech"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  return {
    open(project) {
      modal.querySelector('#modal-title').textContent = project.title;
      modal.querySelector('#modal-desc').textContent = project.description;

      const links = modal.querySelector('#modal-links');
      links.innerHTML = '';
      if (project.liveUrl) {
        links.innerHTML += `<a class="btn btn--primary" href="${project.liveUrl}" target="_blank" rel="noopener">Live site ↗</a>`;
      }
      if (project.repoUrl) {
        links.innerHTML += `<a class="btn btn--ghost" href="${project.repoUrl}" target="_blank" rel="noopener">GitHub ↗</a>`;
      }

      const tech = modal.querySelector('#modal-tech');
      tech.innerHTML = (project.tech || [])
        .map((t) => `<span class="tech-tag">${t}</span>`)
        .join('');

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      modal.querySelector('.modal__close').focus();
    },
    close,
  };
}

export function initRevealCards() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll('.project-card.reveal').forEach((el) => observer.observe(el));
}
