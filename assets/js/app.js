let locale = 'en'
let copy = null
let projects = []
let catalog = []
let principles = []
let milestones = []
let catalogFilter = 'all'
let projectModal = null
let modalTrigger = null
let carouselIndex = 0

const ERA_ORDER = ['design', 'hardware', 'ideyou', 'teaching', 'platform']
const ERA_COLORS = {
  design: '#f5617f',
  hardware: '#ffd22b',
  ideyou: '#ff5356',
  teaching: '#9900cc',
  platform: '#0076f3',
}
const LIGHT_ACCENTS = new Set(['yellow', 'green', 'orange'])

function detectLocale() {
  const stored = localStorage.getItem('isaque-locale')
  if (stored === 'en' || stored === 'pt') return stored
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

function applyI18n() {
  const t = copy[locale]
  document.documentElement.lang = locale

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = getPath(t, el.dataset.i18n)
    if (typeof value === 'string') el.textContent = value
  })

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const value = getPath(t, el.dataset.i18nAria)
    if (typeof value === 'string') el.setAttribute('aria-label', value)
  })

  document.getElementById('lang-en')?.classList.toggle('is-active', locale === 'en')
  document.getElementById('lang-pt')?.classList.toggle('is-active', locale === 'pt')
  document.getElementById('lang-en')?.setAttribute('aria-pressed', String(locale === 'en'))
  document.getElementById('lang-pt')?.setAttribute('aria-pressed', String(locale === 'pt'))

  renderDomains()
  renderProjects()
  renderCatalog()
  renderPrinciples()
  renderMilestones()
  renderTech()
  initReveal()
  if (projectModal?.isOpen()) {
    const id = projectModal.currentId()
    if (id) projectModal.open(id, { skipHash: true })
  }
}

function renderDomains() {
  const root = document.getElementById('think-domains')
  if (!root) return
  const domains = copy[locale].think.domains
  root.innerHTML = `<ul>${domains.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
}

function caseHighlightsMarkup(project) {
  const items = Array.isArray(project.highlights) ? project.highlights : []
  if (!items.length) return ''
  return `
    <dl class="case__highlights reveal">
      ${items
        .map(
          (h) => `
        <div class="case__highlight">
          <dt>${escapeHtml(h.label[locale])}</dt>
          <dd>${escapeHtml(h.value[locale])}</dd>
        </div>`,
        )
        .join('')}
    </dl>
  `
}

function localizedSrc(src) {
  if (!src) return ''
  if (typeof src === 'string') return src
  return src[locale] || src.en || ''
}

function figureMediaMarkup(item, caption, opts = {}) {
  const src = localizedSrc(typeof item === 'string' ? item : item?.src)
  if (!src) return ''
  const alt =
    (item && item.alt?.[locale]) ||
    (item && item.alt?.en) ||
    (item && item.label?.[locale]) ||
    (item && item.label?.en) ||
    caption ||
    ''
  const isVideo = (item && item.type === 'video') || /\.mp4($|\?)/i.test(src)
  if (isVideo) {
    const posterSrc = localizedSrc(item?.poster)
    const poster = posterSrc ? ` poster="${escapeAttr(posterSrc)}"` : ''
    const autoplay = opts.autoplay ? ' autoplay' : ''
    const controls = opts.controls === false ? '' : ' controls'
    return `<video src="${escapeAttr(src)}"${poster}${autoplay}${controls} playsinline muted loop preload="metadata" aria-label="${escapeAttr(alt)}"></video>`
  }
  return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy">`
}

