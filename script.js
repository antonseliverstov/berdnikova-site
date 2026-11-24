document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

menuButton?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
});

navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navLinks?.classList.contains('open')) {
    navLinks.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    menuButton?.focus();
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const processObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      processObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.scroll-card').forEach((card) => processObserver.observe(card));

const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox?.querySelector('img');
document.querySelectorAll('[data-lightbox]').forEach((button) => {
  button.addEventListener('click', () => {
    lightboxImage.src = button.dataset.lightbox;
    lightbox.showModal();
  });
});
lightbox?.querySelector('button').addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

// Online booking: YCLIENTS opens in a side panel; every link keeps a real href as a fallback.
const bookingDialog = document.querySelector('#booking-dialog');
const bookingFrame = bookingDialog?.querySelector('[data-booking-frame]');
const bookingStatus = bookingDialog?.querySelector('[data-booking-status]');
const bookingClose = bookingDialog?.querySelector('[data-booking-close]');
const bookingSlowDelay = 12000;
let bookingOpener = null;
let bookingSlowTimer = null;

function closeMobileMenu() {
  if (!navLinks?.classList.contains('open')) return;
  navLinks.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

function loadBookingFrame(url) {
  if (!bookingFrame || bookingFrame.dataset.loadedUrl === url) return;
  bookingFrame.dataset.loadedUrl = url;
  bookingDialog.classList.remove('is-loaded', 'is-slow');
  bookingStatus.textContent = 'Загружаем расписание…';
  clearTimeout(bookingSlowTimer);
  // A cross-origin frame can't report its own errors reliably, so a slow load
  // only adds a hint; the "open in a new tab" link is always visible anyway.
  bookingSlowTimer = setTimeout(() => {
    if (bookingDialog.classList.contains('is-loaded')) return;
    bookingDialog.classList.add('is-slow');
    bookingStatus.textContent = 'Расписание загружается дольше обычного. Вы можете открыть запись в новой вкладке — ссылка внизу панели.';
  }, bookingSlowDelay);
  bookingFrame.src = url;
}

bookingFrame?.addEventListener('load', () => {
  if (!bookingFrame.dataset.loadedUrl) return;
  clearTimeout(bookingSlowTimer);
  bookingDialog.classList.remove('is-slow');
  bookingDialog.classList.add('is-loaded');
  bookingStatus.textContent = '';
});

function openBooking(opener) {
  if (!bookingDialog || typeof bookingDialog.showModal !== 'function') return false;
  bookingOpener = opener;
  closeMobileMenu();
  loadBookingFrame(opener.href);
  document.documentElement.classList.add('booking-open');
  bookingDialog.showModal();
  bookingClose?.focus();
  return true;
}

document.querySelectorAll('[data-booking-open]').forEach((link) => {
  link.addEventListener('click', (event) => {
    // Let modified clicks (new tab / window) behave like a normal link.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (openBooking(link)) event.preventDefault();
  });
});

// Closes the panel; where CSS defines an exit animation (phones) it plays first.
function closeBooking() {
  if (!bookingDialog?.open || bookingDialog.classList.contains('is-closing')) return;
  bookingDialog.classList.add('is-closing');
  // Only phones define the slide-out; elsewhere (or with reduced motion) close at once, as before.
  if (getComputedStyle(bookingDialog).animationName !== 'booking-drawer-out') {
    bookingDialog.close();
    return;
  }
  const finish = () => {
    bookingDialog.removeEventListener('animationend', finish);
    clearTimeout(fallback);
    if (bookingDialog.open) bookingDialog.close();
  };
  const fallback = setTimeout(finish, 450);
  bookingDialog.addEventListener('animationend', finish);
}

bookingClose?.addEventListener('click', closeBooking);
bookingDialog?.addEventListener('cancel', (event) => {
  // Esc: run the same animated close instead of the instant native one.
  event.preventDefault();
  closeBooking();
});
bookingDialog?.addEventListener('click', (event) => {
  // Clicks on the ::backdrop are reported on the dialog element itself.
  if (event.target !== bookingDialog) return;
  const rect = bookingDialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) closeBooking();
});
bookingDialog?.addEventListener('close', () => {
  bookingDialog.classList.remove('is-closing');
  document.documentElement.classList.remove('booking-open');
  bookingOpener?.focus({ preventScroll: true });
  bookingOpener = null;
});

const educationDocuments = [
  { qualification: 0, kind: 'Диплом', title: 'Диплом по психологии', meta: 'НОУ ВПО «Институт профессиональных инноваций» · 2010', src: 'assets/documents/diploma-psychology-2010.jpg', alt: 'Диплом по психологии, 2010 год' },
  { qualification: 0, kind: 'Приложение', title: 'Приложение к диплому по психологии', meta: 'НОУ ВПО «Институт профессиональных инноваций» · 2010', src: 'assets/documents/diploma-psychology-2010-appendix.jpg', alt: 'Приложение к диплому по психологии, 2010 год' },
  { qualification: 1, kind: 'Диплом', title: 'Диплом по клинической психологии', meta: 'Российский государственный социальный университет · 2017', src: 'assets/documents/diploma-clinical-psychology-2017.jpg', alt: 'Диплом по клинической психологии, 2017 год' },
  { qualification: 1, kind: 'Приложение', title: 'Приложение к диплому по клинической психологии', meta: 'Российский государственный социальный университет · 2017', src: 'assets/documents/diploma-clinical-psychology-2017-appendix.jpg', alt: 'Приложение к диплому по клинической психологии, 2017 год' },
  { qualification: 2, kind: 'Сертификат', title: 'НЛП Коуч Практик', meta: 'A&B Coach · 120 часов · 26 июля 2020', src: 'assets/documents/certificate-nlp-coach-2020.jpg', alt: 'Сертификат НЛП Коуч Практик, 2020 год' },
  { qualification: 3, kind: 'Сертификат', title: 'Timeline Transformation Seminar for Professionals', meta: 'Makani Academy · трёхдневная программа', src: 'assets/documents/certificate-timeline-transformation.jpg', alt: 'Сертификат Timeline Transformation Seminar for Professionals' },
  { set: 'olga', kind: 'Диплом', title: 'Диплом психолога — Ольга Авдашина (до брака Хромушина)', meta: 'НОУ ВПО «Институт профессиональных инноваций» · 2011 · выдан на добрачную фамилию Хромушина', src: 'assets/documents/olga-diploma-psychology-2011.jpg', alt: 'Диплом психолога Ольги Авдашиной (до брака Хромушиной), 2011 год' },
  { set: 'olga', kind: 'Диплом', title: 'Диплом о профессиональной переподготовке — Ольга Авдашина', meta: 'Российский государственный социальный университет · клиническая психология · 2017', src: 'assets/documents/olga-diploma-clinical-psychology-2017.jpg', alt: 'Диплом Ольги Авдашиной о переподготовке по клинической психологии, 2017 год' },
  { set: 'marina', kind: 'Диплом', title: 'Диплом психолога — Марина Крючкова', meta: 'НОУ ВПО «Институт профессиональных инноваций» · 2010 · квалификация «Психолог. Преподаватель психологии»', src: 'assets/documents/marina-diploma-psychology-2010.jpg', alt: 'Диплом психолога Марины Крючковой, 2010 год' },
  { set: 'marina', kind: 'Удостоверение', title: 'Психологическая коррекция кризисных состояний и посттравматического стресса — Марина Крючкова', meta: 'Московский институт лингвистики, «Институт практической психологии и психоанализа» · 72 часа · 2016', src: 'assets/documents/marina-certificate-crisis-ptsd-2016.jpg', alt: 'Удостоверение Марины Крючковой о повышении квалификации: коррекция кризисных состояний и посттравматического стресса, 2016 год' },
  { set: 'marina', kind: 'Удостоверение', title: 'Психотерапия зависимого поведения и психотерапия горя — Марина Крючкова', meta: 'Московский институт лингвистики, «Институт практической психологии и психоанализа» · 36 часов · 2016', src: 'assets/documents/marina-certificate-addiction-grief-2016.jpg', alt: 'Удостоверение Марины Крючковой о повышении квалификации: психотерапия зависимого поведения и горя, 2016 год' },
];

const educationSection = document.querySelector('#education');
const documentModal = document.querySelector('#document-modal');
const documentModalImage = document.querySelector('#document-modal-image');
const documentModalTitle = document.querySelector('#document-modal-title');
const documentModalPosition = document.querySelector('#document-modal-position');
const documentPanArea = document.querySelector('#document-pan-area');
const zoomReset = document.querySelector('#document-zoom-reset');
let currentDocument = 0;
let documentZoom = 1;
let documentFitWidth = 0;

// Documents are grouped by owner (Yulia by default, Olga and Marina separately): the zoom window pages only within one group.
const docSet = (index) => educationDocuments[index]?.set || 'yulia';
const docGroup = (index) => educationDocuments.map((d, i) => i).filter((i) => docSet(i) === docSet(index));
function docPositionLabel(index) {
  const group = docGroup(index);
  return `${group.indexOf(index) + 1} из ${group.length}`;
}
function stepDocument(direction) {
  const group = docGroup(currentDocument);
  const at = group.indexOf(currentDocument);
  updateDocument(group[(at + direction + group.length) % group.length]);
}

// Current document for the zoom window; the window keeps its own prev/next through all 6 documents.
function updateDocument(index, resetModalZoom = true) {
  currentDocument = (index + educationDocuments.length) % educationDocuments.length;
  const documentData = educationDocuments[currentDocument];
  if (documentModal?.open) {
    documentModalImage.src = documentData.src;
    documentModalImage.alt = documentData.alt;
    documentModalTitle.textContent = documentData.title;
    documentModalPosition.textContent = docPositionLabel(currentDocument);
    if (resetModalZoom) documentModalImage.addEventListener('load', fitModalDocument, { once: true });
  }
  const group = docGroup(currentDocument);
  const at = group.indexOf(currentDocument);
  [at - 1, at + 1].forEach((neighbor) => {
    const preload = new Image();
    preload.src = educationDocuments[group[(neighbor + group.length) % group.length]].src;
  });
}

// Education carousel: one card per program, endless, neighbours peek at both edges,
// chips above follow the centred card. A clone of the last card sits before the first and vice versa.
const eduTrack = educationSection?.querySelector('.edu-track');
const eduReal = eduTrack ? [...eduTrack.querySelectorAll('.edu-card')] : [];
const eduChips = educationSection ? [...educationSection.querySelectorAll('[data-edu-go]')] : [];
const eduCount = eduReal.length;
let eduSlides = [];
let eduCurrent = 0;      // real index 0..count-1
let eduPhysical = 1;     // index in eduSlides (0 and count+1 are clones)
let eduScrollTimer;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function eduLeft(physical) {
  const card = eduSlides[physical];
  return card.offsetLeft - (eduTrack.clientWidth - card.offsetWidth) / 2;
}
function eduMark(physical) {
  eduPhysical = physical;
  eduCurrent = (physical - 1 + eduCount) % eduCount;
  eduSlides.forEach((card, i) => card.classList.toggle('is-active', i === physical));
  eduChips.forEach((chip, i) => {
    const active = i === eduCurrent;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-selected', String(active));
    chip.tabIndex = active ? 0 : -1;
    if (active) revealEducationTab(chip);
  });
}
function eduJump(physical) {
  eduTrack.style.scrollSnapType = 'none';
  eduTrack.scrollLeft = eduLeft(physical);
  eduMark(physical);
  requestAnimationFrame(() => { eduTrack.style.scrollSnapType = ''; });
}
function eduScrollTo(physical, smooth = true) {
  eduMark(physical);
  eduTrack.scrollTo({ left: eduLeft(physical), behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' });
}
function eduGo(realIndex, smooth = true) {
  if (!eduCount) return;
  eduScrollTo(((realIndex % eduCount) + eduCount) % eduCount + 1, smooth);
}
function eduStep(direction) {
  if (!eduCount) return;
  eduScrollTo(Math.max(0, Math.min(eduCount + 1, eduPhysical + direction)));
}
function eduNearest() {
  const centre = eduTrack.scrollLeft + eduTrack.clientWidth / 2;
  let best = 1; let bestDistance = Infinity;
  eduSlides.forEach((card, i) => {
    const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre);
    if (distance < bestDistance) { bestDistance = distance; best = i; }
  });
  return best;
}

// Keeps the active chip visible inside the (mobile) horizontally scrolling bar without scrolling the page itself.
function revealEducationTab(tab) {
  const bar = tab.parentElement;
  if (!bar || bar.scrollWidth <= bar.clientWidth) return;
  const left = tab.offsetLeft - bar.offsetLeft;
  const right = left + tab.offsetWidth;
  if (left < bar.scrollLeft || right > bar.scrollLeft + bar.clientWidth) {
    bar.scrollTo({ left: Math.max(0, left - 16), behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
}

if (eduTrack && eduCount > 1) {
  const makeClone = (card) => {
    const clone = card.cloneNode(true);
    clone.removeAttribute('id');
    clone.removeAttribute('role');
    clone.removeAttribute('aria-labelledby');
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('is-clone');
    // In clones headings become plain text, so the page outline has each program only once
    clone.querySelectorAll('h3').forEach((h) => { const p = document.createElement('p'); p.className = 'edu-title'; p.innerHTML = h.innerHTML; h.replaceWith(p); });
    clone.querySelectorAll('button').forEach((button) => button.setAttribute('tabindex', '-1'));
    return clone;
  };
  eduTrack.prepend(makeClone(eduReal[eduCount - 1]));
  eduTrack.append(makeClone(eduReal[0]));
  eduSlides = [...eduTrack.querySelectorAll('.edu-card')];

  eduChips.forEach((chip) => chip.addEventListener('click', () => eduGo(Number(chip.dataset.eduGo))));
  educationSection.querySelector('.edu-chips')?.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    eduGo(eduCurrent + (event.key === 'ArrowRight' ? 1 : -1));
    eduChips[eduCurrent].focus();
  });
  educationSection.querySelectorAll('[data-edu-step]').forEach((button) => {
    button.addEventListener('click', () => eduStep(Number(button.dataset.eduStep)));
  });
  eduTrack.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); eduStep(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); eduStep(1); }
  });
  // A click on a peeking neighbour brings it to the centre instead of opening its document.
  eduSlides.forEach((card, i) => {
    card.addEventListener('click', (event) => {
      if (i === eduPhysical) return;
      event.preventDefault();
      event.stopPropagation();
      eduScrollTo(i);
    }, true);
  });
  eduTrack.addEventListener('scroll', () => {
    clearTimeout(eduScrollTimer);
    eduScrollTimer = setTimeout(() => {
      const nearest = eduNearest();
      if (nearest === 0) eduJump(eduCount);
      else if (nearest === eduCount + 1) eduJump(1);
      else if (nearest !== eduPhysical) eduMark(nearest);
    }, 120);
  }, { passive: true });
  window.addEventListener('resize', () => eduJump(eduPhysical));
  eduMark(1);
  requestAnimationFrame(() => eduJump(1));
}

