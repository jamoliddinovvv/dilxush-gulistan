/* =========================================================
   Меню «Дилхуш»

   Сейчас здесь только структура — настоящих блюд и цен пока нет.
   Чтобы вставить реальное меню, заполните поля:
     name  — название   { ru: 'Плов', uz: 'Palov' }
     desc  — описание   { ru: '...', uz: '...' }
     price — цена        '65 000'
     img   — имя файла из assets/img (без .jpg)
     tag   — необязательная метка { ru: 'Новинка', uz: 'Yangi' }
   Пустое поле (null / не указано) показывается как заглушка.
   ========================================================= */
window.DILXUSH_MENU = {
  // «Стоит попробовать» — ровно 3 блюда, у каждого своя форма кадра
  featured: [
    { img: 'plov', name: null, desc: null, price: null },
    { img: 'lagman', name: null, desc: null, price: null },
    { img: 'manti', name: null, desc: null, price: null },
  ],

  // Разделы — пример структуры, названия уточнить по меню ресторана
  categories: [
    {
      id: 'hot',
      title: { ru: 'Горячие блюда', uz: 'Issiq taomlar' },
      items: [
        { img: 'plov', tag: { ru: 'Метка', uz: 'Belgi' } },
        { img: 'lagman', short: true },
        { img: 'manti' },
        { img: 'plov', short: true },
        { img: 'lagman' },
      ],
    },
    {
      id: 'soups',
      title: { ru: 'Супы', uz: 'Sho‘rvalar' },
      items: [
        { img: 'shurpa', short: true },
        { img: 'shurpa' },
        { img: 'shurpa', short: true },
      ],
    },
    {
      id: 'bakery',
      title: { ru: 'Выпечка и хлеб', uz: 'Non va pishiriqlar' },
      items: [
        { img: 'non', tag: { ru: 'Метка', uz: 'Belgi' } },
        { img: 'samsa', short: true },
        { img: 'non' },
        { img: 'samsa', short: true },
      ],
    },
    {
      id: 'salads',
      title: { ru: 'Салаты и закуски', uz: 'Salatlar va gazaklar' },
      items: [
        { img: 'salad', short: true },
        { img: 'salad' },
        { img: 'salad', short: true },
        { img: 'salad' },
      ],
    },
    {
      id: 'drinks',
      title: { ru: 'Чай и напитки', uz: 'Choy va ichimliklar' },
      items: [
        { img: 'tea', short: true },
        { img: 'tea' },
        { img: 'tea', short: true },
      ],
    },
  ],
};
