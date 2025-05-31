// src/js/metadataUploadModal.js

import { t } from './i18n.js'; // Importar la función t real

let metadataModal = null;
let modalImagePreview = null;
let modalFileInput = null;
let modalSelectFileButton = null;
let modalDragDropText = null;
let modalForm = null;
let closeButton = null; // Para el span de cierre
let modalFileNameTitle = null;
let modalImagePreviewContainer = null; // Para el texto de drag & drop
let captionLabel = null;
let authorLabel = null;
let publishDateLabel = null;
let sourceLabel = null;
let tagsLabel = null;
let metadataTagsInput = null; // Para el placeholder
let keywordsLabel = null;
let metadataKeywordsInput = null; // Para el placeholder
let saveAndUploadButton = null;

/**
 * Inicializa el modal de subida de metadatos y sus controles.
 */
export function initializeMetadataUploadModal() {
    metadataModal = document.getElementById('metadata-modal');
    modalImagePreview = document.getElementById('modal-image-preview');
    modalFileInput = document.getElementById('modal-file-input');
    modalSelectFileButton = document.getElementById('modal-select-file-button');
    modalDragDropText = document.getElementById('modal-drag-drop-text');
    modalForm = document.getElementById('metadata-form');

    modalFileNameTitle = document.getElementById('modal-file-name');
    modalImagePreviewContainer = document.getElementById('modal-image-preview-container');
    captionLabel = metadataModal.querySelector('label[for="caption"]');
    authorLabel = metadataModal.querySelector('label[for="author"]');
    publishDateLabel = metadataModal.querySelector('label[for="publish-date"]');
    sourceLabel = metadataModal.querySelector('label[for="source"]');
    tagsLabel = metadataModal.querySelector('label[for="metadata-tags"]');
    metadataTagsInput = document.getElementById('metadata-tags');
    keywordsLabel = metadataModal.querySelector('label[for="metadata-keywords"]');
    metadataKeywordsInput = document.getElementById('metadata-keywords');
    saveAndUploadButton = modalForm.querySelector('button[type="submit"]');

    // El botón de cierre es el span dentro del modal-content
    if (metadataModal) {
        closeButton = metadataModal.querySelector('.modal-content > .close');
    }

    if (!metadataModal || !modalImagePreview || !modalFileInput || !modalSelectFileButton || !modalDragDropText || !modalForm || !closeButton || !modalFileNameTitle || !modalImagePreviewContainer || !captionLabel || !authorLabel || !publishDateLabel || !sourceLabel || !tagsLabel || !metadataTagsInput || !keywordsLabel || !metadataKeywordsInput || !saveAndUploadButton) {
        console.error('[MetadataUploadModal] No se pudieron encontrar todos los elementos del modal. Verifica los IDs y selectores.');
        return;
    }

    // Aplicar traducciones a los elementos del modal
    applyModalTranslations();

    // Event listener para el botón de seleccionar archivo
    modalSelectFileButton.addEventListener('click', () => {
        modalFileInput.click(); // Simula un clic en el input de archivo oculto
    });

    // Event listener para el cambio en el input de archivo (cuando se selecciona una imagen)
    modalFileInput.addEventListener('change', handleFileSelect);

    // Event listeners para drag and drop (arrastrar y soltar)
    if (modalImagePreviewContainer) {
        modalImagePreviewContainer.addEventListener('dragover', handleDragOver);
        modalImagePreviewContainer.addEventListener('dragleave', handleDragLeave);
        modalImagePreviewContainer.addEventListener('drop', handleDrop);
        // También permitir hacer clic en el área de drag-drop para seleccionar archivo
        modalImagePreviewContainer.addEventListener('click', () => modalFileInput.click());
    }

    // Event listener para el botón de cierre del modal
    closeButton.addEventListener('click', closeMetadataModal);

    // Event listener para el envío del formulario (subida de imagen y metadatos)
    modalForm.addEventListener('submit', handleFormSubmit);

    console.log('[MetadataUploadModal] Modal de subida de metadatos inicializado.');
}

