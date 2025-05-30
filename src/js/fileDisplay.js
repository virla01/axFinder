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
            gridViewContainer.classList.add('grid', 'grid-cols-2', 'gap-4', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-6', 'p-4');
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
            listViewContainer.classList.remove('grid', 'grid-cols-2', 'gap-4', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-6');
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
                console.log(`[DEBUG RenderImgGrid] Item: ${item.name}, mtime: ${item.mtime}, size: ${item.size}`);

                gridItem.className = 'transition-shadow shadow cursor-pointer file-item group hover:shadow-md flex flex-col items-center bg-white rounded-lg overflow-hidden border border-gray-200';
                // Añadir atributos data-* para el modal de imagen
                gridItem.setAttribute('data-image-url', item.imageUrl);
                gridItem.setAttribute('data-file-name', item.name);

                const thumbnailUrl = item.thumbnailUrl || item.imageUrl; // Usar thumbnailUrl si existe, sino imageUrl

                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.className = 'w-full h-32 bg-gray-200 bg-cover bg-center'; // Ajusta h-32 según sea necesario
                thumbnailDiv.style.backgroundImage = `url('${thumbnailUrl}')`;
                gridItem.appendChild(thumbnailDiv);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'flex flex-col items-center p-2 text-center w-full'; // Reducido padding y altura

                const nameSpan = document.createElement('span');
                nameSpan.className = 'w-full mt-1 text-sm font-medium text-gray-700 truncate file-name-display';
                nameSpan.textContent = item.name;
                infoDiv.appendChild(nameSpan);

                if (item.size) {
                    const sizeSpan = document.createElement('span');
                    sizeSpan.className = 'text-xs text-gray-500 file-size-display';
                    sizeSpan.textContent = item.size;
                    infoDiv.appendChild(sizeSpan);
                }

                if (item.mtime) {
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'text-xs text-gray-500 file-date-display';
                    dateSpan.textContent = new Date(item.mtime * 1000).toLocaleDateString();
                    infoDiv.appendChild(dateSpan);
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
                // Añadir atributos data-* para el modal de imagen también en la vista de lista
                listItem.setAttribute('data-image-url', item.imageUrl);
                listItem.setAttribute('data-file-name', item.name);
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

    const imageItems = container.querySelectorAll('[data-image-url]');
    imageItems.forEach(item => {
        item.addEventListener('dblclick', () => {
            const imageUrl = item.dataset.imageUrl;
            const imageName = item.dataset.fileName;

            if (imageUrl && imageName) {
                // Obtener todas las imágenes de la carpeta actual desde el caché
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
}

let currentModalImages = [];
let currentModalIndex = -1;

function showImageModal(imageUrl, imageName, allImages = [], index = -1) {
    // Eliminar modal existente si lo hay
    const existingModalOverlay = document.getElementById('ax-image-modal-overlay');
    if (existingModalOverlay) {
        existingModalOverlay.remove();
    }
    // Limpiar listeners de teclado anteriores si existían
    document.removeEventListener('keydown', handleModalKeyNavigation);
    document.removeEventListener('keydown', handleEscKey); // Asegurarse que el listener global de Esc se limpia

    currentModalImages = allImages;
    currentModalIndex = index;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'ax-image-modal-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center';
    overlay.addEventListener('click', () => closeModal());

    // Crear contenedor del modal
    const modalContent = document.createElement('div');
    modalContent.className = 'relative bg-white p-4 rounded-lg shadow-xl max-w-3xl max-h-[80vh] z-50 flex flex-col';
    // Detener la propagación para que el clic en el contenido no cierre el modal
    modalContent.addEventListener('click', (e) => e.stopPropagation());


    // Nombre del archivo
    const nameElement = document.createElement('div');
    nameElement.textContent = imageName;
    nameElement.className = 'text-lg font-semibold mb-2 text-gray-800';

    // Imagen
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = imageName;
    img.className = 'max-w-full max-h-[calc(80vh-100px)] object-contain rounded'; // Ajuste de altura

    // Botón de cierre
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'absolute top-2 right-2 text-2xl text-gray-600 hover:text-gray-900 focus:outline-none';
    closeButton.title = 'Cerrar';
    closeButton.addEventListener('click', () => closeModal());

    // Ensamblar modal
    modalContent.appendChild(nameElement);
    modalContent.appendChild(img);
    modalContent.appendChild(closeButton);

    // Contenedor para los metadatos
    const metadataContainer = document.createElement('div');
    metadataContainer.className = 'mt-4 p-3 bg-gray-50 rounded max-h-48 overflow-y-auto text-sm'; // Estilos para el contenedor de metadatos
    modalContent.appendChild(metadataContainer);

    // Intentar obtener el item actual y sus metadatos
    const currentImageItem = (allImages && index !== -1 && allImages[index]) ? allImages[index] : null;
    const metadata = currentImageItem ? currentImageItem.metadata : null;

    if (metadata) {
        const fields = [
            { key: 'caption', label: 'Descripción' },
            { key: 'author', label: 'Autor' },
            { key: 'publish-date', label: 'Fecha de Publicación' },
            { key: 'source', label: 'Fuente' },
            { key: 'tags', label: 'Etiquetas' },
            { key: 'keywords', label: 'Palabras Clave' }
        ];

        fields.forEach(field => {
            const value = metadata[field.key] || ''; // Usar string vacío si el valor no existe
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'mb-2';

            const labelElement = document.createElement('label');
            labelElement.className = 'block font-semibold text-gray-700';
            labelElement.textContent = field.label + ':';
            fieldDiv.appendChild(labelElement);

            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = value;
            inputElement.readOnly = true; // Solo lectura por ahora
            inputElement.className = 'w-full p-1 border border-gray-300 rounded mt-1 bg-gray-100'; // Estilo de input deshabilitado
            // Si el campo es 'caption' o 'tags', podríamos considerar usar un textarea en el futuro
            // if (field.key === 'caption' || field.key === 'tags') {
            // inputElement = document.createElement('textarea');
            // inputElement.rows = 2;
            // }
            fieldDiv.appendChild(inputElement);
            metadataContainer.appendChild(fieldDiv);
        });
    } else {
        metadataContainer.innerHTML = '<p class="text-gray-500">No hay metadatos disponibles para esta imagen.</p>';
    }


    // Botones de navegación
    if (currentModalImages.length > 1) {
        const prevButton = document.createElement('button');
        prevButton.id = 'ax-modal-prev-btn';
        prevButton.innerHTML = '&#10094;'; // <
        prevButton.className = 'absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-white hover:text-gray-300 focus:outline-none bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full p-2 transition-colors';
        prevButton.title = 'Anterior';
        prevButton.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateToImage(-1);
        });
        modalContent.appendChild(prevButton); // Añadir al modalContent para que no se cierre al hacer clic

        const nextButton = document.createElement('button');
        nextButton.id = 'ax-modal-next-btn';
        nextButton.innerHTML = '&#10095;'; // >
        nextButton.className = 'absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-white hover:text-gray-300 focus:outline-none bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full p-2 transition-colors';
        nextButton.title = 'Siguiente';
        nextButton.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateToImage(1);
        });
        modalContent.appendChild(nextButton); // Añadir al modalContent

        updateNavigationButtons();
    }

    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    // Listener para tecla Escape y flechas de navegación
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

