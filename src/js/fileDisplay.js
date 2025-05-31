// src/js/fileDisplay.js


import { UIElements, LOADING_SPINNER_HTML } from './uiElements.js';
import { api } from './apiService.js';
import { config, currentSortOrder, fileCache, icons } from './config.js'; // Importar config y fileCache
// import { formatDate, formatSize, getFileIcon } from './utils.js';

let currentViewMode = 'grid'; // 'grid' o 'list'

// Importar desde configMenu.js o duplicar aquí las claves y la función getDisplaySetting
// Por simplicidad momentánea, duplicaremos. Idealmente, esto podría estar en un módulo de 'settings'.
const LS_SHOW_FILE_NAME = 'axFinder_showFileName';
const LS_SHOW_DATE = 'axFinder_showDate';
const LS_SHOW_FILE_SIZE = 'axFinder_showFileSize';

function getDisplaySetting(key, defaultValue) {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? storedValue === 'true' : defaultValue;
}

// Nueva función para aplicar visibilidad
/**
 * Aplica o quita la clase 'ax-info-hidden' a los elementos que coinciden con el selector.
 * @param {HTMLElement} parentElement El elemento padre dentro del cual buscar (gridItem o listItem).
 * @param {string} selector El selector CSS para los elementos a afectar (ej: '.file-name-display').
 * @param {boolean} visible Si true, se quita la clase para mostrar; si false, se añade para ocultar.
 */
function applyVisibilityToElement(parentElement, selector, visible) {
    if (!parentElement) return;
    const elements = parentElement.querySelectorAll(selector);
    elements.forEach(element => {
        if (visible) {
            element.classList.remove('ax-info-hidden');
        } else {
            element.classList.add('ax-info-hidden');
        }
    });
}

// Funciones exportadas para actualizar la visibilidad globalmente
export function updateFileNameVisibility(visible) {
    document.querySelectorAll('.file-item .file-name-display').forEach(el => {
        if (visible) el.classList.remove('ax-info-hidden');
        else el.classList.add('ax-info-hidden');
    });
}
export function updateFileDateVisibility(visible) {
    document.querySelectorAll('.file-item .file-date-display').forEach(el => {
        if (visible) el.classList.remove('ax-info-hidden');
        else el.classList.add('ax-info-hidden');
    });
}
export function updateFileSizeVisibility(visible) {
    document.querySelectorAll('.file-item .file-size-display').forEach(el => {
        if (visible) el.classList.remove('ax-info-hidden');
        else el.classList.add('ax-info-hidden');
    });
}

export function setViewMode(mode) {
    console.log(`[FileDisplay] setViewMode INICIO - modo: ${mode}`);
    const filesContainer = UIElements.fileDisplayArea();
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    if (gridViewContainer) console.log('[FileDisplay DEBUG setViewMode ANTES] gridViewContainer.className:', gridViewContainer.className);
    if (listViewContainer) console.log('[FileDisplay DEBUG setViewMode ANTES] listViewContainer.className:', listViewContainer.className);

    // Referencias a los botones de la toolbar
    const gridBtnToolbar = document.getElementById('grid-btn');
    const listBtnToolbar = document.getElementById('list-btn');

    if (!filesContainer || !gridViewContainer || !listViewContainer) {
        console.error('[FileDisplay] Contenedores de vista no encontrados para cambiar vista.');
        return;
    }
    // No es necesario verificar gridBtnToolbar y listBtnToolbar aquí, se hará antes de usarlos

    // Quitar clase activa de ambos botones de la toolbar primero
    if (gridBtnToolbar) gridBtnToolbar.classList.remove('active');
    if (listBtnToolbar) listBtnToolbar.classList.remove('active');

    if (mode === 'grid') {
        if (gridViewContainer) {
            gridViewContainer.classList.remove('hidden');
            gridViewContainer.classList.add('grid', 'grid-cols-2', 'gap-4', 'sm:grid-cols-3', 'md:grid-cols-4', 'p-4');
            gridViewContainer.classList.remove('space-y-2');
        }
        if (listViewContainer) {
            listViewContainer.classList.add('hidden');
        }
        if (gridBtnToolbar) gridBtnToolbar.classList.add('active');
        config.currentViewMode = 'grid';
    } else if (mode === 'list') {
        if (listViewContainer) {
            listViewContainer.classList.remove('hidden');
            listViewContainer.classList.add('space-y-2', 'p-4');
            listViewContainer.classList.remove('grid', 'grid-cols-2', 'gap-4', 'sm:grid-cols-3', 'md:grid-cols-4');
        }
        if (gridViewContainer) {
            gridViewContainer.classList.add('hidden');
        }
        if (listBtnToolbar) listBtnToolbar.classList.add('active');
        config.currentViewMode = 'list';
    } else if (mode === 'compact') {
        // TODO: Implementar lógica para la vista compacta
        // Por ahora, podría ser similar a la lista o grid, o requerir su propio contenedor y clases.
        console.warn("[FileDisplay] Modo de vista 'compact' solicitado pero no completamente implementado.");
        // Como fallback, podemos usar la vista de lista o grid, o dejarlo como está.
        // Si usamos list como fallback:
        if (listViewContainer) listViewContainer.classList.remove('hidden');
        if (gridViewContainer) gridViewContainer.classList.add('hidden');
        if (listViewContainer) listViewContainer.className = 'space-y-1 p-2'; // Ejemplo: menos espacio, menos padding
        if (filesContainer) filesContainer.className = '';
        if (listBtnToolbar) listBtnToolbar.classList.add('active'); // O un botón dedicado si existe
        config.currentViewMode = 'compact';
    }

    if (gridViewContainer) console.log('[FileDisplay DEBUG setViewMode DESPUES DE CAMBIO CLASES] gridViewContainer.className:', gridViewContainer.className);
    if (listViewContainer) console.log('[FileDisplay DEBUG setViewMode DESPUES DE CAMBIO CLASES] listViewContainer.className:', listViewContainer.className);

    const currentPath = config.currentPath || '.';
    console.log(`[FileDisplay] setViewMode - Llamando a renderFiles o loadFiles para path: ${currentPath}`);
    if (fileCache.has(currentPath)) {
        renderFiles(fileCache.get(currentPath), currentPath);
    } else if (currentPath) {
        loadFiles(currentPath);
    }
    console.log('[FileDisplay] setViewMode FIN');
}

