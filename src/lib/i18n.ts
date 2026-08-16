import az from '../locales/az.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

const dictionaries: Record<string, any> = {
  az,
  en,
  ru
};

// Bu funksiya açarı (məsələn: "settings.title") qəbul edir və düzgün sözü tapır
export const getTranslation = (lang: string = 'az') => {
  const dictionary = dictionaries[lang] || dictionaries['az'];

  return (key: string) => {
    const keys = key.split('.');
    let value = dictionary;
    
    for (const k of keys) {
      if (value[k] === undefined) return key; // Əgər tərcümə tapılmazsa, açarın özünü qaytarır
      value = value[k];
    }
    
    return value;
  };
};