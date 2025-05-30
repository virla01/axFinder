// axfinder.js - Punto de entrada principal para AxFinder

import { loadFolders } from './src/js/loadFolder.js';
import { loadFiles, setViewMode } from './src/js/fileDisplay.js';
import { icons, currentSortOrder } from './src/js/config.js';
import { UIElements } from './src/js/uiElements.js';
import { initializeConfigMenu } from './src/js/configMenu.js';

/**
 * Carga el template HTML principal de AxFinder y lo inyecta en el contenedor especificado.
 * @param {HTMLElement} containerElement - El elemento contenedor donde se cargará AxFinder.
 * @param {string} templatePath - La ruta al archivo de plantilla HTML.
 */
async function initializeAxFinder(containerElement, templatePath = 'src/template/ax-template.html') {
    try {
        const response = await fetch(templatePath);
        if (!response.ok) {
            throw new Error(`Error al cargar el template: ${response.status} ${response.statusText}`);
        }
        const htmlTemplate = await response.text();

        if (!containerElement) {
            console.error('El elemento contenedor no fue proporcionado o no es válido.');
            return;
        }
        containerElement.innerHTML = htmlTemplate;

        // Mantenemos el setTimeout por si acaso ayuda con el renderizado del template
        setTimeout(async () => {
            try {
                await loadFolders();
                // Intentar obtener los elementos DE NUEVO aquí, DESPUÉS de que el template se haya inyectado
                // y DESPUÉS de que loadFolders (que también podría modificar el DOM) haya terminado.

                const gridBtn = document.getElementById('grid-btn');
                const listBtn = document.getElementById('list-btn');

                if (!gridBtn || !listBtn) {
                    console.error("Botones de vista (grid-btn o list-btn) no encontrados DESPUÉS de cargar el template.");
                    // Podrías incluso intentar buscarlos de nuevo con UIElements si sospechas de UIElements
                    // console.log("Intentando con UIElements.gridButton():", UIElements.gridButton());
                    // console.log("Intentando con UIElements.listButton():", UIElements.listButton());
                } else {
                    console.log("Botones de vista encontrados. Añadiendo listeners.");
                }


                if (gridBtn) {
                    gridBtn.addEventListener('click', () => setViewMode('grid'));
                }

                if (listBtn) {
                    listBtn.addEventListener('click', () => setViewMode('list'));
                }

                // Cargar archivos iniciales y establecer vista
                await loadFiles('.', currentSortOrder.column, currentSortOrder.direction);
                console.log('AxFinder inicializado, template cargado y carpetas solicitadas.');
                setViewMode('grid'); // Establecer vista DESPUÉS de que los botones tengan listeners y los archivos iniciales se carguen

                initializeConfigMenu();

            } catch (error) {
                console.error('Error dentro del setTimeout de initializeAxFinder:', error);
            }
        }, 0);

    } catch (error) {
        console.error('Error durante la inicialización de AxFinder:', error);
        if (containerElement) {
            containerElement.innerHTML = `<p style="color: red; padding: 1rem;">Error al cargar AxFinder: ${error.message}</p>`;
        }
    }
}

// Auto-inicialización al cargar el script
document.addEventListener('DOMContentLoaded', () => {
    // Priorizar el ID 'axfinder' según las instrucciones del usuario
    let container = document.getElementById('axfinder');

    // Fallback a data-axfinder-container si 'axfinder' no existe
    if (!container) {
        container = document.querySelector('[data-axfinder-container]');
    }

    // Fallback a un elemento con el ID 'axfinder' (esto es redundante si el primero lo encuentra, pero mantenido por si acaso)
    // y para mantener la compatibilidad con versiones anteriores que pudieran buscar solo el ID.
    if (!container && document.getElementById('axfinder')) {
        console.warn("AxFinder: Se encontró un contenedor con ID 'axfinder', pero se recomienda usar el atributo 'data-axfinder-container' para mayor flexibilidad o asegurar que el ID 'axfinder' sea el principal.");
        container = document.getElementById('axfinder');
    }

    if (container) {
        console.log("AxFinder: Contenedor encontrado, inicializando AxFinder.", container);
        initializeAxFinder(container);
    } else {
        console.error("AxFinder: No se encontró ningún contenedor adecuado (ID 'axfinder' o atributo 'data-axfinder-container') para inicialización.");
    }
});

// Exportar para posible inicialización manual si es necesario
export { initializeAxFinder };