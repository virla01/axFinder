// axfinder.js
console.log('axfinder.js cargado');

function initAxFinder(containerId) {
    console.log(`Inicializando AxFinder en el contenedor: ${containerId}`);
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Error: No se encontró el contenedor con ID '${containerId}'.`);
        return;
    }

    // Contenido HTML de axDefault.html
    const axFinderHTML = `
    <div class="w-full h-full flex">
        <!-- Sidebar -->
        <div class="w-64 bg-white border-r border-blue-200 flex flex-col">
            <div class="p-4 pl-0 border-b border-blue-200">
                <!-- No me quites el logo!!!!! -->
                <img src="src/images/axFinder-800.png" alt="Logo de AxFinder" class="w-auto h-[2.6rem]" />
            </div>
            <div class="flex-1 overflow-y-auto py-2">
                <div class="space-y-1">
                    <div class="flex items-center p-2 mb-2 hover:bg-blue-100 cursor-pointer text-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-auto h-5"><path class="fill-blue-600" d="M570.24 247.41L512 199.52V104a8 8 0 0 0-8-8h-32a8 8 0 0 0-7.95 7.88v56.22L323.87 45a56.06 56.06 0 0 0-71.74 0L5.76 247.41a16 16 0 0 0-2 22.54L14 282.25a16 16 0 0 0 22.53 2L64 261.69V448a32.09 32.09 0 0 0 32 32h128a32.09 32.09 0 0 0 32-32V344h64v104a32.09 32.09 0 0 0 32 32h128a32.07 32.07 0 0 0 32-31.76V261.67l27.53 22.62a16 16 0 0 0 22.53-2L572.29 270a16 16 0 0 0-2.05-22.59zM463.85 432H368V328a32.09 32.09 0 0 0-32-32h-96a32.09 32.09 0 0 0-32 32v104h-96V222.27L288 77.65l176 144.56z" class=""></path></svg>
                        <span class="text-gray-800 font-bold ml-2">Inicio</span>
                    </div>
                    <div id="sidebar-folders-container" class="space-y-1 ml-5">
                        <!-- Las carpetas se cargarán aquí dinámicamente -->
                    </div>
                </div>
            </div>
        </div>
        <!-- Fin Sidebar -->

        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
            <!-- Toolbar -->
            <div class="bg-white border-b border-blue-200 p-4 flex items-center justify-between">
                <div class="flex items-center">
                    <div class="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4 absolute left-3 top-3.5"><path class="fill-blue-500" d="M508.5 468.9L387.1 347.5c-2.3-2.3-5.3-3.5-8.5-3.5h-13.2c31.5-36.5 50.6-84 50.6-136C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c52 0 99.5-19.1 136-50.6v13.2c0 3.2 1.3 6.2 3.5 8.5l121.4 121.4c4.7 4.7 12.3 4.7 17 0l22.6-22.6c4.7-4.7 4.7-12.3 0-17zM208 368c-88.4 0-160-71.6-160-160S119.6 48 208 48s160 71.6 160 160-71.6 160-160 160z"></path></svg>
                        <input type="text" placeholder="Buscar archivos..."
                            class="pl-10 pr-4 text-base py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500" />
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="p-2 rounded transition-colors bg-blue-100 hover:rounded-full hover:bg-black/5" id="grid-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4"><path class="fill-blue-500" d="M464 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM197.3 72h117.3v96H197.3zm0 136h117.3v96H197.3zm-40 232H52c-6.6 0-12-5.4-12-12v-84h117.3zm0-136H40v-96h117.3zm0-136H40V84c0-6.6 5.4-12 12-12h105.3zm157.4 272H197.3v-96h117.3v96zm157.3 0H354.7v-96H472zm0-136H354.7v-96H472zm0-136H354.7V72H472z"></path></svg>
                    </button>
                    <button class="p-2 rounded transition-colors hover:rounded-full hover:bg-black/5" id="list-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4"><path class="fill-blue-500" d="M80 48H16A16 16 0 0 0 0 64v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16zm0 160H16a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16zm0 160H16a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16zm416-136H176a16 16 0 0 0-16 16v16a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-16a16 16 0 0 0-16-16zm0 160H176a16 16 0 0 0-16 16v16a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-16a16 16 0 0 0-16-16zm0-320H176a16 16 0 0 0-16 16v16a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V88a16 16 0 0 0-16-16z"></path></svg>
                    </button>
                    <button class="p-2 rounded transition-colors hover:rounded-full hover:bg-black/5" id="config-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4"><path class="fill-blue-500" d="M452.515 237l31.843-18.382c9.426-5.441 13.996-16.542 11.177-27.054-11.404-42.531-33.842-80.547-64.058-110.797-7.68-7.688-19.575-9.246-28.985-3.811l-31.785 18.358a196.276 196.276 0 0 0-32.899-19.02V39.541a24.016 24.016 0 0 0-17.842-23.206c-41.761-11.107-86.117-11.121-127.93-.001-10.519 2.798-17.844 12.321-17.844 23.206v36.753a196.276 196.276 0 0 0-32.899 19.02l-31.785-18.358c-9.41-5.435-21.305-3.877-28.985 3.811-30.216 30.25-52.654 68.265-64.058 110.797-2.819 10.512 1.751 21.613 11.177 27.054L59.485 237a197.715 197.715 0 0 0 0 37.999l-31.843 18.382c-9.426 5.441-13.996 16.542-11.177 27.054 11.404 42.531 33.842 80.547 64.058 110.797 7.68 7.688 19.575 9.246 28.985 3.811l31.785-18.358a196.202 196.202 0 0 0 32.899 19.019v36.753a24.016 24.016 0 0 0 17.842 23.206c41.761 11.107 86.117 11.122 127.93.001 10.519-2.798 17.844-12.321 17.844-23.206v-36.753a196.34 196.34 0 0 0 32.899-19.019l31.785 18.358c9.41 5.435 21.305 3.877 28.985-3.811 30.216-30.25 52.654-68.266 64.058-110.797 2.819-10.512-1.751-21.613-11.177-27.054L452.515 275c1.22-12.65 1.22-25.35 0-38zm-52.679 63.019l43.819 25.289a200.138 200.138 0 0 1-33.849 58.528l-43.829-25.309c-31.984 27.397-36.659 30.077-76.168 44.029v50.599a200.917 200.917 0 0 1-67.618 0v-50.599c-39.504-13.95-44.196-16.642-76.168-44.029l-43.829 25.309a200.15 200.15 0 0 1-33.849-58.528l43.819-25.289c-7.63-41.299-7.634-46.719 0-88.038l-43.819-25.289c7.85-21.229 19.31-41.049 33.849-58.529l43.829 25.309c31.984-27.397 36.66-30.078 76.168-44.029V58.845a200.917 200.917 0 0 1 67.618 0v50.599c39.504 13.95 44.196 16.642 76.168 44.029l43.829-25.309a200.143 200.143 0 0 1 33.849 58.529l-43.819 25.289c7.631 41.3 7.634 46.718 0 88.037zM256 160c-52.935 0-96 43.065-96 96s43.065 96 96 96 96-43.065 96-96-43.065-96-96-96zm0 144c-26.468 0-48-21.532-48-48 0-26.467 21.532-48 48-48s48 21.533 48 48c0 26.468-21.532 48-48 48z" class=""></path></svg>
                    </button>
                </div>
            </div>
            <!-- Fin Toolbar -->

            <!-- Main Content Area -->
            <div class="flex-1 p-4 overflow-auto bg-blue-50" id="main-content-area">
                <div class="flex justify-between items-center mb-3">
                    <h2 class="text-xl font-semibold text-gray-800" id="current-path">/</h2>
                    <div class="text-sm text-gray-600" id="items-count"></div>
                </div>
                <div id="file-view">
                    <!-- Vista de archivos (Grid o Lista) se renderizará aquí -->
                    <div id="grid-view-container" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        <!-- Contenido se genera dinámicamente -->
                    </div>
                    <div id="list-view-container" class="space-y-2 hidden">
                        <!-- Contenido se genera dinámicamente -->
                    </div>
                </div>
            </div>
            <!-- Fin Main Content Area -->
        </div>
        <!-- Fin Main Content -->
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between">
        <!-- Botón de prueba de API (temporalmente aquí) -->
        <button id="ax-test-button" style="margin: 10px; padding: 5px; border: 1px solid blue;">Probar Conexión API</button>
        <div id="ax-status" style="margin: 10px;">Estado: Desconocido</div>
    </div>
    <!-- Fin Footer -->
    `;

    container.innerHTML = axFinderHTML;

    loadFolders(); // Cargar carpetas dinámicamente

    // Añadir Event Listeners para la funcionalidad de la UI
    // Los event listeners para las carpetas se añadirán en loadFolders

    const gridBtn = document.getElementById('grid-btn');
    if (gridBtn) {
        gridBtn.addEventListener('click', () => setViewMode('grid'));
    }

    const listBtn = document.getElementById('list-btn');
    if (listBtn) {
        listBtn.addEventListener('click', () => setViewMode('list'));
    }

    // Ejemplo para file-item, necesitará ser más dinámico si hay muchos items
    const fileItem = document.querySelector('.file-item[data-file-id="1"]');
    if (fileItem) {
        fileItem.addEventListener('click', () => toggleFileSelection(1));
    }

    // Lógica para probar la conexión con files.php
    const testButton = document.getElementById('ax-test-button');
    const statusDiv = document.getElementById('ax-status');

    if (testButton && statusDiv) {
        testButton.addEventListener('click', () => {
            statusDiv.textContent = 'Estado: Conectando...';
            fetch('./src/api/files.php?action=test')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error del servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Respuesta de la API:', data);
                    statusDiv.textContent = `Estado: Conectado. Mensaje: ${data.message || JSON.stringify(data)}`;
                    if (data.baseDir_configurado) { // Ajustado para coincidir con la respuesta de la API
                        statusDiv.innerHTML += `<br>BaseDir configurado: ${data.baseDir_configurado}`;
                    }
                })
                .catch(error => {
                    console.error('Error al conectar con la API:', error);
                    statusDiv.textContent = `Estado: Error de conexión. ${error.message}`;
                });
        });
    }

    console.log('AxFinder inicializado con nuevo template.');
}

function loadFolders() {
    const foldersContainer = document.getElementById('sidebar-folders-container');
    if (!foldersContainer) {
        console.error('Error: No se encontró el contenedor de carpetas del sidebar.');
        return;
    }
    foldersContainer.innerHTML = `
        <div class="flex items-center justify-center p-4">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm text-gray-600">Cargando directorios...</p>
        </div>
    `;

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
                    // Usar el SVG del icono directamente desde folder.icon o el 'folderClosed' de config.php como fallback
                    const iconHtml = folder.icon ? folder.icon : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class="ax-secondary"/></svg>'; // Icono folderClosed de config.php
                    folderElement.innerHTML = `
                        <div class="flex items-center p-2 mb-2 hover:bg-blue-100 cursor-pointer text-sm font-bold transition-colors" id="folder-${folderId}">
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

                    const clickableFolderHeader = document.getElementById(`folder-${folderId}`);
                    if (clickableFolderHeader) {
                        clickableFolderHeader.addEventListener('click', () => {
                            const isOpening = toggleFolder(folderId, folder.name);
                            const iconContainer = document.getElementById(`${folderId}-icon-container`);
                            if (iconContainer) {
                                // Suponiendo que tienes los SVGs de folderOpen y folderClosed disponibles globalmente o los cargas aquí
                                // Estos son los SVGs de tu config.php
                                const folderOpenIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M69.08 271.63L0 390.05V112a48 48 0 0 1 48-48h160l64 64h160a48 48 0 0 1 48 48v48H152a96.31 96.31 0 0 0-82.92 47.63z" class="ax-secondary"/><path d="M152 256h400a24 24 0 0 1 20.73 36.09l-72.46 124.16A64 64 0 0 1 445 448H45a24 24 0 0 1-20.73-36.09l72.45-124.16A64 64 0 0 1 152 256z" class="ax-primary"/></svg>';
                                const folderClosedIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class="ax-secondary"/></svg>';

                                iconContainer.innerHTML = isOpening ? folderOpenIcon : folderClosedIcon;
                            }
                            // Marcar como activo y desmarcar otros
                            document.querySelectorAll('#sidebar-folders-container .bg-blue-100').forEach(item => {
                                item.classList.remove('bg-blue-100');
                            });
                            clickableFolderHeader.classList.add('bg-blue-100');
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

function toggleFolder(folderId, folderPath) {
    console.log(`Toggle folder: ${folderId}, Path: ${folderPath}`);
    const childrenContainer = document.getElementById(`${folderId}-children`);
    let isOpening = false;
    if (childrenContainer) {
        childrenContainer.classList.toggle('hidden');
        isOpening = !childrenContainer.classList.contains('hidden');
        console.log(`[toggleFolder] Folder: ${folderId}, Path: ${folderPath}, Opening: ${isOpening}, Children HTML: '${childrenContainer.innerHTML.trim()}'`);
        if (isOpening && childrenContainer.innerHTML.trim() === '<!-- Sub-elementos -->') {
            loadSubFolders(folderId, folderPath, childrenContainer);
        }
    }
    // Actualizar la ruta actual y cargar contenido
    loadFiles(folderPath);
    return isOpening; // Devuelve true si la carpeta se está abriendo, false si se está cerrando
}

function loadSubFolders(parentFolderId, parentFolderPath, childrenContainer) {
    childrenContainer.innerHTML = '<p class="p-2 text-xs text-gray-400">Cargando subcarpetas...</p>';

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
                    childrenContainer.innerHTML = '<p class="p-2 text-xs text-gray-500">No hay subcarpetas.</p>';
                    return;
                }
                data.folders.forEach(folder => {
                    // Usar folder.path que es relativo a baseDir, o construirlo si es necesario.
                    // Para el ID, podemos añadir el prefijo del padre para asegurar unicidad si hay nombres repetidos en diferentes niveles.
                    const subFolderId = `${parentFolderId}-${folder.name.replace(/\s+/g, '-').toLowerCase()}`;
                    const subFolderElement = document.createElement('div');
                    subFolderElement.classList.add('tree-folder');

                    const iconHtml = folder.icon ? folder.icon : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class="ax-secondary"/></svg>';

                    subFolderElement.innerHTML = `
                        <div class="flex items-center p-2 pl-4 mb-1 hover:bg-blue-100 cursor-pointer text-sm font-semibold transition-colors" id="folder-${subFolderId}">
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

                    const clickableSubFolderHeader = document.getElementById(`folder-${subFolderId}`);
                    if (clickableSubFolderHeader) {
                        clickableSubFolderHeader.addEventListener('click', (event) => {
                            event.stopPropagation(); // Evitar que el evento de clic se propague al contenedor padre
                            const isOpening = toggleFolder(subFolderId, folder.path); // folder.path ya es la ruta completa relativa a baseDir
                            const iconContainer = document.getElementById(`${subFolderId}-icon-container`);
                            if (iconContainer) {
                                const folderOpenIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M69.08 271.63L0 390.05V112a48 48 0 0 1 48-48h160l64 64h160a48 48 0 0 1 48 48v48H152a96.31 96.31 0 0 0-82.92 47.63z" class="ax-secondary"/><path d="M152 256h400a24 24 0 0 1 20.73 36.09l-72.46 124.16A64 64 0 0 1 445 448H45a24 24 0 0 1-20.73-36.09l72.45-124.16A64 64 0 0 1 152 256z" class="ax-primary"/></svg>';
                                const folderClosedIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class="ax-secondary"/></svg>';
                                iconContainer.innerHTML = isOpening ? folderOpenIcon : folderClosedIcon;
                            }
                            document.querySelectorAll('#sidebar-folders-container .bg-blue-100').forEach(item => {
                                item.classList.remove('bg-blue-100');
                            });
                            clickableSubFolderHeader.classList.add('bg-blue-100');
                        });
                    }
                });
            } else {
                childrenContainer.innerHTML = `<p class="p-2 text-xs text-red-500">Error al cargar subcarpetas: ${data.message || 'Formato inesperado.'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error en fetch al cargar subcarpetas:', error);
            childrenContainer.innerHTML = `<p class="p-2 text-xs text-red-500">Error de conexión: ${error.message}</p>`;
        });
}

// La definición de ICONS y getFileIcon se moverá a la configuración del backend (config.php)
// let ICONS = {}; // Se obtendrá del backend
// function getFileIcon(fileName) { /* Se obtendrá/adaptará del backend */ return 'file'; }

function loadFiles(folderName) {
    const fileView = document.getElementById('file-view');
    const currentPathElement = document.getElementById('current-path');

    if (!fileView || !currentPathElement) {
        console.error('Error: No se encontró el contenedor de vista de archivos (ID: file-view) o de ruta actual (ID: current-path). Verifique el HTML.');
        const mainContentArea = document.getElementById('main-content-area');
        if (mainContentArea) mainContentArea.innerHTML = '<p class="p-4 text-red-600 font-bold">Error Crítico: Elementos de la interfaz no encontrados. IDs esperados: file-view, current-path.</p>';
        return;
    }

    currentPathElement.textContent = folderName ? `/${folderName}` : '/';

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
        gridViewContainer.innerHTML = '<p class="p-4 text-gray-500">Cargando archivos...</p>';
    } else if (!listViewContainer.classList.contains('hidden')) {
        listViewContainer.innerHTML = '<p class="p-4 text-gray-500">Cargando archivos...</p>';
    } else { // Si ambos están ocultos (estado inicial o error), ponerlo en grid por defecto
        gridViewContainer.innerHTML = '<p class="p-4 text-gray-500">Cargando archivos...</p>';
    }

    fetch(`./src/api/files.php?action=list_files&folder=${encodeURIComponent(folderName)}`)
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
                        // Aplicar el diseño específico para imágenes solicitado por el usuario
                        // Las clases 'flex flex-col items-center text-center' ya están en gridItem.className
                        const imageHtml = `<img src="${item.imageUrl}" alt="${item.name}" class="w-full h-32 object-contain rounded-t-lg mb-2">`;
                        gridItem.innerHTML = `
                            ${imageHtml}
                            <span class="text-sm font-medium text-gray-700 truncate w-full mt-1">${item.name}</span>
                            ${item.size ? `<span class="text-xs text-gray-500">${item.size}</span>` : ''}
                        `;
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
                    } else if (item.imageUrl) { // Miniatura pequeña para la lista si es imagen
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

function clearFileView() {
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');
    const currentPathElement = document.getElementById('current-path');

    const initialMsg = '<p class="p-4 text-gray-500">Seleccione una carpeta para ver los archivos.</p>';
    if (gridViewContainer) gridViewContainer.innerHTML = initialMsg;
    if (listViewContainer) listViewContainer.innerHTML = ''; // En modo lista, puede estar vacío inicialmente
    if (currentPathElement) currentPathElement.textContent = '/';
}

function setViewMode(mode) {
    console.log(`setViewMode llamado con: ${mode}`);
    const gridViewContainer = document.getElementById('grid-view-container');
    const listViewContainer = document.getElementById('list-view-container');
    const gridBtn = document.getElementById('grid-btn');
    const listBtn = document.getElementById('list-btn');

    if (gridViewContainer && listViewContainer && gridBtn && listBtn) {
        const currentFolder = document.getElementById('current-path').textContent.substring(1) || '';
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

        // Volver a cargar los archivos de la carpeta actual SOLO si la vista está cambiando y hay contenido
        // o si una de las vistas está vacía y debería tener contenido.
        const gridIsEmpty = gridViewContainer.innerHTML.includes('Seleccione una carpeta') || gridViewContainer.innerHTML.includes('Esta carpeta está vacía') || gridViewContainer.innerHTML === '';
        const listIsEmpty = listViewContainer.innerHTML.includes('Seleccione una carpeta') || listViewContainer.innerHTML.includes('Esta carpeta está vacía') || listViewContainer.innerHTML === '';

        if (isActiveViewChanging && ((mode === 'grid' && gridIsEmpty && !listIsEmpty) || (mode === 'list' && listIsEmpty && !gridIsEmpty) || !gridIsEmpty || !listIsEmpty)) {
            // Si hay una carpeta seleccionada (no es la raíz inicial sin selección)
            if (document.getElementById('current-path').textContent !== '/' || (currentFolder === '' && fileCache[`files--name-asc`])) {
                loadFiles(currentFolder, currentSortOrder.column, currentSortOrder.direction);
            } else if (currentFolder === '' && !fileCache[`files--name-asc`]) {
                // Caso inicial, raíz, sin archivos cargados aún en caché
                loadFiles('', currentSortOrder.column, currentSortOrder.direction);
            } else {
                // No hacer nada o limpiar si es el estado inicial sin selección
                if (mode === 'grid') gridViewContainer.innerHTML = '<p class="p-4 text-gray-500">Seleccione una carpeta.</p>';
                if (mode === 'list') listViewContainer.innerHTML = '<p class="p-4 text-gray-500">Seleccione una carpeta.</p>';
            }
        }
    } else {
        console.error('Error: No se pudieron encontrar los elementos para cambiar la vista.');
    }
}

function toggleFileSelection(fileId) {
    console.log(`toggleFileSelection llamado para: ${fileId}`);
    // Implementar lógica de selección de archivos
    // Por ejemplo, añadir una clase 'selected' al elemento
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileElement) {
        fileElement.classList.toggle('ring-2');
        fileElement.classList.toggle('ring-blue-500');
        fileElement.classList.toggle('shadow-xl');
    }
}

// No es necesario exportar initAxFinder si no se usan módulos y el script se carga globalmente.
// El DOMContentLoaded ya llama a initAxFinder.
// ... existing code ...