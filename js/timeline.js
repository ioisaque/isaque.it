export function initTimeline(eras) {
  const spine = document.getElementById('timeline-spine');
  const track = document.getElementById('timeline-track');
  const progress = document.getElementById('timeline-progress');
  const eraSections = document.querySelectorAll('.era');

  if (!track || !eras.length) return;

  track.innerHTML = eras
    .sort((a, b) => a.order - b.order)
    .map(
      (era) => `
    <button
      type="button"
      class="timeline-node"
      data-era="${era.id}"
      style="--node-color: ${era.color}"
      aria-label="${era.label}, ${era.years}"
    >
      <span class="timeline-node__dot"></span>
      <span class="timeline-node__label">${era.label}</span>
      <span class="timeline-node__years">${era.years}</span>
    </button>
  `
    )
    .join('');

  const nodes = track.querySelectorAll('.timeline-node');

  nodes.forEach((node) => {
    node.addEventListener('click', () => {
      const id = node.dataset.era;
      const section = document.getElementById(`era-${id}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('era-', '');
          nodes.forEach((n) => n.classList.toggle('is-active', n.dataset.era === id));
          updateProgress(eras, id, progress);
        }
      });
    },
    { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
  );

  eraSections.forEach((section) => observer.observe(section));

  if (spine) {
    const revealObserver = new IntersectionObserver(
      ([entry]) => {
        spine.classList.toggle('is-visible', entry.isIntersecting);
      },
      { threshold: 0 }
    );
    const hero = document.getElementById('hero');
    if (hero) revealObserver.observe(hero);
  }
}

function updateProgress(eras, activeId, progressEl) {
  if (!progressEl) return;
  const sorted = [...eras].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((e) => e.id === activeId);
  if (idx < 0) return;
  const pct = (idx / (sorted.length - 1)) * 100;
  const isVertical = window.matchMedia('(max-width: 768px)').matches;
  if (isVertical) {
    progressEl.style.width = '100%';
    progressEl.style.height = `${pct}%`;
  } else {
    progressEl.style.height = '100%';
    progressEl.style.width = `${pct}%`;
  }
}

export function renderEras(eras, projects, openModal) {
  const container = document.getElementById('eras');
  if (!container) return;

  container.innerHTML = eras
    .sort((a, b) => a.order - b.order)
    .map((era) => {
      const eraProjects = era.projects
        .map((slug) => projects.find((p) => p.slug === slug))
        .filter(Boolean);

      const chips = eraProjects
        .map(
          (p) =>
            `<button type="button" class="era__project-chip" data-slug="${p.slug}">${p.title}</button>`
        )
        .join('');

      return `
    <section
      class="era reveal"
      id="era-${era.id}"
      style="--era-color: ${era.color}"
      aria-labelledby="era-headline-${era.id}"
    >
      <div class="container era__inner">
        <div class="era__content">
          <div class="era__meta">
            <span class="era__badge">${era.label}</span>
            <span class="era__years">${era.years}</span>
          </div>
          <h2 class="era__headline" id="era-headline-${era.id}">${era.headline}</h2>
          <p class="era__story">${era.story}</p>
          <div class="era__projects">${chips}</div>
        </div>
        <div class="era__visual">
          <div class="era__visual-block">
            <span class="era__visual-order">0${era.order}</span>
            <img class="era__visual-icon" src="https://cdn.isaque.it/assets/icons/icon.svg" alt="" width="64" height="64">
            <span class="era__visual-label">${era.label}</span>
          </div>
        </div>
      </div>
    </section>
  `;
    })
    .join('');

  container.querySelectorAll('.era__project-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const slug = chip.dataset.slug;
      const project = projects.find((p) => p.slug === slug);
      if (project) openModal(project);
    });
  });

  initReveal(container.querySelectorAll('.era'));
}

function initReveal(elements) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  elements.forEach((el) => observer.observe(el));
}

export function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  toggle?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });

  document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      links?.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

export function initParallax() {
  const photoWrap = document.querySelector('.hero__photo-wrap');
  if (!photoWrap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      photoWrap.style.transform = `translateY(${y * 0.08}px)`;
    },
    { passive: true }
  );
}

export function initTheme() {
  const btn = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');

  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  }

  btn?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    let next;
    if (current === 'light') next = 'dark';
    else if (current === 'dark') next = 'light';
    else {
      next = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(btn, next);
  });

  if (btn) updateThemeIcon(btn, stored || 'auto');
}

function updateThemeIcon(btn, mode) {
  const isDark =
    mode === 'dark' ||
    (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  btn.innerHTML = isDark
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

export function initRevealAll() {
  const els = document.querySelectorAll('.reveal:not(.era)');
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
  els.forEach((el) => observer.observe(el));
}
