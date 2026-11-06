(function () {
  'use strict';
  var C = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Флаги блоков */
  $$('[data-flag]').forEach(function (el) { el.hidden = !C[el.getAttribute('data-flag')]; });

  /* Текстовые поля из конфига: заглушка остаётся, если значения нет */
  $$('[data-cfg]').forEach(function (el) {
    var v = C[el.getAttribute('data-cfg')];
    if (v) { el.textContent = v; el.classList.remove('todo'); }
  });
  if (C.phone) {
    $$('[data-cfg="phoneText"]').forEach(function (el) {
      el.innerHTML = ''; var a = document.createElement('a'); a.href = 'tel:' + C.phone; a.textContent = fmtPhone(C.phone); el.appendChild(a);
    });
  }
  function fmtPhone(p) {
    var d = p.replace(/\D/g, '');
    return d.length === 11 ? '+7 ' + d.slice(1, 4) + ' ' + d.slice(4, 7) + '-' + d.slice(7, 9) + '-' + d.slice(9) : p;
  }

  /* Цены */
  var tb = $('[data-cfg-prices]');
  if (tb && C.prices && C.prices.length) {
    C.prices.forEach(function (r) {
      var tr = document.createElement('tr');
      r.forEach(function (c) { var td = document.createElement('td'); td.textContent = c; tr.appendChild(td); });
      tb.appendChild(tr);
    });
  }

  /* Кнопки связи */
  var link = { telegram: C.telegram, whatsapp: C.whatsapp, max: C.max, phone: C.phone ? 'tel:' + C.phone : null };
  var any = false;
  $$('[data-contact]').forEach(function (a) {
    var k = a.getAttribute('data-contact'); if (k === 'primary') k = C.primary || 'telegram';
    var href = link[k];
    if (href) {
      any = true; a.href = href;
      if (k !== 'phone') { a.target = '_blank'; a.rel = 'noopener'; }
    } else if (a.getAttribute('data-contact') !== 'primary') {
      a.setAttribute('aria-disabled', 'true'); a.title = 'Номер появится в ближайшее время';
      a.addEventListener('click', function (e) { e.preventDefault(); });
    }
  });
  var note = $('[data-contact-note]'); if (note && any) note.hidden = true;

  /* «Центр психологии и развития» — ровно по ширине имени (брендбук, лист 06) */
  function fitLockups() {
    $$('.lockup').forEach(function (l) {
      var name = $('.lockup__name', l), c = $('.lockup__center', l);
      if (!name || !c) return;
      c.style.letterSpacing = '0px'; c.style.marginRight = '0px';
      var target = name.getBoundingClientRect().width, w0 = c.getBoundingClientRect().width;
      var n = c.textContent.length;
      if (n < 2 || !target) return;
      // браузер добавляет разрядку и после последней буквы, поэтому делим на (n − 1)
      var ls = (target - w0) / (n - 1);
      c.style.letterSpacing = ls + 'px';
      c.style.marginRight = (-ls) + 'px';
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLockups); else window.addEventListener('load', fitLockups);
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fitLockups, 120); });
  fitLockups();

  /* Меню на телефоне */
  var mb = $('.menu-btn'), nav = $('#nav');
  if (mb && nav) {
    mb.addEventListener('click', function () {
      var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); mb.textContent = o ? 'Закрыть' : 'Меню';
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.textContent = 'Меню'; }); });
  }

  /* Карточки запросов: на телефоне — аккордеон, на компьютере — всегда открыты */
  var mq = window.matchMedia('(max-width: 767px)');
  function groups() {
    $$('.group').forEach(function (d, i) { d.open = mq.matches ? i < 2 : true; });
  }
  groups(); (mq.addEventListener ? mq.addEventListener('change', groups) : mq.addListener(groups));
  $$('.group summary').forEach(function (s) { s.addEventListener('click', function (e) { if (!mq.matches) e.preventDefault(); }); });

  /* Карта — только по клику (сторонний скрипт не грузим заранее) */
  var mapBtn = $('#map-load');
  if (mapBtn) mapBtn.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent('Тула, проспект Ленина, 85') + '&z=16';
    f.title = 'Карта: Тула, проспект Ленина, 85'; f.loading = 'lazy'; f.setAttribute('allowfullscreen', '');
    var m = $('#map'); m.innerHTML = ''; m.appendChild(f);
  });

  /* Появление блоков */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* Cookie и Метрика */
  var KEY = 'cookie-consent', box = $('#cookie'), st = null;
  try { st = localStorage.getItem(KEY); } catch (e) {}
  if (!st && box) box.hidden = false;
  if (st === 'accept') loadMetrika();
  $$('[data-cookie]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-cookie'); try { localStorage.setItem(KEY, v); } catch (e) {}
      box.hidden = true; if (v === 'accept') loadMetrika();
    });
  });
  function loadMetrika() {
    var id = C.metrikaId; if (!id) return;
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
})();
