// Уведомление о cookie и (когда будет готова) Яндекс Метрика — как на belovet.ru.
// Уведомление показывается на всех страницах, пока посетитель не нажмёт «Понятно»; отметка хранится в localStorage
// (psy-berdnikova-cookie: seen) только на устройстве посетителя.
// Метрика: впишите номер счётчика в METRIKA_ID — счётчик загрузится, а текст уведомления упомянет Метрику.
// Перед этим обновите раздел 8 в privacy.html (там сейчас сказано, что аналитика не подключена).
(function () {
  var METRIKA_ID = ''; // например '12345678'
  var KEY = 'psy-berdnikova-cookie';

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadMetrika() {
    if (!METRIKA_ID) return;
    // Вебвизор не записывает ввод в поля
    document.querySelectorAll('input, textarea').forEach(function (el) { el.classList.add('ym-disable-keys'); });
    window.dataLayer = window.dataLayer || [];
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_ID, 'ym');
    window.ym(METRIKA_ID, 'init', { ssr: true, webvisor: true, clickmap: true, referrer: document.referrer, url: location.href, accurateTrackBounce: true, trackLinks: true });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('tel:') === 0) window.ym(METRIKA_ID, 'reachGoal', 'phone');
      else if (href.indexOf('mailto:') === 0) window.ym(METRIKA_ID, 'reachGoal', 'email');
      else if (a.hasAttribute('data-booking-open')) window.ym(METRIKA_ID, 'reachGoal', 'booking');
    });
  }

  function privacyHref() {
    var a = document.querySelector('a[href$="privacy.html"]');
    return (a ? a.getAttribute('href') : 'privacy.html') + '#cookie';
  }

  function show() {
    var box = document.createElement('div');
    box.className = 'pb-cookie';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Уведомление о файлах cookie');
    var text = METRIKA_ID
      ? 'Сайт использует файлы cookie и Яндекс Метрику: она помогает понять, какие разделы полезны.'
      : 'Сайт использует файлы cookie: они нужны для работы онлайн-записи.';
    box.innerHTML = '<p>' + text + ' <a href="' + privacyHref() + '">Подробнее</a></p><button type="button">Понятно</button>';
    box.querySelector('button').addEventListener('click', function () { set('seen'); box.hidden = true; });
    document.body.appendChild(box);
  }

  function start() {
    loadMetrika();
    if (!get()) show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