function mediaOpenAttrs(item, caption) {
  const src = localizedSrc(item?.src)
  if (!src) return ''
  const title = item.label?.[locale] || item.label?.en || ''
  const desc = item.alt?.[locale] || item.alt?.en || caption || ''
  const isVideo = item.type === 'video' || /\.mp4($|\?)/i.test(src)
  const poster = localizedSrc(item.poster)
  return [
    `data-media-open`,
    `data-media-src="${escapeAttr(src)}"`,
    `data-media-type="${isVideo ? 'video' : 'image'}"`,
    title ? `data-media-title="${escapeAttr(title)}"` : '',
    desc ? `data-media-desc="${escapeAttr(desc)}"` : '',
    poster ? `data-media-poster="${escapeAttr(poster)}"` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function chapterFigureMarkup(figure, className) {
  if (!figure) return ''
  const caption = figure.caption?.[locale] || figure.caption?.en || ''
  const mediaLabels = copy[locale]?.catalog?.modal || {}

  if (figure.type === 'compare' && Array.isArray(figure.items) && figure.items.length) {
    const parts = []
    const showArrow = figure.arrow !== false
    const screens = figure.variant === 'screens'
    const glue = figure.variant === 'glue'
    const expandLabel = mediaLabels.expandMedia || 'View larger'
    figure.items.forEach((item, index) => {
      const src = localizedSrc(item.src)
      if (!src) return
      const label = item.label?.[locale] || item.label?.en || ''
      const alt = item.alt?.[locale] || item.alt?.en || label || caption
      if (index > 0 && showArrow) {
        parts.push(`<span class="${className}-compare-arrow" aria-hidden="true">→</span>`)
      }
      const openAttrs = mediaOpenAttrs(item, caption)
      parts.push(`
          <div class="${className}-pair">
            ${label ? `<p class="${className}-pair-label">${escapeHtml(label)}</p>` : ''}
            <button type="button" class="${className}-pair-frame" ${openAttrs} aria-label="${escapeAttr((label ? label + '. ' : '') + expandLabel)}">
              <img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy">
            </button>
          </div>`)
    })
    if (!parts.length) return ''
    const modifiers = [`${className}--compare`]
    if (screens) modifiers.push(`${className}--screens`)
    if (glue) modifiers.push(`${className}--glue`)
    if (!showArrow) modifiers.push(`${className}--no-arrow`)
    return `
      <figure class="${className} ${modifiers.join(' ')}">
        <div class="${className}-pairs"${glue || !showArrow ? ' data-media-group' : ''}>${parts.join('')}</div>
        ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
      </figure>
    `
  }

  if (figure.type === 'carousel' && Array.isArray(figure.items) && figure.items.length) {
    const slides = figure.items
      .map((item, i) => {
        const src = localizedSrc(item.src)
        if (!src) return ''
        const label = item.label?.[locale] || item.label?.en || ''
        const desc = item.alt?.[locale] || item.alt?.en || ''
        const media = figureMediaMarkup(item, caption, { autoplay: false, controls: false })
        const expandLabel = mediaLabels.expandMedia || 'View larger'
        const fitCover = item.fit === 'cover'
        return `
          <button type="button" class="${className}-slide${i === 0 ? ' is-active' : ''}" data-slide="${i}"${i === 0 ? '' : ' hidden'} ${mediaOpenAttrs(item, caption)} aria-label="${escapeAttr((label ? label + '. ' : '') + expandLabel)}">
            <span class="${className}-slide-media${fitCover ? ` ${className}-slide-media--cover` : ''}">${media}</span>
            ${
              label || desc
                ? `<span class="${className}-slide-copy">
              ${label ? `<span class="${className}-slide-title">${escapeHtml(label)}</span>` : ''}
              ${desc ? `<span class="${className}-slide-desc">${escapeHtml(desc)}</span>` : ''}
            </span>`
                : ''
            }
          </button>`
      })
      .filter(Boolean)
      .join('')
    if (!slides) return ''
    const controls =
      figure.items.length > 1
        ? `
      <div class="${className}-controls">
        <button type="button" class="${className}-nav ${className}-nav--prev" data-chapter-carousel="prev" aria-label="${escapeAttr(mediaLabels.mediaPrev || 'Previous')}">‹</button>
        <p class="${className}-status" data-chapter-carousel-status>1 / ${figure.items.length}</p>
        <button type="button" class="${className}-nav ${className}-nav--next" data-chapter-carousel="next" aria-label="${escapeAttr(mediaLabels.mediaNext || 'Next')}">›</button>
      </div>
      <div class="${className}-dots" role="tablist">
        ${figure.items
          .map((item, i) => {
            const label = item.label?.[locale] || item.label?.en || String(i + 1)
            return `<button type="button" class="${className}-dot${i === 0 ? ' is-active' : ''}" data-chapter-carousel-dot="${i}" aria-label="${escapeAttr(label)}"></button>`
          })
          .join('')}
      </div>`
        : ''
    return `
      <figure class="${className} ${className}--carousel" data-chapter-carousel-root>
        <div class="${className}-viewport">${slides}</div>
        ${controls}
        ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
      </figure>
    `
  }

  const src = localizedSrc(figure.src)
  if (!src) return ''
  const isDiagram = figure.type === 'diagram' || /\.svg$/i.test(src)
  const isTall = figure.type === 'receipt' || /comanda/i.test(src)
  const isPhoto = figure.type === 'photo' || (figure.type === 'image' && !/\.svg$/i.test(src))
  const isVideo = figure.type === 'video' || /\.mp4($|\?)/i.test(src)
  const mods = [
    isDiagram ? `${className}--diagram` : '',
    isTall ? `${className}--tall` : '',
    isPhoto || isVideo ? `${className}--photo` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const canOpen = !isDiagram || isPhoto || isVideo || /\.(png|jpe?g|webp|gif|mp4)($|\?)/i.test(src)
  const openAttrs = canOpen
    ? mediaOpenAttrs(
        {
          src: figure.src,
          type: isVideo ? 'video' : 'image',
          poster: figure.poster,
          label: figure.label || {},
          alt: figure.alt || figure.caption || {},
        },
        caption,
      )
    : ''
  const media = figureMediaMarkup(figure, caption, {
    autoplay: isVideo,
    controls: false,
  })
  const expandLabel = mediaLabels.expandMedia || 'View larger'
  const fitCover = figure.fit === 'cover'
  const cardClass = `${className}-photo-card${fitCover ? ` ${className}-photo-card--cover` : ''}`
  return `
    <figure class="${className}${mods ? ` ${mods}` : ''}">
      ${
        openAttrs
          ? `<button type="button" class="${cardClass}" ${openAttrs} aria-label="${escapeAttr(expandLabel)}">${media}</button>`
          : isPhoto || isVideo
            ? `<div class="${cardClass}">${media}</div>`
            : media
      }
      ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
    </figure>
  `
}

function bindChapterCarousels(root = document) {
  root.querySelectorAll('[data-chapter-carousel-root]').forEach((el) => {
    if (el.dataset.bound === '1') return
    el.dataset.bound = '1'

    const slides = [...el.querySelectorAll('[data-slide]')]
    const dots = [...el.querySelectorAll('[data-chapter-carousel-dot]')]
    const status = el.querySelector('[data-chapter-carousel-status]')
    if (!slides.length) return

    let index = 0
    const syncVideos = () => {
      slides.forEach((slide, i) => {
        slide.querySelectorAll('video').forEach((video) => {
          if (i === index) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
      })
    }
    const show = (next) => {
      index = ((next % slides.length) + slides.length) % slides.length
      slides.forEach((slide, i) => {
        const on = i === index
        slide.classList.toggle('is-active', on)
        if (on) slide.removeAttribute('hidden')
        else slide.setAttribute('hidden', '')
      })
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index)
        dot.setAttribute('aria-selected', String(i === index))
      })
      if (status) status.textContent = `${index + 1} / ${slides.length}`
      syncVideos()
    }

    if (slides.length < 2) {
      syncVideos()
      return
    }

    el.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-chapter-carousel]')
      const dot = e.target.closest('[data-chapter-carousel-dot]')
      if (nav && el.contains(nav)) {
        e.preventDefault()
        e.stopPropagation()
        show(nav.dataset.chapterCarousel === 'prev' ? index - 1 : index + 1)
        return
      }
      if (dot && el.contains(dot)) {
        e.preventDefault()
        e.stopPropagation()
        show(Number(dot.dataset.chapterCarouselDot) || 0)
      }
    })

    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        show(index - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        show(index + 1)
      }
    })

    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0')
    syncVideos()
  })
}

