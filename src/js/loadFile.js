import { LOADING_SPINNER_HTML } from './uiElements.js';

function loadFiles(folderName = '', sortBy = 'name', sortOrder = 'asc') {
    const fileView = document.getElementById('file-view');

    if (!fileView) { // Actualizado
        console.error('Error: No se encontró el contenedor de vista de archivos (ID: file-view) o de ruta actual (ID: current-folder-display). Verifique el HTML.');
        const mainContentArea = document.getElementById('main-content-area');
        if (mainContentArea) mainContentArea.innerHTML = '<p class="p-4 text-red-600 font-bold">Error Crítico: Elementos de la interfaz no encontrados.</p>';
        return;
    }

    // Limpiar solo los contenedores de items, no todo fileView.
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');

    if (!gridViewContainer || !listViewContainer) {
        console.error('Error: No se encontraron los contenedores grid-view-container o list-view-container.');
        fileView.innerHTML = '<p class="p-4 text-red-500">Error de renderizado: contenedores de vista no encontrados.</p>';
        return;
    }

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

    const folderParam = folderName === '' ? '.' : folderName;
    fetch(`./src/api/files.php?action=list_files&folder=${encodeURIComponent(folderParam)}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                return response.json();
            } else {
                return response.text().then(text => {
                    throw new Error(`Respuesta inesperada del servidor (no JSON): ${response.status} ${response.statusText}. Contenido: ${text.substring(0, 200)}...`);
                });
            }
        })
        .then(data => {
            // Primero obtenemos las referencias a los contenedores
            const gridViewContainer = document.getElementById('grid-view-container');
            const listViewContainer = document.getElementById('list-view-container');

            // Verificamos que los contenedores existan ANTES de intentar usarlos o limpiarlos
            if (!gridViewContainer || !listViewContainer) {
                console.error('Error crítico: grid-view-container o list-view-container no encontrados DESPUÉS del fetch. Esto no debería suceder.');
                if (fileView) fileView.innerHTML = '<p class="p-4 text-red-500">Error fatal de renderizado. Contacte al administrador.</p>';
                return;
            }

            // Limpiar los contenedores específicos, no todo fileView
            gridViewContainer.innerHTML = '';
            listViewContainer.innerHTML = '';

            if (data.success && data.items) {
                if (data.items.length === 0) {
                    // Mostrar mensaje de carpeta vacía en el contenedor activo
                    if (!gridViewContainer.classList.contains('hidden')) {
                        gridViewContainer.innerHTML = '<p class="p-4 text-gray-500">Esta carpeta está vacía.</p>';
                    } else {
                        listViewContainer.innerHTML = '<p class="p-4 text-gray-500">Esta carpeta está vacía.</p>';
                    }
                    return;
                }

                // Determinar el modo de vista actual para renderizar
                // const gridViewContainer = document.getElementById('grid-view-container'); // Ya definido arriba
                // const listViewContainer = document.getElementById('list-view-container'); // Ya definido arriba
                const isGridViewActive = !gridViewContainer.classList.contains('hidden');

                // El indicador de carga ya fue limpiado arriba.

                const itemsContainer = isGridViewActive ? gridViewContainer : listViewContainer;

                data.items.forEach(item => {
                    const itemIconSvg = item.icon || ''; // SVG del icono desde el backend

                    // Crear elemento para la vista Grid
                    const gridItem = document.createElement('div');
                    gridItem.className = 'file-item group bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center';
                    gridItem.setAttribute('data-file-id', item.name);
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
                        imgElement.src = item.imageUrl;
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
                            sizeSpan.textContent = item.size;
                            infoDiv.appendChild(sizeSpan);
                        }
                        gridItem.appendChild(infoDiv);

                    } else { // Para otros archivos, usar el SVG del icono genérico de archivo
                        const fileIconHtml = `<div class="w-16 h-16 text-gray-400 mb-2 flex items-center justify-center">${itemIconSvg}</div>`;
                        gridItem.innerHTML = `
                            ${fileIconHtml}
                            <span class="text-sm font-medium text-gray-700 truncate w-full">${item.name}</span>
                            ${item.size ? `<span class="text-xs text-gray-500">${item.size}</span>` : ''}
                        `;
                    }

                    // Crear elemento para la vista Lista
                    const listItem = document.createElement('div');
                    listItem.className = 'file-item-list group bg-white p-2.5 rounded-md shadow-sm hover:bg-blue-50 transition-colors cursor-pointer flex items-center space-x-3';
                    listItem.setAttribute('data-file-id', item.name);
                    listItem.setAttribute('data-file-type', item.type);

                    let listIconHtml = '';
                    if (item.type === 'folder') {
                        listIconHtml = `<div class="w-6 h-6 text-blue-500 flex items-center justify-center">${itemIconSvg}</div>`;
                        listItem.addEventListener('click', () => {
                            const newPath = folderName === '.' ? item.name : `${folderName}/${item.name}`;
                            loadFiles(newPath);
                        });
                    } else if (item.imageUrl) {
                        listIconHtml = `<img src="${item.imageUrl}" alt="${item.name}" class="w-8 h-8 object-cover rounded">`;
                    } else {
                        listIconHtml = `<div class="w-6 h-6 text-gray-400 flex items-center justify-center">${itemIconSvg}</div>`;
                    }

                    listItem.innerHTML = `
                        <div class="flex-shrink-0">
                            ${listIconHtml}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-800 truncate">${item.name}</p>
                            <p class="text-xs text-gray-500 truncate">${item.type === 'folder' ? 'Carpeta' : 'Archivo'}${item.size ? ` - ${item.size}` : ''}</p>
                        </div>
                        <div class="text-xs text-gray-400 group-hover:text-blue-600">
                            <!-- Acciones o fecha -->
                        </div>
                    `;

                    // Añadir al contenedor correspondiente según la vista activa
                    if (isGridViewActive) {
                        gridViewContainer.appendChild(gridItem);
                    } else {
                        listViewContainer.appendChild(listItem);
                    }
                });

            } else {
                console.error('Error al cargar archivos:', data.message || 'Respuesta no exitosa');
                fileView.innerHTML = `<p class="p-4 text-red-500">Error al cargar archivos: ${data.message || 'Error desconocido'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error en fetch al cargar archivos:', error);
            fileView.innerHTML = `<p class="p-4 text-red-500">Error de conexión al cargar archivos: ${error.message}</p>`;
        });
}

