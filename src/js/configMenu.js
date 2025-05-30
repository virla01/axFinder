import { UIElements } from './uiElements.js'; // Asumimos que añadiremos los botones relevantes a UIElements
import { updateFileNameVisibility, updateFileDateVisibility, updateFileSizeVisibility } from './fileDisplay.js';
import { currentSortOrder as appCurrentSortOrder, setSortOrder as appSetSortOrder, config as appConfig } from './config.js'; // Renombrado para evitar conflicto
// TODO: Necesitaremos importar funciones de fileDisplay.js para actualizar la vista en tiempo real
// import { toggleFileNameDisplay, toggleDateDisplay, toggleFileSizeDisplay } from './fileDisplay.js';

// Claves para localStorage
export const LS_SHOW_FILE_NAME = 'axFinder_showFileName';
export const LS_SHOW_DATE = 'axFinder_showDate';
export const LS_SHOW_FILE_SIZE = 'axFinder_showFileSize';
export const LS_VIEW_MODE = 'axFinderViewMode'; // Clave para localStorage
export const LS_THEME = 'axFinderTheme'; // Nueva clave para el tema

/**
 * Obtiene un ajuste de visualización desde localStorage.
 * @param {string} key - La clave en localStorage.
 * @param {boolean} defaultValue - El valor por defecto si la clave no se encuentra.
 * @returns {boolean} - El valor del ajuste.
 */
function getDisplaySetting(key, defaultValue) {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? storedValue === 'true' : defaultValue;
}

/**
 * Guarda un ajuste de visualización en localStorage.
 * @param {string} key - La clave en localStorage.
 * @param {boolean} value - El valor a guardar.
 */
function setDisplaySetting(key, value) {
    localStorage.setItem(key, value);
}

/**
 * Obtiene la configuración del modo de vista preferido.
 * Prioriza localStorage, luego usa 'grid' como fallback.
 * @returns {string} El modo de vista ('grid', 'list', 'compact').
 */
export function getViewModeSetting() {
    const storedViewMode = localStorage.getItem(LS_VIEW_MODE);
    if (storedViewMode && ['grid', 'list', 'compact'].includes(storedViewMode)) {
        console.log('[ConfigMenu] getViewModeSetting: Usando valor de localStorage:', storedViewMode);
        return storedViewMode;
    }
    console.log('[ConfigMenu] getViewModeSetting: localStorage vacío o inválido. Usando "grid" por defecto.');
    return 'grid'; // Fallback a 'grid' si no hay nada en localStorage o es inválido
}

/**
 * Guarda el modo de vista en localStorage.
 * @param {string} value - El valor a guardar (ej: 'list', 'thumbnails').
 */
function setViewModeSetting(value) {
    localStorage.setItem(LS_VIEW_MODE, value);
}

// --- LÓGICA DE TEMAS (AJUSTADA PARA data-theme) ---
function applyTheme(theme) {
    console.log(`[Theme] applyTheme llamada con: '${theme}'`); // Log de entrada
    const rootElement = document.documentElement;
    if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log(`[Theme] Modo Sistema. systemPrefersDark: ${systemPrefersDark}`); // Log
        if (systemPrefersDark) {
            rootElement.setAttribute('data-theme', 'dark');
        } else {
            rootElement.removeAttribute('data-theme');
        }
        localStorage.removeItem(LS_THEME);
        console.log(`[Theme] Aplicando tema del sistema: ${systemPrefersDark ? 'oscuro' : 'claro'}. Atributo data-theme: ${rootElement.getAttribute('data-theme')}`);
    } else {
        if (theme === 'dark') {
            rootElement.setAttribute('data-theme', 'dark');
        } else {
            rootElement.removeAttribute('data-theme'); // Para 'light', quitamos el atributo
        }
        localStorage.setItem(LS_THEME, theme);
        console.log(`[Theme] Aplicando tema: ${theme}. Atributo data-theme: ${rootElement.getAttribute('data-theme')}`);
    }
}

// Función para inicializar el tema al cargar la página
export function initializeTheme() {
    const savedTheme = localStorage.getItem(LS_THEME);
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme('system'); // Por defecto, seguir la preferencia del sistema
    }

    // Escuchar cambios en la preferencia del sistema si el tema actual es 'system' o no hay guardado
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        const currentSelectedTheme = localStorage.getItem(LS_THEME);
        if (!currentSelectedTheme || currentSelectedTheme === 'system') {
            console.log("[Theme] Preferencia del sistema cambió, aplicando...");
            applyTheme('system');
        }
    });
}
// Llamar a initializeTheme cuando el script se carga por primera vez.
// Esto es importante para que el tema se aplique antes de que el usuario interactúe.
// initializeTheme(); // Se llamará desde axfinder.js después de cargar el DOM.

