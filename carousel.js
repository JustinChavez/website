// Adds arrows, feature tabs, arrow keys, and a Slides/List toggle to each .carousel, and plays only the visible clip.
// Without this script a carousel is still a swipeable, scroll-snapping row.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

for (const carousel of document.querySelectorAll('.carousel')) {
  const track = carousel.querySelector('.carousel-track');
  const slides = [...track.querySelectorAll(':scope > .slide')];
  if (!slides.length) continue;
  let index = 0;

  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  const prev = Object.assign(document.createElement('button'), {className: 'arrow', type: 'button', textContent: '‹'});
  const next = Object.assign(document.createElement('button'), {className: 'arrow', type: 'button', textContent: '›'});
  prev.setAttribute('aria-label', 'Previous slide');
  next.setAttribute('aria-label', 'Next slide');
  const tabs = document.createElement('div');
  tabs.className = 'carousel-tabs';
  const tabButtons = slides.map((slide, i) => {
    const b = Object.assign(document.createElement('button'), {type: 'button', textContent: slide.dataset.label || `Slide ${i + 1}`});
    b.addEventListener('click', () => go(i));
    tabs.append(b);
    return b;
  });
  const count = document.createElement('span');
  count.className = 'carousel-count';
  count.setAttribute('aria-live', 'polite');
  nav.append(prev, tabs, next, count);
  carousel.append(nav);

  // Slides / List toggle. List shows every slide's text, with no media.
  const views = document.createElement('div');
  views.className = 'carousel-views';
  views.setAttribute('role', 'group');
  views.setAttribute('aria-label', 'View');
  const viewButtons = ['Slides', 'List'].map(name => {
    const b = Object.assign(document.createElement('button'), {type: 'button', textContent: name});
    b.addEventListener('click', () => setView(name.toLowerCase(), true));
    views.append(b);
    return b;
  });
  carousel.prepend(views);
  function setView(view, remember) {
    const list = view === 'list';
    carousel.classList.toggle('is-list', list);
    viewButtons.forEach(b => b.setAttribute('aria-pressed', String(b.textContent.toLowerCase() === view)));
    if (remember) try { localStorage.setItem('carousel-view', view); } catch {}
    if (list) slides.forEach(slide => slide.querySelectorAll('video').forEach(v => v.pause()));
    else go(index);
  }

  slides.forEach((slide, i) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${slides.length}: ${slide.dataset.label || ''}`);
  });

  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({left: slides[i].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth'});
    setActive(i);
  }
  function setActive(i) {
    index = i;
    tabButtons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    count.textContent = `${i + 1} / ${slides.length}`;
    slides.forEach((slide, k) => {
      for (const video of slide.querySelectorAll('video')) {
        if (k === i && !reduceMotion && !carousel.classList.contains('is-list')) video.play().catch(() => {});
        else video.pause();
      }
    });
  }
  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  track.addEventListener('keydown', event => {
    if (carousel.classList.contains('is-list')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1); }
  });
  // Swiping or scrolling the track moves the active slide too.
  const seen = new IntersectionObserver(entries => {
    if (carousel.classList.contains('is-list')) return;
    for (const entry of entries) if (entry.isIntersecting) setActive(slides.indexOf(entry.target));
  }, {root: track, threshold: 0.6});
  slides.forEach(slide => seen.observe(slide));
  setActive(0);
  let saved = 'slides';
  try { saved = localStorage.getItem('carousel-view') || 'slides'; } catch {}
  setView(saved === 'list' ? 'list' : 'slides', false);
}