document.querySelectorAll('[data-open-doc]').forEach((button) => {
  button.addEventListener('click', () => {
    updateDocument(Number(button.dataset.openDoc));
    openDocumentModal();
  });
});
// After browsing documents in the zoom window, the carousel shows the program of the last one.
documentModal?.addEventListener('close', () => {
  const program = educationDocuments[currentDocument]?.qualification;
  if (typeof program === 'number' && program !== eduCurrent && eduSlides.length) eduJump(program + 1);
});

function setDocumentZoom(zoom) {
  documentZoom = Math.min(3, Math.max(1, zoom));
  documentModalImage.style.width = `${documentFitWidth * documentZoom}px`;
  zoomReset.textContent = `${Math.round(documentZoom * 100)}%`;
}

function fitModalDocument() {
  const availableWidth = Math.max(200, documentPanArea.clientWidth - 40);
  const availableHeight = Math.max(200, documentPanArea.clientHeight - 40);
  const naturalWidth = documentModalImage.naturalWidth || 1200;
  const naturalHeight = documentModalImage.naturalHeight || 850;
  documentFitWidth = naturalWidth * Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);
  setDocumentZoom(1);
  documentPanArea.scrollTo(0, 0);
}

function openDocumentModal() {
  const documentData = educationDocuments[currentDocument];
  documentModalImage.src = documentData.src;
  documentModalImage.alt = documentData.alt;
  documentModalTitle.textContent = documentData.title;
  documentModalPosition.textContent = docPositionLabel(currentDocument);
  documentModal.showModal();
  requestAnimationFrame(fitModalDocument);
}

