/**
 * Sistema i18n ligero para Kuyay Autochekin.
 * Idiomas soportados: es | en | pt
 */
import { useState, useCallback, useEffect } from "react";
import es, { type TranslationKeys } from "./es";
import en from "./en";
import pt from "./pt";

export type Lang = "es" | "en" | "pt";

const STORAGE_KEY = "app_language";

const dictionaries: Record<Lang, TranslationKeys> = { es, en, pt };

/** Obtiene el idioma guardado o "es" por defecto */
function getSavedLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (v && dictionaries[v]) return v;
  } catch {
    // SSR o storage bloqueado
  }
  return "es";
}

/**
 * Hook reutilizable de idioma.
 *
 * ```tsx
 * const { language, setLanguage, t } = useLanguage();
 * t("guest.name") // "Nombre" | "Name" | "Nome"
 * ```
 */
export function useLanguage() {
  const [language, setLang] = useState<Lang>(getSavedLang);

  const setLanguage = useCallback((l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // silencioso
    }
  }, []);

  // Sincronizar con storage en mount
  useEffect(() => {
    const saved = getSavedLang();
    if (saved !== language) setLang(saved);
  }, []);

  /**
   * t("guest.name") → accede a dictionaries[language].guest.name
   */
  const t = useCallback(
    (key: string): string => {
      const dict = dictionaries[language] || dictionaries.es;
      const parts = key.split(".");
      let val: any = dict;
      for (const p of parts) {
        val = val?.[p];
        if (val === undefined) break;
      }
      return typeof val === "string" ? val : key;
    },
    [language]
  );

  return { language, setLanguage, t };
}

export const LANG_LABELS: Record<Lang, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

export const LANG_FLAGS: Record<Lang, string> = {
  es: "🇪🇸",
  en: "🇺🇸",
  pt: "🇧🇷",
};
