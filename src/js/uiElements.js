// src/js/uiElements.js


// Contenedor principal de AxFinder, se pasará en la inicialización
let _axFinderContainerId = null;

function getElement(selector, context) {
    const base = context || (_axFinderContainerId ? document.getElementById(_axFinderContainerId) : document);
    if (!base) {
        // Si el contenedor principal no se encuentra (y se esperaba), es un problema.
        // Si no hay contexto y no hay _axFinderContainerId, busca en todo el document.
        if (!_axFinderContainerId && !context) {
            // console.warn(`[UIElements] Buscando '${selector}' en todo el documento porque el contenedor principal no está definido.`);
        } else if (_axFinderContainerId && !document.getElementById(_axFinderContainerId) && !context) {
            console.error(`[UIElements] Contenedor principal con ID '${_axFinderContainerId}' no encontrado.`);
            return null;
        }
    }
    const element = base.querySelector(selector);
    if (!element) {
        // console.warn(`[UIElements] Elemento no encontrado con selector: '${selector}' dentro de ${context ? 'contexto proporcionado' : (_axFinderContainerId || 'documento')}`);
    }
    return element;
}

function getAllElements(selector, context) {
    const base = context || (_axFinderContainerId ? document.getElementById(_axFinderContainerId) : document);
    if (!base) {
        if (!_axFinderContainerId && !context) {
            // console.warn(`[UIElements] Buscando todos '${selector}' en todo el documento porque el contenedor principal no está definido.`);
        } else if (_axFinderContainerId && !document.getElementById(_axFinderContainerId) && !context) {
            console.error(`[UIElements] Contenedor principal con ID '${_axFinderContainerId}' no encontrado para getAllElements.`);
            return [];
        }
    }
    return base.querySelectorAll(selector);
}

export const UIElements = {
    // Método para establecer el ID del contenedor principal
    setAxFinderContainerId: (id) => {
        _axFinderContainerId = id;

    },
    axFinderContainer: (id) => {
        // Si se pasa un id, se usa ese. Si no, el global.
        const containerIdToUse = id || _axFinderContainerId;
        if (!containerIdToUse) {
            console.error('[UIElements] Se intentó obtener axFinderContainer sin un ID especificado o configurado.');
            return null;
        }
        return document.getElementById(containerIdToUse);
    },

    // --- Contenedores principales del template ---
    axfinderSidebar: () => getElement('#axfinder-sidebar'),
    axfinderMainContent: () => getElement('#axfinder-main-content'),

    // --- Sidebar ---
    sidebar: () => getElement('#ax-sidebar'),
    sidebarFoldersContainer: () => getElement('#sidebar-folders-container'), // Contenedor para la lista de carpetas
    // Para elementos de carpeta individuales, se necesitarán selectores más dinámicos o pasar contexto
    getFolderElementById: (folderId) => getElement(`#folder-${folderId}`), // Asume que el ID del elemento clicable es `folder-folderId`
    getFolderChildrenContainerById: (folderId) => getElement(`#${folderId}-children`), // Contenedor de subcarpetas
    getFolderIconContainerById: (folderId) => getElement(`#${folderId}-icon-container`), // Contenedor del icono de la carpeta
    getFolderChevronPlaceholderById: (folderId) => getElement(`#${folderId}-chevron-placeholder`), // Contenedor del chevron
    homeButton: () => getElement('#home-button'), // Si tienes un botón de inicio específico
    staticHomeButton: () => getElement('.static-home-button'), // Botón de inicio estático en el template

    // --- Main Content Area ---
    mainContentArea: () => getElement('#ax-main-content'),
    // currentFolderDisplay: () => getElement('#current-folder-display'), // Eliminado

    // Contenedores para las vistas de archivos
    fileDisplayArea: () => getElement('#file-view'), // Contenedor principal para grid/list
    fileGrid: () => getElement('#file-grid'), // Contenedor específico para la vista de cuadrícula
    fileList: () => getElement('#file-list'), // Contenedor específico para la vista de lista

    // --- Toolbar / Controls ---
    gridButton: () => getElement('#grid-btn'), // ID actualizado
    listButton: () => getElement('#list-btn'), // ID actualizado
    createFolderButton: () => getElement('#create-folder-btn'),
    uploadButton: () => getElement('#upload-btn'), // Si existe
    searchInput: () => getElement('#search-input'), // Si existe
    sortOptions: () => getElement('#sort-options'), // Si existe un dropdown de ordenación

    // --- Modals (si se usan) ---
    createFolderModal: () => getElement('#create-folder-modal'),
    newFolderNameInput: () => getElement('#new-folder-name-input'),
    submitCreateFolderButton: () => getElement('#submit-create-folder'), // ID actualizado
    cancelCreateFolderButton: () => getElement('#cancel-create-folder'), // ID actualizado
    createFolderErrorDisplay: () => getElement('#create-folder-error'),

    // --- Otros ---
    testApiButton: () => getElement('#test-api-btn'), // Para pruebas
    apiStatusDiv: () => getElement('#api-status'), // Para mostrar estado de API

    // Funciones para obtener elementos dentro de un contexto específico (ej. un item de archivo)
    // getFileNameElement: (itemElement) => getElement('.file-name', itemElement),
    // getFileSizeElement: (itemElement) => getElement('.file-size', itemElement),
    // getFileDateElement: (itemElement) => getElement('.file-date', itemElement),
};

// Inicializar con un ID por defecto si es necesario, o esperar a que main.js lo configure.
// UIElements.setAxFinderContainerId('axfinder-container'); // Ejemplo