function mediaItemFromEl(el) {
  return {
    src: el.dataset.mediaSrc || '',
    type: el.dataset.mediaType || 'image',
    poster: el.dataset.mediaPoster || '',
    title: el.dataset.mediaTitle || '',
    desc: el.dataset.mediaDesc || '',
  }
}

function createMediaLightbox() {
  let root = document.getElementById('media-lightbox')
  if (!root) {
    root = document.createElement('div')
    root.id = 'media-lightbox'
    root.className = 'media-lightbox'
    root.setAttribute('aria-hidden', 'true')
    root.innerHTML = `
      <div class="media-lightbox__backdrop" data-media-lightbox-close tabindex="-1"></div>
      <div class="media-lightbox__dialog" role="dialog" aria-modal="true" aria-labelledby="media-lightbox-title">
        <button type="button" class="media-lightbox__close" data-media-lightbox-close aria-label="Close">×</button>
        <button type="button" class="media-lightbox__nav media-lightbox__nav--prev" data-media-lightbox-nav="prev" aria-label="Previous">‹</button>
        <button type="button" class="media-lightbox__nav media-lightbox__nav--next" data-media-lightbox-nav="next" aria-label="Next">›</button>
        <div class="media-lightbox__stage" data-media-lightbox-stage></div>
        <div class="media-lightbox__meta">
          <h3 class="media-lightbox__title" id="media-lightbox-title" data-media-lightbox-title></h3>
          <p class="media-lightbox__desc" data-media-lightbox-desc></p>
        </div>
      </div>
    `
    document.body.appendChild(root)
  }

  const stage = root.querySelector('[data-media-lightbox-stage]')
  const titleEl = root.querySelector('[data-media-lightbox-title]')
  const descEl = root.querySelector('[data-media-lightbox-desc]')
  const prevBtn = root.querySelector('[data-media-lightbox-nav="prev"]')
  const nextBtn = root.querySelector('[data-media-lightbox-nav="next"]')
  const closeBtn = root.querySelector('.media-lightbox__close')

  let items = []
  let index = 0
  let lastFocus = null

  const labels = () => copy[locale]?.catalog?.modal || {}

  const render = () => {
    const item = items[index]
    if (!item) return
    const isVideo = item.type === 'video'
    stage.innerHTML = isVideo
      ? `<video src="${escapeAttr(item.src)}"${item.poster ? ` poster="${escapeAttr(item.poster)}"` : ''} controls playsinline autoplay></video>`
      : `<img src="${escapeAttr(item.src)}" alt="${escapeAttr(item.title || item.desc || '')}">`
    titleEl.textContent = item.title || ''
    titleEl.hidden = !item.title
    descEl.textContent = item.desc || ''
    descEl.hidden = !item.desc
    const multi = items.length > 1
    prevBtn.hidden = !multi
    nextBtn.hidden = !multi
    closeBtn.setAttribute('aria-label', labels().close || 'Close')
    prevBtn.setAttribute('aria-label', labels().mediaPrev || 'Previous')
    nextBtn.setAttribute('aria-label', labels().mediaNext || 'Next')
  }

  const close = () => {
    if (!root.classList.contains('is-open')) return
    stage.querySelectorAll('video').forEach((v) => {
      v.pause()
      v.removeAttribute('src')
      v.load()
    })
    root.classList.remove('is-open')
    root.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
    items = []
    if (lastFocus?.focus) lastFocus.focus()
    lastFocus = null
  }

  const show = (next) => {
    if (!items.length) return
    index = ((next % items.length) + items.length) % items.length
    render()
  }

  const open = (nextItems, start = 0) => {
    items = (nextItems || []).filter((item) => item.src)
    if (!items.length) return
    lastFocus = document.activeElement
    index = Math.max(0, Math.min(start, items.length - 1))
    root.classList.add('is-open')
    root.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    render()
    closeBtn.focus()
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-media-lightbox-close]')) {
      e.preventDefault()
      close()
      return
    }
    const nav = e.target.closest('[data-media-lightbox-nav]')
    if (nav) {
      e.preventDefault()
      show(nav.dataset.mediaLightboxNav === 'prev' ? index - 1 : index + 1)
    }
  })

  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('is-open')) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      show(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      show(index + 1)
    }
  })

  return { open, close }
}