export function initializeConfigMenu() {
    console.log("[ConfigMenu] Inicializando menú de configuración...");
    const configMenu = document.getElementById('config-menu');
    const configBtn = document.getElementById('config-btn'); // Botón para abrir
    const closeConfigBtn = document.getElementById('close-config'); // Botón para cerrar

    if (!configMenu) {
        console.warn("[ConfigMenu] Elemento del menú de configuración (#config-menu) no encontrado. La funcionalidad del menú estará deshabilitada.");
        return;
    }

    if (!configBtn) {
        console.warn("[ConfigMenu] Botón para abrir el menú de configuración (#config-btn) no encontrado.");
    } else {
        configBtn.addEventListener('click', () => {
            console.log("[ConfigMenu] Botón #config-btn clickeado, abriendo menú.");
            configMenu.classList.remove('hidden');
            configMenu.classList.add('open');
        });
    }

    if (!closeConfigBtn) {
        console.warn("[ConfigMenu] Botón para cerrar el menú de configuración (#close-config) no encontrado en el HTML del menú.");
    } else {
        closeConfigBtn.addEventListener('click', () => {
            console.log("[ConfigMenu] Botón #close-config clickeado, cerrando menú.");
            configMenu.classList.add('hidden');
            configMenu.classList.remove('open');
        });
    }

    // Inicializar controles dentro del menú
    if (configMenu) {
        initializeSettingControls(configMenu);
    } else {
        // Si el panel no existe, no tiene sentido intentar inicializar sus controles.
        // El warning ya se mostró arriba.
    }

    console.log("[ConfigMenu] Menú de configuración inicializado (listeners para abrir/cerrar).");
}

