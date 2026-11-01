(function () {
  'use strict';

  var dialog = document.getElementById('order');
  var form = document.getElementById('order-form');
  var toast = document.getElementById('toast');
  var openers = [].slice.call(document.querySelectorAll('[data-order-open]'));
  if (!dialog || !form || !toast || !openers.length) return;

  var title = document.getElementById('order-title');
  var closeButtons = [].slice.call(dialog.querySelectorAll('[data-order-close]'));
  var fields = [
    { input: document.getElementById('order-name'), error: document.getElementById('order-name-error'), message: 'Введите ФИО' },
    { input: document.getElementById('order-contact'), error: document.getElementById('order-contact-error'), message: 'Укажите телефон, e-mail или ссылку на мессенджер' }
  ];
  var summary = {
    shape: dialog.querySelector('[data-order-shape]'),
    color: dialog.querySelector('[data-order-color]'),
    text: dialog.querySelector('[data-order-text]'),
    price: dialog.querySelector('[data-order-price]')
  };

  var CLOSE_MS = 300;          // совпадает с transition панели в css/styles.css
  var TOAST_MS = 5000;         // сколько показываем уведомление
  var TOAST_FADE_MS = 300;
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var finePointer = window.matchMedia ? window.matchMedia('(pointer: fine)') : { matches: true };
  var root = document.documentElement;
  var lastOpener = null;
  var closing = false;
  var toastTimer = 0;
  var toastClearTimer = 0;

  // ---------- Чекаут: подтягиваем выбор из конструктора ----------
  function fillSummary() {
    var state = window.MetkaConfigurator && window.MetkaConfigurator.getState();
    if (!state) return;
    var text = state.text.toUpperCase();   // на адреснике надпись набрана заглавными
    summary.shape.textContent = state.shape;
    summary.color.textContent = state.color;
    summary.text.textContent = text || 'без надписи';
    summary.text.classList.toggle('is-empty', !text);
    summary.price.textContent = state.price;
  }

  // ---------- Проверка полей ----------
  function setError(field, message) {
    field.error.hidden = !message;
    field.error.textContent = message || '';
    if (message) field.input.setAttribute('aria-invalid', 'true');
    else field.input.removeAttribute('aria-invalid');
  }

  function validate() {
    var firstInvalid = null;
    fields.forEach(function (field) {
      var empty = !field.input.value.trim();
      setError(field, empty ? field.message : '');
      if (empty && !firstInvalid) firstInvalid = field.input;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  fields.forEach(function (field) {
    field.input.addEventListener('input', function () {
      if (field.input.value.trim()) setError(field, '');
    });
  });

  // ---------- Открытие и закрытие ----------
  function openDialog(opener) {
    if (dialog.open || closing) return;
    lastOpener = opener;
    fillSummary();
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute('open', '');
    root.classList.add('has-order');
    void dialog.offsetWidth;               // фиксируем начальное положение, чтобы панель именно выехала
    dialog.classList.add('is-open');
    // На телефоне не открываем клавиатуру сразу — она закроет чекаут
    (finePointer.matches ? fields[0].input : title).focus({ preventScroll: true });
  }

  function closeDialog(done) {
    if (!dialog.open || closing) return;
    closing = true;
    dialog.classList.remove('is-open');
    window.setTimeout(function () {
      if (dialog.close) dialog.close();
      else dialog.removeAttribute('open');
      root.classList.remove('has-order');
      closing = false;
      if (lastOpener) lastOpener.focus({ preventScroll: true });
      if (done) done();
    }, reduceMotion.matches ? 0 : CLOSE_MS);
  }

  openers.forEach(function (button) {
    button.addEventListener('click', function () { openDialog(button); });
  });
  closeButtons.forEach(function (button) {
    button.addEventListener('click', function () { closeDialog(); });
  });

  // Esc закрываем сами, чтобы панель успела уехать вверх
  dialog.addEventListener('cancel', function (e) {
    e.preventDefault();
    closeDialog();
  });

  // Клик по затемнению. Если выделение текста началось в поле и закончилось за панелью, форму не закрываем
  var pressedOnBackdrop = false;
  dialog.addEventListener('mousedown', function (e) { pressedOnBackdrop = e.target === dialog; });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog && pressedOnBackdrop) closeDialog();
    pressedOnBackdrop = false;
  });

  // ---------- Уведомление ----------
  function hideToast() {
    window.clearTimeout(toastTimer);
    toast.classList.remove('is-visible');
    window.clearTimeout(toastClearTimer);
    toastClearTimer = window.setTimeout(function () { toast.textContent = ''; }, TOAST_FADE_MS + 50);
  }

  function showToast(lead, text) {
    window.clearTimeout(toastTimer);
    window.clearTimeout(toastClearTimer);
    toast.textContent = '';

    var card = document.createElement('div');
    card.className = 'toast__card';
    var icon = document.createElement('span');
    icon.className = 'toast__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.4l3 3 6-6.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var message = document.createElement('p');
    message.className = 'toast__text';
    var strong = document.createElement('b');
    strong.textContent = lead;
    message.appendChild(strong);
    message.appendChild(document.createTextNode(' ' + text));
    card.appendChild(icon);
    card.appendChild(message);
    card.addEventListener('click', hideToast);
    toast.appendChild(card);

    void toast.offsetWidth;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(hideToast, TOAST_MS);
  }

  // ---------- Отправка ----------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (closing || !validate()) return;
    // Сайт тестовый: заявка никуда не отправляется. Когда появится приём заказов, данные брать здесь:
    // fields[0].input.value (ФИО), fields[1].input.value (контакты) и window.MetkaConfigurator.getState()
    closeDialog(function () {
      form.reset();
      fields.forEach(function (field) { setError(field, ''); });
      showToast('Заказ принят!', 'Ожидайте звонка или сообщения для подтверждения.');
    });
  });
})();
