import { UIElements } from './uiElements.js';
import { api } from './apiService.js'; // Para la futura llamada de eliminación
// Importar loadFolders y loadFiles para refrescar la UI después de eliminar
import { loadFolders } from './loadFolder.js';
import { loadFiles } from './fileDisplay.js';
import { showNotification } from './notifications.js'; // Importar showNotification

let folderPathToDelete = null; // Almacenará la ruta de la carpeta a eliminar

function showConfirmDeleteFolderModal(path, message) {
    const modal = UIElements.confirmDeleteFolderModal();
    const modalMessage = document.getElementById('confirm-delete-modal-message');

    if (modal && modalMessage) {
        folderPathToDelete = path;
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
    } else {
        console.error('Modal de confirmación de eliminación o su elemento de mensaje no encontrado.');
    }
}

function hideConfirmDeleteFolderModal() {
    const modal = UIElements.confirmDeleteFolderModal();
    if (modal) {
        modal.classList.add('hidden');
        folderPathToDelete = null;
    }
}

async function handleDeleteConfirm() {
    if (!folderPathToDelete) {
        showNotification('No se especificó ninguna carpeta para eliminar.', 'error');
        hideConfirmDeleteFolderModal();
        return;
    }

    // --- INICIO LÓGICA DE ELIMINACIÓN REAL ---
    try {
        const response = await api.deleteFolder(folderPathToDelete);

        if (response.success) {
            showNotification(`Carpeta '${folderPathToDelete}' eliminada exitosamente.`, 'success');
            // Actualizar la UI
            await loadFolders(); // Recargar el árbol de carpetas
            // Determinar el path del padre para recargar los archivos
            let parentPath = '.'; // Por defecto, la raíz
            if (folderPathToDelete.includes('/')) {
                const lastSlashIndex = folderPathToDelete.lastIndexOf('/');
                // Si hay una barra y no es el primer carácter (ej. 'sub/carpeta', no '/carpeta')
                if (lastSlashIndex > 0) { 
                    parentPath = folderPathToDelete.substring(0, lastSlashIndex);
                } else if (lastSlashIndex === 0) {
                    // Si es una ruta absoluta como '/nombrecarpeta' (improbable en este contexto, pero seguro)
                    // el padre sigue siendo la raíz para la recarga de la lista de archivos.
                    parentPath = '.'; 
                }
            }
            // Si folderPathToDelete no incluye '/', significa que estaba en la raíz,
            // por lo que parentPath ya es '.' y está correcto.
            
            await loadFiles(parentPath); // Recargar archivos del directorio padre (o raíz si no hay padre)
        } else {
            showNotification(`Error al eliminar la carpeta: ${response.message}`, 'error');
        }
    } catch (error) {
        console.error('Error en la llamada API para delete_folder:', error); // Mantener este console.error para depuración interna
        showNotification('Error de conexión al intentar eliminar la carpeta.', 'error');
    }
    // --- FIN LÓGICA DE ELIMINACIÓN REAL ---
    hideConfirmDeleteFolderModal();
}

export function initConfirmDeleteFolderModal() {
    const confirmButton = document.getElementById('confirm-delete-folder-button');
    const cancelButton = document.getElementById('cancel-delete-folder-button');
    const modal = UIElements.confirmDeleteFolderModal();

    if (confirmButton) {
        confirmButton.addEventListener('click', handleDeleteConfirm);
    }
    if (cancelButton) {
        cancelButton.addEventListener('click', hideConfirmDeleteFolderModal);
    }

    // Opcional: cerrar modal si se hace clic fuera de él (similar a otros modales)
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) { // Si el clic es directamente en el fondo del modal
                hideConfirmDeleteFolderModal();
            }
        });
    }
}

// Exportamos la función que folderContextMenu usará para mostrar el modal
export { showConfirmDeleteFolderModal };