export async function loadFiles(path, sortBy = currentSortOrder.column, sortOrder = currentSortOrder.direction) {
    console.log(`[FileDisplay] loadFiles INVOCADO con path: ${path}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`);

    const filesContainer = UIElements.fileDisplayArea();
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    console.log("[FileDisplay DEBUG] Intentando obtener elementos:");
    console.log("[FileDisplay DEBUG] UIElements.fileDisplayArea() (#file-view) encontró:", filesContainer);
    console.log("[FileDisplay DEBUG] document.getElementById('grid-view-container') encontró:", gridViewContainer);
    console.log("[FileDisplay DEBUG] document.getElementById('list-view-container') encontró:", listViewContainer);

    if (!filesContainer || !gridViewContainer || !listViewContainer) {
        console.error('[FileDisplay] Uno o más contenedores de vista de archivos (file-view, grid-view-container, list-view-container) no fueron encontrados. Estado:', {
            esFilesContainerNulo: !filesContainer,
            esGridViewContainerNulo: !gridViewContainer,
            esListViewContainerNulo: !listViewContainer
        });
        return;
    }

    // Limpiar solo los contenedores de items, no todo fileView.
    gridViewContainer.innerHTML = '';
    listViewContainer.innerHTML = '';

    // Mostrar indicador de carga en el contenedor activo
    if (!gridViewContainer.classList.contains('hidden')) {
        gridViewContainer.innerHTML = LOADING_SPINNER_HTML;
    } else if (!listViewContainer.classList.contains('hidden')) {
        listViewContainer.innerHTML = LOADING_SPINNER_HTML;
    } else {
        gridViewContainer.innerHTML = LOADING_SPINNER_HTML;
    }

    config.currentPath = path;

    try {
        console.log(`[FileDisplay] loadFiles -> Llamando a api.fetchFiles con: path=${path}, sortBy=${sortBy}, sortOrder=${sortOrder}`);
        const data = await api.fetchFiles(path, sortBy, sortOrder);
        console.log("[FileDisplay] loadFiles -> Datos recibidos de api.fetchFiles:", JSON.stringify(data, null, 2));

        if (data.success && data.items && Array.isArray(data.items)) {
            fileCache.set(path, data.items);
            renderFiles(data.items, path);

            currentSortOrder.column = sortBy;
            currentSortOrder.direction = sortOrder;

        } else {
            console.error('[FileDisplay] Error o respuesta inválida del servidor:', data.message || 'Respuesta no exitosa');
            if (filesContainer) {
                filesContainer.innerHTML = `<div class="col-span-full text-center text-red-500">Error al cargar archivos: ${data.message || 'Respuesta inválida del servidor'}</div>`;
            }
        }
    } catch (error) {
        console.error('[FileDisplay] Error en fetch al cargar archivos:', error);
        if (filesContainer) {
            filesContainer.innerHTML = `<div class="col-span-full text-center text-red-500">Error de conexión al cargar archivos: ${error.message}</div>`;
        }
    }
}

