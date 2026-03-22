import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import es from './locales/es/translation.json';

const initI18n = async () => {
  const savedLang = await AsyncStorage.getItem('user-language');
  const deviceLang = Localization.getLocales()[0]?.languageCode?.startsWith('es') ? 'es' : 'en';

  await i18n.use(initReactI18next).init({
    lng: savedLang ?? deviceLang,
    // lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;