let mediaLightbox = null

function bindMediaLightbox() {
  if (mediaLightbox) return mediaLightbox
  mediaLightbox = createMediaLightbox()
  document.addEventListener('click', (e) => {
    const openEl = e.target.closest('[data-media-open]')
    if (!openEl) return
    if (e.target.closest('[data-chapter-carousel], [data-chapter-carousel-dot]')) return
    e.preventDefault()
    const carousel = openEl.closest('[data-chapter-carousel-root]')
    if (carousel) {
      const slides = [...carousel.querySelectorAll('[data-media-open]')]
      mediaLightbox.open(
        slides.map(mediaItemFromEl),
        Math.max(0, slides.indexOf(openEl)),
      )
      return
    }
    const group = openEl.closest('[data-media-group]')
    if (group) {
      const slides = [...group.querySelectorAll('[data-media-open]')]
      mediaLightbox.open(
        slides.map(mediaItemFromEl),
        Math.max(0, slides.indexOf(openEl)),
      )
      return
    }
    mediaLightbox.open([mediaItemFromEl(openEl)], 0)
  })
  return mediaLightbox
}

function chapterStepsMarkup(steps, className) {
  if (!Array.isArray(steps) || !steps.length) return ''
  const figureClass = className.includes('modal') ? 'modal__chapter-figure' : 'case__chapter-figure'
  const stepClass = className.includes('modal') ? 'modal__chapter-step' : 'case__chapter-step'
  return `
    <ol class="${className}-steps">
      ${steps
        .map(
          (step) => `
        <li class="${stepClass}">
          <h5>${escapeHtml(step.title?.[locale] || step.title?.en || '')}</h5>
          <p>${escapeHtml(step.body?.[locale] || step.body?.en || '')}</p>
          ${chapterFigureMarkup(step.figure, figureClass)}
        </li>`,
        )
        .join('')}
    </ol>
  `
}

function caseChaptersMarkup(project, labels) {
  const chapters = Array.isArray(project.chapters) ? project.chapters : []
  if (!chapters.length) return ''
  return `
    <div class="case__chapters">
      <p class="case__chapters-label reveal">${escapeHtml(labels.chapters || 'The story')}</p>
      <ol class="case__chapter-list">
        ${chapters
          .map(
            (ch) => `
          <li class="case__chapter reveal">
            <h4>${escapeHtml(ch.title[locale])}</h4>
            <p>${escapeHtml(ch.body[locale])}</p>
            ${chapterFigureMarkup(ch.figure, 'case__chapter-figure')}
            ${chapterStepsMarkup(ch.steps, 'case__chapter')}
          </li>`,
          )
          .join('')}
      </ol>
    </div>
  `
}

function caseGalleryMarkup(project, labels) {
  const media = Array.isArray(project.media) ? project.media : []
  // Skip a single leftover — looks like a broken empty strip
  if (media.length < 2) return ''
  return `
    <div class="case__gallery reveal">
      <p class="case__gallery-label">${escapeHtml(labels.gallery || 'Evidence')}</p>
      <div class="case__gallery-track" role="list">
        ${media
          .map((entry) => {
            const alt = entry.alt?.[locale] || entry.alt?.en || ''
            const src = localizedSrc(entry.src)
            if (entry.type === 'video') {
              return `<div class="case__gallery-item" role="listitem">${mediaMarkup(entry)}</div>`
            }
            const diagram = entry.type === 'diagram' || /\.svg$/i.test(src)
            return `<figure class="case__gallery-item${diagram ? ' case__gallery-item--diagram' : ''}" role="listitem"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy"></figure>`
          })
          .join('')}
      </div>
    </div>
  `
}

function renderProjects() {
  const root = document.getElementById('work-cases')
  if (!root) return
  const labels = copy[locale].work.labels
  const total = String(projects.length).padStart(2, '0')

  root.innerHTML = projects
    .map((project, index) => {
      const n = String(index + 1).padStart(2, '0')
      const isCube = project.id === 'cube'
      const isDeep = Boolean(project.chapters?.length || project.highlights?.length)
      const links = []
      if (project.links?.live) {
        links.push(
          `<a class="btn btn--ghost" href="${escapeAttr(project.links.live)}" target="_blank" rel="noopener noreferrer">${escapeHtml(labels.live)}</a>`,
        )
      }
      if (project.links?.repo) {
        links.push(
          `<a class="btn btn--text" href="${escapeAttr(project.links.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(labels.repo)}</a>`,
        )
      }
      if (project.links?.docs) {
        const docsLabel = copy[locale].catalog.docs || 'PDF'
        links.push(
          `<a class="btn btn--text" href="${escapeAttr(project.links.docs)}" target="_blank" rel="noopener noreferrer">${escapeHtml(docsLabel)}</a>`,
        )
      }

      const embed = isCube
        ? `<div class="rubik-embed" aria-hidden="true">
            <div class="rubik-stage" id="rubik-stage" data-cube-mount></div>
          </div>`
        : ''

      return `
        <article class="case case--${escapeAttr(project.accent)}${isCube ? ' case--cube' : ''}${isDeep ? ' case--deep' : ''}" id="case-${escapeAttr(project.id)}">
          ${embed}
          <div class="container case__inner">
            <header class="case__intro reveal">
              <span class="case__accent bg-accent-${escapeAttr(project.accent)}" aria-hidden="true"></span>
              <p class="case__index">${n} / ${total}</p>
              <h3 class="case__title">${escapeHtml(project.title[locale])}</h3>
              <p class="case__subtitle">${escapeHtml(project.subtitle[locale])}</p>
            </header>
            <div class="case__grid">
              <article class="case__block reveal"><h4>${escapeHtml(labels.problem)}</h4><p>${escapeHtml(project.problem[locale])}</p></article>
              <article class="case__block reveal"><h4>${escapeHtml(labels.difficulty)}</h4><p>${escapeHtml(project.difficulty[locale])}</p></article>
              <article class="case__block reveal"><h4>${escapeHtml(labels.simplification)}</h4><p>${escapeHtml(project.simplification[locale])}</p></article>
              <article class="case__block reveal"><h4>${escapeHtml(labels.change)}</h4><p>${escapeHtml(project.change[locale])}</p></article>
            </div>
            ${caseHighlightsMarkup(project)}
            ${caseGalleryMarkup(project, labels)}
            ${caseChaptersMarkup(project, labels)}
            ${links.length ? `<div class="case__links reveal">${links.join('')}</div>` : ''}
          </div>
        </article>
      `
    })
    .join('')

  bindChapterCarousels(root)
  mountRubik()
}

