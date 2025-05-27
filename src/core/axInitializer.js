// src/core/axInitializer.js
import { axFinderHTML } from '../../axfinder.js';

/**
 * Inicializa AxFinder en el contenedor especificado.
 * @param {string} containerId El ID del elemento contenedor donde se cargará AxFinder.
 */
export function axInitialize(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        console.log(`[axInitializer] Contenedor '${containerId}' encontrado. Cargando AxFinder HTML.`);
        container.innerHTML = axFinderHTML;
        // Aquí se podrían inicializar otros módulos de AxFinder después de cargar el HTML principal
        // Por ejemplo: inicializar navegación de carpetas, visualización de archivos, etc.
        console.log('[axInitializer] AxFinder HTML cargado. Implementación modular lista.');
        // TODO: Llamar a inicializadores de otros módulos (folderNavigation, fileDisplay, etc.)
    } else {
        console.error(`[axInitializer] Error: Contenedor con ID '${containerId}' no encontrado en el DOM.`);
        console.error('[axInitializer] AxFinder no pudo inicializarse. Asegúrate de que el elemento exista y el ID sea correcto.');
    }
}