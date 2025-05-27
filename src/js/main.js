// src/js/main.js
console.log('src/js/main.js cargado para inicialización automática.');

// Importar la función de inicialización principal desde el nuevo módulo
import { axInitialize } from '../core/axInitializer.js';

// ID del contenedor que activará la carga automática de AxFinder.
// Este ID debe estar presente en el HTML donde se quiera cargar AxFinder automáticamente.
const AUTO_INIT_CONTAINER_ID = 'axfinder-auto-load'; // Puedes cambiar este ID si lo deseas.

/**
 * Función para inicializar AxFinder automáticamente si se encuentra el contenedor designado.
 */
function autoInitializeAxFinder() {
    const autoInitContainer = document.getElementById(AUTO_INIT_CONTAINER_ID);
    if (autoInitContainer) {
        console.log(`[Main] Contenedor '${AUTO_INIT_CONTAINER_ID}' encontrado. Inicializando AxFinder automáticamente.`);
        axInitialize(AUTO_INIT_CONTAINER_ID);
    } else {
        console.log(`[Main] Contenedor '${AUTO_INIT_CONTAINER_ID}' no encontrado. AxFinder no se inicializará automáticamente.`);
        console.log('[Main] Para inicializar AxFinder manualmente, asegúrate de que el script axfinder.js (o su bundle) se cargue y luego llama a axInitialize("ID_DEL_CONTENEDOR_MANUAL") desde tu propio script, o exporta axInitialize desde este archivo y úsalo.');
    }
}

// Escuchar al evento DOMContentLoaded para asegurar que el DOM esté listo
// antes de intentar encontrar el contenedor y inicializar AxFinder.
document.addEventListener('DOMContentLoaded', autoInitializeAxFinder);

// Opcionalmente, puedes exportar axInitialize si aún quieres permitir la inicialización manual desde otros scripts
// export { axInitialize };