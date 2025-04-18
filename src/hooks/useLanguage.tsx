
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as translations from '@/translations';

// Define Language type based on the available translation keys
export type Language = 'en' | 'uk' | 'ru' | 'de' | 'be';

interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to get the language from localStorage, default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return (savedLanguage && ['en', 'ru', 'uk', 'de', 'be'].includes(savedLanguage)) 
      ? savedLanguage as Language 
      : 'en';
  });

  // Select the appropriate translation object based on the current language
  const t = translations[language] || translations.en;

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
