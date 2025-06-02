// src/js/renameFolderModal.js
import { UIElements } from './uiElements.js';
import { t } from './i18n.js';
import { api } from './apiService.js';
import { loadFiles } from './fileDisplay.js'; // Para refrescar vista de archivos
import { loadFolders } from './loadFolder.js'; // Para refrescar árbol de carpetas
import { config } from './config.js';

let renameModal = null;
let currentFolderPath = null; // Para saber qué carpeta estamos renombrando
let currentFolderNameDisplay = null;
let newNameInput = null;
let errorDisplay = null;
let submitButton = null;
let cancelButton = null;

export function initRenameFolderModal() {
    renameModal = UIElements.renameFolderModal();
    currentFolderNameDisplay = UIElements.currentFolderNameDisplay();
    newNameInput = UIElements.newFolderNameRenameInput();
    errorDisplay = UIElements.renameFolderErrorDisplay();
    submitButton = UIElements.submitRenameFolderButton();
    cancelButton = UIElements.cancelRenameFolderButton();

    if (!renameModal || !newNameInput || !errorDisplay || !submitButton || !cancelButton || !currentFolderNameDisplay) {
        console.error('[RenameFolderModal] No se pudieron inicializar todos los elementos del modal de renombrar.');
        return;
    }

    submitButton.addEventListener('click', handleRenameFolderSubmit);
    cancelButton.addEventListener('click', hideRenameFolderModal);
    renameModal.addEventListener('click', (event) => {
        if (event.target === renameModal) { // Clic fuera del contenido del modal
            hideRenameFolderModal();
        }
    });

    // console.log('[RenameFolderModal] Modal de renombrar carpeta inicializado.');
}

export function showRenameFolderModal(folderPath, currentName) {
    if (!renameModal || !newNameInput || !errorDisplay || !currentFolderNameDisplay) {
        console.error('[RenameFolderModal] Elementos del modal no disponibles para mostrar.');
        return;
    }
    currentFolderPath = folderPath;
    currentFolderNameDisplay.textContent = currentName;
    newNameInput.value = currentName; // Pre-rellenar con el nombre actual
    errorDisplay.textContent = '';
    newNameInput.classList.remove('border-red-500');

    // Aplicar traducciones
    const titleElement = renameModal.querySelector('[data-i18n-key="renameFolderModal.title"]');
    if (titleElement) titleElement.textContent = t('renameFolderModal.title');

    const currentNameLabel = renameModal.querySelector('[data-i18n-key="renameFolderModal.currentNameLabel"]');
    // El texto "Nombre actual:" está hardcodeado en el HTML, pero el strong id="current-folder-name-display" se actualiza arriba.
    // Si quisiéramos traducir "Nombre actual:", necesitaríamos un span alrededor. Por ahora lo dejamos.

    const newNameLabel = renameModal.querySelector('[data-i18n-key="renameFolderModal.newNameLabel"]');
    if (newNameLabel) newNameLabel.textContent = t('renameFolderModal.newNameLabel');
    
    newNameInput.placeholder = t('renameFolderModal.newNamePlaceholder');

    const renameButtonText = renameModal.querySelector('[data-i18n-key="renameFolderModal.renameButton"]');
    if (renameButtonText) renameButtonText.textContent = t('renameFolderModal.renameButton');


    renameModal.classList.remove('hidden');
    newNameInput.focus();
    // console.log(`[RenameFolderModal] Mostrando modal para renombrar: ${currentFolderPath} (nombre actual: ${currentName})`);
}

function hideRenameFolderModal() {
    if (renameModal) {
        renameModal.classList.add('hidden');
        // console.log('[RenameFolderModal] Modal de renombrar oculto.');
    }
}