/**
 * Aplica las traducciones a los elementos estáticos del modal.
 * Se llama en la inicialización y podría llamarse si cambia el idioma.
 */
export function applyModalTranslations() {
    if (modalFileNameTitle) modalFileNameTitle.textContent = t('modal.metadataTitle');
    if (modalImagePreview) modalImagePreview.alt = t('modal.imagePreviewAlt');
    if (modalDragDropText) modalDragDropText.textContent = t('modal.dragDropText');
    if (modalSelectFileButton) modalSelectFileButton.textContent = t('modal.selectFileButton');

    if (captionLabel) captionLabel.textContent = t('modal.captionLabel');
    if (authorLabel) authorLabel.textContent = t('modal.authorLabel');
    if (publishDateLabel) publishDateLabel.textContent = t('modal.publishDateLabel');
    if (sourceLabel) sourceLabel.textContent = t('modal.sourceLabel');
    if (tagsLabel) tagsLabel.textContent = t('modal.tagsLabel');
    if (metadataTagsInput) metadataTagsInput.placeholder = t('modal.tagsPlaceholder');
    if (keywordsLabel) keywordsLabel.textContent = t('modal.keywordsLabel');
    if (metadataKeywordsInput) metadataKeywordsInput.placeholder = t('modal.keywordsPlaceholder');
    if (saveAndUploadButton) saveAndUploadButton.textContent = t('modal.saveAndUploadButton');

    // Para el título h2 cuando se abre para edición, se maneja en openMetadataModal
}

/**
 * Muestra el modal de subida de metadatos.
 * @param {Object} [fileInfo=null] - Opcional. Información de un archivo existente para editar (no implementado completamente aún).
 */
export function openMetadataModal(fileInfo = null) {
    if (!metadataModal) return;

    // Aplicar estilos para comportamiento de superposición global
    metadataModal.style.position = 'fixed';
    metadataModal.style.top = '0';
    metadataModal.style.left = '0';
    metadataModal.style.width = '100vw';
    metadataModal.style.height = '100vh';
    metadataModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Fondo semitransparente
    metadataModal.style.display = 'flex'; // Usar flex para centrar el contenido
    metadataModal.style.alignItems = 'center';
    metadataModal.style.justifyContent = 'center';
    metadataModal.style.zIndex = '1000'; // Asegurar que esté por encima de otros elementos

    // Evitar scroll en el body mientras el modal está abierto
    document.body.style.overflow = 'hidden';

    // Resetear el formulario y la previsualización
    modalForm.reset();
    modalImagePreview.style.display = 'none';
    modalImagePreview.src = '#';
    modalDragDropText.style.display = 'block'; // Mostrar texto de arrastrar/soltar
    modalFileInput.value = ''; // Limpiar el input de archivo

    // Actualizar textos que podrían cambiar (como el título del modal)
    if (fileInfo && fileInfo.name) { // Si es para editar
        if (modalFileNameTitle) modalFileNameTitle.textContent = `${t('modal.editing', { fileName: fileInfo.name })}`;
        // Aquí necesitarías una clave como "modal.editing": "Editando: {{fileName}}" en tu JSON
        // y que la función t() soporte interpolación básica, lo cual no hace aún.
        // Por ahora, lo más simple:
        // if (modalFileNameTitle) modalFileNameTitle.textContent = "Editando: " + fileInfo.name;
    } else { // Si es para nueva subida, asegurar título por defecto
        if (modalFileNameTitle) modalFileNameTitle.textContent = t('modal.metadataTitle');
    }

    metadataModal.style.display = 'flex';
}

/**
 * Cierra el modal de subida de metadatos.
 */
export function closeMetadataModal() {
    if (!metadataModal) return;
    metadataModal.style.display = 'none';

    // Restaurar scroll en el body
    document.body.style.overflow = 'auto';
}

/**
 * Maneja la selección de un archivo a través del input o drag & drop.
 * @param {Event} event - El evento del input de archivo o el evento de drop.
 */
