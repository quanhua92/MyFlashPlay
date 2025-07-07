import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from "react"
import type {
  LanguageCode,
  TranslationNamespace,
  TranslationFunction,
} from "../types/i18n.types"
import { usePreferences } from "../hooks/usePreferences"

interface I18nContextType {
  currentLanguage: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: TranslationFunction
  translations: TranslationNamespace
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { preferences, updatePreferences } = usePreferences()
  const [translations, setTranslations] =
    React.useState<TranslationNamespace | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Extract language code from preferences (remove country code if present)
  const currentLanguage = useMemo(() => {
    const lang = preferences.language || "en-US"
    return lang.split("-")[0] as LanguageCode
  }, [preferences.language])

  // Load translation file dynamically
  const loadTranslations = useCallback(async (language: LanguageCode) => {
    setIsLoading(true)
    try {
      // Dynamic import for code splitting
      const translationModule = await import(`../i18n/locales/${language}.ts`)
      setTranslations(translationModule.default)
    } catch (error) {
      console.warn(
        `Failed to load translations for ${language}, falling back to English`,
      )
      try {
        const fallbackModule = await import("../i18n/locales/en.ts")
        setTranslations(fallbackModule.default)
      } catch (fallbackError) {
        console.error("Failed to load fallback translations:", fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load translations when language changes
  useEffect(() => {
    loadTranslations(currentLanguage)
  }, [currentLanguage, loadTranslations])

  // Update language preference
  const setLanguage = useCallback(
    (language: LanguageCode) => {
      updatePreferences({ language: `${language}-${language.toUpperCase()}` })
    },
    [updatePreferences],
  )

  // Translation function with parameter interpolation
  const t = useCallback<TranslationFunction>(
    (key: string, params?: Record<string, string | number>) => {
      if (!translations) {
        return key // Return key if translations not loaded
      }

      // Navigate nested object path
      const keys = key.split(".")
      let value: any = translations

      for (const k of keys) {
        value = value?.[k]
        if (value === undefined) {
          console.warn(`Translation key not found: ${key}`)
          return key
        }
      }

      // Handle parameter interpolation
      if (typeof value === "string" && params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) =>
            str.replace(`{{${paramKey}}}`, String(paramValue)),
          value,
        )
      }

      return value || key
    },
    [translations],
  )

  const contextValue = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      t,
      translations: translations!,
      isLoading,
    }),
    [currentLanguage, setLanguage, t, translations, isLoading],
  )

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
