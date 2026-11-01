(function () {
  'use strict';

  var root = document.getElementById('config');
  if (!root) return;

  var stage = root.querySelector('.config__stage');
  var tag = root.querySelector('.tag');
  var images = [].slice.call(root.querySelectorAll('.tag__img'));
  var thumbs = [].slice.call(root.querySelectorAll('.opt__thumb'));
  var textBox = root.querySelector('.tag__text');
  var label = root.querySelector('.tag__label');
  var caption = root.querySelector('.config__caption');
  var input = document.getElementById('tag-text');
  var counter = root.querySelector('.input__count');
  var priceEl = root.querySelector('.config__price');
  var shapeInputs = [].slice.call(root.querySelectorAll('input[name="shape"]'));
  var colorInputs = [].slice.call(root.querySelectorAll('input[name="color"]'));

  var MAX_FONT_PX = 84;      // кегль надписи из одной буквы (в пикселях исходных превью)
  var MIN_FONT_PX = 12;      // кегль надписи из максимального числа букв
  var MAX_SCALE = 1.1;       // во сколько раз показываем превью относительно исходных файлов
  var WIDEST_TAG_PX = 320;   // косточка
  var TALLEST_TAG_PX = 348;  // сердечко и круг вместе с кольцом
  var firstFocus = true;
  var scale = 1;
  var measurer = label.cloneNode(false);
  measurer.removeAttribute('data-text');
  measurer.className = 'tag__label tag__label--measure';
  measurer.setAttribute('aria-hidden', 'true');
  textBox.appendChild(measurer);

  function checked(inputs) {
    for (var i = 0; i < inputs.length; i++) if (inputs[i].checked) return inputs[i];
    return inputs[0];
  }

  function optionName(radio) {
    return radio.closest('.opt').querySelector('.opt__name').textContent.trim();
  }

  // Масштаб адресника зависит от размера сцены: на узких экранах косточка не должна упираться в края
  function layout() {
    var width = stage.clientWidth;
    var height = stage.clientHeight;
    if (!width || !height) return;
    scale = Math.max(0.4, Math.min(MAX_SCALE, (width - 32) / WIDEST_TAG_PX, (height - 72) / TALLEST_TAG_PX));
    tag.style.setProperty('--k', scale.toFixed(3));
  }

  // Ширина текста при кегле 1 px (считаем по невидимой копии, чтобы не зависеть от текущего размера)
  function widthPerPx(text) {
    measurer.textContent = text;
    return measurer.getBoundingClientRect().width / 100;
  }

  // Кегль зависит от числа букв: одна буква — самый крупный, дальше с каждой новой меньше.
  // Если надпись всё равно шире площадки (например, «ШШШШ»), добавляем страховку по ширине
  function fit() {
    var text = label.textContent;
    var max = input.maxLength > 1 ? input.maxLength : 16;
    var progress = Math.min(1, Math.max(0, (text.length - 1) / (max - 1)));
    var size = (MAX_FONT_PX - (MAX_FONT_PX - MIN_FONT_PX) * progress) * scale;
    var boxWidth = textBox.clientWidth;
    var perPx = text ? widthPerPx(text) : 0;
    if (boxWidth && perPx && perPx * size > boxWidth) size = boxWidth / perPx;
    textBox.style.setProperty('--fit', size.toFixed(2) + 'px');
  }

  // 1190 → «от 1 190 ₽» (неразрывные пробелы, чтобы цена не рвалась на две строки)
  function formatPrice(value) {
    return 'от ' + String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  function describe() {
    var shape = optionName(checked(shapeInputs));
    var color = optionName(checked(colorInputs));
    var text = label.textContent.toUpperCase();
    caption.textContent = shape + ' · ' + color;
    tag.setAttribute('aria-label', 'Превью адресника: ' + shape.toLowerCase() + ', ' + color.toLowerCase() +
      (text ? ', надпись «' + text + '»' : ', без надписи'));
  }

  function updateOptions() {
    var shape = checked(shapeInputs).value;
    var color = checked(colorInputs).value;
    // Цена зависит только от формы: от цвета и текста не меняется
    priceEl.textContent = formatPrice(checked(shapeInputs).getAttribute('data-price'));
    stage.setAttribute('data-shape', shape);
    stage.setAttribute('data-color', color);
    images.forEach(function (img) {
      img.classList.toggle('is-active', img.getAttribute('data-shape') === shape && img.getAttribute('data-color') === color);
    });
    // Миниатюры форм показываем в выбранном цвете
    thumbs.forEach(function (thumb) {
      thumb.src = 'assets/img/tags/' + thumb.getAttribute('data-thumb') + '-' + color + '.webp';
    });
    fit();
    describe();
  }

  function updateText() {
    var value = input.value.replace(/\s+/g, ' ').trim();
    label.textContent = value;
    label.setAttribute('data-text', value);
    counter.textContent = input.value.length + ' / ' + input.maxLength;
    fit();
    describe();
  }

  shapeInputs.concat(colorInputs).forEach(function (radio) {
    radio.addEventListener('change', updateOptions);
  });
  input.addEventListener('input', updateText);

  // При первом фокусе выделяем пример («Лекс»), чтобы можно было сразу печатать своё
  input.addEventListener('focus', function () {
    if (!firstFocus) return;
    firstFocus = false;
    input.select();
  });

  // Ширина площадки зависит от размера экрана и от загрузки шрифта
  function relayout() {
    layout();
    fit();
  }
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(stage);
  else window.addEventListener('resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  layout();
  updateOptions();
  updateText();

  // Выбранные параметры для формы заказа (js/order.js)
  window.MetkaConfigurator = {
    getState: function () {
      return {
        shape: optionName(checked(shapeInputs)),
        color: optionName(checked(colorInputs)),
        text: label.textContent,
        price: priceEl.textContent
      };
    }
  };
})();
