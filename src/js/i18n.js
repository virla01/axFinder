let translations = {};
let currentLanguage = 'es'; // Idioma por defecto

/**
 * Carga las traducciones para el idioma especificado.
 * Los archivos de idioma deben estar en src/lang/ y llamarse {lang}.json (ej. es.json)
 * @param {string} lang - El código de idioma (ej. 'es', 'en').
 */
async function loadTranslations(lang) {
    try {
        const fetchURL = `src/lang/${lang}.json`;
        // console.log(`[i18n] Intentando cargar traducciones desde URL (relativa a la página HTML base): ${fetchURL}`);

        const response = await fetch(fetchURL);
        if (!response.ok) {
            throw new Error(`[i18n] HTTP error al cargar ${lang}.json! status: ${response.status} - URL: ${response.url}`);
        }
        translations = await response.json();
        // console.log(`[i18n] Traducciones cargadas para ${lang} desde .json:`, translations);
    } catch (error) {
        console.error(`[i18n] Error al cargar el archivo de traducción ${lang}.json:`, error);
        console.warn(`[i18n] Se usará un objeto de traducciones vacío para ${lang}. Las claves no se traducirán.`);
        translations = {}; // Usar un objeto vacío como fallback para evitar errores
    }
}

/**
 * Inicializa el sistema de internacionalización.
 * Carga las traducciones para el idioma actual.
 * @param {string} [defaultLang='es'] - El idioma por defecto a cargar.
 */
export async function initI18n(defaultLang = 'es') {
    currentLanguage = defaultLang;
    await loadTranslations(currentLanguage);
}

/**
 * Obtiene la traducción para una clave dada.
 * @param {string} key - La clave de traducción (ej. 'modal.title').
 * @param {Object} [options] - Opciones adicionales (ej. para interpolación).
 * @returns {string} La cadena traducida o la clave si no se encuentra la traducción.
 */
export function t(key, options = {}) {
    if (translations && typeof translations[key] !== 'undefined') {
        let translatedString = translations[key];
        // Realizar la sustitución de placeholders
        for (const placeholder in options) {
            if (options.hasOwnProperty(placeholder)) {
                const regex = new RegExp(`{${placeholder}}`, 'g');
                translatedString = translatedString.replace(regex, options[placeholder]);
            }
        }
        return translatedString;
    }
    console.warn(`[i18n] Traducción no encontrada para la clave: ${key}`);
    return key;
}

/**
 * Cambia el idioma actual y carga las nuevas traducciones.
 * @param {string} lang - El nuevo código de idioma.
 */
export async function setLanguage(lang) {
    currentLanguage = lang;
    await loadTranslations(lang);
    // console.log(`[i18n] Idioma cambiado a: ${lang}`);
}

/**
 * Obtiene el idioma actual.
 * @returns {string} El código del idioma actual.
 */
export function getCurrentLanguage() {
    return currentLanguage;
}
