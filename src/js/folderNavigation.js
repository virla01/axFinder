// src/js/folderNavigation.js
// Módulo para la navegación de carpetas y su visualización en el sidebar.


// Importaciones necesarias de otros módulos de AxFinder
import { loadFiles } from './fileDisplay.js';
// Importamos el objeto config completo y los iconos
import { config, icons } from './config.js';
import { UIElements } from './uiElements.js'; // Necesario para el contenedor de carpetas
import { loadFolders as loadFoldersFromLoadFolderJS } from './loadFolder.js'; // Importar la función de loadFolder.js

/**
 * Carga las carpetas iniciales en el contenedor del sidebar.
 * Esta función ahora delega completamente a la lógica de loadFolder.js.
 */
export function loadFolders(initialPath = '') {
    // LLAMADA A LA NUEVA FUNCIÓN DE CARGA DE CARPETAS
    loadFoldersFromLoadFolderJS(initialPath);
}

// Las funciones createFolderElement, toggleFolder, y updateActiveFolderSelection
// han sido eliminadas de este archivo ya que su funcionalidad ahora es manejada
// completamente por loadFolder.js para evitar duplicidad y centralizar la lógica.
// La variable currentActiveFolderElement también ha sido eliminada.