function renderFiles(files, currentPath) {
    console.log(`[FileDisplay] renderFiles INICIO - Renderizando ${files.length} archivos en modo ${config.currentViewMode} para la ruta: ${currentPath}`);
    const filesContainer = UIElements.fileDisplayArea();
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    if (gridViewContainer) console.log('[FileDisplay DEBUG renderFiles INICIO] gridViewContainer.className:', gridViewContainer.className, 'innerHTML length:', gridViewContainer.innerHTML.length);
    if (listViewContainer) console.log('[FileDisplay DEBUG renderFiles INICIO] listViewContainer.className:', listViewContainer.className, 'innerHTML length:', listViewContainer.innerHTML.length);

    if (!filesContainer || !gridViewContainer || !listViewContainer) {
        console.error('[FileDisplay] Contenedores de vista no encontrados para renderizar.');
        return;
    }

    // Limpiar los contenedores específicos, no todo fileView
    gridViewContainer.innerHTML = '';
    listViewContainer.innerHTML = '';

    if (files.length === 0) {
        const emptyMessage = '<div class="col-span-full text-center text-gray-500">Esta carpeta está vacía.</div>';
        if (config.currentViewMode === 'grid') {
            gridViewContainer.innerHTML = emptyMessage;
        } else {
            listViewContainer.innerHTML = emptyMessage;
        }
        return;
    }

    const itemsContainer = config.currentViewMode === 'grid' ? gridViewContainer : listViewContainer;

    // Obtener el estado de visibilidad actual una vez
    const showName = getDisplaySetting(LS_SHOW_FILE_NAME, true);
    const showDate = getDisplaySetting(LS_SHOW_DATE, true);
    const showSize = getDisplaySetting(LS_SHOW_FILE_SIZE, true);

    files.forEach(item => {
        const itemIconSvg = item.icon || ''; // SVG del icono desde el backend

        if (config.currentViewMode === 'grid') {
            const gridItem = document.createElement('div');
            gridItem.className = 'p-4 transition-all bg-white border-2 border-blue-200 rounded-lg cursor-pointer hover:shadow-lg hover:border-blue-300 file-item group'; // Clase base, se sobreescribe para imágenes.
            gridItem.setAttribute('data-file-path', item.path);
            gridItem.setAttribute('data-file-type', item.type);
            gridItem.setAttribute('data-file-name', item.name);

            if (item.type === 'folder') {
                const folderIconHtml = `<div class="w-16 h-16 text-blue-500 mb-2 flex items-center justify-center">${itemIconSvg}</div>`;
                const folderDateDisplay = item.mtime ? new Date(item.mtime * 1000).toLocaleDateString() : '';
                gridItem.innerHTML = `
                    ${folderIconHtml}
                    <div class="flex flex-col items-center text-center w-full">
                        <span class="text-sm font-medium text-gray-700 truncate w-full file-name-display ${showName ? '' : 'ax-info-hidden'}">${item.name}</span>
                        ${folderDateDisplay ? `<span class="text-xs text-gray-500 truncate file-date-display ${showDate ? '' : 'ax-info-hidden'}">${folderDateDisplay}</span>` : ''}
                    </div>
                `;
            } else if (item.imageUrl) {
                console.log(`[DEBUG RenderImgGrid] Item: ${item.name}, mtime: ${item.mtime}, size: ${item.size}`);
                gridItem.className = 'transition-shadow shadow cursor-pointer file-item group hover:shadow-lg flex flex-col items-center bg-white rounded-lg overflow-hidden border border-gray-200';
                gridItem.setAttribute('data-image-url', item.imageUrl);

                const fileSizeDisplay = item.size !== undefined && item.size !== null ? item.size : '';
                const fileDateDisplay = item.mtime ? new Date(item.mtime * 1000).toLocaleDateString() : '';

                gridItem.innerHTML = `
                    <div class="w-full h-32 bg-gray-200 bg-cover bg-center relative" style="background-image: url('${item.imageUrl}');">
                        <div class="grid-img-tool w-full flex justify-center bg-white/80 absolute bottom-0 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ul class="grid grid-cols-3 gap-1.5 w-22">
                                <li class="flex w-8 h-8 justify-center items-center rounded-full p-2 hover:bg-blue-800/10 hover:text-blue-600 cursor-pointer action-view" alt="Ver" title="Ver archivo" data-action="view">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-4 h-4"><path fill="currentColor" d="M288 144a110.94 110.94 0 0 0-31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1-56 56 55.4 55.4 0 0 1-27-7.24A111.71 111.71 0 1 0 288 144zm284.52 97.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400c-98.65 0-189.09-55-237.93-144C98.91 167 189.34 112 288 112s189.09 55 237.93 144C477.1 345 386.66 400 288 400z"/></svg>
                                </li>
                                <li class="flex w-8 h-8 justify-center items-center rounded-full p-2 hover:bg-green-800/10 hover:text-green-600 cursor-pointer action-edit" alt="Editar" title="Editar archivo" data-action="edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-4 h-4"><path fill="currentColor" d="M402.3 344.9l32-32c5-5 13.7-1.5 13.7 5.7V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V112c0-26.5 21.5-48 48-48h273.5c7.1 0 10.7 8.6 5.7 13.7l-32 32c-1.5 1.5-3.5 2.3-5.7 2.3H48v352h352V350.5c0-2.1.8-4.1 2.3-5.6zm156.6-201.8L296.3 405.7l-90.4 10c-26.2 2.9-48.5-19.2-45.6-45.6l10-90.4L432.9 17.1c22.9-22.9 59.9-22.9 82.7 0l43.2 43.2c22.9 22.9 22.9 60 .1 82.8zM460.1 174L402 115.9 216.2 301.8l-7.3 65.3 65.3-7.3L460.1 174zm64.8-79.7l-43.2-43.2c-4.1-4.1-10.8-4.1-14.8 0L436 82l58.1 58.1 30.9-30.9c4-4.2 4-10.8-.1-14.9z"/></svg>
                                </li>
                                <li class="flex w-8 h-8 justify-center items-center rounded-full p-2 hover:bg-red-800/10 hover:text-red-600 cursor-pointer action-delete" alt="Eliminar" title="Borrar archivo" data-action="delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-4 h-4"><path fill="currentColor" d="M268 416h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12zM432 80h-82.41l-34-56.7A48 48 0 0 0 274.41 0H173.59a48 48 0 0 0-41.16 23.3L98.41 80H16A16 16 0 0 0 0 96v16a16 16 0 0 0 16 16h16v336a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128h16a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM171.84 50.91A6 6 0 0 1 177 48h94a6 6 0 0 1 5.15 2.91L293.61 80H154.39zM368 464H80V128h288zm-212-48h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12z"/></svg>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="flex flex-col p-2 text-center w-full">
                        <span class="w-full text-sm font-medium text-gray-700 truncate file-name-display ${showName ? '' : 'ax-info-hidden'}">${item.name}</span>
                        ${fileSizeDisplay ? `<span class="text-xs text-gray-500 truncate file-size-display ${showSize ? '' : 'ax-info-hidden'}">${fileSizeDisplay}</span>` : ''}
                        ${fileDateDisplay ? `<span class="text-xs text-gray-500 truncate file-date-display ${showDate ? '' : 'ax-info-hidden'}">${fileDateDisplay}</span>` : ''}
                    </div>
                `;
            } else { // Archivos genéricos (no carpetas, no imágenes con previsualización)
                const fileIconHtml = `<div class="w-16 h-16 text-gray-500 mb-2 flex items-center justify-center">${itemIconSvg}</div>`;
                const fileSizeDisplay = item.size !== undefined && item.size !== null ? item.size : '';
                const fileDateDisplay = item.mtime ? new Date(item.mtime * 1000).toLocaleDateString() : '';

                gridItem.innerHTML = `
                    ${fileIconHtml}
                    <div class="flex flex-col items-center text-center w-full">
                        <span class="text-sm font-medium text-gray-700 truncate w-full file-name-display ${showName ? '' : 'ax-info-hidden'}">${item.name}</span>
                        ${fileSizeDisplay ? `<span class="text-xs text-gray-500 truncate file-size-display ${showSize ? '' : 'ax-info-hidden'}">${fileSizeDisplay}</span>` : ''}
                        ${fileDateDisplay ? `<span class="text-xs text-gray-500 truncate file-date-display ${showDate ? '' : 'ax-info-hidden'}">${fileDateDisplay}</span>` : ''}
                    </div>
                `;
            }
            itemsContainer.appendChild(gridItem);
            // Las llamadas a applyVisibilityToElement(gridItem, ...) se eliminan ya que los spans controlan su visibilidad.

        } else if (config.currentViewMode === 'list') {
            const listItem = document.createElement('div');
            listItem.className = 'file-item-list group bg-white rounded-tr-md rounded-br-md shadow-sm hover:shadow-lg hover:bg-blue-50/50 transition-colors flex items-center file-item'; // Añadido file-item para consistencia de selectores de visibilidad
            listItem.setAttribute('data-file-path', item.path);
            listItem.setAttribute('data-file-type', item.type);
            listItem.setAttribute('data-file-name', item.name);

            let listIconHtml;
            if (item.type === 'folder') {
                // Para carpetas, usamos el SVG si está disponible, sino un ícono genérico de carpeta (si lo tuvieras en `icons`)
                // O mantenemos el itemIconSvg que podría ser específico del backend.
                listIconHtml = `<div class="flex-shrink-0 w-10 h-10 text-blue-500 flex items-center justify-center p-2">${itemIconSvg || icons.defaultFolderIcon || '📁'}</div>`;
            } else if (item.imageUrl) {
                listIconHtml = `<img src="${item.imageUrl}" alt="${item.name}" class="w-20 h-19 object-cover">`; // Clases de list.html
                listItem.setAttribute('data-image-url', item.imageUrl);
            } else {
                // Para otros archivos, usamos el SVG si está disponible, sino un ícono genérico de archivo
                listIconHtml = `<div class="flex-shrink-0 w-10 h-10 text-gray-400 flex items-center justify-center p-2">${itemIconSvg || icons.defaultFileIcon || '📄'}</div>`;
            }

            const fileSizeDisplay = item.size !== undefined && item.size !== null ? item.size : '';
            const fileDateDisplay = item.mtime ? new Date(item.mtime * 1000).toLocaleDateString() : '';
            const typeDisplay = item.type === 'folder' ? 'Carpeta' : 'Archivo';

            listItem.innerHTML = `
                ${listIconHtml}
                <div class="flex-1 min-w-0 px-4 py-2">
                    <p class="text-base font-medium text-gray-800 truncate file-name-display ${showName ? '' : 'ax-info-hidden'}">${item.name}</p>
                    <p class="text-xs text-gray-500 truncate file-size-display ${showSize ? '' : 'ax-info-hidden'}">
                        ${typeDisplay}${fileSizeDisplay ? ` - ${fileSizeDisplay}` : ''}
                    </p>
                    <p class="text-xs text-gray-500 truncate file-date-display ${showDate ? '' : 'ax-info-hidden'}">${fileDateDisplay}</p>
                </div>
                <div class="list-img-tool px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ul class="grid grid-cols-3 gap-1.5 w-22">
                        <li class="flex w-8 h-8 justify-center items-center rounded-full p-2 hover:bg-blue-800/10 hover:text-blue-600 cursor-pointer action-view" alt="Ver" title="Ver archivo" data-action="view">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-4 h-4"><path fill="currentColor" d="M288 144a110.94 110.94 0 0 0-31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1-56 56 55.4 55.4 0 0 1-27-7.24A111.71 111.71 0 1 0 288 144zm284.52 97.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400c-98.65 0-189.09-55-237.93-144C98.91 167 189.34 112 288 112s189.09 55 237.93 144C477.1 345 386.66 400 288 400z"/></svg>
                        </li>
                        <li class="flex w-8 h-8 justify-center items-center rounded-full p-2 hover:bg-green-800/10 hover:text-green-600 cursor-pointer action-edit" alt="Editar" title="Editar archivo" data-action="edit">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-4 h-4"><path fill="currentColor" d="M402.3 344.9l32-32c5-5 13.7-1.5 13.7 5.7V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V112c0-26.5 21.5-48 48-48h273.5c7.1 0 10.7 8.6 5.7 13.7l-32 32c-1.5 1.5-3.5 2.3-5.7 2.3H48v352h352V350.5c0-2.1.8-4.1 2.3-5.6zm156.6-201.8L296.3 405.7l-90.4 10c-26.2 2.9-48.5-19.2-45.6-45.6l10-90.4L432.9 17.1c22.9-22.9 59.9-22.9 82.7 0l43.2 43.2c22.9 22.9 22.9 60 .1 82.8zM460.1 174L402 115.9 216.2 301.8l-7.3 65.3 65.3-7.3L460.1 174zm64.8-79.7l-43.2-43.2c-4.1-4.1-10.8-4.1-14.8 0L436 82l58.1 58.1 30.9-30.9c4-4.2 4-10.8-.1-14.9z"/></svg>
                        </li>
                        <li class="flex w-8 h-8 justify-center items-center rounded-full p-2 hover:bg-red-800/10 hover:text-red-600 cursor-pointer action-delete" alt="Eliminar" title="Borrar archivo" data-action="delete">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-4 h-4"><path fill="currentColor" d="M268 416h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12zM432 80h-82.41l-34-56.7A48 48 0 0 0 274.41 0H173.59a48 48 0 0 0-41.16 23.3L98.41 80H16A16 16 0 0 0 0 96v16a16 16 0 0 0 16 16h16v336a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128h16a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM171.84 50.91A6 6 0 0 1 177 48h94a6 6 0 0 1 5.15 2.91L293.61 80H154.39zM368 464H80V128h288zm-212-48h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12z"/></svg>
                        </li>
                    </ul>
                </div>
            `;

            console.log('[FileDisplay DEBUG renderFiles] Creando listItem para:', item.name, 'Contenido HTML parcial:', listItem.innerHTML.substring(0, 100));
            itemsContainer.appendChild(listItem);
        }
    });

    // Event listeners para los elementos de archivo (común a grid y list)
    itemsContainer.querySelectorAll('[data-file-path]').forEach(el => {
        el.addEventListener('click', (event) => {
            event.stopPropagation(); // Evitar que se propague a listeners de carpeta si están anidados
            const filePath = el.dataset.filePath;
            const fileType = el.dataset.type;
            console.log(`[FileDisplay] Elemento clickeado: ${filePath}, Tipo: ${fileType}`);
            if (fileType === 'folder') {
                loadFiles(filePath); // Cargar contenido de la subcarpeta
                // Actualizar el árbol de carpetas si es necesario (marcar como activa, etc.)
                // Esta lógica podría estar en folderNavigation.js y ser llamada desde aquí o mediante un evento.
                document.dispatchEvent(new CustomEvent('folderNavigated', { detail: { path: filePath } }));
            } else {
                // Lógica para abrir/previsualizar archivo
                console.log(`[FileDisplay] Abrir/previsualizar archivo: ${filePath}`);
                // Ejemplo: openFilePreview(filePath); // Implementar esta función
            }
        });
    });

    // Añadir event listeners a los items después de renderizarlos
    addEventListenersToItems(gridViewContainer);
    addEventListenersToItems(listViewContainer);

    // Forzar la actualización de la visibilidad globalmente por si acaso algo se quedó desincronizado
    // Esto es más una medida de seguridad, la lógica de applyVisibilityToElement por item debería ser suficiente
    updateFileNameVisibility(showName);
    updateFileDateVisibility(showDate);
    updateFileSizeVisibility(showSize);

    console.log('[FileDisplay DEBUG renderFiles FIN BUCLE] innerHTML de itemsContainer (si es lista):', (config.currentViewMode === 'list' && listViewContainer) ? listViewContainer.innerHTML.substring(0, 200) : 'No es lista o no hay contenedor');
}