function handleFileSelect(event) {
    const files = event.target.files || (event.dataTransfer && event.dataTransfer.files);
    if (files && files[0]) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modalImagePreview.src = e.target.result;
                modalImagePreview.style.display = 'block';
                modalDragDropText.style.display = 'none'; // Ocultar texto de drag & drop
            };
            reader.readAsDataURL(file);
        } else {
            alert(t('modal.notAnImageError')); // Traducir: "Por favor, selecciona un archivo de imagen."
            modalImagePreview.style.display = 'none';
            modalImagePreview.src = '#';
            modalDragDropText.style.display = 'block';
            modalFileInput.value = ''; // Limpiar el input
        }
    }
}

// --- Funciones para Drag and Drop ---
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '#3498db'; // Cambiar color del borde
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '#ccc'; // Restaurar color del borde
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '#ccc';

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
        modalFileInput.files = files; // Asignar archivos al input para que 'change' se dispare
        const changeEvent = new Event('change', { bubbles: true });
        modalFileInput.dispatchEvent(changeEvent);
    }
}
// --- Fin Funciones para Drag and Drop ---


/**
 * Maneja el envío del formulario (subida de imagen y metadatos).
 * @param {Event} event - El evento de envío del formulario.
 */
async function handleFormSubmit(event) {
    event.preventDefault(); // Evitar el envío tradicional del formulario

    const formData = new FormData(modalForm);
    const file = modalFileInput.files[0];

    if (!file) {
        alert(t('modal.noFileSelectedError')); // Traducir: "Por favor, selecciona una imagen para subir."
        return;
    }
    // formData ya contiene los campos del formulario (caption, author, etc.)
    // El input de archivo no se añade automáticamente a FormData si está oculto y
    // no tiene nombre, o si se pobló mediante drag & drop sin pasarlo explícitamente.
    // Aunque modalFileInput.files = files; en handleDrop y 'change' debería cubrirlo.
    // Para estar seguros, podemos añadirlo explícitamente si es necesario,
    // pero usualmente FormData(formElement) recoge los inputs con 'name'.

    // Asegurarse de que el archivo está en el FormData
    // Si modalFileInput tiene un 'name' (ej. name="imageFile"), FormData lo recogerá.
    // Si no, hay que añadirlo: formData.append('imageFile', file, file.name);
    // Revisando tu HTML, el <input type="file" id="modal-file-input"> no tiene atributo "name".
    // Vamos a añadirlo al FormData explícitamente.
    formData.append('uploaded_image', file, file.name);


    console.log('[MetadataUploadModal] Enviando formulario...');
    // Aquí iría la lógica para enviar formData al servidor (tu script PHP de subida)
    // Ejemplo:
    try {
        // Suponiendo que tienes una función api.uploadFileWithMetadata en apiService.js
        // const response = await api.uploadFileWithMetadata(formData);

        // --- Placeholder para la llamada a la API ---
        console.log('FormData a enviar:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        alert('Simulación: Archivo y metadatos enviados. Reemplazar con llamada real a la API.');
        // --- Fin Placeholder ---

        // if (response.success) {
        //     alert(t('modal.uploadSuccess')); // Traducir: "¡Archivo subido con éxito!"
        //     closeMetadataModal();
        //     // Aquí deberías refrescar la vista de archivos para mostrar el nuevo archivo
        //     // Por ejemplo, llamando a loadFiles(config.currentPath) o una función similar
        // } else {
        //     alert(t('modal.uploadError') + ': ' + (response.message || 'Error desconocido'));
        // }
    } catch (error) {
        console.error('[MetadataUploadModal] Error al subir archivo:', error);
        alert(t('modal.uploadError') + ': ' + error.message);
    }
}

// Para pruebas, podrías añadir un botón en algún lugar de tu UI principal que llame a openMetadataModal().
// Ejemplo: document.getElementById('boton-abrir-modal-subida').addEventListener('click', openMetadataModal); 