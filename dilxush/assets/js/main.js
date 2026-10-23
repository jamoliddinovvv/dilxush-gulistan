/* =========================================================
   DILXUSH — интерактив и анимации
   Зависимости: i18n.js (window.I18n), menu-data.js (window.DILXUSH_MENU),
   GSAP + ScrollTrigger + Lenis (необязательны — без них сайт работает статично).
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Два режима анимации:
  //  full — всё: параллакс, плавный скролл, закреплённая галерея, «шторки»;
  //  calm — если в системе включено «уменьшение движения»: только мягкие
  //         проявления (opacity), без движения по экрану. ?motion=1 включает full.
  const forceMotion = root.classList.contains('force-motion');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const animate = hasGSAP;
  const fullMotion = hasGSAP && (forceMotion || !prefersReduced);
  const reduceMotion = !fullMotion;
  const isDesktop = () => window.matchMedia('(min-width: 1000px)').matches;

  const { t, pick } = window.I18n;
  const MENU = window.DILXUSH_MENU;
  // Фото: WebP (легче на ~четверть, на глаз неотличим) с JPG-запасом для старых телефонов.
  let webpOK = false;
  (() => { const i = new Image(); i.onload = () => { webpOK = i.width === 1; }; i.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='; })();
  const imgSrc = (name) => `assets/img/${name}.${webpOK ? 'webp' : 'jpg'}`;
  // размеры файлов: полный, -sm (560 px), -xs (200 px, миниатюры) — браузер берёт наименьший достаточный
  const FULL_W = { samsa: 1024 };
  const variants = (name, ext, withXs) =>
    [withXs && `assets/img/${name}-xs.${ext} 200w`, `assets/img/${name}-sm.${ext} 560w`, `assets/img/${name}.${ext} ${FULL_W[name] || 825}w`]
      .filter(Boolean).join(', ');
  const picture = (name, attrs, sizes, withXs = false) =>
    `<picture><source type="image/webp" srcset="${variants(name, 'webp', withXs)}" sizes="${sizes}">` +
    `<img src="assets/img/${name}.jpg" srcset="${variants(name, 'jpg', withXs)}" sizes="${sizes}" ${attrs}></picture>`;
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- toast ---------- */
  const toastEl = $('[data-toast]');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3400);
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (fullMotion && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ duration: 1.15, easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) return lenis.scrollTo(target, { duration: 1.4 });
    const behavior = reduceMotion ? 'auto' : 'smooth';
    if (target === 0) window.scrollTo({ top: 0, behavior });
    else target.scrollIntoView({ behavior });
  }

  /* ---------- mobile nav ---------- */
  const burger = $('[data-burger]');
  const mnav = $('#mobile-nav');
  const isMenuOpen = () => root.classList.contains('menu-open');

  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mnav.setAttribute('aria-hidden', String(!open));
    updateBurgerLabel();
    if (lenis) open ? lenis.stop() : lenis.start();
    else document.body.style.overflow = open ? 'hidden' : '';
    updateDock();
  }
  burger.addEventListener('click', () => setMenu(!isMenuOpen()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen()) { setMenu(false); burger.focus(); }
  });

  /* ---------- links: якоря и «появится позже» ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (a.hasAttribute('data-soon')) {
      e.preventDefault();
      toast(t(a.dataset.soon));
      return;
    }
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#') || href === '#') return;
    const target = href === '#top' ? 0 : $(href);
    if (target === null) return;
    e.preventDefault();
    const wasOpen = isMenuOpen();
    if (wasOpen) setMenu(false);
    setTimeout(() => scrollToTarget(target), wasOpen ? 450 : 0);
  });

  /* ---------- язык: короткое затухание текста, смена, проявление ---------- */
  let switching = false;
  $$('[data-lang-btn]').forEach((btn) => btn.addEventListener('click', () => {
    const next = btn.dataset.langBtn;
    if (switching || next === window.I18n.getLang()) return;
    switching = true;
    root.classList.add('lang-fade');
    setTimeout(() => {
      window.I18n.setLang(next);
      requestAnimationFrame(() => {
        root.classList.remove('lang-fade');
        switching = false;
      });
    }, reduceMotion ? 0 : 220);
  }));

  // подпись кнопки меню зависит и от языка, и от того, открыто ли меню
  const updateBurgerLabel = () => burger.setAttribute('aria-label', t(isMenuOpen() ? 'nav.close' : 'nav.open'));
  updateBurgerLabel();
  document.addEventListener('langchange', updateBurgerLabel);

  /* ---------- выбор языка при открытии сайта ----------
     Спрашиваем один раз за визит (sessionStorage): перезагрузка и переходы
     по странице не спрашивают снова, новое открытие сайта — спрашивает.
     Переключатель RU / UZ в шапке остаётся. Вступление ждёт выбора. */
  const ASKED_KEY = 'dilxush-lang-asked';
  const picker = $('[data-langpick]');
  let resolveLang;
  const langChosen = new Promise((r) => { resolveLang = r; });
  let asked = false;
  try { asked = sessionStorage.getItem(ASKED_KEY) === '1'; } catch (e) { /* приватный режим — спросим */ }

  if (!picker || asked) {
    resolveLang();
  } else {
    const btns = $$('[data-pick]', picker);
    const choose = (lang) => {
      try { sessionStorage.setItem(ASKED_KEY, '1'); } catch (e) { /* ignore */ }
      if (lang !== window.I18n.getLang()) window.I18n.setLang(lang);
      picker.classList.remove('is-open');
      root.classList.remove('langpick-open');
      if (lenis) lenis.start();
      setTimeout(() => { picker.hidden = true; }, reduceMotion ? 0 : 500);
      resolveLang();
    };
    btns.forEach((b) => b.addEventListener('click', () => choose(b.dataset.pick)));
    picker.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); choose(window.I18n.getLang()); return; }
      if (e.key !== 'Tab') return;
      // фокус не уходит из окна
      const i = btns.indexOf(document.activeElement);
      e.preventDefault();
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
    });
    picker.hidden = false;
    root.classList.add('langpick-open');
    if (lenis) lenis.stop();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      picker.classList.add('is-open');
      btns[0].focus({ preventScroll: true });
    }));
  }

  /* ---------- header: прячется при скролле вниз ---------- */
  const header = $('[data-header]');
  const hero = $('.hero');
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    if (Math.abs(y - lastY) > 4) {
      const hide = y > lastY && y > 240 && !isMenuOpen();
      header.classList.toggle('is-hidden', hide);
      root.style.setProperty('--header-offset', hide ? '0px' : 'var(--header-h)');
    }
    lastY = y;
    updateDock();
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- активный пункт навигации ---------- */
  const navLinks = $$('.nav__link, .mnav__link');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const id = `#${en.target.id}`;
      navLinks.forEach((l) => {
        if (l.getAttribute('href') === id) l.classList.toggle('is-active', en.isIntersecting);
      });
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  ['#about', '#menu', '#atmosphere', '#experience', '#contacts'].forEach((id) => { const s = $(id); if (s) sectionIO.observe(s); });

  /* ---------- мобильная панель ---------- */
  const dock = $('[data-dock]');
  const dockHiddenBy = new Set();
  const dockIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => (en.isIntersecting ? dockHiddenBy.add(en.target) : dockHiddenBy.delete(en.target)));
    updateDock();
  }, { threshold: 0.1 });
  [$('#contacts'), $('.footer')].forEach((el) => dockIO.observe(el));

  // высоту первого экрана кэшируем — не читаем layout на каждом кадре скролла
  let heroH = hero.offsetHeight;
  window.addEventListener('resize', () => { heroH = hero.offsetHeight; }, { passive: true });

  function updateDock() {
    const show = window.scrollY > heroH * 0.75 && dockHiddenBy.size === 0 && !isMenuOpen();
    dock.classList.toggle('is-visible', show);
  }

  /* =========================================================
     MENU (данные — assets/js/menu-data.js)
     ========================================================= */
  const priceHTML = (price) =>
    `<span class="${price ? '' : 'ph'}">${price || t('menu.ph.price')}</span><small>${t('menu.currency')}</small>`;

  /* ---- «Стоит попробовать» ---- */
  const FEAT_SHAPES = ['arch', '', 'star']; // арка, прямоугольник, звезда
  const featEl = $('[data-featured]');
  featEl.innerHTML = MENU.featured.map((d, i) => `
    <article class="feat feat--${i + 1}">
      <figure class="feat__img frame ${FEAT_SHAPES[i] || ''}" data-reveal-img>
        ${picture(d.img, 'alt="" loading="lazy" decoding="async" data-parallax-img', '(min-width: 1000px) 40vw, 90vw')}
      </figure>
      <div class="feat__meta" data-reveal>
        <span class="feat__num">${pad(i + 1)}</span>
        <h4 class="feat__name"></h4>
        <p class="feat__price"></p>
        <p class="feat__desc"></p>
      </div>
    </article>`).join('');

  function fillFeatured() {
    $$('.feat', featEl).forEach((el, i) => {
      const d = MENU.featured[i];
      $('.feat__name', el).textContent = pick(d.name) || t('menu.ph.name');
      $('.feat__desc', el).textContent = pick(d.desc) || t('menu.ph.descShort');
      $('.feat__price', el).innerHTML = priceHTML(d.price);
      $('img', el).alt = pick(d.name);
    });
  }

  /* ---- полное меню: вкладки + список ---- */
  const tabsEl = $('[data-menu-tabs]');
  const listEl = $('[data-menu-list]');
  let currentCat = MENU.categories[0].id;

  function renderTabs() {
    tabsEl.innerHTML = MENU.categories.map((cat) => {
      const on = cat.id === currentCat;
      return `<button class="menu-tab" role="tab" id="tab-${cat.id}" data-cat="${cat.id}"
        aria-selected="${on}" tabindex="${on ? 0 : -1}">${pick(cat.title)}<sup>${cat.items.length}</sup></button>`;
    }).join('');
  }

  function dishHTML(item, i) {
    const name = pick(item.name) || t('menu.ph.name');
    const desc = pick(item.desc) || t(item.short ? 'menu.ph.descShort' : 'menu.ph.desc');
    const tag = pick(item.tag);
    return `
      <li class="dish" data-img="${item.img}">
        <div class="dish__thumb">${picture(item.img, 'alt="" loading="lazy"', '56px', true)}</div>
        <span class="dish__num">${pad(i + 1)}</span>
        <div class="dish__body">
          <h4 class="dish__name">${name}${tag ? `<span class="dish__tag">${tag}</span>` : ''}</h4>
          <p class="dish__desc">${desc}</p>
        </div>
        <p class="dish__price">${priceHTML(item.price)}</p>
      </li>`;
  }

  function renderList(withAnim) {
    const paint = () => {
      const cat = MENU.categories.find((c) => c.id === currentCat);
      listEl.innerHTML = cat.items.map(dishHTML).join('');
      listEl.parentElement.setAttribute('aria-labelledby', `tab-${cat.id}`);
      if (withAnim && animate) {
        gsap.fromTo($$('.dish', listEl), { y: fullMotion ? 24 : 0, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .8, stagger: .06, ease: 'expo.out', clearProps: 'transform,opacity,visibility' });
      }
      if (hasGSAP) ScrollTrigger.refresh();
    };
    const rows = $$('.dish', listEl);
    if (withAnim && animate && rows.length) {
      gsap.killTweensOf(rows);
      gsap.to(rows, { y: fullMotion ? -12 : 0, autoAlpha: 0, duration: .28, stagger: .02, ease: 'power2.in', onComplete: paint });
    } else {
      paint();
    }
  }

  function selectTab(btn, focus) {
    if (btn.dataset.cat === currentCat) return;
    currentCat = btn.dataset.cat;
    $$('.menu-tab', tabsEl).forEach((tab) => {
      const on = tab === btn;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    if (focus) btn.focus();
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    renderList(true);
  }

  tabsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.menu-tab');
    if (btn) selectTab(btn, false);
  });
  tabsEl.addEventListener('keydown', (e) => {
    const tabs = $$('.menu-tab', tabsEl);
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: tabs[(i + 1) % tabs.length], ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length],
      Home: tabs[0], End: tabs[tabs.length - 1] }[e.key];
    if (next) { e.preventDefault(); selectTab(next, true); }
  });

  fillFeatured();
  renderTabs();
  renderList(false);

  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- светлая / тёмная тема ----------
     По умолчанию — светлая. Выбор запоминается (localStorage);
     тема ставится ещё в <head>, поэтому при загрузке нет вспышки. */
  const themeBtn = $('[data-theme-toggle]');
  const themeMeta = $('meta[name="theme-color"]');
  const isDark = () => root.getAttribute('data-theme') === 'dark';
  function syncThemeButton() {
    const label = t(isDark() ? 'theme.toLight' : 'theme.toDark');
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
    themeBtn.setAttribute('aria-pressed', String(isDark()));
  }
  function applyTheme(dark) {
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    themeMeta.setAttribute('content', dark ? '#1C1915' : '#F4EFE7');
    try { localStorage.setItem('dilxush-theme', dark ? 'dark' : 'light'); } catch (e) { /* приватный режим */ }
    syncThemeButton();
  }
  let themeBusy = false;
  function setTheme(dark) {
    if (themeBusy) return;
    if (reduceMotion) { applyTheme(dark); return; }
    // Лучший вариант: браузер делает снимок страницы и плавно растворяет
    // старую тему в новой — всё меняется одновременно, одним движением.
    if (document.startViewTransition) {
      themeBusy = true;
      root.classList.add('theme-vt');
      const vt = document.startViewTransition(() => applyTheme(dark));
      vt.finished.finally(() => { root.classList.remove('theme-vt'); themeBusy = false; });
      return;
    }
    // Запасной вариант (старые браузеры): переход цветов у каждого элемента
    root.classList.add('theme-anim');
    applyTheme(dark);
    clearTimeout(setTheme.timer);
    setTheme.timer = setTimeout(() => root.classList.remove('theme-anim'), 750);
  }
  themeBtn.addEventListener('click', () => setTheme(!isDark()));
  syncThemeButton();
  document.addEventListener('langchange', syncThemeButton);

  /* ---------- открыто / закрыто ----------
     Часы подтверждены рестораном: ежедневно 09:00–22:00.
     Считаем по времени Ташкента (UTC+5, без перехода на летнее время),
     поэтому статус верный, где бы ни находился посетитель. */
  const HOURS = { open: 9 * 60, close: 22 * 60, soonMin: 60 };
  const statusEls = $$('[data-open-status]');
  function renderStatus() {
    const now = new Date(Date.now() + 5 * 3600e3); // «часы» Ташкента в UTC-полях
    const min = now.getUTCHours() * 60 + now.getUTCMinutes();
    let state;
    if (min >= HOURS.open && min < HOURS.close) state = HOURS.close - min <= HOURS.soonMin ? 'soon' : 'open';
    else state = min < HOURS.open ? 'closedMorning' : 'closedNight';
    const cls = state === 'open' ? 'is-open' : state === 'soon' ? 'is-soon' : 'is-closed';
    statusEls.forEach((el) => {
      el.textContent = t(`status.${state}`);
      el.classList.remove('is-open', 'is-soon', 'is-closed');
      el.classList.add(cls);
    });
  }
  renderStatus();
  // обновлять в начале каждой минуты
  setTimeout(() => { renderStatus(); setInterval(renderStatus, 60e3); }, 60e3 - (Date.now() % 60e3));
  document.addEventListener('langchange', renderStatus);

  /* ---------- карта: грузится только при подключении к интернету ----------
     Без сети вместо страницы ошибки остаётся фон-сетка со звездой и кнопки
     маршрута; появится сеть — карта подгрузится сама. */
  const mapFrame = $('[data-map-src]');
  if (mapFrame) {
    const loadMap = () => {
      if (mapFrame.src || !navigator.onLine) return;
      mapFrame.addEventListener('load', () => mapFrame.classList.add('is-loaded'), { once: true });
      mapFrame.src = mapFrame.dataset.mapSrc;
    };
    loadMap();
    window.addEventListener('online', loadMap);
  }

  /* ---------- фото проявляются по мере загрузки ---------- */
  $$('main img, .footer img').forEach((img) => {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('fade-in', 'is-pending');
    const done = () => img.classList.remove('is-pending');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* ---------- разбивка заголовков на слова (для анимации) ---------- */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 1) { walk(child); return; }
        if (child.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        // делим только по обычным пробелам — неразрывные (&nbsp;) держат слова вместе
        child.textContent.split(/([ \n\t\r]+)/).forEach((tok) => {
          if (!tok) return;
          if (/^[ \n\t\r]+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.innerHTML = '<span></span>';
          w.firstChild.textContent = tok;
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      });
    };
    walk(el);
    return $$('.w > span', el);
  }

  /* ---------- смена языка: перерисовать то, что строит JS ---------- */
  document.addEventListener('langchange', () => {
    fillFeatured();
    renderTabs();
    renderList(false);
    if (animate) $$('[data-split]').forEach(splitWords);
    if (hasGSAP) ScrollTrigger.refresh(); // длина текста могла изменить высоту блоков
  });

  /* =========================================================
     ANIMATION
     ========================================================= */
  if (!animate) {
    root.classList.remove('is-loading');
    return;
  }
  root.classList.add('motion', fullMotion ? 'motion-full' : 'motion-calm');
  gsap.registerPlugin(ScrollTrigger);
  const EASE = 'expo.out';

  // Спрятать / показать: в full — сдвиг из-под маски, в calm — только проявление
  const HIDE = fullMotion ? { yPercent: 115 } : { autoAlpha: 0 };
  const SHOW = fullMotion ? { yPercent: 0 } : { autoAlpha: 1 };

  // восьмиконечная звезда как clip-path; s — масштаб от центра
  const STAR = [[100, 50], [85.36, 64.64], [85.36, 85.36], [64.64, 85.36], [50, 100], [35.36, 85.36], [14.64, 85.36], [14.64, 64.64],
    [0, 50], [14.64, 35.36], [14.64, 14.64], [35.36, 14.64], [50, 0], [64.64, 14.64], [85.36, 14.64], [85.36, 35.36]];
  const starPoly = (s) => `polygon(${STAR.map(([x, y]) => `${(50 + (x - 50) * s).toFixed(2)}% ${(50 + (y - 50) * s).toFixed(2)}%`).join(', ')})`;

  /* ---- вступление: оно же загрузка страницы ---- */
  const heroLines = $$('.hero__title .line > span');
  const heroFades = $$('[data-hero-fade]');
  const heroStar = $('[data-hero-star]');
  const heroImg = $('img', heroStar);
  const heroOutline = $('.hero__outline');
  const heroMark = $('[data-hero-mark]');
  const heroMarkImg = $('img', heroMark);

  // знак проявляется первым и медленнее всего — как фон, на который ложится остальное
  gsap.set(heroMarkImg, { autoAlpha: 0, scale: fullMotion ? 1.04 : 1 });
  gsap.set(heroLines, HIDE);
  gsap.set(heroFades, { y: fullMotion ? 24 : 0, autoAlpha: 0 });
  gsap.set(header, { yPercent: fullMotion ? -100 : 0, autoAlpha: fullMotion ? 1 : 0, transition: 'none' });
  if (fullMotion) {
    gsap.set(heroStar, { clipPath: starPoly(0) });
    gsap.set(heroImg, { scale: 1.35 });
    gsap.set(heroOutline, { autoAlpha: 0, scale: .8, rotation: -22.5 });
  } else {
    gsap.set([heroStar, heroOutline], { autoAlpha: 0 });
  }
  root.classList.remove('is-loading');

  // Вступление ждёт шрифты (но не дольше 1,2 с) — иначе текст выезжает запасным
  // шрифтом и «прыгает» — и выбор языка, чтобы гость увидел его уже на своём языке.
  const intro = gsap.timeline({ defaults: { ease: EASE }, paused: true });
  let introStarted = false;
  const startIntro = () => {
    if (introStarted) return;
    introStarted = true;
    // строки заголовка берём заново: после выбора узбекского они заменены новыми
    const lines = $$('.hero__title .line > span');
    gsap.set(lines, HIDE);
    intro.to(lines, { ...SHOW, duration: fullMotion ? 1.3 : 1, stagger: fullMotion ? .1 : .18 }, .3);
    intro.play();
  };
  const fontsReady = document.fonts && document.fonts.status !== 'loaded'
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))])
    : Promise.resolve();
  Promise.all([fontsReady, langChosen]).then(() => gsap.delayedCall(.15, startIntro));
  if (fullMotion) {
    intro
      .to(heroStar, { clipPath: starPoly(1), duration: 1.7, ease: 'expo.inOut' }, 0)
      .to(heroImg, { scale: 1, duration: 2.2 }, .2)
      .to(heroOutline, { autoAlpha: 1, scale: 1, rotation: 0, duration: 2 }, .6)
      .to(header, { yPercent: 0, duration: 1.1, clearProps: 'transform,transition' }, .5);
  } else {
    intro
      .to(heroStar, { autoAlpha: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .to(heroOutline, { autoAlpha: 1, duration: 1.4, ease: 'power2.out' }, .4)
      .to(header, { autoAlpha: 1, duration: .8, clearProps: 'opacity,visibility,transition' }, .5);
  }
  intro
    .to(heroMarkImg, { autoAlpha: 1, scale: 1, duration: 2.6, ease: 'power2.out' }, 0)
    .to(heroFades, { y: 0, autoAlpha: 1, duration: 1.1, stagger: .08 }, .75);

  /* =========================================================
     Только full: движение, привязанное к скроллу.
     Создаётся раньше остальных триггеров: закреплённая галерея добавляет
     высоту странице, и всё, что ниже неё, должно считаться уже с учётом этого.
     ========================================================= */
  if (fullMotion) {
    const heroScroll = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('[data-hero-visual]', { yPercent: 14, ease: 'none', scrollTrigger: heroScroll });
    // знак уходит медленнее содержимого — ощущение глубины, без вращения
    gsap.to(heroMark, { yPercent: 9, ease: 'none', scrollTrigger: { ...heroScroll } });
    gsap.to(heroOutline, { rotation: 22.5, ease: 'none', immediateRender: false, scrollTrigger: { ...heroScroll } });

    // лёгкий параллакс внутри кадра (запас в 20% заложен в .frame)
    $$('[data-parallax-img]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // атмосфера: кадр раскрывается на всю ширину
    gsap.fromTo('[data-band]',
      { clipPath: 'inset(7% 6% 7% 6% round 18px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'top 15%', scrub: true } });
    gsap.fromTo('[data-band-img]', { scale: 1.3 }, {
      scale: 1, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    // галерея: горизонтальный скролл на desktop
    gsap.matchMedia().add('(min-width: 1000px)', () => {
      const section = $('[data-gallery]');
      const track = $('[data-gallery-track]');
      const bar = $('[data-gallery-bar]');
      // offsetLeft не зависит от текущего transform трека
      const distance = () => Math.max(0, track.scrollWidth - (window.innerWidth - track.offsetLeft) + 40);

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
        },
      });

      $$('.g-item img', track).forEach((img) => {
        gsap.fromTo(img, { xPercent: -6, scale: 1.14 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      });
    });
  }

  /* ---- заголовки: по словам и по строкам ---- */
  // После смены языка текст заголовка заменяется целиком. Если заголовок ещё
  // не появлялся, анимация настраивается заново на новый текст; если уже
  // появился — новый текст просто остаётся видимым.
  function setupHeading(el) {
    if (el._reveal) el._reveal.scrollTrigger.kill();
    if (el._revealed) return;
    const isSplit = el.hasAttribute('data-split');
    const parts = isSplit ? $$('.w > span', el) : $$('.line > span', el);
    gsap.set(parts, HIDE);
    el._reveal = gsap.to(parts, {
      ...SHOW,
      duration: isSplit ? (fullMotion ? 1.2 : .9) : (fullMotion ? 1.3 : 1),
      stagger: isSplit ? (fullMotion ? .035 : .05) : (fullMotion ? .12 : .2),
      ease: EASE,
      onStart: () => { el._revealed = true; },
      scrollTrigger: { trigger: el, start: isSplit ? 'top 85%' : 'top 88%', once: true },
    });
  }
  $$('[data-split]').forEach((el) => splitWords(el));
  $$('[data-split], [data-lines]').forEach(setupHeading);
  document.addEventListener('langchange', () => {
    // заголовки уже разбиты на слова обработчиком выше
    $$('[data-split], [data-lines]').forEach(setupHeading);
  });

  /* ---- появление блоков ---- */
  // блоки, которые попали в кадр одновременно, появляются по очереди, а не разом
  gsap.set('[data-reveal]', { y: fullMotion ? 36 : 0, autoAlpha: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      y: 0, autoAlpha: 1, duration: 1.1, stagger: .12, ease: 'power3.out', overwrite: true,
    }),
  });

  // строки меню — лёгкая «лесенка» при первом появлении списка
  ScrollTrigger.create({
    trigger: listEl,
    start: 'top 85%',
    once: true,
    onEnter: () => gsap.from($$('.dish', listEl), {
      y: fullMotion ? 18 : 0, autoAlpha: 0, duration: .9, stagger: .07, ease: 'power3.out', clearProps: 'transform,opacity,visibility',
    }),
  });

  // фото: в full — «шторка» (звёздные — из центра), в calm — мягкое проявление
  $$('[data-reveal-img]').forEach((el) => {
    const st = { trigger: el, start: 'top 85%', once: true };
    if (!fullMotion) {
      gsap.from(el, { autoAlpha: 0, duration: 1.4, ease: 'power2.out', scrollTrigger: st });
      return;
    }
    const isStar = el.classList.contains('star');
    gsap.fromTo(el,
      { clipPath: isStar ? starPoly(0) : 'inset(100% 0% 0% 0%)' },
      { clipPath: isStar ? starPoly(1) : 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: st });
    const img = $('img', el);
    if (img) gsap.from(img, { scale: 1.3, duration: 2, ease: EASE, scrollTrigger: st });
  });

  /* ---- меню: фото блюда рядом с курсором (desktop) ---- */
  const preview = $('[data-menu-preview]');
  const previewImg = $('img', preview);
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: fullMotion ? .6 : 1 });
    const follow = fullMotion ? .6 : .9;
    const qx = gsap.quickTo(preview, 'x', { duration: follow, ease: 'power3' });
    const qy = gsap.quickTo(preview, 'y', { duration: follow, ease: 'power3' });
    const qr = fullMotion ? gsap.quickTo(preview, 'rotation', { duration: .8, ease: 'power3' }) : () => {};
    let lastX = 0;
    let shown = false;

    listEl.addEventListener('mousemove', (e) => {
      if (!isDesktop()) return;
      const dish = e.target.closest('.dish');
      if (!dish) return;
      qx(e.clientX + 40);
      qy(e.clientY);
      qr(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * .6));
      lastX = e.clientX;
      const src = imgSrc(dish.dataset.img);
      if (!previewImg.src.endsWith(src)) {
        previewImg.src = src;
        if (fullMotion) gsap.fromTo(previewImg, { scale: 1.2 }, { scale: 1, duration: .8, ease: EASE });
      }
      if (!shown) {
        shown = true;
        gsap.set(preview, { x: e.clientX + 40, y: e.clientY });
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: .6, ease: EASE, overwrite: 'auto' });
      }
    });
    listEl.addEventListener('mouseleave', () => {
      shown = false;
      gsap.to(preview, { autoAlpha: 0, scale: fullMotion ? .6 : 1, duration: .45, ease: 'power3.out', overwrite: 'auto' });
    });
  }

  /* ---- «За столом»: картинка слева сменяется вместе с шагом (обычный crossfade) ---- */
  const expSteps = $$('[data-exp-step]');
  const expImgs = $$('[data-exp-img]');
  let expIndex = -1;
  function setExp(i) {
    if (i === expIndex) return;
    expIndex = i;
    expSteps.forEach((s, j) => s.classList.toggle('is-active', j === i));
    expImgs.forEach((img, j) => img.classList.toggle('is-active', j === i));
  }
  // Активный шаг считается по положению, а не по событиям входа/выхода:
  // так состояние верное и после прыжков по странице («Наверх», пункты меню).
  const syncExp = () => {
    const line = window.innerHeight * 0.6;
    let i = 0;
    expSteps.forEach((s, j) => { if (s.getBoundingClientRect().top < line) i = j; });
    setExp(i);
  };
  syncExp();
  ScrollTrigger.create({
    trigger: '.exp__steps',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: syncExp,
    onToggle: syncExp,
    onRefresh: syncExp,
  });

  /* ---- подпись в подвале ---- */
  const word = $('.footer__word');
  const text = word.textContent;
  word.textContent = '';
  const chars = text.split('').map((ch) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = ch;
    word.appendChild(s);
    return s;
  });
  gsap.from(chars, {
    ...(fullMotion ? { yPercent: 105 } : { autoAlpha: 0 }),
    duration: fullMotion ? 1.4 : 1, stagger: .06, ease: EASE,
    scrollTrigger: { trigger: '.footer', start: 'top 75%', once: true },
  });

  /* ---- пересчёт после загрузки шрифтов и картинок ---- */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