function addEventListenersToItems(container) {
    if (!container) return;

    // Listener para doble clic en imágenes (funcionalidad existente)
    const imageItemsForDblClick = container.querySelectorAll('[data-image-url][data-file-name]'); // Aseguramos que tenga ambos data attributes
    imageItemsForDblClick.forEach(item => {
        // Primero removemos cualquier listener de dblclick existente para evitar duplicados
        // Esto es una solución simple. Una mejor podría ser pasar una función con nombre para poder removerla específicamente.
        const new_item = item.cloneNode(true);
        item.parentNode.replaceChild(new_item, item);
        // Ahora new_item es el que está en el DOM, y no tiene listeners

        new_item.addEventListener('dblclick', () => {
            const imageUrl = new_item.dataset.imageUrl;
            const imageName = new_item.dataset.fileName;

            if (imageUrl && imageName) {
                const currentFiles = fileCache.get(config.currentPath) || [];
                const allImagesInFolder = currentFiles.filter(file => file.imageUrl);
                let currentIndex = -1;
                if (allImagesInFolder.length > 0) {
                    currentIndex = allImagesInFolder.findIndex(img => img.imageUrl === imageUrl);
                }
                showImageModal(imageUrl, imageName, allImagesInFolder, currentIndex);
            }
        });
    });

    // Listener para botones de acción dentro de cada item (grid o list)
    const allFileItems = container.querySelectorAll('.file-item, .file-item-list');
    allFileItems.forEach(item => {
        const viewButton = item.querySelector('[data-action="view"]');

        if (viewButton) {
            // Prevenir duplicados para el botón de ver también
            const new_viewButton = viewButton.cloneNode(true);
            viewButton.parentNode.replaceChild(new_viewButton, viewButton);

            new_viewButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Evitar que el clic se propague al file-item padre

                const imageUrl = item.dataset.imageUrl;
                const imageName = item.dataset.fileName;

                if (imageUrl && imageName) { // Solo actuar si el item es una imagen
                    console.log(`[FileDisplay] Botón Ver clickeado para: ${imageName}`);
                    const currentFiles = fileCache.get(config.currentPath) || [];
                    const allImagesInFolder = currentFiles.filter(file => file.imageUrl);
                    let currentIndex = -1;
                    if (allImagesInFolder.length > 0) {
                        currentIndex = allImagesInFolder.findIndex(img => img.imageUrl === imageUrl);
                    }
                    showImageModal(imageUrl, imageName, allImagesInFolder, currentIndex);
                } else {
                    console.log('[FileDisplay] Botón Ver clickeado, pero no es una imagen o falta data.', item.dataset);
                    // Aquí podrías manejar la acción de "ver" para otros tipos de archivo si es necesario
                    // Por ejemplo, si es un PDF o un texto, podrías abrirlo en una nueva pestaña o un visor diferente.
                    // if (item.dataset.fileType === 'file' && !imageUrl) { ... }
                }
            });
        }

        // Aquí se podrían añadir listeners para otros data-action como edit o delete
        const editButton = item.querySelector('[data-action="edit"]');
        if (editButton) {
            // Lógica para editar (placeholder)
            editButton.addEventListener('click', (event) => {
                event.stopPropagation();
                console.log('[FileDisplay] Botón Editar clickeado para:', item.dataset.filePath);
                // alert(`Editar: ${item.dataset.filePath}`);
            });
        }

        const deleteButton = item.querySelector('[data-action="delete"]');
        if (deleteButton) {
            // Lógica para eliminar (placeholder)
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                console.log('[FileDisplay] Botón Eliminar clickeado para:', item.dataset.filePath);
                // if (confirm(`¿Seguro que quieres eliminar ${item.dataset.fileName}?`)) {
                //     // Llamar a la API para eliminar y luego recargar la vista
                // }
            });
        }
    });
}