function monogram(title) {
  const parts = String(title)
    .replace(/[^a-zA-Z0-9.\s+-]/g, ' ')
    .trim()
    .split(/[\s.]+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function catalogById(id) {
  return catalog.find((item) => item.id === id)
}

function caseById(id) {
  return projects.find((item) => item.id === id)
}

function mergeMedia(item, study) {
  const fromItem = Array.isArray(item.media) ? item.media : []
  const fromStudy = Array.isArray(study?.media) ? study.media : []
  return [...fromItem, ...fromStudy]
}

function mediaMarkup(entry) {
  if (!entry) return ''
  const alt = entry.alt?.[locale] || entry.alt?.en || ''
  const src = localizedSrc(entry.src)
  if (entry.type === 'video') {
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(src)) {
      return `<iframe src="${escapeAttr(src)}" title="${escapeAttr(alt || 'Video')}" allowfullscreen loading="lazy"></iframe>`
    }
    return `<video src="${escapeAttr(src)}" controls playsinline></video>`
  }
  const diagram = entry.type === 'diagram' || /\.svg$/i.test(src)
  return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy"${diagram ? ' class="is-diagram"' : ''}>`
}

function createProjectModal() {
  const root = document.getElementById('project-modal')
  const body = document.getElementById('modal-body')
  if (!root || !body) return null

  let openId = null

  const close = ({ skipHash } = {}) => {
    if (!root.classList.contains('is-open')) return
    root.classList.remove('is-open', 'modal--case')
    root.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
    openId = null
    if (!skipHash && location.hash.startsWith('#project-')) {
      history.replaceState(null, '', `${location.pathname}${location.search}`)
    }
    if (modalTrigger?.focus) modalTrigger.focus()
    modalTrigger = null
  }

  const renderCarousel = (media, labels) => {
    if (!media.length) return ''
    carouselIndex = Math.min(carouselIndex, media.length - 1)
    const current = media[carouselIndex]
    const nav =
      media.length > 1
        ? `
      <button type="button" class="modal__carousel-nav modal__carousel-nav--prev" data-carousel="prev" aria-label="${escapeAttr(labels.modal.mediaPrev)}">‹</button>
      <button type="button" class="modal__carousel-nav modal__carousel-nav--next" data-carousel="next" aria-label="${escapeAttr(labels.modal.mediaNext)}">›</button>
      <div class="modal__carousel-dots">
        ${media
          .map(
            (_, i) =>
              `<button type="button" class="modal__carousel-dot${i === carouselIndex ? ' is-active' : ''}" data-carousel-dot="${i}" aria-label="${i + 1}"></button>`,
          )
          .join('')}
      </div>`
        : ''

    return `
      <div class="modal__media modal__carousel">
        <div class="modal__media-frame" data-carousel-frame>${mediaMarkup(current)}</div>
        ${nav}
      </div>
    `
  }

  const paint = (item) => {
    const labels = copy[locale].catalog
    const workLabels = copy[locale].work.labels
    const study = item.caseId ? caseById(item.caseId) : null
    const isCase = Boolean(study)
    const media = mergeMedia(item, study)
    const title = item.title[locale]
    const summary = item.summary[locale]
    const detail = item.detail?.[locale]

    root.classList.toggle('modal--case', isCase)

    const links = []
    if (item.links?.live) {
      const liveLabel = item.linkLabels?.live?.[locale] || labels.liveSite || labels.live
      links.push(
        `<a class="btn btn--primary" href="${escapeAttr(item.links.live)}" target="_blank" rel="noopener noreferrer">${escapeHtml(liveLabel)} <span aria-hidden="true">↗</span></a>`,
      )
    }
    if (item.links?.repo) {
      const repoLabel = item.linkLabels?.repo?.[locale] || labels.repo
      links.push(
        `<a class="btn btn--ghost" href="${escapeAttr(item.links.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repoLabel)} <span aria-hidden="true">↗</span></a>`,
      )
    }
    if (item.links?.docs) {
      const docsLabel = item.linkLabels?.docs?.[locale] || labels.docs || 'PDF'
      links.push(
        `<a class="btn btn--ghost" href="${escapeAttr(item.links.docs)}" target="_blank" rel="noopener noreferrer">${escapeHtml(docsLabel)} <span aria-hidden="true">↗</span></a>`,
      )
    }
    if (study?.links?.live && study.links.live !== item.links?.live) {
      links.push(
        `<a class="btn btn--ghost" href="${escapeAttr(study.links.live)}" target="_blank" rel="noopener noreferrer">${escapeHtml(workLabels.live)} <span aria-hidden="true">↗</span></a>`,
      )
    }
    if (study?.links?.repo && study.links.repo !== item.links?.repo) {
      links.push(
        `<a class="btn btn--ghost" href="${escapeAttr(study.links.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(workLabels.repo)} <span aria-hidden="true">↗</span></a>`,
      )
    }
    if (study?.links?.docs && study.links.docs !== item.links?.docs) {
      const docsLabel = labels.docs || 'PDF'
      links.push(
        `<a class="btn btn--ghost" href="${escapeAttr(study.links.docs)}" target="_blank" rel="noopener noreferrer">${escapeHtml(docsLabel)} <span aria-hidden="true">↗</span></a>`,
      )
    }

    const tech = (item.tech || []).map((t) => `<li>${escapeHtml(t)}</li>`).join('')

    const highlights =
      isCase && Array.isArray(study.highlights) && study.highlights.length
        ? `
      <dl class="modal__highlights">
        ${study.highlights
          .map(
            (h) => `
          <div class="modal__highlight">
            <dt>${escapeHtml(h.label[locale])}</dt>
            <dd>${escapeHtml(h.value[locale])}</dd>
          </div>`,
          )
          .join('')}
      </dl>`
        : ''

    const chapters =
      isCase && Array.isArray(study.chapters) && study.chapters.length
        ? `
      <div class="modal__chapters">
        <p class="modal__section-label">${escapeHtml(labels.modal.chapters || workLabels.chapters || 'The story')}</p>
        <ol class="modal__chapter-list">
          ${study.chapters
            .map(
              (ch) => `
            <li class="modal__chapter">
              <h4>${escapeHtml(ch.title[locale])}</h4>
              <p>${escapeHtml(ch.body[locale])}</p>
              ${chapterFigureMarkup(ch.figure, 'modal__chapter-figure')}
              ${chapterStepsMarkup(ch.steps, 'modal__chapter')}
            </li>`,
            )
            .join('')}
        </ol>
      </div>`
        : ''

    const caseBlocks = isCase
      ? `
      <div class="modal__case-grid">
        <article class="modal__case-block"><h4>${escapeHtml(workLabels.problem)}</h4><p>${escapeHtml(study.problem[locale])}</p></article>
        <article class="modal__case-block"><h4>${escapeHtml(workLabels.difficulty)}</h4><p>${escapeHtml(study.difficulty[locale])}</p></article>
        <article class="modal__case-block"><h4>${escapeHtml(workLabels.simplification)}</h4><p>${escapeHtml(study.simplification[locale])}</p></article>
        <article class="modal__case-block"><h4>${escapeHtml(workLabels.change)}</h4><p>${escapeHtml(study.change[locale])}</p></article>
      </div>`
      : ''

    body.innerHTML = `
      <h2 class="modal__title" id="modal-title">${escapeHtml(title)}</h2>
      <p class="modal__desc">${escapeHtml(summary)}</p>
      ${detail ? `<p class="modal__detail">${escapeHtml(detail)}</p>` : ''}
      ${caseBlocks}
      ${highlights}
      ${renderCarousel(media, labels)}
      ${chapters}
      ${links.length ? `<div class="modal__links">${links.join('')}</div>` : ''}
      ${
        tech
          ? `<p class="modal__tech-label">${escapeHtml(labels.modal.tech)}</p><ul class="modal__tech">${tech}</ul>`
          : ''
      }
    `

    body.querySelectorAll('[data-carousel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.carousel === 'prev') {
          carouselIndex = (carouselIndex - 1 + media.length) % media.length
        } else {
          carouselIndex = (carouselIndex + 1) % media.length
        }
        paint(item)
      })
    })
    body.querySelectorAll('[data-carousel-dot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        carouselIndex = Number(btn.dataset.carouselDot) || 0
        paint(item)
      })
    })
    bindChapterCarousels(body)
  }

  const open = (id, { skipHash, trigger } = {}) => {
    const item = catalogById(id)
    if (!item) return
    if (trigger) modalTrigger = trigger
    openId = id
    carouselIndex = 0
    paint(item)
    root.classList.add('is-open')
    root.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    root.querySelector('.modal__close')?.focus()
    if (!skipHash) {
      const next = `#project-${id}`
      if (location.hash !== next) history.replaceState(null, '', next)
    }
  }

  root.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => close())
  })

  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('is-open')) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const item = catalogById(openId)
      if (!item) return
      const media = mergeMedia(item, item.caseId ? caseById(item.caseId) : null)
      if (media.length < 2) return
      carouselIndex =
        e.key === 'ArrowLeft'
          ? (carouselIndex - 1 + media.length) % media.length
          : (carouselIndex + 1) % media.length
      paint(item)
    }
  })

  return {
    open,
    close,
    isOpen: () => root.classList.contains('is-open'),
    currentId: () => openId,
  }
}

