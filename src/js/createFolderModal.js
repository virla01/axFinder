// src/js/createFolderModal.js
console.log('src/js/createFolderModal.js cargado');

import { UIElements } from './uiElements.js';
import { api } from './apiService.js';
import { loadFolders } from './folderNavigation.js'; // Para refrescar la lista de carpetas
import { loadFiles } from './fileDisplay.js'; // Para refrescar la vista de archivos si es necesario
import { config } from './config.js'; // Para obtener currentPath

let isActive = false;

function showModal() {
    const modal = UIElements.createFolderModal();
    const input = UIElements.newFolderNameInput();
    const errorDisplay = UIElements.createFolderErrorDisplay();

    if (modal) {
        modal.classList.remove('hidden');
        if (input) input.value = ''; // Limpiar input
        if (errorDisplay) errorDisplay.textContent = ''; // Limpiar errores previos
        if (input) input.focus();
        isActive = true;
        console.log('Modal de creación de carpeta mostrado.');
    } else {
        console.error('No se pudo encontrar el elemento del modal de creación de carpeta.');
    }
}

function hideModal() {
    const modal = UIElements.createFolderModal();
    if (modal) {
        modal.classList.add('hidden');
        isActive = false;
        console.log('Modal de creación de carpeta ocultado.');
    } else {
        console.error('No se pudo encontrar el elemento del modal para ocultarlo.');
    }
}

async function handleSubmit() {
    const input = UIElements.newFolderNameInput();
    const errorDisplay = UIElements.createFolderErrorDisplay();

    if (!input || !errorDisplay) {
        console.error('Elementos del modal no encontrados para el submit.');
        return;
    }

    const folderName = input.value.trim();
    if (!folderName) {
        errorDisplay.textContent = 'El nombre de la carpeta no puede estar vacío.';
        input.focus();
        return;
    }

    // Validar nombre de carpeta (caracteres no permitidos, etc.) - Simplificado por ahora
    const invalidChars = /[\\/:*?"<>|]/;
    if (invalidChars.test(folderName)) {
        errorDisplay.textContent = 'El nombre contiene caracteres no válidos (\\ / : * ? " < > |).';
        input.focus();
        return;
    }

    errorDisplay.textContent = ''; // Limpiar errores previos
    const currentPath = config.currentPath; // Obtener la ruta actual desde config

    console.log(`Intentando crear carpeta: '${folderName}' en ruta: '${currentPath}'`);

    try {
        const result = await api.createFolder(currentPath, folderName);
        console.log('Respuesta de creación de carpeta:', result);
        if (result.success) {
            hideModal();
            // Refrescar la vista de carpetas y archivos
            // Es importante asegurar que folderNavigation.js y fileDisplay.js tengan funciones para refrescar
            // y que config.currentPath esté actualizado si la navegación cambia.
            if (UIElements.sidebarFoldersContainer()) {
                await loadFolders(UIElements.sidebarFoldersContainer(), ''); // Recargar desde la raíz o la carpeta padre
            }
            // Si la nueva carpeta está dentro de la vista actual, refrescar archivos
            // Esto es un poco más complejo, ya que la nueva carpeta no se seleccionará automáticamente.
            // Por ahora, simplemente recargamos la vista actual.
            if (UIElements.filesContainer()) {
                await loadFiles(currentPath); // Recargar archivos de la carpeta actual
            }
            console.log(`Carpeta '${folderName}' creada exitosamente.`);
        } else {
            errorDisplay.textContent = result.message || 'Error al crear la carpeta.';
            console.error('Error al crear carpeta (respuesta API):', result.message);
        }
    } catch (error) {
        console.error('Error en la llamada API para crear carpeta:', error);
        errorDisplay.textContent = `Error de red o servidor: ${error.message}`;
    }
}

export function initCreateFolderModal() {
    const createButton = UIElements.createFolderButton();
    const submitButton = UIElements.submitCreateFolderButton();
    const cancelButton = UIElements.cancelCreateFolderButton();
    const modal = UIElements.createFolderModal();

    if (createButton) {
        createButton.addEventListener('click', showModal);
    } else {
        console.warn('Botón para mostrar modal de creación de carpeta no encontrado.');
    }

    if (submitButton) {
        submitButton.addEventListener('click', handleSubmit);
    } else {
        console.warn('Botón de submit del modal de creación de carpeta no encontrado.');
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', hideModal);
    } else {
        console.warn('Botón de cancelar del modal de creación de carpeta no encontrado.');
    }

    // Cerrar modal si se presiona Escape
    if (modal) {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isActive) {
                hideModal();
            }
        });
        // Cerrar modal si se hace clic fuera de él (en el overlay)
        modal.addEventListener('click', (event) => {
            if (event.target === modal && isActive) { // Asegurarse que el clic es en el overlay y no en el contenido del modal
                hideModal();
            }
        });
    }

    console.log('Modal de creación de carpeta inicializado.');
}