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
        filesContainer.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4';
    } else if (mode === 'list') {
        listViewContainer.classList.remove('hidden');
        gridViewContainer.classList.add('hidden');
        filesContainer.className = 'p-4 space-y-2'; // Quitar clases de grid, añadir espaciado para lista
    }

    // Volver a renderizar los archivos cacheados con la nueva vista
    const currentPath = config.currentPath || '.'; // Usar la ruta desde config, '.' para la raíz
    if (fileCache.has(currentPath)) {
        renderFiles(fileCache.get(currentPath), currentPath);
    } else if (currentPath) {
        // Si no está en caché pero tenemos una ruta, intentar cargarla de nuevo
        loadFiles(currentPath);
    }
}

export async function loadFiles(path, sortBy = currentSortOrder.column, sortOrder = currentSortOrder.direction) {
    console.log(`[FileDisplay] loadFiles llamado con path: ${path}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`);
    const filesContainer = UIElements.fileDisplayArea();
    const currentFolderDisplay = UIElements.currentFolderDisplay();
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    if (!filesContainer || !currentFolderDisplay || !gridViewContainer || !listViewContainer) {
        console.error('[FileDisplay] Contenedores de archivos o ruta actual no encontrados.');
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
    } else { // Si ambos están ocultos (estado inicial o error), ponerlo en grid por defecto
        gridViewContainer.innerHTML = LOADING_SPINNER_HTML;
    }

    config.currentPath = path; // Guardar la ruta actual en config.js

    try {
        const data = await api.fetchFiles(path, sortBy, sortOrder);

        if (data.success && data.items && Array.isArray(data.items)) { // Verificar success y items
            fileCache.set(path, data.items); // Guardar en caché
            renderFiles(data.items, path); // Renderizar con la ruta actual

            currentSortOrder.column = sortBy;
            currentSortOrder.direction = sortOrder;

            // Update the current-folder-display element
            currentFolderDisplay.textContent = path === '' || path === '.' ? '/' : '/' + path;
            currentFolderDisplay.dataset.path = path;

        } else {
            console.error('[FileDisplay] Error o respuesta inválida del servidor:', data.message || 'Respuesta no exitosa');
            filesContainer.innerHTML = `<div class="col-span-full text-center text-red-500">Error al cargar archivos: ${data.message || 'Respuesta inválida del servidor'}</div>`;
        }
    } catch (error) {
        console.error('[FileDisplay] Error en fetch al cargar archivos:', error);
        filesContainer.innerHTML = `<div class="col-span-full text-center text-red-500">Error de conexión al cargar archivos: ${error.message}</div>`;
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
            gridItem.className = 'file-item group bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center';
            gridItem.setAttribute('data-file-path', item.path); // Usar item.path
            gridItem.setAttribute('data-file-type', item.type);

            if (item.type === 'folder') {
                const folderIconHtml = `<div class="w-16 h-16 text-blue-500 mb-2 flex items-center justify-center">${itemIconSvg}</div>`;
                gridItem.innerHTML = `
                    ${folderIconHtml}
                    <span class="text-sm font-medium text-gray-700 truncate w-full">${item.name}</span>
                `;
            } else if (item.imageUrl) { // Si es una imagen y tiene imageUrl para la miniatura
                // Aplicar el nuevo diseño para imágenes
                gridItem.className = 'file-item group shadow hover:shadow-md transition-shadow cursor-pointer'; // Clases base del div principal

                const imgElement = document.createElement('img');
                imgElement.src = item.imageUrl; // Usar imageUrl
                imgElement.alt = item.name;
                imgElement.className = 'w-full h-24 object-cover';
                gridItem.appendChild(imgElement);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'bg-white p-3 rounded-b-lg flex flex-col items-center text-center h-18';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'text-sm font-medium text-gray-700 truncate w-full mt-1';
                nameSpan.textContent = item.name;
                infoDiv.appendChild(nameSpan);

                if (item.size) {
                    const sizeSpan = document.createElement('span');
                    sizeSpan.className = 'text-xs text-gray-500';
                    sizeSpan.textContent = item.size; // Usar item.size
                    infoDiv.appendChild(sizeSpan);
                }
                gridItem.appendChild(infoDiv);

            } else { // Para otros archivos, usar el SVG del icono genérico de archivo
                const fileIconHtml = `<div class="w-16 h-16 text-gray-400 mb-2 flex items-center justify-center">${itemIconSvg}</div>`;
                gridItem.innerHTML = `
                    ${fileIconHtml}
                    <span class="text-sm font-medium text-gray-700 truncate w-full">${item.name}</span>
                    ${item.size ? `<span class="text-xs text-gray-500">${item.size}</span>` : ''} // Usar item.size
                `;
            }

            itemsContainer.appendChild(gridItem);

        } else { // list view
            // Crear elemento para la vista Lista
            const listItem = document.createElement('div');
            listItem.className = 'file-item-list group bg-white p-2.5 rounded-md shadow-sm hover:bg-blue-50 transition-colors cursor-pointer flex items-center space-x-3';
            listItem.setAttribute('data-file-path', item.path); // Usar item.path
            listItem.setAttribute('data-file-type', item.type);

            let listIconHtml = '';
            if (item.type === 'folder') {
                listIconHtml = `<div class="flex-shrink-0 w-6 h-6 text-blue-500 flex items-center justify-center">${itemIconSvg}</div>`;
            } else if (item.imageUrl) {
                listIconHtml = `<img src="${item.imageUrl}" alt="${item.name}" class="flex-shrink-0 w-8 h-8 object-cover rounded">`; // Usar imageUrl
            } else {
                listIconHtml = `<div class="flex-shrink-0 w-6 h-6 text-gray-400 flex items-center justify-center">${itemIconSvg}</div>`;
            }

            listItem.innerHTML = `
                ${listIconHtml}
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${item.name}</p>
                    <p class="text-xs text-gray-500 truncate">${item.type === 'folder' ? 'Carpeta' : 'Archivo'}${item.size ? ` - ${item.size}` : ''}</p> // Usar item.size
                </div>
                <div class="text-xs text-gray-400 group-hover:text-blue-600">
                    ${item.mtime ? String(new Date(item.mtime * 1000).toLocaleDateString()) : ''} <!-- Usar item.mtime -->
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
    const currentPathElement = UIElements.currentFolderDisplay();
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    if (fileView) {
        // Limpiar ambos contenedores de vista
        if (gridViewContainer) gridViewContainer.innerHTML = '';
        if (listViewContainer) listViewContainer.innerHTML = '';

        // Mostrar mensaje de "seleccione carpeta" en el contenedor activo
        const emptyMessage = '<p class="p-4 text-gray-500">Seleccione una carpeta para ver los archivos.</p>';
        if (currentViewMode === 'grid' && gridViewContainer) {
            gridViewContainer.innerHTML = emptyMessage;
        } else if (currentViewMode === 'list' && listViewContainer) {
            listViewContainer.innerHTML = emptyMessage;
        } else if (gridViewContainer) { // Default a grid si no hay modo activo
            gridViewContainer.innerHTML = emptyMessage;
        }
    }
    if (currentPathElement) {
        currentPathElement.textContent = '/';
        currentPathElement.dataset.path = '.'; // Resetear la ruta a la raíz
        config.currentPath = '.'; // Resetear la ruta en config
    }
}