function openProjectFromHash() {
  const match = location.hash.match(/^#project-(.+)$/)
  if (!match) return
  projectModal?.open(match[1], { skipHash: true })
}

function renderCatalog() {
  const filtersRoot = document.getElementById('catalog-filters')
  const grid = document.getElementById('catalog-grid')
  if (!filtersRoot || !grid) return

  const labels = copy[locale].catalog
  const filterKeys = ['all', ...ERA_ORDER]

  filtersRoot.innerHTML = filterKeys
    .map((key) => {
      const active = catalogFilter === key ? ' is-active' : ''
      const color = key === 'all' ? 'var(--ink)' : ERA_COLORS[key]
      return `<button type="button" class="catalog__filter${active}" data-era="${escapeAttr(key)}" style="--filter-color:${color}">${escapeHtml(labels.filters[key])}</button>`
    })
    .join('')

  filtersRoot.querySelectorAll('.catalog__filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      catalogFilter = btn.dataset.era || 'all'
      renderCatalog()
      initReveal()
    })
  })

  const ordered = [
    ...catalog.filter((item) => !item.pinnedEnd),
    ...catalog.filter((item) => item.pinnedEnd),
  ]

  grid.innerHTML = ordered
    .map((item) => {
      const title = item.title[locale]
      const pinned = Boolean(item.pinnedEnd)
      const hidden = !pinned && catalogFilter !== 'all' && item.era !== catalogFilter
      const monoLight = !LIGHT_ACCENTS.has(item.accent) ? ' is-light' : ''
      const badge = item.caseId
        ? `<button type="button" class="catalog-card__badge" data-open-project="${escapeAttr(item.id)}">${escapeHtml(labels.caseStudy)}</button>`
        : ''

      const links = []
      if (item.caseId) {
        links.push(
          `<button type="button" data-open-project="${escapeAttr(item.id)}">${escapeHtml(labels.viewCase)}</button>`,
        )
      }
      if (item.links?.live) {
        const liveLabel = item.linkLabels?.live?.[locale] || labels.live
        links.push(
          `<a href="${escapeAttr(item.links.live)}" target="_blank" rel="noopener noreferrer">${escapeHtml(liveLabel)}</a>`,
        )
      }
      if (item.links?.repo) {
        const repoLabel = item.linkLabels?.repo?.[locale] || labels.repo
        links.push(
          `<a href="${escapeAttr(item.links.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repoLabel)}</a>`,
        )
      }

      return `
        <article class="catalog-card reveal${pinned ? ' catalog-card--classified' : ''}" id="catalog-${escapeAttr(item.id)}" data-era="${escapeAttr(item.era)}" data-project-id="${escapeAttr(item.id)}" tabindex="0" role="button" aria-label="${escapeAttr(title)}"${hidden ? ' hidden' : ''}>
          <div class="catalog-card__top">
            <span class="catalog-card__mono bg-accent-${escapeAttr(item.accent)}${monoLight}" aria-hidden="true">${escapeHtml(monogram(title))}${item.logo ? `<img class="catalog-card__logo${item.logoBg ? ' catalog-card__logo--boxed' : ''}" src="${escapeAttr(item.logo)}" alt="" loading="lazy"${item.logoBg ? ` style="background:${escapeAttr(item.logoBg)}"` : ''} onerror="this.remove()">` : ''}</span>
            <h3 class="catalog-card__title${pinned ? ' user_coder' : ''}">${escapeHtml(title)}</h3>
            ${badge}
          </div>
          <p class="catalog-card__desc">${escapeHtml(item.summary[locale])}</p>
          <div class="catalog-card__foot">
            <span class="catalog-card__lang">${escapeHtml(item.language)}</span>
            ${links.length ? `<div class="catalog-card__links">${links.join('')}</div>` : ''}
          </div>
        </article>
      `
    })
    .join('')

  grid.querySelectorAll('.catalog-card').forEach((card) => {
    const id = card.dataset.projectId
    const open = (trigger) => projectModal?.open(id, { trigger })

    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return
      const openBtn = e.target.closest('[data-open-project]')
      if (openBtn) {
        e.preventDefault()
        e.stopPropagation()
        open(openBtn)
        return
      }
      open(card)
    })

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        open(card)
      }
    })
  })
}

