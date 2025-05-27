// src/js/folderNavigation.js
console.log('src/js/folderNavigation.js cargado');

import { UIElements } from './uiElements.js';
import { api } from './apiService.js';
import { loadFiles } from './fileDisplay.js';
// import { icons } from './config.js'; // Para los iconos de carpeta y chevron

export async function loadFolders(initialPath = '') {
    console.log('[FolderNavigation] Cargando estructura de carpetas inicial.');
    const sidebarFoldersContainer = UIElements.sidebarFoldersContainer();
    if (!sidebarFoldersContainer) {
        console.error('[FolderNavigation] Contenedor de carpetas del sidebar no encontrado.');
        return;
    }

    sidebarFoldersContainer.innerHTML = '<div class="p-2"><div class="loader">Cargando carpetas...</div></div>'; // Spinner

    try {
        const folders = await api.fetchFolders(initialPath); // Asume que fetchFolders puede tomar una ruta base
        console.log('[FolderNavigation] Carpetas recibidas:', folders);
        sidebarFoldersContainer.innerHTML = ''; // Limpiar spinner

        if (folders && folders.length > 0) {
            folders.forEach(folder => {
                const folderElement = createFolderElement(folder, 0, ''); // Nivel 0, sin ID de padre
                sidebarFoldersContainer.appendChild(folderElement);
            });
        } else {
            sidebarFoldersContainer.innerHTML = '<p class="p-2 text-gray-500">No hay carpetas para mostrar.</p>';
        }
        // Escuchar evento de navegación de archivos para actualizar la selección de carpeta
        document.addEventListener('folderNavigated', (event) => {
            const navigatedPath = event.detail.path;
            updateActiveFolderSelection(navigatedPath);
        });

    } catch (error) {
        console.error('[FolderNavigation] Error al cargar carpetas:', error);
        sidebarFoldersContainer.innerHTML = `<p class="p-2 text-red-500">Error al cargar carpetas: ${error.message}</p>`;
    }
}

function createFolderElement(folder, level, parentFolderId) {
    const folderId = parentFolderId ? `${parentFolderId}-${folder.name.replace(/\s+/g, '_')}` : folder.name.replace(/\s+/g, '_');

    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder-item';
    folderDiv.style.paddingLeft = `${level * 15}px`;
    folderDiv.dataset.path = folder.path;
    folderDiv.id = `folder-${folderId}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex items-center p-2 hover:bg-blue-100 cursor-pointer rounded-md';

    const chevronSpan = document.createElement('span');
    chevronSpan.className = 'chevron-icon w-5 h-5 mr-1 text-gray-500';
    if (folder.hasSubfolders) {
        chevronSpan.innerHTML = icons.chevronRight;
    } else {
        chevronSpan.innerHTML = ''; // O un espaciador si es necesario para alinear
    }

    const iconSpan = document.createElement('span');
    iconSpan.className = 'folder-icon w-5 h-5 mr-2 text-blue-500';
    iconSpan.innerHTML = icons.folderClosed;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'text-sm text-gray-700 truncate';
    nameSpan.textContent = folder.name;

    contentDiv.appendChild(chevronSpan);
    contentDiv.appendChild(iconSpan);
    contentDiv.appendChild(nameSpan);
    folderDiv.appendChild(contentDiv);

    const subfoldersContainer = document.createElement('div');
    subfoldersContainer.className = 'subfolders-container hidden pl-4'; // Oculto por defecto
    subfoldersContainer.id = `subfolders-${folderId}`;
    folderDiv.appendChild(subfoldersContainer);

    contentDiv.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log(`[FolderNavigation] Carpeta clickeada: ${folder.path}, ID: ${folderId}`);
        loadFiles(folder.path); // Cargar archivos de esta carpeta
        updateActiveFolderSelection(folder.path);
        if (folder.hasSubfolders) {
            toggleFolder(folderId, folder.path, level + 1, iconSpan, chevronSpan, subfoldersContainer);
        }
    });

    return folderDiv;
}

async function toggleFolder(folderId, folderPath, level, iconElement, chevronElement, subfoldersContainer) {
    const isOpen = !subfoldersContainer.classList.contains('hidden');
    console.log(`[FolderNavigation] Toggle folder: ${folderId}, actualmente ${isOpen ? 'abierta' : 'cerrada'}`);

    if (isOpen) {
        subfoldersContainer.classList.add('hidden');
        iconElement.innerHTML = icons.folderClosed;
        chevronElement.innerHTML = icons.chevronRight;
    } else {
        subfoldersContainer.classList.remove('hidden');
        iconElement.innerHTML = icons.folderOpen;
        chevronElement.innerHTML = icons.chevronDown;

        // Cargar subcarpetas si aún no se han cargado
        if (subfoldersContainer.innerHTML === '') {
            subfoldersContainer.innerHTML = '<div class="p-1"><div class="loader-sm">Cargando...</div></div>'; // Spinner pequeño
            try {
                const subfolders = await api.fetchFolders(folderPath);
                subfoldersContainer.innerHTML = ''; // Limpiar spinner
                if (subfolders && subfolders.length > 0) {
                    subfolders.forEach(subfolder => {
                        const subfolderElement = createFolderElement(subfolder, level, folderId);
                        subfoldersContainer.appendChild(subfolderElement);
                    });
                } else {
                    // No es necesario un mensaje si no hay subcarpetas, el chevron ya lo indica
                    // Opcionalmente, se podría añadir un texto si se desea.
                }
            } catch (error) {
                console.error(`[FolderNavigation] Error al cargar subcarpetas para ${folderPath}:`, error);
                subfoldersContainer.innerHTML = `<p class="p-1 text-xs text-red-500">Error</p>`;
            }
        }
    }
}

function updateActiveFolderSelection(selectedPath) {
    console.log(`[FolderNavigation] Actualizando selección activa a: ${selectedPath}`);
    const allFolderElements = document.querySelectorAll('#sidebar-folders-container .folder-item > div:first-child');
    allFolderElements.forEach(el => {
        const path = el.parentElement.dataset.path;
        if (path === selectedPath) {
            el.classList.add('bg-blue-100', 'font-semibold');
        } else {
            el.classList.remove('bg-blue-100', 'font-semibold');
        }
    });
}