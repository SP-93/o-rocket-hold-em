import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import sr from './locales/sr.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      sr: { translation: sr },
      en: { translation: en }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