let currentModalImages = [];
let currentModalIndex = -1;

function showImageModal(imageUrl, imageName, allImages = [], index = -1) {
    // Eliminar modal existente si lo hay
    const existingModalOverlay = document.getElementById('ax-image-modal-overlay');
    if (existingModalOverlay) {
        existingModalOverlay.remove();
    }
    document.removeEventListener('keydown', handleModalKeyNavigation);
    document.removeEventListener('keydown', handleEscKey);

    currentModalImages = allImages;
    currentModalIndex = index;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'ax-image-modal-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4'; // p-4 para espacio alrededor del modal
    overlay.addEventListener('click', () => closeModal());

    // Crear contenedor del modal (el recuadro blanco general)
    // Debe ser relative para el posicionamiento absoluto del botón X.
    const modalContent = document.createElement('div');
    modalContent.className = 'relative bg-white p-4 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] z-50 flex flex-col';
    modalContent.addEventListener('click', (e) => e.stopPropagation());

    // Contenedor para el nombre del archivo y el botón de cierre (HIJO DE modalContent)
    const headerControlsContainer = document.createElement('div');
    headerControlsContainer.className = 'flex justify-between items-center w-full mb-3 px-1'; // px-1 para un pequeño margen lateral interno

    // Nombre del archivo (dentro de headerControlsContainer, alineado a la izquierda por flex)
    const nameElement = document.createElement('div');
    nameElement.textContent = imageName;
    nameElement.className = 'text-lg font-semibold text-gray-800 truncate'; // Quitado text-center, truncate para nombres largos
    headerControlsContainer.appendChild(nameElement);

    // Botón de cierre (dentro de headerControlsContainer, alineado a la derecha por flex)
    const closeButtonElement = document.createElement('button');
    closeButtonElement.textContent = 'X';
    closeButtonElement.className = 'text-black hover:text-gray-700 text-xl ml-auto font-semibold'; // Clases simplificadas
    closeButtonElement.style.backgroundColor = 'transparent';
    closeButtonElement.style.border = 'none';
    closeButtonElement.style.padding = '0.1rem 0.3rem'; // Padding aún más sutil para que no sea muy grande
    closeButtonElement.title = 'Cerrar';
    closeButtonElement.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });
    headerControlsContainer.appendChild(closeButtonElement);

    modalContent.appendChild(headerControlsContainer); // Añadir el contenedor de controles del encabezado

    // Contenedor específico para la imagen (HIJO DE modalContent, después de headerControlsContainer)
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'w-full h-full flex-grow flex flex-col items-center justify-center overflow-hidden'; // Eliminado pt-3

    // Imagen (dentro de imageWrapper)
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = imageName;
    // Ajustar max-h para que quepa bien con el nombre y el padding
    img.className = 'max-w-full max-h-[calc(90vh-150px)] object-contain rounded';
    imageWrapper.appendChild(img);

    modalContent.appendChild(imageWrapper); // imageWrapper (con nombre e imagen) se añade a modalContent

    // Añadir modalContent al overlay
    overlay.appendChild(modalContent);

    // Botones de navegación (AHORA HIJOS DE OVERLAY, fuera de modalContent)
    if (currentModalImages.length > 1) {
        const prevButton = document.createElement('button');
        prevButton.id = 'ax-modal-prev-btn';
        prevButton.innerHTML = '&#10094;'; // <
        // Estilo para estar en el overlay, a la izquierda del modalContent
        prevButton.className = 'absolute left-5 top-1/2 -translate-y-1/2 text-4xl text-white opacity-60 hover:opacity-90 focus:outline-none z-50 p-3 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all';
        prevButton.title = 'Anterior';
        prevButton.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateToImage(-1);
        });
        overlay.appendChild(prevButton); // Añadido a OVERLAY

        const nextButton = document.createElement('button');
        nextButton.id = 'ax-modal-next-btn';
        nextButton.innerHTML = '&#10095;'; // >
        // Estilo para estar en el overlay, a la derecha del modalContent
        nextButton.className = 'absolute right-5 top-1/2 -translate-y-1/2 text-4xl text-white opacity-60 hover:opacity-90 focus:outline-none z-50 p-3 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all';
        nextButton.title = 'Siguiente';
        nextButton.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateToImage(1);
        });
        overlay.appendChild(nextButton); // Añadido a OVERLAY

        updateNavigationButtons();
    }

    document.body.appendChild(overlay);

    document.addEventListener('keydown', handleEscKey);
    if (currentModalImages.length > 1) {
        document.addEventListener('keydown', handleModalKeyNavigation);
    }
}

