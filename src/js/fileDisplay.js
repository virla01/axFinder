// src/js/fileDisplay.js
console.log('src/js/fileDisplay.js cargado');

import { UIElements } from './uiElements.js';
import { api } from './apiService.js';
import { config, currentSortOrder, fileCache } from './config.js'; // Importar config y fileCache
// import { formatDate, formatSize, getFileIcon } from './utils.js';

let currentViewMode = 'grid'; // 'grid' o 'list'

export function setViewMode(mode) {
    console.log(`[FileDisplay] Cambiando modo de vista a: ${mode}`);
    currentViewMode = mode;
    const filesContainer = UIElements.filesContainer();
    if (filesContainer) {
        filesContainer.className = mode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4' : 'p-4';
        // Volver a renderizar los archivos cacheados con la nueva vista
        // const currentPath = UIElements.currentFolderDisplay()?.dataset.path || ''; // Eliminado
        const currentPath = config.currentPath || ''; // Usar la ruta desde config
        if (fileCache.has(currentPath)) {
            renderFiles(fileCache.get(currentPath), currentPath);
        }
    } else {
        console.error('[FileDisplay] Contenedor de archivos no encontrado para cambiar vista.');
    }
}

export async function loadFiles(path, sortBy = currentSortOrder.column, sortOrder = currentSortOrder.direction) {
    console.log(`[FileDisplay] Cargando archivos para: ${path}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`);
    const filesContainer = UIElements.filesContainer();
    // const itemsCountDisplay = UIElements.itemsCountDisplay(); // Eliminado
    // const currentFolderDisplay = UIElements.currentFolderDisplay(); // Eliminado

    if (!filesContainer /*|| !itemsCountDisplay || !currentFolderDisplay*/) { // Modificada la condición
        console.error('[FileDisplay] Contenedor de archivos (filesContainer) no encontrado.');
        return;
    }

    filesContainer.innerHTML = '<div class="col-span-full text-center"><div class="loader">Cargando archivos...</div></div>'; // Spinner
    // currentFolderDisplay.textContent = path === '' ? 'Raíz' : path; // Eliminado
    // currentFolderDisplay.dataset.path = path; // Eliminado
    // En su lugar, podemos guardar la ruta actual en config.js si es necesario globalmente
    config.currentPath = path;

    try {
        const data = await api.fetchFiles(path, sortBy, sortOrder);
        console.log('[FileDisplay] Archivos recibidos:', data);
        if (data.files && Array.isArray(data.files)) {
            fileCache.set(path, data.files); // Guardar en caché
            renderFiles(data.files, path);
            // itemsCountDisplay.textContent = `${data.files.length} elementos`; // Eliminado
            currentSortOrder.column = sortBy;
            currentSortOrder.direction = sortOrder;
        } else {
            throw new Error(data.error || 'Respuesta inválida del servidor');
        }
    } catch (error) {
        console.error('[FileDisplay] Error al cargar archivos:', error);
        filesContainer.innerHTML = `<div class="col-span-full text-center text-red-500">Error al cargar archivos: ${error.message}</div>`;
        // itemsCountDisplay.textContent = '0 elementos'; // Eliminado
    }
}

function renderFiles(files, currentPath) {
    console.log(`[FileDisplay] Renderizando ${files.length} archivos en modo ${currentViewMode}`);
    const filesContainer = UIElements.filesContainer();
    if (!filesContainer) {
        console.error('[FileDisplay] Contenedor de archivos no encontrado para renderizar.');
        return;
    }

    filesContainer.innerHTML = ''; // Limpiar contenedor

    if (files.length === 0) {
        filesContainer.innerHTML = '<div class="col-span-full text-center text-gray-500">Esta carpeta está vacía.</div>';
        return;
    }

    if (currentViewMode === 'grid') {
        filesContainer.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4';
        files.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center break-words';
            fileElement.dataset.filePath = file.path;
            fileElement.dataset.type = file.type;

            // const icon = getFileIcon(file, true); // true para grid view
            const icon = ''; // Placeholder
            const imgElement = document.createElement('img');
            imgElement.src = icon;
            imgElement.alt = file.type; // Mantener alt text
            imgElement.className = 'w-16 h-16 object-contain mb-2'; // Ajustado para mejor visualización

            const nameElement = document.createElement('span');
            nameElement.className = 'text-sm font-medium text-gray-700';
            nameElement.textContent = file.name;

            fileElement.appendChild(imgElement);
            fileElement.appendChild(nameElement);
            filesContainer.appendChild(fileElement);
        });
    } else { // list view
        filesContainer.className = 'p-4 space-y-2'; // Quitar clases de grid, añadir espaciado para lista
        const table = document.createElement('table');
        table.className = 'min-w-full bg-white shadow rounded-lg';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr class="bg-gray-50">
                <th class="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" data-sort="name">Nombre</th>
                <th class="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" data-sort="size">Tamaño</th>
                <th class="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" data-sort="date">Modificado</th>
            </tr>
        `;
        const tbody = document.createElement('tbody');
        tbody.className = 'divide-y divide-gray-200';

        files.forEach(file => {
            const row = tbody.insertRow();
            row.className = 'hover:bg-gray-50 cursor-pointer';
            row.dataset.filePath = file.path;
            row.dataset.type = file.type;

            // const icon = getFileIcon(file, false); // false para list view
            const icon = ''; // Placeholder

            row.insertCell().innerHTML = `<div class="flex items-center"><img src="${icon}" alt="${file.type}" class="w-5 h-5 mr-2 object-contain"><span class="text-sm text-gray-900">${file.name}</span></div>`;
            row.insertCell().textContent = file.type === 'folder' ? '-' : String(file.size); // Usar String(file.size) como placeholder
            row.insertCell().textContent = String(new Date(file.mtime * 1000).toLocaleDateString()); // Usar toLocaleDateString como placeholder
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        filesContainer.appendChild(table);

        // Añadir listeners para ordenar en encabezados de tabla
        thead.querySelectorAll('th').forEach(th => {
            th.addEventListener('click', () => {
                const sortBy = th.dataset.sort;
                const sortOrder = (currentSortOrder.column === sortBy && currentSortOrder.direction === 'asc') ? 'desc' : 'asc';
                loadFiles(currentPath, sortBy, sortOrder);
            });
        });
    }

    // Event listeners para los elementos de archivo (común a grid y list)
    filesContainer.querySelectorAll('[data-file-path]').forEach(el => {
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
                // Ejemplo: openFilePreview(filePath);
            }
        });
    });
}