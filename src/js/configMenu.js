import { UIElements } from './uiElements.js'; // Asumimos que añadiremos los botones relevantes a UIElements

export function initializeConfigMenu() {
    const configMenuPanel = document.getElementById('config-menu');
    const closeConfigButton = document.getElementById('close-config');

    // Corregido: Usar 'config-btn' para el botón que ABRE el panel
    const openConfigButton = document.getElementById('config-btn');

    console.log("DEBUG: configMenuPanel encontrado:", configMenuPanel); // Log para ver el panel
    console.log("DEBUG: closeConfigButton encontrado:", closeConfigButton); // Log para ver el botón de cierre

    if (!configMenuPanel) {
        console.error("Panel de configuración (ID: config-menu) no encontrado.");
        return;
    }

    if (openConfigButton) {
        openConfigButton.addEventListener('click', () => {
            console.log("Abriendo menú de configuración (clic en #config-btn)...");
            if (configMenuPanel) {
                configMenuPanel.style.display = 'block';
            }
        });
    } else {
        // Esta advertencia ahora debería desaparecer si 'config-btn' existe
        console.warn("Botón para abrir el menú de configuración (ID: config-btn) no encontrado.");
    }

    if (closeConfigButton) {
        closeConfigButton.addEventListener('click', () => {
            console.log("Cerrando menú de configuración...");
            if (configMenuPanel) {
                configMenuPanel.style.display = 'none';
            }
        });
    } else {
        // Esta advertencia debería haber desaparecido antes, ya que 'close-config' está en tu HTML.
        console.warn("Botón para cerrar el menú de configuración (ID: close-config) no encontrado.");
    }

    // Aquí puedes añadir listeners para los diferentes controles de configuración más adelante
    initializeSettingControls(configMenuPanel);
}

function initializeSettingControls(configMenuElement) {
    // --- Checkboxes de visibilidad ---
    const chkShowFileName = configMenuElement.querySelector('#chkShowFileName');
    const chkShowDate = configMenuElement.querySelector('#chkShowDate');
    const chkShowFileSize = configMenuElement.querySelector('#chkShowFileSize');

    if (chkShowFileName) {
        chkShowFileName.addEventListener('change', (event) => {
            console.log('Mostrar Nombre Fichero:', event.target.checked);
            // Aquí aplicarías la lógica para mostrar/ocultar nombres de fichero
        });
    }
    // Añadir listeners similares para chkShowDate y chkShowFileSize

    // --- Radios de Vista ---
    const radioViewList = configMenuElement.querySelector('#radioViewList');
    const radioViewThumbnails = configMenuElement.querySelector('#radioViewThumbnails');
    const radioViewCompact = configMenuElement.querySelector('#radioViewCompact');

    // Ejemplo para un radio button
    if (radioViewList) {
        radioViewList.addEventListener('change', (event) => {
            if (event.target.checked) {
                console.log('Vista seleccionada:', event.target.value); // "list"
                // Aquí llamarías a setViewMode('list') o una función similar
            }
        });
    }
    // Añadir listeners para los otros radio buttons de vista (Thumbnails, Compact)

    // --- Dropdown Ordenar por ---
    const selectSortBy = configMenuElement.querySelector('#selectSortBy');
    if (selectSortBy) {
        selectSortBy.addEventListener('change', (event) => {
            console.log('Ordenar por:', event.target.value);
            // Aquí actualizarías config.currentSortOrder.column y llamarías a loadFiles
        });
    }

    // --- Radios de Orden ---
    const radioSortAsc = configMenuElement.querySelector('#radioSortAsc');
    // Añadir listener para radioSortAsc y radioSortDesc
    // Actualizar config.currentSortOrder.direction y llamar a loadFiles

    // --- Slider Tamaño de Miniatura ---
    const inputThumbnailSize = configMenuElement.querySelector('#inputThumbnailSize');
    const sliderThumbnailSize = configMenuElement.querySelector('#sliderThumbnailSize');

    if (inputThumbnailSize && sliderThumbnailSize) {
        inputThumbnailSize.addEventListener('input', (event) => {
            sliderThumbnailSize.value = event.target.value;
            console.log('Tamaño miniatura (input):', event.target.value);
            // Aplicar cambio de tamaño de miniatura
        });
        sliderThumbnailSize.addEventListener('input', (event) => {
            inputThumbnailSize.value = event.target.value;
            console.log('Tamaño miniatura (slider):', event.target.value);
            // Aplicar cambio de tamaño de miniatura
        });
    }

    // --- Radios de Tema ---
    // Añadir listeners para radioThemeLight, radioThemeDark, radioThemeSystem
    // Aplicar cambio de tema (esto usualmente implica cambiar clases en el body o contenedor principal)
}

// Podrías añadir funciones para guardar/cargar configuraciones desde localStorage si quieres persistencia 