function renderPrinciples() {
  const root = document.getElementById('principles-list')
  if (!root) return
  root.innerHTML = principles
    .map(
      (item, index) => `
      <li class="principles__item reveal">
        <span class="principles__num" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <div>
          <h3>${escapeHtml(item.title[locale])}</h3>
          <p>${escapeHtml(item.body[locale])}</p>
        </div>
      </li>
    `,
    )
    .join('')
}

function renderMilestones() {
  const root = document.getElementById('timeline-list')
  if (!root) return
  root.innerHTML = milestones
    .map((item) => {
      const chips = (item.projects || [])
        .map((id) => {
          const project = catalogById(id)
          if (!project) return ''
          return `<li><a class="timeline__chip" href="#project-${escapeAttr(id)}">${escapeHtml(project.title[locale])}</a></li>`
        })
        .join('')

      return `
      <li class="timeline__item reveal" data-era="${escapeAttr(item.era || item.id)}">
        <div class="timeline__rail" aria-hidden="true"><span class="timeline__dot"></span></div>
        <div class="timeline__body">
          <p class="timeline__years">${escapeHtml(item.years)}</p>
          <h3>${escapeHtml(item.title[locale])}</h3>
          ${item.headline ? `<p class="timeline__headline">${escapeHtml(item.headline[locale])}</p>` : ''}
          <p class="timeline__lead">${escapeHtml(item.body[locale])}</p>
          ${item.context ? `<p class="timeline__context">${escapeHtml(item.context[locale])}</p>` : ''}
          ${chips ? `<ul class="timeline__chips">${chips}</ul>` : ''}
        </div>
      </li>
    `
    })
    .join('')

  root.querySelectorAll('.timeline__chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const match = chip.getAttribute('href')?.match(/^#project-(.+)$/)
      if (!match) return
      e.preventDefault()
      projectModal?.open(match[1], { trigger: chip })
    })
  })
}