document.querySelector('.document-modal-close')?.addEventListener('click', () => documentModal.close());
document.querySelector('#document-zoom-in')?.addEventListener('click', () => setDocumentZoom(documentZoom + 0.25));
document.querySelector('#document-zoom-out')?.addEventListener('click', () => setDocumentZoom(documentZoom - 0.25));
zoomReset?.addEventListener('click', fitModalDocument);
document.querySelector('#document-modal-prev')?.addEventListener('click', () => stepDocument(-1));
document.querySelector('#document-modal-next')?.addEventListener('click', () => stepDocument(1));

let dragStart = null;
documentPanArea?.addEventListener('pointerdown', (event) => {
  if (documentZoom === 1) return;
  dragStart = { x: event.clientX, y: event.clientY, left: documentPanArea.scrollLeft, top: documentPanArea.scrollTop };
  documentPanArea.setPointerCapture(event.pointerId);
  documentPanArea.classList.add('dragging');
});
documentPanArea?.addEventListener('pointermove', (event) => {
  if (!dragStart) return;
  documentPanArea.scrollLeft = dragStart.left - (event.clientX - dragStart.x);
  documentPanArea.scrollTop = dragStart.top - (event.clientY - dragStart.y);
});
documentPanArea?.addEventListener('pointerup', () => {
  dragStart = null;
  documentPanArea.classList.remove('dragging');
});
documentModal?.addEventListener('close', () => {
  dragStart = null;
  documentPanArea.classList.remove('dragging');
});
document.addEventListener('keydown', (event) => {
  if (!documentModal?.open) return;
  if (event.key === 'ArrowLeft') stepDocument(-1);
  if (event.key === 'ArrowRight') stepDocument(1);
  if (event.key === '+' || event.key === '=') setDocumentZoom(documentZoom + 0.25);
  if (event.key === '-') setDocumentZoom(documentZoom - 0.25);
  if (event.key === '0') fitModalDocument();
});

