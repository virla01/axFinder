// axfinder.js - Punto de entrada principal para AxFinder

import { loadFolders } from './src/js/loadFolder.js';
import { loadFiles, setViewMode } from './src/js/fileDisplay.js';
import { config, icons, currentSortOrder } from './src/js/config.js';
import { UIElements } from './src/js/uiElements.js';
import { initializeConfigMenu, LS_VIEW_MODE, getViewModeSetting, initializeTheme } from './src/js/configMenu.js';
import { api } from './src/js/apiService.js'; // Importar el servicio de API
import { initializeMetadataUploadModal, openMetadataModal } from './src/js/metadataUploadModal.js';
import { initCreateFolderModal } from './src/js/createFolderModal.js';
import { initFolderContextMenu } from './src/js/folderContextMenu.js';
import { initConfirmDeleteFolderModal } from './src/js/confirmDeleteFolderModal.js'; // Importar initCreateFolderModal
import { initRenameFolderModal } from './src/js/renameFolderModal.js';
import { initI18n } from './src/js/i18n.js'; // Importar initI18n
import { updateActiveFolderSelection } from './src/js/loadFolder.js'; // Importar updateActiveFolderSelection

/**
 * Carga el template HTML principal de AxFinder y lo inyecta en el contenedor especificado.
 * @param {HTMLElement} containerElement - El elemento contenedor donde se cargará AxFinder.
 * @param {string} templatePath - La ruta al archivo de plantilla HTML.
 */
async function initializeAxFinder(containerElement, templatePath = 'src/template/ax-template.html') {
    try {
        // INICIALIZAR I18N PRIMERO
        await initI18n(); // Cargar traducciones (ej. español por defecto)
        console.log('[AxFinder] Sistema i18n inicializado.');

        const response = await fetch(templatePath);
        if (!response.ok) {
            throw new Error(`Error al cargar el template: ${response.status} ${response.statusText}`);
        }
        const htmlTemplate = await response.text();

        if (!containerElement) {
            console.error('El elemento contenedor no fue proporcionado o no es válido.');
            return;
        }
        containerElement.innerHTML = htmlTemplate;

        // INICIALIZAR TEMA AQUÍ, después de inyectar el HTML y antes del setTimeout
        initializeTheme();
        console.log('[AxFinder] Tema inicializado después de cargar el template.');

        // INICIALIZAR MODALES AQUÍ PRIMERO (movido fuera del setTimeout)
        initializeMetadataUploadModal();
        initCreateFolderModal();
        initFolderContextMenu();
        initConfirmDeleteFolderModal();
        initRenameFolderModal();
        console.log('[AxFinder] Modales inicializados.');
        try {
            await loadFolders();

            // 1. OBTENER LA CONFIGURACIÓN DEL SERVIDOR (VISTA POR DEFECTO DE PHP) - OPCIONAL
            let phpDefaultViewMode = 'grid'; // Fallback si la API falla o no se usa
            try {
                const serverConfigData = await api.fetchServerConfig();
                if (serverConfigData.success && serverConfigData.config && serverConfigData.config.defaultViewMode) {
                    phpDefaultViewMode = serverConfigData.config.defaultViewMode;
                    console.log('[AxFinder] Vista por defecto de PHP recuperada (informativo):', phpDefaultViewMode);
                } else {
                    console.warn('[AxFinder] No se pudo obtener la vista por defecto del servidor (informativo).', serverConfigData);
                }
            } catch (error) {
                console.error('[AxFinder] Error al obtener la configuración del servidor (informativo):', error);
            }

            // 2. OBTENER LA VISTA PREFERIDA (LocalStorage o 'grid' por defecto)
            const preferredViewMode = getViewModeSetting();
            console.log("[AxFinder] Vista preferida (localStorage o 'grid' default):", preferredViewMode);

            // 3. ESTABLECER config.currentViewMode
            config.currentViewMode = preferredViewMode;
            console.log('[AxFinder] config.currentViewMode establecido a:', config.currentViewMode);

            // 4. LLAMAR A setViewMode ANTES DE loadFiles PARA ASEGURAR QUE LOS CONTENEDORES ESTÉN CORRECTOS
            setViewMode(config.currentViewMode); // Esto actualiza clases CSS y botones

            const gridBtn = document.getElementById('grid-btn');
            const listBtn = document.getElementById('list-btn');
            const uploadFileBtn = document.getElementById('upload-file-btn');

            if (!gridBtn || !listBtn) {
                console.error("Botones de vista (grid-btn o list-btn) no encontrados DESPUÉS de cargar el template.");
            } else {
                console.log("Botones de vista encontrados. Añadiendo listeners.");
                gridBtn.addEventListener('click', () => setViewMode('grid'));
                listBtn.addEventListener('click', () => setViewMode('list'));
            }

            if (uploadFileBtn) {
                uploadFileBtn.addEventListener('click', () => {
                    openMetadataModal(); // Llama sin argumentos para una nueva subida
                });
            } else {
                console.warn('[AxFinder] Botón de subir archivo (upload-file-btn) no encontrado.');
            }

            // 5. CARGAR ARCHIVOS (renderFiles usará el config.currentViewMode ya establecido)
            await loadFiles('.', currentSortOrder.column, currentSortOrder.direction);
            console.log('AxFinder inicializado, template cargado, carpetas y archivos solicitados.');

            // Asegurarse de que la carpeta inicial ('storage' o '.') esté seleccionada (movido fuera del setTimeout)
            updateActiveFolderSelection(config.currentPath || 'storage');

            // 6. INICIALIZAR MENÚ DE CONFIGURACIÓN
            initializeConfigMenu();

        } catch (error) {
            console.error('Error durante la inicialización de AxFinder (después de la carga del template):', error);
        }

    } catch (error) {
        console.error('Error durante la inicialización de AxFinder:', error);
        if (containerElement) {
            containerElement.innerHTML = `<p style="color: red; padding: 1rem;">Error al cargar AxFinder: ${error.message}</p>`;
        }
    }
}

// Auto-inicialización al cargar el script
document.addEventListener('DOMContentLoaded', () => {
    // Priorizar el ID 'axfinder' según las instrucciones del usuario
    let container = document.getElementById('axfinder');

    // Fallback a data-axfinder-container si 'axfinder' no existe
    if (!container) {
        container = document.querySelector('[data-axfinder-container]');
    }

    // Fallback a un elemento con el ID 'axfinder' (esto es redundante si el primero lo encuentra, pero mantenido por si acaso)
    // y para mantener la compatibilidad con versiones anteriores que pudieran buscar solo el ID.
    if (!container && document.getElementById('axfinder')) {
        console.warn("AxFinder: Se encontró un contenedor con ID 'axfinder', pero se recomienda usar el atributo 'data-axfinder-container' para mayor flexibilidad o asegurar que el ID 'axfinder' sea el principal.");
        container = document.getElementById('axfinder');
    }

    if (container) {
        console.log("AxFinder: Contenedor encontrado, inicializando AxFinder.", container);
        initializeAxFinder(container);
    } else {
        console.error("AxFinder: No se encontró ningún contenedor adecuado (ID 'axfinder' o atributo 'data-axfinder-container') para inicialización.");
    }
});

// Exportar para posible inicialización manual si es necesario
export { initializeAxFinder };