function navigateToImage(direction) {
    if (currentModalImages.length <= 1) return;

    const newIndex = currentModalIndex + direction;

    if (newIndex >= 0 && newIndex < currentModalImages.length) {
        currentModalIndex = newIndex;
        const newImage = currentModalImages[currentModalIndex];

        const imgElement = document.querySelector('#ax-image-modal-overlay img');
        const nameElement = document.querySelector('#ax-image-modal-overlay .text-lg.font-semibold');

        if (imgElement && nameElement) {
            imgElement.src = newImage.imageUrl;
            imgElement.alt = newImage.name;
            nameElement.textContent = newImage.name;
        }
        updateNavigationButtons();
    }
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('ax-modal-prev-btn');
    const nextButton = document.getElementById('ax-modal-next-btn');

    if (prevButton) {
        prevButton.disabled = currentModalIndex === 0;
        prevButton.classList.toggle('opacity-50', prevButton.disabled);
        prevButton.classList.toggle('cursor-not-allowed', prevButton.disabled);
    }
    if (nextButton) {
        nextButton.disabled = currentModalIndex === currentModalImages.length - 1;
        nextButton.classList.toggle('opacity-50', nextButton.disabled);
        nextButton.classList.toggle('cursor-not-allowed', nextButton.disabled);
    }
}

