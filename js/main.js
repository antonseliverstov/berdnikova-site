(function () {
  'use strict';
  var C = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NEWTAB = ' (откроется в новой вкладке)';

  /* ---------- Флаги и поля из конфига ---------- */
  $$('[data-flag]').forEach(function (el) { el.hidden = !C[el.getAttribute('data-flag')]; });
  $$('[data-cfg]').forEach(function (el) {
    var v = C[el.getAttribute('data-cfg')];
    if (v) { el.textContent = v; el.classList.remove('todo'); }
  });
  $$('[data-show-if]').forEach(function (el) { el.hidden = !C[el.getAttribute('data-show-if')]; });

  function digits(p) { return String(p || '').replace(/\D/g, ''); }
  function fmtPhone(p) {
    var d = digits(p); if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
    return d.length === 11 ? '+7 ' + d.slice(1, 4) + ' ' + d.slice(4, 7) + '-' + d.slice(7, 9) + '-' + d.slice(9) : String(p);
  }
  function telHref(p) { var d = digits(p); if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); return 'tel:+' + d; }

  /* ---------- Каналы записи: только заполненные ---------- */
  var msg = C.messageText || 'Здравствуйте! Хочу записаться на консультацию.';
  function channelHref(k) {
    var v = C[k]; if (!v) return null;
    v = String(v).trim();
    if (k === 'phone') return telHref(v);
    if (k === 'telegram') {
      if (/^https?:\/\//.test(v)) return v;
      return 'https://t.me/' + v.replace(/^@/, '');
    }
    if (k === 'whatsapp') {
      var base = /^https?:\/\//.test(v) ? v : 'https://wa.me/' + digits(v);
      return base + (base.indexOf('?') < 0 ? '?text=' : '&text=') + encodeURIComponent(msg);
    }
    if (k === 'max') return /^https?:\/\//.test(v) ? v : null;
    return null;
  }
  var LABEL = { telegram: 'Написать в Telegram', whatsapp: 'Написать в WhatsApp', max: 'Написать в Max', phone: 'Позвонить' };
  var order = ['telegram', 'whatsapp', 'max', 'phone'];
  var primary = channelHref(C.primary) ? C.primary : order.filter(channelHref)[0];
  var available = order.filter(channelHref);
  if (primary) { available.splice(available.indexOf(primary), 1); available.unshift(primary); }

  function goal(name) { try { if (window.ym && C.metrikaId) window.ym(C.metrikaId, 'reachGoal', name); } catch (e) {} }
  function makeLink(k, cls) {
    var a = document.createElement('a'); a.className = 'btn ' + cls; a.href = channelHref(k);
    a.textContent = k === 'phone' ? 'Позвонить: ' + fmtPhone(C.phone) : LABEL[k];
    if (k !== 'phone') {
      a.target = '_blank'; a.rel = 'noopener';
      var s = document.createElement('span'); s.className = 'sr-only'; s.textContent = NEWTAB; a.appendChild(s);
    }
    a.addEventListener('click', function () { goal('contact_' + k); });
    return a;
  }
  var list = $('[data-contact-list]'), wait = $('[data-contact-wait]');
  if (list) {
    available.forEach(function (k, i) { list.appendChild(makeLink(k, i === 0 ? 'btn--gold' : 'btn--dark')); });
    list.hidden = !available.length;
  }
  if (wait) wait.hidden = available.length > 0;
  // «Написать Юлии» на первом экране: сразу в основной канал, иначе — к блоку контактов
  var heroBtn = $('[data-contact-primary]');
  if (heroBtn && primary && primary !== 'phone') {
    heroBtn.href = channelHref(primary); heroBtn.target = '_blank'; heroBtn.rel = 'noopener';
    var s2 = document.createElement('span'); s2.className = 'sr-only'; s2.textContent = ' в ' + LABEL[primary].replace('Написать в ', '') + NEWTAB; heroBtn.appendChild(s2);
    heroBtn.addEventListener('click', function () { goal('contact_' + primary + '_hero'); });
  }
  if (C.phone) $$('[data-cfg="phoneText"]').forEach(function (el) {
    el.textContent = ''; var a = document.createElement('a'); a.href = telHref(C.phone); a.textContent = fmtPhone(C.phone); el.appendChild(a);
  });

  /* ---------- Цены: блок существует, только если включён и заполнен ---------- */
  var slot = $('[data-prices-slot]');
  if (slot && C.showPrices && C.prices && C.prices.length) {
    var wrap = document.createElement('div'); wrap.className = 'prices';
    var h = document.createElement('h3'); h.className = 'overline'; h.textContent = 'Стоимость'; wrap.appendChild(h);
    var t = document.createElement('table'), tb = document.createElement('tbody');
    var cap = document.createElement('caption'); cap.className = 'sr-only'; cap.textContent = 'Стоимость консультаций'; t.appendChild(cap);
    C.prices.forEach(function (r) {
      var tr = document.createElement('tr'), th = document.createElement('th'), td = document.createElement('td');
      th.scope = 'row'; th.textContent = r[0]; td.textContent = r[1]; tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t); slot.appendChild(wrap);
  } else if (slot) { slot.remove(); }

  /* ---------- «Центр психологии и развития» — ровно по ширине имени (лист 06) ---------- */
  function fitLockups() {
    $$('.lockup').forEach(function (l) {
      var name = $('.lockup__name', l), c = $('.lockup__center', l);
      if (!name || !c) return;
      c.style.letterSpacing = '0px'; c.style.marginRight = '0px';
      var target = name.getBoundingClientRect().width, w0 = c.getBoundingClientRect().width, n = c.textContent.length;
      if (n < 2 || !target) return;
      var ls = (target - w0) / (n - 1); // браузер ставит разрядку и после последней буквы
      c.style.letterSpacing = ls + 'px'; c.style.marginRight = (-ls) + 'px';
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLockups);
  fitLockups();

  /* ---------- Мобильное меню: aria-expanded, Esc, возврат фокуса ---------- */
  var mb = $('.menu-btn'), nav = $('#nav'), navMq = window.matchMedia('(max-width: 1240px)');
  function setMenu(open, focusBack) {
    if (!mb || !nav) return;
    nav.classList.toggle('open', open);
    mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    mb.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mb.textContent = open ? 'Закрыть' : 'Меню';
    if (open) { var first = $('a', nav); if (first) first.focus(); }
    else if (focusBack) mb.focus();
  }
  if (mb && nav) {
    mb.addEventListener('click', function () { setMenu(!nav.classList.contains('open'), false); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (navMq.matches) setMenu(false, false); }); });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && nav.classList.contains('open')) { e.preventDefault(); setMenu(false, true); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !mb.contains(e.target)) setMenu(false, false);
    });
    nav.addEventListener('focusout', function (e) {
      if (navMq.matches && nav.classList.contains('open') && e.relatedTarget && !nav.contains(e.relatedTarget) && e.relatedTarget !== mb) setMenu(false, false);
    });
    var onNav = function () { if (!navMq.matches) setMenu(false, false); };
    navMq.addEventListener ? navMq.addEventListener('change', onNav) : navMq.addListener(onNav);
  }

  /* ---------- Карточки запросов: аккордеон только на телефоне ---------- */
  var mq = window.matchMedia('(max-width: 767px)');
  function setGroup(btn, open) {
    var ul = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', open ? 'true' : 'false'); if (ul) ul.hidden = !open;
  }
  function groups() {
    $$('.group__toggle').forEach(function (b, i) { setGroup(b, mq.matches ? i < 2 : true); });
  }
  $$('.group__toggle').forEach(function (b) { b.addEventListener('click', function () { setGroup(b, b.getAttribute('aria-expanded') !== 'true'); }); });
  groups(); mq.addEventListener ? mq.addEventListener('change', groups) : mq.addListener(groups);

  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fitLockups, 120); });

  /* ---------- Карта по клику ---------- */
  var mapBtn = $('#map-load');
  if (mapBtn) mapBtn.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent('Тула, проспект Ленина, 85') + '&z=16';
    f.title = 'Яндекс Карта: Тула, проспект Ленина, 85'; f.setAttribute('allowfullscreen', '');
    var m = $('#map'); m.innerHTML = ''; m.appendChild(f); f.focus();
  });

  /* ---------- Появление блоков ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- Cookie и Метрика ---------- */
  var KEY = 'cookie-consent', box = $('#cookie'), st = null;
  try { st = localStorage.getItem(KEY); } catch (e) {}
  function pad() { document.body.style.paddingBottom = box && !box.hidden ? (box.offsetHeight + 24) + 'px' : ''; }
  if (!st && box) { box.hidden = false; pad(); window.addEventListener('resize', pad); }
  if (st === 'accept') loadMetrika();
  $$('[data-cookie]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-cookie'); try { localStorage.setItem(KEY, v); } catch (e) {}
      box.hidden = true; pad(); if (v === 'accept') loadMetrika();
      var main = $('#main'); if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
    });
  });
  function loadMetrika() {
    var id = C.metrikaId; if (!id) return;
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
})();
