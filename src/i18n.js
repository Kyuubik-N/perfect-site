import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      siteName: 'Kyuubik',
      nav: {
        home: 'Home',
        features: 'Features',
        contact: 'Contact',
        notes: 'Notes',
        calendar: 'Calendar',
        library: 'Library',
      },
      home: {
        heroTitle: 'Kyuubik — your personal space',
        heroSubtitle: 'Notes, calendar and files — fast, clean, and beautiful.',
        ctaPrimary: 'Open Notes',
        ctaSecondary: 'Go to Files',
        quickTitle: 'Quick access',
        notes: { title: 'Notes', desc: 'Ideas, links and todos. With dates.' },
        calendar: { title: 'Calendar', desc: 'See all notes and files by day.' },
        library: { title: 'Library', desc: 'Upload and preview images, videos and more.' },
      },
      hero: {
        title: 'Build clean, modern, fast sites',
        subtitle:
          'Starter layout with Tailwind, dark mode and i18n. Customize sections and ship quickly.',
        cta: 'Explore Features',
        secondary: 'Contact',
      },
      features: {
        title: 'Why choose us',
        items: [
          { title: 'Performance first', desc: 'Optimized assets and modern tooling.' },
          { title: 'Composable', desc: 'Small pieces that fit your needs.' },
          { title: 'Secure by default', desc: 'Good defaults and best practices.' },
        ],
      },
      footer: { madeBy: 'Made with ❤️ using Vite + React + Tailwind' },
    },
  },
  ru: {
    translation: {
      siteName: 'Kyuubik',
      nav: {
        home: 'Главная',
        features: 'Возможности',
        contact: 'Контакты',
        notes: 'Заметки',
        calendar: 'Календарь',
        library: 'Файлы',
      },
      home: {
        heroTitle: 'Kyuubik — личное пространство',
        heroSubtitle: 'Заметки, календарь и файлы — быстро и красиво.',
        ctaPrimary: 'Открыть заметки',
        ctaSecondary: 'Перейти к файлам',
        quickTitle: 'Быстрый доступ',
        notes: { title: 'Заметки', desc: 'Идеи, ссылки и дела. С датами.' },
        calendar: { title: 'Календарь', desc: 'Смотрите заметки и файлы по дням.' },
        library: { title: 'Файлы', desc: 'Загружайте и просматривайте медиа и документы.' },
      },
      hero: {
        title: 'Создавайте чистые и быстрые сайты',
        subtitle:
          'Стартовый шаблон с Tailwind, тёмной темой и i18n. Настройте секции и запускайте быстрее.',
        cta: 'Смотреть возможности',
        secondary: 'Связаться',
      },
      features: {
        title: 'Почему мы',
        items: [
          { title: 'Производительность', desc: 'Оптимизированные ресурсы и современный стек.' },
          { title: 'Композиция', desc: 'Малые части под ваши задачи.' },
          { title: 'Безопасность', desc: 'Хорошие дефолты и практики.' },
        ],
      },
      footer: { madeBy: 'Сделано с ❤️ на Vite + React + Tailwind' },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'ru',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
