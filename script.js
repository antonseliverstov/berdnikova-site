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
];

const educationSection = document.querySelector('#education');
const documentImage = document.querySelector('#document-image');
const documentTitle = document.querySelector('#document-title');
const documentKind = document.querySelector('#document-kind');
const documentMeta = document.querySelector('#document-meta');
const documentPosition = document.querySelector('#document-position');
const documentPreview = document.querySelector('#document-preview');
const documentModal = document.querySelector('#document-modal');
const documentModalImage = document.querySelector('#document-modal-image');
const documentModalTitle = document.querySelector('#document-modal-title');
const documentModalPosition = document.querySelector('#document-modal-position');
const documentPanArea = document.querySelector('#document-pan-area');
const zoomReset = document.querySelector('#document-zoom-reset');
let currentDocument = 0;
let documentZoom = 1;
let documentFitWidth = 0;

function updateDocument(index, resetModalZoom = true) {
  currentDocument = (index + educationDocuments.length) % educationDocuments.length;
  const documentData = educationDocuments[currentDocument];
  documentImage.src = documentData.src;
  documentImage.alt = documentData.alt;
  documentTitle.textContent = documentData.title;
  documentKind.textContent = documentData.kind;
  documentMeta.textContent = documentData.meta;
  documentPosition.textContent = `${currentDocument + 1} из ${educationDocuments.length}`;
  documentPreview.setAttribute('aria-label', `Открыть увеличенный документ: ${documentData.title}`);

  educationSection?.querySelectorAll('[data-program]').forEach((tab) => {
    const isActive = Number(tab.dataset.program) === documentData.qualification;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
    if (isActive) revealEducationTab(tab);
  });
  educationSection?.querySelectorAll('[data-program-panel]').forEach((panel) => {
    panel.hidden = Number(panel.dataset.programPanel) !== documentData.qualification;
  });
  educationSection?.querySelectorAll('[data-document]').forEach((button) => {
    const isActive = Number(button.dataset.document) === currentDocument;
    button.classList.toggle('active', isActive);
    if (button.closest('.document-switches')) button.setAttribute('aria-pressed', String(isActive));
  });

  if (documentModal?.open) {
    documentModalImage.src = documentData.src;
    documentModalImage.alt = documentData.alt;
    documentModalTitle.textContent = documentData.title;
    documentModalPosition.textContent = `${currentDocument + 1} из ${educationDocuments.length}`;
    if (resetModalZoom) documentModalImage.addEventListener('load', fitModalDocument, { once: true });
  }

  [currentDocument - 1, currentDocument + 1].forEach((neighbor) => {
    const preload = new Image();
    preload.src = educationDocuments[(neighbor + educationDocuments.length) % educationDocuments.length].src;
  });
}

// Keeps the active program button visible inside the (mobile) horizontally scrolling bar
// without scrolling the page itself.
function revealEducationTab(tab) {
  const bar = tab.parentElement;
  if (!bar || bar.scrollWidth <= bar.clientWidth) return;
  const left = tab.offsetLeft - bar.offsetLeft;
  const right = left + tab.offsetWidth;
  if (left < bar.scrollLeft || right > bar.scrollLeft + bar.clientWidth) {
    bar.scrollTo({ left: Math.max(0, left - 16), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

educationSection?.querySelectorAll('[data-program]').forEach((tab) => {
  tab.addEventListener('click', () => {
    const first = educationDocuments.findIndex((item) => item.qualification === Number(tab.dataset.program));
    if (first >= 0) updateDocument(first);
  });
});
educationSection?.querySelectorAll('[data-document]').forEach((button) => {
  button.addEventListener('click', () => updateDocument(Number(button.dataset.document)));
});
document.querySelector('#viewer-prev')?.addEventListener('click', () => updateDocument(currentDocument - 1));
document.querySelector('#viewer-next')?.addEventListener('click', () => updateDocument(currentDocument + 1));

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
  documentModalPosition.textContent = `${currentDocument + 1} из ${educationDocuments.length}`;
  documentModal.showModal();
  requestAnimationFrame(fitModalDocument);
}

documentPreview?.addEventListener('click', openDocumentModal);
document.querySelector('#viewer-expand')?.addEventListener('click', openDocumentModal);
document.querySelector('.document-modal-close')?.addEventListener('click', () => documentModal.close());
document.querySelector('#document-zoom-in')?.addEventListener('click', () => setDocumentZoom(documentZoom + 0.25));
document.querySelector('#document-zoom-out')?.addEventListener('click', () => setDocumentZoom(documentZoom - 0.25));
zoomReset?.addEventListener('click', fitModalDocument);
document.querySelector('#document-modal-prev')?.addEventListener('click', () => updateDocument(currentDocument - 1));
document.querySelector('#document-modal-next')?.addEventListener('click', () => updateDocument(currentDocument + 1));

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
  if (event.key === 'ArrowLeft') updateDocument(currentDocument - 1);
  if (event.key === 'ArrowRight') updateDocument(currentDocument + 1);
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
