import { UIElements } from './uiElements.js';
import { api } from './apiService.js'; // Asegúrate que la ruta sea correcta
import { showConfirmDeleteFolderModal } from './confirmDeleteFolderModal.js';
import { showRenameFolderModal } from './renameFolderModal.js';

export function initFolderContextMenu() {
    const menu = UIElements.folderContextMenu();

    if (!menu) {
        console.error("Folder context menu element not found for initialization.");
        return;
    }

    document.addEventListener('click', function(event) {
        // Ocultar el menú si está visible y el clic es fuera de él
        if (!menu.classList.contains('hidden') && !menu.contains(event.target)) {
            let targetElement = event.target;
            let isFolderTriggerClick = false;
            // Verificar si el clic fue en un elemento que abre el menú (una carpeta)
            while (targetElement && targetElement !== document.body) {
                if (targetElement.id && targetElement.id.startsWith('folder-')) {
                    isFolderTriggerClick = true;
                    break;
                }
                targetElement = targetElement.parentElement;
            }

            // Si el clic fue en una carpeta Y FUE UN CLIC DERECHO (event.button === 2),
            // el menú se habrá abierto por el listener en loadFolder.js, así que no lo cerramos aquí.
            // Si fue un clic izquierdo en una carpeta, o cualquier clic fuera de una carpeta y fuera del menú, lo cerramos.
            if (isFolderTriggerClick && event.button === 2) {
                // No hacer nada, el menú se maneja al abrirse
            } else {
                menu.classList.add('hidden');
            }
        }
    });

    document.addEventListener('keydown', function(event) {
        if (!menu.classList.contains('hidden') && event.key === 'Escape') {
            menu.classList.add('hidden');
        }
    });

    // Aquí añadiremos los listeners para las opciones del menú (Eliminar, Renombrar)
    const deleteOption = document.getElementById('context-menu-delete');
    if (deleteOption) {
        deleteOption.addEventListener('click', async function(event) { // Convertir a async
            event.preventDefault();
            const folderPath = menu.dataset.folderPath;
            if (folderPath) {
                menu.classList.add('hidden'); // Ocultar menú inmediatamente
                try {
                    // console.log(`Verificando si la carpeta '${folderPath}' está vacía...`);
                    const response = await api.checkFolderEmpty(folderPath);

                    if (response.success) {
                        const folderName = folderPath.includes('/') ? folderPath.substring(folderPath.lastIndexOf('/') + 1) : folderPath;
                        if (response.isEmpty) {
                            showConfirmDeleteFolderModal(folderPath, `¿Estás seguro de que quieres eliminar la carpeta '${folderName}'? Esta acción no se puede deshacer.`);
                        } else {
                            showConfirmDeleteFolderModal(folderPath, `La carpeta '${folderName}' contiene archivos o subcarpetas. ¿Estás seguro de que quieres eliminarla junto con TODO su contenido? Esta acción no se puede deshacer.`);
                        }
                    } else {
                        console.error('Error al verificar si la carpeta está vacía:', response.message);
                        UIElements.showNotification(`Error al verificar carpeta: ${response.message}`, 'error');
                    }
                } catch (error) {
                    console.error('Error en la llamada API para check_folder_empty:', error);
                    UIElements.showNotification('Error de conexión al verificar la carpeta.', 'error');
                }
            }
        });
    }

    const renameOption = document.getElementById('context-menu-rename');
    if (renameOption) {
        renameOption.addEventListener('click', function(event) {
            event.preventDefault();
            const folderPath = menu.dataset.folderPath;
            if (folderPath) {
                const folderName = folderPath.includes('/') ? folderPath.substring(folderPath.lastIndexOf('/') + 1) : folderPath;
                // console.log('Acción: Renombrar carpeta', folderPath, 'Nombre actual:', folderName);
                showRenameFolderModal(folderPath, folderName);
                menu.classList.add('hidden');
            }
        });
    }
}