async function handleRenameFolderSubmit() {
    if (!newNameInput || !errorDisplay || !currentFolderPath) return;

    const newName = newNameInput.value.trim();

    if (!newName) {
        errorDisplay.textContent = t('renameFolderModal.errorEmptyName');
        newNameInput.classList.add('border-red-500');
        return;
    }

    // Validación básica de caracteres no permitidos (ejemplo)
    if (/[<>:"/\\|?*]/.test(newName)) {
        errorDisplay.textContent = t('renameFolderModal.errorInvalidChars');
        newNameInput.classList.add('border-red-500');
        return;
    }
    
    errorDisplay.textContent = '';
    newNameInput.classList.remove('border-red-500');
    submitButton.disabled = true;
    submitButton.textContent = t('renameFolderModal.renamingButton') || 'Renombrando...';


    try {
        const response = await api.renameFolder(currentFolderPath, newName);
        if (response.success) {
            UIElements.showNotification(t('renameFolderModal.successMessage', { oldName: currentFolderPath.split('/').pop(), newName: newName }), 'success');
            hideRenameFolderModal();
            
            // Actualizar la UI: Recargar el árbol de carpetas y la vista de archivos del directorio padre
            await loadFolders(); // Recarga todo el árbol de carpetas
            
            const parentPath = currentFolderPath.substring(0, currentFolderPath.lastIndexOf('/')) || '.';
            if (config.currentPath === parentPath || config.currentPath === currentFolderPath) { // Si estábamos viendo el padre o la carpeta renombrada
                 await loadFiles(parentPath); // Recargar la vista de archivos del padre
            } else if (config.currentPath.startsWith(currentFolderPath + '/')) { // Si estábamos viendo una subcarpeta de la carpeta renombrada
                // Aquí la lógica es más compleja, podríamos necesitar actualizar config.currentPath
                // Por simplicidad, recargamos el padre. El usuario podría necesitar navegar de nuevo.
                await loadFiles(parentPath);
            }

        } else {
            errorDisplay.textContent = response.message || t('renameFolderModal.errorGeneric');
            newNameInput.classList.add('border-red-500');
        }
    } catch (error) {
    console.error('[RenameFolderModal] Error al renombrar carpeta:', error, 'Mensaje del error:', error.message); // Log mejorado
    let displayMessage = t('renameFolderModal.errorException') + ` (${error.message})`;

    if (error.message && typeof error.message === 'string' && error.message.includes('409')) {
        let jsonStringForParse = null; // Variable para guardar la cadena que se intentará parsear
        try {
            const jsonStringMatch = error.message.match(/{.*}/);
            if (jsonStringMatch && jsonStringMatch[0]) {
                jsonStringForParse = jsonStringMatch[0].trim(); // Añadido .trim()
                console.log('[RenameFolderModal] Cadena JSON potencial para error 409:', jsonStringForParse); // Log
                const errorDetails = JSON.parse(jsonStringForParse);
                
                if (errorDetails && errorDetails.message) {
                    console.log('[RenameFolderModal] errorDetails.message parseado:', errorDetails.message); // Log
                    const nameMatch = errorDetails.message.match(/'([^']+)'/);
                    const conflictingName = nameMatch && nameMatch[1] ? nameMatch[1] : newNameInput.value.trim();
                    console.log('[RenameFolderModal] Valor de conflictingName antes de llamar a t():', conflictingName); // Log para depurar conflictingName
                    displayMessage = t('renameFolderModal.errorConflict', { NAME: conflictingName });
                    console.log('[RenameFolderModal] Mostrando mensaje específico 409:', displayMessage); // Log
                } else {
                    console.warn('[RenameFolderModal] El JSON parseado para error 409 no contiene la propiedad "message".');
                }
            } else {
                console.warn('[RenameFolderModal] No se pudo encontrar la cadena JSON en el mensaje de error 409.');
            }
        } catch (parseError) {
            // Log detallado si JSON.parse falla
            console.warn('[RenameFolderModal] Falló el parseo del JSON del mensaje de error 409:', parseError, 'El input para JSON.parse fue:', jsonStringForParse !== null ? jsonStringForParse : 'jsonStringMatch[0] no disponible');
        }
    }
    errorDisplay.textContent = displayMessage;
    newNameInput.classList.add('border-red-500');
} finally {
        submitButton.disabled = false;
        const renameButtonText = renameModal.querySelector('[data-i18n-key="renameFolderModal.renameButton"]');
        if (renameButtonText) submitButton.textContent = t('renameFolderModal.renameButton');
    }
}
