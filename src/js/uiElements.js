// src/js/uiElements.js
console.log('src/js/uiElements.js cargado');

export const LOADING_SPINNER_HTML = `
    <div class="flex items-center justify-center p-4">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm text-gray-600">Cargando...</p>
    </div>
`;

// let _axFinderContainerId = null; // Comentamos esto por ahora

function getElement(selector, context = document) { // Siempre usa document como contexto por defecto
    const element = context.querySelector(selector);
    if (!element) {
        // console.warn(`[UIElements] Elemento no encontrado para el selector: ${selector}`);
    }
    return element;
}

// function getAllElements(selector, context) { ... } // Mantenemos si se usa, o simplificamos igual

export const UIElements = {
    // --- Contenedores principales del template ---
    axfinderSidebar: () => getElement('#axfinder-sidebar'),
    axfinderMainContent: () => getElement('#axfinder-main-content'),
    sidebar: () => getElement('#ax-sidebar'),
    sidebarFoldersContainer: () => getElement('#sidebar-folders-container'),
    getFolderElementById: (folderId) => getElement(`#folder-${folderId}`),
    getFolderChildrenContainerById: (folderId) => getElement(`#${folderId}-children`),
    getFolderIconContainerById: (folderId) => getElement(`#${folderId}-icon-container`),
    getFolderChevronPlaceholderById: (folderId) => getElement(`#${folderId}-chevron-placeholder`),
    homeButton: () => getElement('#home-button'),
    staticHomeButton: () => getElement('.static-home-button'),
    mainContentArea: () => getElement('#ax-main-content'),
    currentFolderDisplay: () => getElement('#current-folder-display'),
    fileDisplayArea: () => getElement('#file-view'),
    fileGrid: () => getElement('#file-grid'),
    fileList: () => getElement('#file-list'),
    gridButton: () => getElement('#grid-btn'),
    listButton: () => getElement('#list-btn'),
    createFolderButton: () => getElement('#create-folder-btn'),
    uploadButton: () => getElement('#upload-btn'),
    searchInput: () => getElement('#search-input'),
    sortOptions: () => getElement('#sort-options'),
    createFolderModal: () => getElement('#create-folder-modal'),
    newFolderNameInput: () => getElement('#new-folder-name-input'),
    submitCreateFolderButton: () => getElement('#submit-create-folder'),
    cancelCreateFolderButton: () => getElement('#cancel-create-folder'),
    createFolderErrorDisplay: () => getElement('#create-folder-error'),
    testApiButton: () => getElement('#test-api-btn'),
    apiStatusDiv: () => getElement('#api-status'),
    configMenuPanel: () => getElement('#config-menu'),
    openConfigButton: () => getElement('#config-btn'),
    closeConfigButton: () => getElement('#close-config'),
};