function renderTech() {
  const root = document.getElementById('tech-list')
  if (!root) return
  const groups = copy[locale].tech.groups || []
  root.innerHTML = groups
    .map((group) => {
      const badges = (group.items || [])
        .map((item) => {
          const color = item.color || '#555555'
          const logo = item.logo || 'white'
          const ink = logo === 'white' ? '#ffffff' : logo === 'black' ? '#000000' : `#${logo.replace(/^#/, '')}`
          const icon = item.icon
            ? `<img class="tech-badge__icon tech-badge__icon--invert" src="${escapeAttr(item.icon)}" alt="" width="16" height="16" loading="lazy" onerror="this.remove()">`
            : item.slug
              ? `<img class="tech-badge__icon" src="https://cdn.simpleicons.org/${escapeAttr(item.slug)}/${escapeAttr(logo)}" alt="" width="16" height="16" loading="lazy" onerror="this.remove()">`
              : ''
          return `<li class="tech-badge" style="--badge:${escapeAttr(color)};--badge-ink:${escapeAttr(ink)}">${icon}<span>${escapeHtml(item.name)}</span></li>`
        })
        .join('')
      return `
        <div class="tech__group">
          <p class="tech__group-label">${escapeHtml(group.label)}</p>
          <ul class="tech__badges">${badges}</ul>
        </div>
      `
    })
    .join('')
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", '&#39;')
}

function initNav() {
  const header = document.getElementById('site-header')
  const toggle = document.getElementById('nav-toggle')
  const links = document.getElementById('nav-links')

  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 12)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  toggle?.addEventListener('click', () => {
    const open = links?.classList.toggle('is-open')
    toggle.setAttribute('aria-expanded', String(Boolean(open)))
    document.body.style.overflow = open ? 'hidden' : ''
    const label = open ? copy[locale].a11y.menuClose : copy[locale].a11y.menuOpen
    toggle.setAttribute('aria-label', label)
  })

  links?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('is-open')
      toggle?.setAttribute('aria-expanded', 'false')
      document.body.style.overflow = ''
    })
  })
}

function initLang() {
  document.getElementById('lang-en')?.addEventListener('click', () => {
    locale = 'en'
    localStorage.setItem('isaque-locale', locale)
    applyI18n()
  })
  document.getElementById('lang-pt')?.addEventListener('click', () => {
    locale = 'pt'
    localStorage.setItem('isaque-locale', locale)
    applyI18n()
  })
}

function initReveal() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const nodes = document.querySelectorAll('.reveal')
  if (reduce) {
    nodes.forEach((el) => el.classList.add('is-visible'))
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.01, rootMargin: '0px 0px -4% 0px' },
  )

  nodes.forEach((el) => {
    el.classList.remove('is-visible')
    io.observe(el)
  })
}

function mountRubik() {
  const stage = document.getElementById('rubik-stage')
  if (!stage || !window.IsaqueCube?.mountSolver) return
  window.IsaqueCube.mountSolver(stage)
}

function mountHeroCube() {
  const el = document.getElementById('hero-cube')
  if (!el || !window.IsaqueCube?.mountHero) return
  window.IsaqueCube.mountHero(el)
}

async function loadJson(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}`)
  return res.json()
}

async function boot() {
  locale = detectLocale()
  ;[copy, projects, catalog, principles, milestones] = await Promise.all([
    loadJson('data/copy.json'),
    loadJson('data/projects.json'),
    loadJson('data/catalog.json'),
    loadJson('data/principles.json'),
    loadJson('data/milestones.json'),
  ])

  const year = document.getElementById('year')
  if (year) year.textContent = String(new Date().getFullYear())

  projectModal = createProjectModal()
  bindMediaLightbox()
  mountHeroCube()
  initNav()
  initLang()
  applyI18n()
  openProjectFromHash()
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#project-')) openProjectFromHash()
    else projectModal?.close({ skipHash: true })
  })
}

boot().catch((err) => {
  console.error(err)
})
