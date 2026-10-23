/* =========================================================
   Переводы (RU / UZ)

   Как это устроено:
   • Русский текст написан прямо в index.html — это исходник.
     У каждого переводимого элемента есть ключ: data-i18n="hero.eyebrow".
     Атрибуты переводятся так: data-i18n-attr="alt:img.plov;aria-label:nav.label".
   • Узбекский текст — в словаре UZ ниже, с теми же ключами.
     Ключ, которого нет в словаре, остаётся по-русски — сайт не ломается.
   • Заголовки, которые анимируются построчно (hero.title, atm.title, exp.title),
     переводятся массивом строк: ['Первая строка', '<em>вторая</em>'].
   • Строки, которые выводит JavaScript (меню, уведомления, подписи кнопок),
     лежат в STRINGS.
   • Узбекский — латиница; о‘/g‘ пишутся через ‘ (U+2018), тутуқ белгиси — ’ (U+2019),
     как в написании «O‘zbekcha» на сайте.
   ========================================================= */
(() => {
  'use strict';

  const DEFAULT_LANG = 'ru';
  const LANGS = ['ru', 'uz'];
  const STORAGE_KEY = 'dilxush-lang';

  /* ---------- строки для JavaScript ---------- */
  const STRINGS = {
    ru: {
      'menu.ph.name': 'Название блюда',
      'menu.ph.desc': 'Состав, вес и подача — из меню ресторана',
      'menu.ph.descShort': 'Короткое описание: 5–8 слов',
      'menu.ph.price': '00 000',
      'menu.currency': 'сум',
      'nav.open': 'Открыть меню',
      'nav.close': 'Закрыть меню',
      'theme.toDark': 'Включить тёмную тему',
      'theme.toLight': 'Включить светлую тему',
      // статус работы (часы: ежедневно 09:00–22:00, время Ташкента)
      'status.open': 'Сейчас открыто · до 22:00',
      'status.soon': 'Скоро закрываемся · в 22:00',
      'status.closedMorning': 'Сейчас закрыто · откроемся в 09:00',
      'status.closedNight': 'Сейчас закрыто · откроемся завтра в 09:00',
    },
    uz: {
      'menu.ph.name': 'Taom nomi',
      'menu.ph.desc': 'Tarkibi, og‘irligi va tortilishi — restoran menyusidan',
      'menu.ph.descShort': 'Qisqa tavsif: 5–8 so‘z',
      'menu.ph.price': '00 000',
      'menu.currency': 'so‘m',
      'nav.open': 'Menyuni ochish',
      'nav.close': 'Menyuni yopish',
      'theme.toDark': 'Qorong‘i rejimni yoqish',
      'theme.toLight': 'Yorug‘ rejimni yoqish',
      'status.open': 'Hozir ochiq · 22:00 gacha',
      'status.soon': 'Tez orada yopiladi · 22:00 da',
      'status.closedMorning': 'Hozir yopiq · 09:00 da ochiladi',
      'status.closedNight': 'Hozir yopiq · ertaga 09:00 da ochiladi',
    },
  };

  /* ---------- узбекский словарь для HTML ---------- */
  const UZ = {
    // <head>
    'meta.title': 'Dilxush — milliy taomlar, Guliston',
    'meta.description': '«Dilxush» — Gulistondagi milliy o‘zbek taomlari restorani. Har kuni 09:00–22:00, telefon: +998 67 226 30 03.',

    // навигация
    'nav.home': 'Dilxush — bosh sahifa',
    'nav.label': 'Sayt bo‘limlari',
    'nav.about': 'Restoran',
    'nav.menu': 'Menyu',
    'nav.atmosphere': 'Muhit',
    'nav.experience': 'Dasturxonda',
    'nav.contacts': 'Aloqa',
    'lang.label': 'Sayt tili',

    // первый экран
    'hero.eyebrow': 'Milliy taomlar restorani&nbsp;·&nbsp;Guliston',
    'hero.name': 'Dilxush',
    'hero.title': ['Ko‘ngilni <em>xush</em>', 'qiladigan ta’m'],
    'hero.ctaMenu': 'Menyuni ko‘rish',
    'hero.ctaContacts': 'Manzilimiz',
    'hero.scroll': 'Pastga suring',

    // подписи к фото (alt)
    'img.plov': 'Sopol lagandagi palov',
    'img.tea': 'Choynak va piyolalarda choy',
    'img.samsa': 'Naqshinkor lagandagi somsa',
    'img.dastarkhan': 'Dasturxon: choynak, quruq mevalar va yong‘oqlar',
    'img.shurpa': 'Sho‘rva',
    'img.salad': 'Achchiq-chuchuk salati',
    'img.manti': 'Manti',
    'img.lagman': 'Lag‘mon',

    // ресторан
    'about.label': 'Restoran',
    'about.statement': 'Nomining o‘zi hammasini aytib turibdi',
    'about.dil': 'yurak, ko‘ngil',
    'about.xush': 'shodlik, xushnudlik',
    'ph.textLabel': 'Vaqtinchalik matn',
    'about.story': 'Bu yerda «Dilxush» haqida qisqa hikoya bo‘ladi: restoranni kim ochgan, hammasi qanday boshlangan va mehmonlar bu yerda nimani yaxshi ko‘radi. 3–4 ta samimiy jumla — restoran egasi bilan birga yozamiz.',

    // меню
    'menu.label': 'Menyu',
    'menu.title': 'Bugun <em>dasturxonda</em> nimalar&nbsp;bor',
    'menu.note': 'Quyidagi taomlar, tavsiflar va narxlar vaqtinchalik. Haqiqiy menyuni restoran menyusidan qo‘shamiz.',
    'menu.featuredTitle': 'Albatta tatib ko‘ring',
    'menu.featuredHint': 'Birinchi navbatda ko‘rsatmoqchi bo‘lgan uchta taom. Restoran egasi bilan birga tanlaymiz.',
    'menu.fullTitle': 'To‘liq menyu',
    'menu.tabsLabel': 'Menyu bo‘limlari',
    'menu.footNote': 'Narxlar — so‘mda. <span class="ph">Xizmat ko‘rsatish shartlari — aniqlashtiriladi</span>',

    // атмосфера и галерея
    'atm.label': 'Muhit',
    'atm.title': ['Bemalol', '<em>o‘tiring</em>'],
    'gallery.title': 'Zal, oshxona, mehmonlar',
    'gallery.hint': 'Bu yerda «Dilxush»ning haqiqiy suratlari bo‘ladi. Har bir kadr uchun format tayyor — faqat fayllarni almashtirish qoladi.',
    'gallery.slotHall': 'Zal surati',
    'gallery.slotSoon': 'suratga olishdan keyin · 4:5',
    'gallery.slotTeam': 'Oshxona va&nbsp;jamoa',
    'gallery.slotSoon2': 'suratga olishdan keyin · 4:5',

    // за столом
    'exp.label': 'Dasturxonda',
    'exp.title': ['Dasturxonning', '<em>o‘z odati bor</em>'],
    'exp.s1.title': 'Avval — choy va&nbsp;non',
    'exp.s1.text': 'Dasturxon menyudan emas, choynak va issiq nondan boshlanadi. Nonni pichoq bilan kesishmaydi — qo‘lda ushatib, hammaga bo‘lib berishadi.',
    'exp.s2.title': 'Keyin — asosiy taom',
    'exp.s2.text': 'Issiq taom dasturxon o‘rtasiga qo‘yiladi va har kim o‘zi oladi. O‘zbek oilalarida shunday ovqatlanishadi — birgalikda, bitta lagandan.',
    'exp.s3.title': 'Hech kim shoshilmaydi',
    'exp.s3.text': 'Dasturxon atrofida uzoq o‘tirishadi: choy quyib turishadi, yana biror narsa tatib ko‘rishadi va hamma narsa haqida suhbatlashishadi.',
    'exp.note': '«Dilxush»ning o‘ziga xos an’analari bormi — taomni alohida tortish, kun taomi, oxirida choy? Ular haqida restoran egasi bilan suhbatdan keyin shu yerda yozamiz.',

    // контакты
    'contacts.label': 'Aloqa',
    'contacts.title': 'Bizni qanday <em>topasiz</em>',
    'contacts.lead': 'Har kuni 09:00 dan 22:00 gacha ishlaymiz.',
    'contacts.address': 'Manzil',
    'contacts.city': 'Guliston',
    'contacts.plusCode': 'Sirdaryo viloyati · xaritadagi joy kodi GQ3F+4VP',
    'contacts.addressValue': 'Guliston, Sirdaryo viloyati',
    'contacts.yandex': 'Yandex Xaritalar',
    'footer.route': 'Marshrut:',
    'contacts.phone': 'Telefon',
    'contacts.actionCall': 'Qo‘ng‘iroq qilish',
    'contacts.hours': 'Ish vaqti',
    'contacts.hoursValue': 'Har kuni, 09:00–22:00',
    'contacts.mapTitle': '«Dilxush» xaritada — GQ3F+4VP, Guliston',
    'contacts.mapCity': 'Guliston, Sirdaryo viloyati',

    // подвал и мобильная панель
    'footer.tagline': 'Milliy taomlar · Guliston',
    'footer.navLabel': 'Sayt bo‘limlari',
    'footer.nav': 'Bo‘limlar',
    'footer.contacts': 'Aloqa',
    'footer.demo': 'Demo-versiya. Suratlar vaqtinchalik.',
    'footer.up': 'Yuqoriga',
    'dock.label': 'Tezkor havolalar',
    'dock.route': 'Manzil',
    'dock.call': 'Qo‘ng‘iroq',
  };

  const DICT = { uz: UZ };

  /* ---------- снимок русского текста из HTML (до любых изменений DOM) ---------- */
  const sourceHTML = new Map();
  const sourceAttr = new Map();

  document.querySelectorAll('[data-i18n]').forEach((el) => sourceHTML.set(el, el.innerHTML));
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const pairs = el.dataset.i18nAttr.split(';').map((p) => p.split(':').map((s) => s.trim()));
    sourceAttr.set(el, pairs.map(([attr, key]) => ({ attr, key, ru: el.getAttribute(attr) })));
  });

  let lang = DEFAULT_LANG;

  const linesHTML = (arr) => arr.map((l) => `<span class="line"><span>${l}</span></span>`).join('');

  /** Есть ли перевод для языка (для RU — всегда да) */
  function isAvailable(l) {
    return l === DEFAULT_LANG || (DICT[l] && Object.keys(DICT[l]).length > 0);
  }

  /** Строка для JavaScript */
  function t(key) {
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.ru[key] || key;
  }

  /** Значение из данных: строка или { ru: '', uz: '' } */
  function pick(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[lang] || value.ru || '';
  }

  function apply() {
    const dict = DICT[lang] || {};
    sourceHTML.forEach((ru, el) => {
      const v = lang === DEFAULT_LANG ? null : dict[el.dataset.i18n];
      el.innerHTML = v == null ? ru : Array.isArray(v) ? linesHTML(v) : v;
    });
    sourceAttr.forEach((list, el) => {
      list.forEach(({ attr, key, ru }) => {
        const v = lang === DEFAULT_LANG ? null : dict[key];
        el.setAttribute(attr, v == null ? ru : v);
      });
    });
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-btn]').forEach((b) => {
      const on = b.dataset.langBtn === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  /** Переключить язык без перезагрузки. Возвращает false, если перевода нет. */
  function setLang(next) {
    if (!LANGS.includes(next) || !isAvailable(next)) return false;
    if (next === lang) return true;
    lang = next;
    apply();
    // выбор помнится в пределах текущего сеанса (вкладки)
    try { sessionStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* приватный режим */ }
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    return true;
  }

  /** Подключить словарь из отдельного файла: I18n.addDictionary('uz', {...}, {...}) */
  function addDictionary(l, html, strings) {
    if (!LANGS.includes(l)) return;
    DICT[l] = Object.assign(DICT[l] || {}, html);
    if (strings) STRINGS[l] = Object.assign(STRINGS[l] || {}, strings);
  }

  // восстановить язык, выбранный в этом сеансе
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && saved !== DEFAULT_LANG && isAvailable(saved)) { lang = saved; apply(); }
  } catch (e) { /* ignore */ }

  window.I18n = { t, pick, setLang, isAvailable, addDictionary, getLang: () => lang, _dict: DICT, _strings: STRINGS };
})();