function closeModal() {
    const modalOverlay = document.getElementById('ax-image-modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
    }
    document.removeEventListener('keydown', handleEscKey);
    document.removeEventListener('keydown', handleModalKeyNavigation); // Asegurarse de limpiar este también
    currentModalImages = [];
    currentModalIndex = -1;
}

function handleModalKeyNavigation(event) {
    if (event.key === 'ArrowLeft') {
        navigateToImage(-1);
    }
    if (event.key === 'ArrowRight') {
        navigateToImage(1);
    }
}

function handleEscKey(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}

export function clearFileView() {
    console.log('[FileDisplay] clearFileView llamado');
    const fileView = UIElements.fileDisplayArea();
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    if (fileView) {
        if (gridViewContainer) gridViewContainer.innerHTML = '';
        if (listViewContainer) listViewContainer.innerHTML = '';

        const emptyMessage = '<p class="p-4 text-gray-500">Seleccione una carpeta para ver los archivos.</p>';
        if (config.currentViewMode === 'grid' && gridViewContainer) {
            gridViewContainer.innerHTML = emptyMessage;
        } else if (config.currentViewMode === 'list' && listViewContainer) {
            listViewContainer.innerHTML = emptyMessage;
        } else if (gridViewContainer) {
            gridViewContainer.innerHTML = emptyMessage;
        }
    }
    config.currentPath = '.';
}

