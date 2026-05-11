import { createContext, useContext, useMemo, useState } from "react";
import en from "./en.json";
import hi from "./hi.json";
import kn from "./kn.json";

const translations = { en, hi, kn };
const LANGUAGE_STORAGE_KEY = "lawglider-language";

const LanguageContext = createContext(null);

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return translations[savedLanguage] ? savedLanguage : "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  function setLanguage(nextLanguage) {
    if (!translations[nextLanguage]) return;
    setLanguageState(nextLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }

  const value = useMemo(() => {
    function t(key) {
      return translations[language]?.[key] || translations.en[key] || key;
    }

    return {
      language,
      setLanguage,
      t,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used inside LanguageProvider");
  }

  return context;
}