async function initializeSettingControls(configMenuElement) {
    // Importación dinámica de loadFiles para evitar ciclos de dependencia
    let loadFilesFunc = null;
    try {
        const fileDisplayModule = await import('./fileDisplay.js');
        loadFilesFunc = fileDisplayModule.loadFiles;
    } catch (err) {
        console.error("[ConfigMenu] Error al importar dinámicamente loadFiles:", err);
    }

    // Referencias a los checkboxes de Configuración
    const chkShowFileName = configMenuElement.querySelector('#chkShowFileName');
    const chkShowDate = configMenuElement.querySelector('#chkShowDate');
    const chkShowFileSize = configMenuElement.querySelector('#chkShowFileSize');

    if (chkShowFileName) {
        chkShowFileName.checked = getDisplaySetting(LS_SHOW_FILE_NAME, true);
        chkShowFileName.addEventListener('change', (event) => {
            const newValue = event.target.checked;
            setDisplaySetting(LS_SHOW_FILE_NAME, newValue);
            updateFileNameVisibility(newValue);
        });
    } else {
        console.warn('[ConfigMenu] Checkbox #chkShowFileName no encontrado.');
    }

    if (chkShowDate) {
        chkShowDate.checked = getDisplaySetting(LS_SHOW_DATE, true);
        chkShowDate.addEventListener('change', (event) => {
            const newValue = event.target.checked;
            setDisplaySetting(LS_SHOW_DATE, newValue);
            updateFileDateVisibility(newValue);
        });
    } else {
        console.warn('[ConfigMenu] Checkbox #chkShowDate no encontrado.');
    }

    if (chkShowFileSize) {
        chkShowFileSize.checked = getDisplaySetting(LS_SHOW_FILE_SIZE, true);
        chkShowFileSize.addEventListener('change', (event) => {
            const newValue = event.target.checked;
            setDisplaySetting(LS_SHOW_FILE_SIZE, newValue);
            updateFileSizeVisibility(newValue);
        });
    } else {
        console.warn('[ConfigMenu] Checkbox #chkShowFileSize no encontrado.');
    }

    // --- Radios de Vista ---
    const radioViewList = configMenuElement.querySelector('#radioViewList');
    const radioViewThumbnails = configMenuElement.querySelector('#radioViewThumbnails');
    const radioViewCompact = configMenuElement.querySelector('#radioViewCompact');

    let importedSetViewMode = null;
    try {
        const fdModule = await import('./fileDisplay.js');
        importedSetViewMode = fdModule.setViewMode;
    } catch (e) { console.error("Error importando setViewMode en configMenu", e); }

    const currentView = getViewModeSetting();
    if (radioViewList) {
        radioViewList.checked = currentView === 'list';
        radioViewList.addEventListener('change', (event) => {
            if (event.target.checked && importedSetViewMode) {
                setViewModeSetting('list');
                importedSetViewMode('list');
            }
        });
    }
    if (radioViewThumbnails) {
        // Asegurarse que el valor 'thumbnails' en config y 'grid' en lógica de vista sean consistentes.
        // getViewModeSetting devuelve 'grid', 'list', o 'compact'. setViewMode usa 'grid'.
        radioViewThumbnails.checked = currentView === 'grid'; // o 'thumbnails' si getViewModeSetting usa eso
        radioViewThumbnails.addEventListener('change', (event) => {
            if (event.target.checked && importedSetViewMode) {
                setViewModeSetting('grid'); // Guardar como 'grid' si es la representación interna
                importedSetViewMode('grid');
            }
        });
    }
    if (radioViewCompact) {
        radioViewCompact.checked = currentView === 'compact';
        radioViewCompact.addEventListener('change', (event) => {
            if (event.target.checked && importedSetViewMode) {
                setViewModeSetting('compact');
                importedSetViewMode('compact');
            }
        });
    }

    // --- Dropdown Ordenar por ---
    const selectSortBy = configMenuElement.querySelector('#selectSortBy');
    if (selectSortBy) {
        selectSortBy.value = appCurrentSortOrder.column; // Establecer valor inicial
        selectSortBy.addEventListener('change', (event) => {
            const newSortColumn = event.target.value;
            appSetSortOrder(newSortColumn, appCurrentSortOrder.direction);
            if (loadFilesFunc && appConfig.currentPath) {
                loadFilesFunc(appConfig.currentPath, newSortColumn, appCurrentSortOrder.direction);
            }
        });
    } else {
        console.warn('[ConfigMenu] Dropdown #selectSortBy no encontrado.');
    }

    // --- Radios de Orden (Ascendente/Descendente) ---
    const radioSortAsc = configMenuElement.querySelector('#radioSortAsc');
    const radioSortDesc = configMenuElement.querySelector('#radioSortDesc');

    if (radioSortAsc && radioSortDesc) {
        // Establecer estado inicial
        if (appCurrentSortOrder.direction === 'asc') {
            radioSortAsc.checked = true;
        } else {
            radioSortDesc.checked = true;
        }

        const sortDirectionHandler = (event) => {
            if (event.target.checked) {
                const newSortDirection = event.target.value;
                appSetSortOrder(appCurrentSortOrder.column, newSortDirection);
                if (loadFilesFunc && appConfig.currentPath) {
                    loadFilesFunc(appConfig.currentPath, appCurrentSortOrder.column, newSortDirection);
                }
            }
        };
        radioSortAsc.addEventListener('change', sortDirectionHandler);
        radioSortDesc.addEventListener('change', sortDirectionHandler);
    } else {
        console.warn('[ConfigMenu] Radios de dirección de orden (#radioSortAsc o #radioSortDesc) no encontrados.');
    }

    // --- Radios de Tema ---
    const radioThemeLight = configMenuElement.querySelector('#radioThemeLight');
    const radioThemeDark = configMenuElement.querySelector('#radioThemeDark');
    const radioThemeSystem = configMenuElement.querySelector('#radioThemeSystem');

    const currentTheme = localStorage.getItem(LS_THEME) || 'system';
    if (radioThemeLight) radioThemeLight.checked = currentTheme === 'light';
    if (radioThemeDark) radioThemeDark.checked = currentTheme === 'dark';
    if (radioThemeSystem) radioThemeSystem.checked = currentTheme === 'system';

    const themeChangeHandler = (event) => {
        if (event.target.checked) {
            applyTheme(event.target.value);
        }
    };

    if (radioThemeLight) radioThemeLight.addEventListener('change', themeChangeHandler);
    if (radioThemeDark) radioThemeDark.addEventListener('change', themeChangeHandler);
    if (radioThemeSystem) radioThemeSystem.addEventListener('change', themeChangeHandler);

    console.log("[ConfigMenu] Controles de configuración inicializados.");
}

// Podrías añadir funciones para guardar/cargar configuraciones desde localStorage si quieres persistencia 