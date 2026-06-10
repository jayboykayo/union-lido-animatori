import { createContext, useContext, useState } from 'react'
import { translations } from '../lib/i18n'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'it'
  })

  const t = (key) => translations[lang]?.[key] || translations['it'][key] || key

  const changeLang = (newLang) => {
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)