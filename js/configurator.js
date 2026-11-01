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
  var shapeInputs = [].slice.call(root.querySelectorAll('input[name="shape"]'));
  var colorInputs = [].slice.call(root.querySelectorAll('input[name="color"]'));

  var MIN_FONT_PX = 6;
  var MAX_SCALE = 1.1;       // во сколько раз показываем превью относительно исходных файлов
  var WIDEST_TAG_PX = 320;   // косточка
  var TALLEST_TAG_PX = 348;  // сердечко и круг вместе с кольцом
  var firstFocus = true;

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
    var scale = Math.min(MAX_SCALE, (width - 32) / WIDEST_TAG_PX, (height - 72) / TALLEST_TAG_PX);
    tag.style.setProperty('--k', Math.max(0.4, scale).toFixed(3));
  }

  // Подгоняем размер шрифта, чтобы надпись целиком помещалась на площадке адресника
  function fit() {
    textBox.style.removeProperty('--fit');
    var boxWidth = textBox.clientWidth;
    var textWidth = label.getBoundingClientRect().width;
    if (!boxWidth || !textWidth || textWidth <= boxWidth) return;
    var fontSize = parseFloat(window.getComputedStyle(label).fontSize);
    textBox.style.setProperty('--fit', Math.max(MIN_FONT_PX, fontSize * boxWidth / textWidth) + 'px');
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
})();
