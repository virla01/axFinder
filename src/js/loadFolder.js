import { loadFiles } from './fileDisplay.js';
import { UIElements, LOADING_SPINNER_HTML } from './uiElements.js';
import { currentSortOrder, icons, config } from './config.js'; // Necesario para los parámetros de loadFiles si se usan e iconos, y import 'config'

export function loadFolders() {
    // Asegurarse de que el DOM esté completamente cargado antes de añadir el event listener
    const homeFolderLink = document.getElementById('home-folder-link');
    if (homeFolderLink) {
        homeFolderLink.addEventListener('click', async () => {
            await loadFiles('storage', currentSortOrder.column, currentSortOrder.direction); // Cargar el directorio 'storage'
            updateActiveFolderSelection('storage'); // Actualizar la selección visual para 'storage'
        });
    }
    const foldersContainer = document.getElementById('sidebar-folders-container');
    if (!foldersContainer) {
        console.error('Error: No se encontró el contenedor de carpetas del sidebar.');
        return;
    }
    foldersContainer.innerHTML = LOADING_SPINNER_HTML.replace('Cargando archivos...', 'Cargando directorios...');

    fetch('src/api/files.php?action=list_folders')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error del servidor al listar carpetas: ${response.status}`);
            }
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
            if (data.success && data.folders) {
                foldersContainer.innerHTML = '';
                if (data.folders.length === 0) {
                    foldersContainer.innerHTML = '<p class="p-2 text-xs text-gray-500">No hay carpetas en el directorio.</p>';
                    return;
                }
                data.folders.forEach(folder => {
                    const folderId = folder.name.replace(/\s+/g, '-').toLowerCase();
                    const folderElement = document.createElement('div');
                    folderElement.classList.add('tree-folder');
                    folderElement.dataset.folderPath = folder.path; // Añadir data-folder-path
                    // Usar el SVG del icono directamente desde folder.icon o el 'folderClosed' de config.js como fallback
                    const iconHtml = folder.icon ? folder.icon : icons.folderClosed;

                    // Siempre crear el placeholder con ID
                    let chevronPlaceholderHTML = `<div class="chevron w-4 h-5 flex items-center justify-center mr-1" id="${folderId}-chevron-placeholder"></div>`;

                    folderElement.innerHTML = `
                        <div class="flex items-center p-2 mb-2 hover:bg-blue-100 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold transition-colors" id="folder-${folderId}">
                            ${chevronPlaceholderHTML}
                            <div class="w-5 h-5" id="${folderId}-icon-container">
                                ${iconHtml} <!-- Insertar el SVG aquí -->
                            </div>
                            <span class="text-gray-800 dark:text-white ml-2">${folder.name}</span>
                        </div>
                        <div class="ml-5 space-y-1 hidden" id="${folderId}-children">
                            <!-- Sub-elementos -->
                        </div>
                    `;
                    foldersContainer.appendChild(folderElement);

                    const clickableFolderDiv = folderElement.querySelector(`#folder-${folderId}`);
                    if (clickableFolderDiv) {
                        clickableFolderDiv.addEventListener('contextmenu', function (event) {
                            event.preventDefault();
                            const menu = UIElements.folderContextMenu();
                            if (menu) {
                                menu.style.position = 'fixed';
                                menu.style.left = `${event.clientX + 5}px`;
                                menu.style.top = `${event.clientY + 5}px`;
                                menu.classList.remove('hidden');
                                menu.dataset.folderPath = folder.path; // Guardar la ruta de la carpeta
                                // console.log('Context menu for folder:', folder.path);
                            }
                        });
                    }

                    // Insertar el chevron inicial después de que el elemento esté en el DOM
                    const initialChevronPlaceholder = document.getElementById(`${folderId}-chevron-placeholder`);
                    if (initialChevronPlaceholder && folder.hasSubfolders) {
                        initialChevronPlaceholder.innerHTML = icons.chevronRight;
                    }

                    const clickableFolderHeader = document.getElementById(`folder-${folderId}`);
                    if (clickableFolderHeader) {
                        clickableFolderHeader.addEventListener('click', async () => {
                            const isOpening = await toggleFolder(folderId, folder.name, folder.hasSubfolders);
                            // La lógica de icono y selección activa se moverá a updateActiveFolderSelection
                            updateActiveFolderSelection(folder.path); // Asegurarse de pasar la ruta completa
                        });
                    }
                });
            } else {
                console.error('Error al cargar carpetas:', data.message || 'Respuesta no exitosa o formato incorrecto.');
                foldersContainer.innerHTML = `<p class="p-2 text-xs text-red-500">Error al procesar datos de carpetas: ${data.message || 'Formato inesperado.'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error en fetch al cargar carpetas:', error);
            foldersContainer.innerHTML = `<p class="p-2 text-xs text-red-500">Error de conexión al cargar carpetas: ${error.message}</p>`;
        });
}

async function toggleFolder(folderId, folderPath, hasSubfolders) {
    // console.log(`[toggleFolder] Toggle folder: ${folderId}, Path: ${folderPath}, hasSubfolders: ${hasSubfolders}`);
    const childrenContainer = document.getElementById(`${folderId}-children`);
    let isOpening = false;
    // const chevronRightIcon y chevronDownIcon eliminados, se usan directamente icons.chevronRight e icons.chevronDown de config.js
    const chevronPlaceholder = document.getElementById(`${folderId}-chevron-placeholder`);
    // console.log(`[toggleFolder] Chevron placeholder found: ${!!chevronPlaceholder}`);

    if (childrenContainer) {
        childrenContainer.classList.toggle('hidden');
        isOpening = !childrenContainer.classList.contains('hidden');
        // console.log(`[toggleFolder] Folder: ${folderId}, Path: ${folderPath}, Opening: ${isOpening}, Children HTML: '${childrenContainer.innerHTML.trim().substring(0, 50)}...'`);

        if (chevronPlaceholder) {
            // Limpiar contenido anterior
            while (chevronPlaceholder.firstChild) {
                chevronPlaceholder.removeChild(chevronPlaceholder.firstChild);
            }

            if (hasSubfolders) {
                const svgIcon = isOpening ? icons.chevronDown : icons.chevronRight;
                // console.log(`[toggleFolder] Attempting to insert chevron for ${folderId}. Icon: ${isOpening ? 'Down' : 'Right'}, SVG content length: ${svgIcon.length}`);
                // Insertar el SVG directamente en el innerHTML del placeholder
                chevronPlaceholder.innerHTML = svgIcon;
                // console.log(`[toggleFolder] After insertion, placeholder innerHTML length: ${chevronPlaceholder.innerHTML.length}`);
            } else {
                // Si no tiene subcarpetas, el placeholder se queda vacío (ya limpiado)
                // console.log(`[toggleFolder] Folder ${folderId} has no subfolders, clearing chevron placeholder.`);
            }
        }


        if (isOpening && childrenContainer.innerHTML.trim() === '<!-- Sub-elementos -->') {
            loadSubFolders(folderId, folderPath, childrenContainer);
        }
    }
    // Actualizar la ruta actual y cargar contenido
    await loadFiles(folderPath, currentSortOrder.column, currentSortOrder.direction);
    return isOpening; // Devuelve true si la carpeta se está abriendo, false si se está cerrando
}

function loadSubFolders(parentFolderId, parentFolderPath, childrenContainer) {
    childrenContainer.innerHTML = `
        <div class="flex items-center justify-start p-2 pl-0">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-xs text-gray-500">Cargando...</p>
        </div>
    `;

    fetch(`src/api/files.php?action=list_folders&path=${encodeURIComponent(parentFolderPath)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error del servidor al listar subcarpetas: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // console.log(`[loadSubFolders] Data for ${parentFolderPath}:`, JSON.stringify(data));
            if (data.success && data.folders) {
                childrenContainer.innerHTML = ''; // Limpiar el mensaje de carga
                if (data.folders.length === 0) {
                    // No mostrar ningún mensaje si no hay subcarpetas, simplemente dejar el contenedor vacío
                    return;
                }
                data.folders.forEach(folder => {
                    // Usar folder.path que es relativo a baseDir, o construirlo si es necesario.
                    // Para el ID, podemos añadir el prefijo del padre para asegurar unicidad si hay nombres repetidos en diferentes niveles.
                    const subFolderId = `${parentFolderId}-${folder.name.replace(/\s+/g, '-').toLowerCase()}`;
                    const subFolderElement = document.createElement('div');
                    subFolderElement.classList.add('tree-folder');
                    subFolderElement.dataset.folderPath = folder.path; // Añadir data-folder-path
                    const iconHtml = folder.icon ? folder.icon : icons.folderClosed;

                    // const chevronRightIcon eliminado, se usa directamente icons.chevronRight de config.js
                    // Siempre crear el placeholder con ID para subcarpetas
                    let chevronPlaceholderHTML = `<div class="w-4 h-5 flex items-center justify-center mr-1" id="${subFolderId}-chevron-placeholder"></div>`;

                    subFolderElement.innerHTML = `
                        <div class="flex items-center p-2 pl-4 mb-1 hover:bg-blue-100 dark:hover:bg-slate-800 cursor-pointer text-sm font-semibold transition-colors" id="folder-${subFolderId}">
                            ${chevronPlaceholderHTML}
                            <div class="w-5 h-5" id="${subFolderId}-icon-container">
                                ${iconHtml}
                            </div>
                            <span class="text-gray-700 dark:text-gray-200 ml-2">${folder.name}</span>
                        </div>
                        <div class="ml-10 space-y-1 hidden" id="${subFolderId}-children">
                            <!-- Sub-elementos -->
                        </div>
                    `;
                    childrenContainer.appendChild(subFolderElement);

                    const clickableSubFolderHeader = subFolderElement.querySelector(`#folder-${subFolderId}`);
                    if (clickableSubFolderHeader) {
                        // Listener para el menú contextual
                        clickableSubFolderHeader.addEventListener('contextmenu', function (event) {
                            event.preventDefault();
                            const menu = UIElements.folderContextMenu();
                            if (menu) {
                                menu.style.position = 'fixed';
                                menu.style.left = `${event.clientX + 5}px`;
                                menu.style.top = `${event.clientY + 5}px`;
                                menu.classList.remove('hidden');
                                menu.dataset.folderPath = folder.path; // Corregido: usar folder.path
                                // console.log('Context menu for subfolder:', folder.path); // Corregido: usar folder.path
                            }
                        });

                        // Listener para el clic normal (expandir/colapsar, cargar archivos)
                        clickableSubFolderHeader.addEventListener('click', async () => {
                            const isOpening = await toggleFolder(subFolderId, folder.path, folder.hasSubfolders);
                            // La lógica de icono y selección activa se moverá a updateActiveFolderSelection
                            updateActiveFolderSelection(folder.path); // Asegurarse de pasar la ruta completa
                        });
                    }

                    // Insertar el chevron inicial para subcarpetas después de que el elemento esté en el DOM
                    const initialSubChevronPlaceholder = document.getElementById(`${subFolderId}-chevron-placeholder`);
                    // console.log(`[loadSubFolders] Subfolder: ${folder.name}, ID: ${subFolderId}, hasSubfolders: ${folder.hasSubfolders}`);
                    // console.log(`[loadSubFolders] Initial sub-chevron placeholder found: ${!!initialSubChevronPlaceholder}`);
                    if (initialSubChevronPlaceholder && folder.hasSubfolders) {
                        // console.log(`[loadSubFolders] Attempting to insert chevronRight for ${subFolderId}. SVG content length: ${icons.chevronRight.length}`);
                        initialSubChevronPlaceholder.innerHTML = icons.chevronRight;
                        // console.log(`[loadSubFolders] After insertion, sub-placeholder innerHTML length: ${initialSubChevronPlaceholder.innerHTML.length}`);
                    }


                });
            } else {
                console.error('Error al cargar subcarpetas:', data.message || 'Respuesta no exitosa o formato incorrecto.');
                childrenContainer.innerHTML = `<p class="p-2 text-xs text-red-500">Error al procesar datos de subcarpetas: ${data.message || 'Formato inesperado.'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error en fetch al cargar subcarpetas:', error);
            childrenContainer.innerHTML = `<p class="p-2 text-xs text-red-500">Error de conexión al cargar subcarpetas: ${error.message}</p>`;
        });
}

// Función para actualizar la selección visual de la carpeta activa
export function updateActiveFolderSelection(folderPath) {
    // console.log(`[LoadFolder] updateActiveFolderSelection - Procesando ruta: ${folderPath}`); // Debug log
    // config.currentPath = folderPath; // **Eliminado**: esta función solo lee config.currentPath

    // Eliminar las clases de resaltado y restaurar iconos de todas las carpetas
    document.querySelectorAll('#sidebar-folders-container .tree-folder > div').forEach(item => {
        item.classList.remove('bg-blue-100', 'bg-slate-950');
        const folderId = item.id.replace('folder-', '');
        const iconContainer = document.getElementById(`${folderId}-icon-container`);
        if (iconContainer) {
            iconContainer.innerHTML = icons.folderClosed;
        }
    });

    // Desmarcar la carpeta 'Inicio' si no es la carpeta activa
    const homeFolderLink = document.getElementById('home-folder-link');
    if (homeFolderLink) {
        homeFolderLink.classList.remove('bg-blue-100');
        homeFolderLink.classList.remove('bg-slate-950'); // Asegurar que también se remueve la clase de modo oscuro
        // Si tienes un icono dinámico para "Inicio" y no es el activo, restaurarlo aquí
    }

    // Identificar la carpeta activa por su data-folder-path
    const selectedFolderElement = document.querySelector(`[data-folder-path="${CSS.escape(folderPath)}"] > div`);

    if (selectedFolderElement) {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark'; // Usar getAttribute('data-theme')
        // console.log(`[LoadFolder] updateActiveFolderSelection - Carpeta ${folderPath}. Es modo oscuro: ${isDarkMode}`); // Debug log
        // Aplicar la clase de fondo según el tema
        selectedFolderElement.classList.add(isDarkMode ? 'bg-slate-950' : 'bg-blue-100');

        // Cambiar el icono de la carpeta seleccionada a abierto
        const folderId = selectedFolderElement.id.replace('folder-', '');
        const iconContainer = document.getElementById(`${folderId}-icon-container`);
        if (iconContainer) {
            iconContainer.innerHTML = icons.folderOpen;
        }
    } else if (folderPath === 'storage' || folderPath === '.') { // Ahora también reconoce '.' para la carpeta raíz
        // Caso especial para la carpeta 'storage' (Inicio)
        if (homeFolderLink) {
            const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark'; // Usar getAttribute('data-theme')
            // console.log(`[LoadFolder] updateActiveFolderSelection - Carpeta INICIO. Es modo oscuro: ${isDarkMode}`); // Debug log
            homeFolderLink.classList.add(isDarkMode ? 'bg-slate-950' : 'bg-blue-100');
        }
    }
}

// Exportar loadFolders para que pueda ser llamada desde axfinder.js
// toggleFolder y loadSubFolders no necesitan ser exportadas si solo se usan internamente
// updateActiveFolderSelection necesita ser exportada si se llama desde fuera (ej. al cargar un archivo)
export { toggleFolder, loadSubFolders };