updateDocument(0);

const reviewCarousel = document.querySelector('.review-carousel');
const reviewViewport = document.querySelector('#review-viewport');
const reviewTrack = document.querySelector('#review-track');
const reviewPosition = document.querySelector('#review-position');
const originalReviews = reviewTrack ? [...reviewTrack.children] : [];
let currentReview = 0;
let reviewScrollTimer;

if (reviewViewport && originalReviews.length) {
  originalReviews.forEach((review, index) => review.setAttribute('aria-label', `Отзыв ${index + 1} из ${originalReviews.length}`));
  const firstClone = originalReviews[0].cloneNode(true);
  const lastClone = originalReviews[originalReviews.length - 1].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  reviewTrack.prepend(lastClone);
  reviewTrack.append(firstClone);

  const reviewWidth = () => reviewViewport.clientWidth;
  const updateReviewLabel = () => {
    reviewPosition.textContent = `${currentReview + 1} из ${originalReviews.length}`;
  };
  const jumpToPhysicalReview = (physicalIndex) => {
    reviewViewport.style.scrollBehavior = 'auto';
    reviewViewport.scrollLeft = physicalIndex * reviewWidth();
    requestAnimationFrame(() => { reviewViewport.style.scrollBehavior = ''; });
  };
  const moveReview = (direction) => {
    let physicalIndex;
    if (direction > 0) {
      physicalIndex = currentReview === originalReviews.length - 1 ? originalReviews.length + 1 : currentReview + 2;
      currentReview = (currentReview + 1) % originalReviews.length;
    } else {
      physicalIndex = currentReview === 0 ? 0 : currentReview;
      currentReview = (currentReview - 1 + originalReviews.length) % originalReviews.length;
    }
    updateReviewLabel();
    reviewViewport.scrollTo({ left: physicalIndex * reviewWidth(), behavior: 'smooth' });
  };

  requestAnimationFrame(() => jumpToPhysicalReview(1));
  document.querySelector('#review-prev')?.addEventListener('click', () => moveReview(-1));
  document.querySelector('#review-next')?.addEventListener('click', () => moveReview(1));
  reviewCarousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveReview(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveReview(1); }
  });
  reviewViewport.addEventListener('scroll', () => {
    clearTimeout(reviewScrollTimer);
    reviewScrollTimer = setTimeout(() => {
      const physicalIndex = Math.round(reviewViewport.scrollLeft / reviewWidth());
      if (physicalIndex === 0) {
        currentReview = originalReviews.length - 1;
        jumpToPhysicalReview(originalReviews.length);
      } else if (physicalIndex === originalReviews.length + 1) {
        currentReview = 0;
        jumpToPhysicalReview(1);
      } else {
        currentReview = Math.max(0, Math.min(originalReviews.length - 1, physicalIndex - 1));
      }
      updateReviewLabel();
    }, 140);
  }, { passive: true });
  window.addEventListener('resize', () => jumpToPhysicalReview(currentReview + 1));
}

document.querySelector('#year').textContent = new Date().getFullYear();
