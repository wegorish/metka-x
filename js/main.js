(function () {
  'use strict';

  var header = document.querySelector('.header');
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  var desktopQuery = window.matchMedia('(min-width: 1200px)');

  if (!header || !burger || !nav) return;

  function setMenu(open) {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  burger.addEventListener('click', function () {
    setMenu(!header.classList.contains('is-open'));
  });

  // Закрываем меню после перехода по ссылке, по Esc, по клику мимо и при переходе на десктоп
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (header.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
  });

  function onBreakpoint(e) {
    if (e.matches) setMenu(false);
  }
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onBreakpoint);
  else desktopQuery.addListener(onBreakpoint);

  // Ссылки-заглушки (Telegram, MAX, соцсети) пока никуда не ведут
  document.querySelectorAll('a[data-placeholder]').forEach(function (link) {
    link.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
