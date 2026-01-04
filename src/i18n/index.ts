import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import sr from './locales/sr.json';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';

const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      sr: { translation: sr },
      en: { translation: en },
      de: { translation: de },
      es: { translation: es },
      zh: { translation: zh },
      ja: { translation: ja },
      ru: { translation: ru }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
