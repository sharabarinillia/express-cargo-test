/** The page language (from <html lang>), and a tiny two-language picker for script strings. */
export const lang: 'en' | 'nl' = document.documentElement.lang.toLowerCase().startsWith('nl') ? 'nl' : 'en';
export const locale = lang === 'nl' ? 'nl-NL' : 'en-GB';
export const t = (en: string, nl: string): string => (lang === 'nl' ? nl : en);
