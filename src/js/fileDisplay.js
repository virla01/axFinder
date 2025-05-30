// src/js/fileDisplay.js


import { UIElements, LOADING_SPINNER_HTML } from './uiElements.js';
import { api } from './apiService.js';
import { config, currentSortOrder, fileCache } from './config.js'; // Importar config y fileCache
// import { formatDate, formatSize, getFileIcon } from './utils.js';

let currentViewMode = 'grid'; // 'grid' o 'list'

export function setViewMode(mode) {
    console.log(`[FileDisplay] setViewMode llamado con: ${mode}`);
    currentViewMode = mode;
    const filesContainer = UIElements.fileDisplayArea();
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    if (!filesContainer || !gridViewContainer || !listViewContainer) {
        console.error('[FileDisplay] Contenedores de vista no encontrados para cambiar vista.');
        return;
    }

    if (mode === 'grid') {
        gridViewContainer.classList.remove('hidden');
        listViewContainer.classList.add('hidden');
        gridViewContainer.className = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
        listViewContainer.className = 'hidden';
        filesContainer.className = 'p-4';
    } else if (mode === 'list') {
        listViewContainer.classList.remove('hidden');
        gridViewContainer.classList.add('hidden');
        listViewContainer.className = 'space-y-2';
        gridViewContainer.className = 'hidden';
        filesContainer.className = 'p-4';
    }

    const currentPath = config.currentPath || '.';
    if (fileCache.has(currentPath)) {
        renderFiles(fileCache.get(currentPath), currentPath);
    } else if (currentPath) {
        loadFiles(currentPath);
    }
}

export async function loadFiles(path, sortBy = currentSortOrder.column, sortOrder = currentSortOrder.direction) {
    console.log(`[FileDisplay] loadFiles llamado con path: ${path}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`);

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
        const data = await api.fetchFiles(path, sortBy, sortOrder);

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
    console.log(`[FileDisplay] Renderizando ${files.length} archivos en modo ${currentViewMode} para la ruta: ${currentPath}`);
    const filesContainer = UIElements.fileDisplayArea();
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    if (!filesContainer || !gridViewContainer || !listViewContainer) {
        console.error('[FileDisplay] Contenedores de vista no encontrados para renderizar.');
        return;
    }

    // Limpiar los contenedores específicos, no todo fileView
    gridViewContainer.innerHTML = '';
    listViewContainer.innerHTML = '';

    if (files.length === 0) {
        const emptyMessage = '<div class="col-span-full text-center text-gray-500">Esta carpeta está vacía.</div>';
        if (currentViewMode === 'grid') {
            gridViewContainer.innerHTML = emptyMessage;
        } else {
            listViewContainer.innerHTML = emptyMessage;
        }
        return;
    }

    const itemsContainer = currentViewMode === 'grid' ? gridViewContainer : listViewContainer;

    files.forEach(item => {
        const itemIconSvg = item.icon || ''; // SVG del icono desde el backend

        if (currentViewMode === 'grid') {
            // Crear elemento para la vista Grid
            const gridItem = document.createElement('div');
            gridItem.className = 'p-4 transition-all bg-white border-2 border-blue-200 rounded-lg cursor-pointer hover:shadow-lg hover:border-blue-300 file-item group';
            gridItem.setAttribute('data-file-path', item.path);
            gridItem.setAttribute('data-file-type', item.type);

            if (item.type === 'folder') {
                const folderIconHtml = `<div class="w-16 h-16 text-blue-500 mb-2 flex items-center justify-center">${itemIconSvg}</div>`;
                gridItem.innerHTML = `
                    ${folderIconHtml}
                    <span class="text-sm font-medium text-gray-700 truncate w-full">${item.name}</span>
                `;
            } else if (item.imageUrl) {
                gridItem.className = 'transition-shadow shadow cursor-pointer file-item group hover:shadow-md';

                const imgElement = document.createElement('img');
                imgElement.src = item.imageUrl;
                imgElement.alt = item.name;
                imgElement.className = 'object-cover w-full h-24';
                gridItem.appendChild(imgElement);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'flex flex-col items-center p-3 text-center bg-white rounded-b-lg h-18';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'w-full mt-1 text-sm font-medium text-gray-700 truncate';
                nameSpan.textContent = item.name;
                infoDiv.appendChild(nameSpan);

                if (item.size) {
                    const sizeSpan = document.createElement('span');
                    sizeSpan.className = 'text-xs text-gray-500';
                    sizeSpan.textContent = item.size;
                    infoDiv.appendChild(sizeSpan);
                }
                gridItem.appendChild(infoDiv);

            } else {
                const fileIconHtml = `<div class="w-16 h-16 text-gray-400 mb-2 flex items-center justify-center">${itemIconSvg}</div>`;
                gridItem.innerHTML = `
                    ${fileIconHtml}
                    <span class="text-sm font-medium text-gray-700 truncate w-full">${item.name}</span>
                    ${item.size ? `<span class="text-xs text-gray-500">${item.size}</span>` : ''}
                `;
            }

            itemsContainer.appendChild(gridItem);

        } else { // list view
            const listItem = document.createElement('div');
            listItem.className = 'file-item-list group bg-white p-2.5 rounded-md shadow-sm hover:bg-blue-50 transition-colors cursor-pointer flex items-center space-x-3';
            listItem.setAttribute('data-file-path', item.path);
            listItem.setAttribute('data-file-type', item.type);

            let listIconHtml = '';
            if (item.type === 'folder') {
                listIconHtml = `<div class="flex-shrink-0 w-6 h-6 text-blue-500 flex items-center justify-center">${itemIconSvg}</div>`;
            } else if (item.imageUrl) {
                listIconHtml = `<img src="${item.imageUrl}" alt="${item.name}" class="flex-shrink-0 w-8 h-8 object-cover rounded">`;
            } else {
                listIconHtml = `<div class="flex-shrink-0 w-6 h-6 text-gray-400 flex items-center justify-center">${itemIconSvg}</div>`;
            }

            listItem.innerHTML = `
                ${listIconHtml}
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${item.name}</p>
                    <p class="text-xs text-gray-500 truncate">${item.type === 'folder' ? 'Carpeta' : 'Archivo'}${item.size ? ` - ${item.size}` : ''}</p>
                </div>
                <div class="text-xs text-gray-400 group-hover:text-blue-600">
                    ${item.mtime ? String(new Date(item.mtime * 1000).toLocaleDateString()) : ''}
                </div>
            `;

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
        if (currentViewMode === 'grid' && gridViewContainer) {
            gridViewContainer.innerHTML = emptyMessage;
        } else if (currentViewMode === 'list' && listViewContainer) {
            listViewContainer.innerHTML = emptyMessage;
        } else if (gridViewContainer) {
            gridViewContainer.innerHTML = emptyMessage;
        }
    }
    config.currentPath = '.';
}

