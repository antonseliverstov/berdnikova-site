// Заявка на консультацию: к специалисту без онлайн-записи (сейчас — Ольга Авдашина)
// и на онлайн-консультацию к Юлии (кнопка «Онлайн», data-mode="online": услуга + день; четверг пока закрыт).
// Боковое окно с формой «имя + телефон + две отметки согласия» → POST JSON на api/lead.php (работает на хостинге с PHP).
// Если отправить не удалось, человек видит телефон центра.
(function () {
  var dialog = document.getElementById('lead-dialog');
  if (!dialog) return;
  var form = dialog.querySelector('#lead-form');
  var done = dialog.querySelector('.lead-done');
  var errorBox = dialog.querySelector('.lead-error');
  var submit = dialog.querySelector('.lead-submit');
  var title = dialog.querySelector('#lead-title');
  var intro = dialog.querySelector('.lead-intro');
  var onlineOnly = dialog.querySelectorAll('[data-online-only]');
  var mode = 'specialist';
  var INTRO = {
    specialist: 'Оставьте имя и телефон — мы перезвоним и согласуем удобное время консультации. Описывать ситуацию не нужно.',
    online: 'Оставьте имя и телефон и выберите день — мы перезвоним и согласуем время онлайн-консультации. Описывать ситуацию не нужно.'
  };
  var phone = form.elements.phone;
  var opener = null;
  var ENDPOINT = 'api/lead.php';
  var FALLBACK = 'Не получилось отправить заявку. Позвоните нам: <a href="tel:+79029083003">+7 902 908 30 03</a>.';

  function digits(v) {
    var d = v.replace(/\D/g, '');
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d && d[0] !== '7') d = '7' + d;
    return d.slice(0, 11);
  }
  function formatPhone(v) {
    var d = digits(v);
    if (!d) return '';
    var r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length >= 4) r += ')';
    if (d.length > 4) r += ' ' + d.slice(4, 7);
    if (d.length > 7) r += '-' + d.slice(7, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    return r;
  }
  phone.addEventListener('input', function () { phone.value = formatPhone(phone.value); });

  function showError(html) { errorBox.innerHTML = html; errorBox.hidden = false; }

  function open(link) {
    opener = link;
    mode = link.getAttribute('data-mode') === 'online' ? 'online' : 'specialist';
    var who = mode === 'online' ? 'Юлия Юрьевна Бердникова' : (link.getAttribute('data-specialist') || '');
    var service = link.getAttribute('data-service') || '';
    form.elements.specialist.value = who;
    form.elements.service.value = mode === 'online' ? service : '';
    var short = who.split(' ');
    if (mode === 'online') title.textContent = 'Онлайн: ' + (service ? service.toLowerCase() : 'консультация');
    else title.textContent = who ? 'Запись к ' + (short[0] === 'Ольга' ? 'Ольге Авдашиной' : who) : 'Заявка на консультацию';
    intro.textContent = INTRO[mode];
    onlineOnly.forEach(function (el) { el.hidden = mode !== 'online'; });
    form.hidden = false; done.hidden = true; errorBox.hidden = true;
    document.documentElement.classList.add('booking-open');
    dialog.showModal();
    form.elements.name.focus();
  }
  function close() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    var finished = false;
    function finish() {
      if (finished) return; finished = true;
      dialog.classList.remove('is-closing');
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove('booking-open');
      if (opener) opener.focus();
    }
    dialog.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 400);
  }

  document.querySelectorAll('[data-lead-open]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (typeof dialog.showModal !== 'function') return;
      e.preventDefault();
      open(link);
    });
  });
  dialog.querySelectorAll('[data-lead-close]').forEach(function (b) { b.addEventListener('click', close); });
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dialog.addEventListener('click', function (e) {
    if (e.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;
    var name = form.elements.name.value.trim();
    var tel = digits(phone.value);
    if (!name) { showError('Укажите имя.'); form.elements.name.focus(); return; }
    if (tel.length !== 11) { showError('Укажите телефон полностью: +7 и 10 цифр.'); phone.focus(); return; }
    if (!form.elements.privacy.checked || !form.elements.consent.checked) { showError('Чтобы отправить заявку, отметьте обе галочки.'); return; }

    var day = '';
    if (mode === 'online') {
      var picked = form.querySelector('input[name="day"]:checked:not(:disabled)');
      if (!picked) { showError('Выберите день онлайн-консультации.'); return; }
      day = picked.value;
    }

    var data = {
      kind: mode,
      specialist: form.elements.specialist.value,
      service: form.elements.service.value,
      day: day,
      name: name,
      phone: formatPhone(tel),
      website: form.elements.website.value,
      privacy: true,
      consent: true,
      consent_version: document.documentElement.getAttribute('data-consent-version') || '',
      page: location.href.split('#')[0]
    };
    submit.disabled = true; submit.textContent = 'Отправляем…';
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.body && res.body.ok) {
          form.reset(); form.hidden = true; done.hidden = false;
          if (window.ym && window.PB_METRIKA) window.ym(window.PB_METRIKA, 'reachGoal', mode === 'online' ? 'online' : 'lead');
        } else if (res.status === 429) {
          showError('Заявок с этого устройства слишком много. Попробуйте позже или позвоните: <a href="tel:+79029083003">+7 902 908 30 03</a>.');
        } else {
          showError(FALLBACK);
        }
      })
      .catch(function () { showError(FALLBACK); })
      .then(function () { submit.disabled = false; submit.textContent = 'Отправить заявку'; });
  });
})();
