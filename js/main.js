(function () {
  'use strict';
  var C = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* «Центр психологии и развития» — ровно по ширине имени (брендбук, лист 06) */
  function fitLockups() {
    $$('.lockup').forEach(function (l) {
      var name = $('.lockup__name', l), c = $('.lockup__center', l);
      if (!name || !c) return;
      c.style.letterSpacing = '0px'; c.style.marginRight = '0px';
      var target = name.getBoundingClientRect().width, w0 = c.getBoundingClientRect().width, n = c.textContent.length;
      if (n < 2 || !target) return;
      var ls = (target - w0) / (n - 1);
      c.style.letterSpacing = ls + 'px'; c.style.marginRight = (-ls) + 'px';
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLockups);
  fitLockups();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fitLockups, 120); });

  /* Мобильное меню: aria-expanded, Esc, возврат фокуса, закрытие по клику мимо */
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

  /* Цели Метрики на кнопках связи */
  $$('[data-goal]').forEach(function (a) {
    a.addEventListener('click', function () { try { if (window.ym && C.metrikaId) window.ym(C.metrikaId, 'reachGoal', a.getAttribute('data-goal')); } catch (e) {} });
  });

  /* Cookie: равнозначный выбор; Метрика — только после согласия */
  var KEY = 'cookie-consent', box = $('#cookie'), st = null;
  try { st = localStorage.getItem(KEY); } catch (e) {}
  function pad() { document.body.style.paddingBottom = box && !box.hidden ? (box.offsetHeight + 24) + 'px' : ''; }
  if (!st && box) { box.hidden = false; pad(); window.addEventListener('resize', pad); }
  if (st === 'accept') loadMetrika();
  $$('[data-cookie]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-cookie'); try { localStorage.setItem(KEY, v); } catch (e) {}
      box.hidden = true; pad(); if (v === 'accept') loadMetrika();
      var main = $('#main'); if (main) main.focus({ preventScroll: true });
    });
  });
  function loadMetrika() {
    var id = C.metrikaId; if (!id) return;
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
})();
