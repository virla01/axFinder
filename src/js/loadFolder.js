import { loadFiles } from './loadFile.js';
import { LOADING_SPINNER_HTML } from './uiElements.js';
import { currentSortOrder, icons } from './config.js'; // Necesario para los parámetros de loadFiles si se usan e iconos

export function loadFolders() {
    // Asegurarse de que el DOM esté completamente cargado antes de añadir el event listener
    const homeFolderLink = document.getElementById('home-folder-link');
    if (homeFolderLink) {
        homeFolderLink.addEventListener('click', () => {
            // Desmarcar la carpeta activa anterior y restaurar su icono a folderClosed
            document.querySelectorAll('#sidebar-folders-container .bg-blue-100').forEach(item => {
                item.classList.remove('bg-blue-100');
                const prevFolderId = item.id.replace('folder-', '');
                const prevIconContainer = document.getElementById(`${prevFolderId}-icon-container`);
                if (prevIconContainer) {
                    prevIconContainer.innerHTML = icons.folderClosed;
                }
            });
            // Marcar "Inicio" como activo y cambiar su icono a folderOpen (si aplica)
            homeFolderLink.classList.add('bg-blue-100');
            // Aquí podrías cambiar el icono de "Inicio" si tuviera uno dinámico

            loadFiles('storage', currentSortOrder.column, currentSortOrder.direction); // Cargar el directorio 'storage'
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
                    // Usar el SVG del icono directamente desde folder.icon o el 'folderClosed' de config.js como fallback
                    const iconHtml = folder.icon ? folder.icon : icons.folderClosed;

                    // Siempre crear el placeholder con ID
                    let chevronPlaceholderHTML = `<div class="w-4 h-5 flex items-center justify-center mr-1" id="${folderId}-chevron-placeholder"></div>`;

                    folderElement.innerHTML = `
                        <div class="flex items-center p-2 mb-2 hover:bg-blue-100 cursor-pointer text-sm font-bold transition-colors" id="folder-${folderId}">
                            ${chevronPlaceholderHTML}
                            <div class="w-5 h-5" id="${folderId}-icon-container">
                                ${iconHtml} <!-- Insertar el SVG aquí -->
                            </div>
                            <span class="text-gray-800 ml-2">${folder.name}</span>
                        </div>
                        <div class="ml-5 space-y-1 hidden" id="${folderId}-children">
                            <!-- Sub-elementos -->
                        </div>
                    `;
                    foldersContainer.appendChild(folderElement);

                    // Insertar el chevron inicial después de que el elemento esté en el DOM
                    const initialChevronPlaceholder = document.getElementById(`${folderId}-chevron-placeholder`);
                    if (initialChevronPlaceholder && folder.hasSubfolders) {
                        initialChevronPlaceholder.innerHTML = icons.chevronRight;
                    }

                    const clickableFolderHeader = document.getElementById(`folder-${folderId}`);
                    if (clickableFolderHeader) {
                        clickableFolderHeader.addEventListener('click', () => {
                            const isOpening = toggleFolder(folderId, folder.name, folder.hasSubfolders);
                            const iconContainer = document.getElementById(`${folderId}-icon-container`);
                            if (iconContainer) {
                                const folderOpenIcon = folder.icons?.folderOpen || icons.folderOpen; // Usar icons.folderOpen
                                const folderClosedIcon = folder.icons?.folderClosed || icons.folderClosed; // Usar icons.folderClosed
                                iconContainer.innerHTML = isOpening ? folderOpenIcon : folderClosedIcon;
                            }
                            // Desmarcar la carpeta activa anterior y restaurar su icono a folderClosed
                            document.querySelectorAll('#sidebar-folders-container .bg-blue-100').forEach(item => {
                                item.classList.remove('bg-blue-100');
                                const prevFolderId = item.id.replace('folder-', '');
                                const prevIconContainer = document.getElementById(`${prevFolderId}-icon-container`);
                                if (prevIconContainer) {
                                    prevIconContainer.innerHTML = icons.folderClosed;
                                }
                            });
                            // Marcar la carpeta actual como activa y cambiar su icono a folderOpen
                            clickableFolderHeader.classList.add('bg-blue-100');
                            if (iconContainer) {
                                iconContainer.innerHTML = icons.folderOpen;
                            }
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

function toggleFolder(folderId, folderPath, hasSubfolders) {
    console.log(`[toggleFolder] Toggle folder: ${folderId}, Path: ${folderPath}, hasSubfolders: ${hasSubfolders}`);
    const childrenContainer = document.getElementById(`${folderId}-children`);
    let isOpening = false;
    // const chevronRightIcon y chevronDownIcon eliminados, se usan directamente icons.chevronRight e icons.chevronDown de config.js
    const chevronPlaceholder = document.getElementById(`${folderId}-chevron-placeholder`);
    console.log(`[toggleFolder] Chevron placeholder found: ${!!chevronPlaceholder}`);

    if (childrenContainer) {
        childrenContainer.classList.toggle('hidden');
        isOpening = !childrenContainer.classList.contains('hidden');
        console.log(`[toggleFolder] Folder: ${folderId}, Path: ${folderPath}, Opening: ${isOpening}, Children HTML: '${childrenContainer.innerHTML.trim().substring(0, 50)}...'`);

        if (chevronPlaceholder) {
            // Limpiar contenido anterior
            while (chevronPlaceholder.firstChild) {
                chevronPlaceholder.removeChild(chevronPlaceholder.firstChild);
            }

            if (hasSubfolders) {
                const svgIcon = isOpening ? icons.chevronDown : icons.chevronRight;
                console.log(`[toggleFolder] Attempting to insert chevron for ${folderId}. Icon: ${isOpening ? 'Down' : 'Right'}, SVG content length: ${svgIcon.length}`);
                // Insertar el SVG directamente en el innerHTML del placeholder
                chevronPlaceholder.innerHTML = svgIcon;
                console.log(`[toggleFolder] After insertion, placeholder innerHTML length: ${chevronPlaceholder.innerHTML.length}`);
            } else {
                // Si no tiene subcarpetas, el placeholder se queda vacío (ya limpiado)
                console.log(`[toggleFolder] Folder ${folderId} has no subfolders, clearing chevron placeholder.`);
            }
        }


        if (isOpening && childrenContainer.innerHTML.trim() === '<!-- Sub-elementos -->') {
            loadSubFolders(folderId, folderPath, childrenContainer);
        }
    }
    // Actualizar la ruta actual y cargar contenido
    loadFiles(folderPath, currentSortOrder.column, currentSortOrder.direction);
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
            console.log(`[loadSubFolders] Data for ${parentFolderPath}:`, JSON.stringify(data));
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

                    const iconHtml = folder.icon ? folder.icon : icons.folderClosed;

                    // const chevronRightIcon eliminado, se usa directamente icons.chevronRight de config.js
                    // Siempre crear el placeholder con ID para subcarpetas
                    let chevronPlaceholderHTML = `<div class="w-4 h-5 flex items-center justify-center mr-1" id="${subFolderId}-chevron-placeholder"></div>`;

                    subFolderElement.innerHTML = `
                        <div class="flex items-center p-2 pl-4 mb-1 hover:bg-blue-100 cursor-pointer text-sm font-semibold transition-colors" id="folder-${subFolderId}">
                            ${chevronPlaceholderHTML}
                            <div class="w-5 h-5" id="${subFolderId}-icon-container">
                                ${iconHtml}
                            </div>
                            <span class="text-gray-700 ml-2">${folder.name}</span>
                        </div>
                        <div class="ml-10 space-y-1 hidden" id="${subFolderId}-children">
                            <!-- Sub-elementos -->
                        </div>
                    `;
                    childrenContainer.appendChild(subFolderElement);

                    // Insertar el chevron inicial para subcarpetas después de que el elemento esté en el DOM
                    const initialSubChevronPlaceholder = document.getElementById(`${subFolderId}-chevron-placeholder`);
                    console.log(`[loadSubFolders] Subfolder: ${folder.name}, ID: ${subFolderId}, hasSubfolders: ${folder.hasSubfolders}`);
                    console.log(`[loadSubFolders] Initial sub-chevron placeholder found: ${!!initialSubChevronPlaceholder}`);
                    if (initialSubChevronPlaceholder && folder.hasSubfolders) {
                        console.log(`[loadSubFolders] Attempting to insert chevronRight for ${subFolderId}. SVG content length: ${icons.chevronRight.length}`);
                        initialSubChevronPlaceholder.innerHTML = icons.chevronRight;
                        console.log(`[loadSubFolders] After insertion, sub-placeholder innerHTML length: ${initialSubChevronPlaceholder.innerHTML.length}`);
                    }

                    const clickableSubFolderHeader = document.getElementById(`folder-${subFolderId}`);
                    if (clickableSubFolderHeader) {
                        clickableSubFolderHeader.addEventListener('click', () => {
                            const isOpening = toggleFolder(subFolderId, folder.path, folder.hasSubfolders);
                            const iconContainer = document.getElementById(`${subFolderId}-icon-container`);
                            if (iconContainer) {
                                const folderOpenIcon = folder.icons?.folderOpen || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M69.08 271.63L0 390.05V112a48 48 0 0 1 48-48h160l64 64h160a48 48 0 0 1 48 48v48H152a96.31 96.31 0 0 0-82.92 47.63z" class="ax-secondary"/></svg>';
                                const folderClosedIcon = folder.icons?.folderClosed || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class="ax-secondary"/></svg>';
                                iconContainer.innerHTML = isOpening ? folderOpenIcon : folderClosedIcon;
                            }
                            // Marcar como activo y desmarcar otros
                            document.querySelectorAll('#sidebar-folders-container .bg-blue-100').forEach(item => {
                                item.classList.remove('bg-blue-100');
                            });
                            clickableSubFolderHeader.classList.add('bg-blue-100');
                        });
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
    // Eliminar la clase 'bg-blue-100' de todas las carpetas
    document.querySelectorAll('#sidebar-folders-container .bg-blue-100').forEach(item => {
        item.classList.remove('bg-blue-100');
    });

    // Encontrar la carpeta con el data-path que coincide y añadir la clase
    // Nota: Esto asume que cada elemento de carpeta tiene un atributo data-path con la ruta completa.
    // Si no es así, necesitaríamos un enfoque diferente, quizás basado en IDs generados a partir de la ruta.
    // Dado que los IDs ahora se basan en el nombre, buscaremos por ID.

    // Generar un ID similar al que se usa al crear los elementos
    // Esto puede ser complicado si las rutas completas no se usan para generar IDs únicos.
    // Si los IDs son solo el nombre de la carpeta, puede haber colisiones.
    // Si los IDs son una combinación de la ruta, necesitamos replicar esa lógica aquí.

    // Asumiendo que los IDs son 'folder-' + nombre de la carpeta (limpio)
    // Esto puede no ser suficiente si hay carpetas con el mismo nombre en diferentes niveles.
    // Si los IDs se generan como 'folder-' + ruta_completa_codificada, necesitamos esa lógica.

    // Basándonos en el código actual, los IDs son 'folder-' + folderId (nombre limpio).
    // Esto significa que solo podemos seleccionar por el nombre de la carpeta, lo cual no es ideal para rutas únicas.
    // Para una selección precisa, los IDs deberían incluir la ruta completa o ser generados de forma única.

    // Por ahora, intentaremos con el nombre limpio, pero ten en cuenta esta limitación.
    const folderName = folderPath.split('/').pop(); // Obtener el último segmento de la ruta
    const folderId = folderName.replace(/\s+/g, '-').toLowerCase();
    const folderElement = document.getElementById(`folder-${folderId}`);

    if (folderElement) {
        folderElement.classList.add('bg-blue-100');
    }
    // Considerar expandir las carpetas padre si la carpeta activa no es de nivel superior
    // Esto requeriría almacenar la estructura del árbol o tener una forma de obtener los padres.
    // Por ahora, solo seleccionamos la carpeta final.
}

// Exportar loadFolders para que pueda ser llamada desde axfinder.js
// toggleFolder y loadSubFolders no necesitan ser exportadas si solo se usan internamente
// updateActiveFolderSelection necesita ser exportada si se llama desde fuera (ej. al cargar un archivo)
export { toggleFolder, loadSubFolders };