let currentSortOrder = { column: 'name', direction: 'asc' }; // Default sort order

function clearFileView() {
    const fileView = document.getElementById('file-view');
    const currentPathElement = document.getElementById('current-path');
    if (fileView) {
        fileView.innerHTML = '<p class="p-4 text-gray-500">Seleccione una carpeta para ver los archivos.</p>';
    }
    if (currentPathElement) {
        currentPathElement.textContent = '/';
    }
}

function setViewMode(mode) {
    console.log(`setViewMode llamado con: ${mode}`);
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');
    const gridBtn = document.getElementById('grid-btn');
    const listBtn = document.getElementById('list-btn');

    if (gridViewContainer && listViewContainer && gridBtn && listBtn) {
        const currentFolderDisplayElement = document.getElementById('current-folder-display');
        const currentPath = currentFolderDisplayElement ? currentFolderDisplayElement.textContent : '';

        const currentFolder = currentFolderDisplayElement ? currentFolderDisplayElement.textContent.substring(1) || '' : '';
        const isActiveViewChanging = (mode === 'grid' && gridViewContainer.classList.contains('hidden')) ||
            (mode === 'list' && listViewContainer.classList.contains('hidden'));

        if (mode === 'grid') {
            gridViewContainer.classList.remove('hidden');
            listViewContainer.classList.add('hidden');
            gridBtn.classList.add('bg-blue-100', 'text-blue-600');
            gridBtn.classList.remove('text-gray-600', 'hover:bg-blue-50');
            listBtn.classList.add('text-gray-600', 'hover:bg-blue-50');
            listBtn.classList.remove('bg-blue-100', 'text-blue-600');
        } else if (mode === 'list') {
            listViewContainer.classList.remove('hidden');
            gridViewContainer.classList.add('hidden');
            listBtn.classList.add('bg-blue-100', 'text-blue-600');
            listBtn.classList.remove('text-gray-600', 'hover:bg-blue-50');
            gridBtn.classList.add('text-gray-600', 'hover:bg-blue-50');
            gridBtn.classList.remove('bg-blue-100', 'text-blue-600');
        }

        // If the view is actually changing, reload the files for the current folder
        if (isActiveViewChanging) {
            const currentPathDisplay = document.getElementById('current-folder-display');
            let currentFolder = currentPathDisplay ? currentPathDisplay.textContent.substring(1) : '';
            if (currentFolder === '/') {
                currentFolder = ''; // Ensure it's empty for the root to be handled by loadFiles
            }
            loadFiles(currentFolder, currentSortOrder.column, currentSortOrder.direction);
        }
    } else {
        console.error('Error: No se pudieron encontrar los elementos para cambiar la vista.');
    }
}

// Exportar funciones necesarias
export { loadFiles, clearFileView, setViewMode };