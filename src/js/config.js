// src/js/config.js
console.log('src/js/config.js cargado');

export const fileCache = new Map();

// --- CLAVES LOCALSTORAGE PARA ORDENACIÓN ---
export const LS_SORT_COLUMN = 'axFinderSortColumn';
export const LS_SORT_DIRECTION = 'axFinderSortDirection';

// --- CONFIGURACIÓN DE ORDENACIÓN ---
// Obtener el orden guardado o usar valores por defecto
const savedSortColumn = localStorage.getItem(LS_SORT_COLUMN) || 'name';
const savedSortDirection = localStorage.getItem(LS_SORT_DIRECTION) || 'asc';

export let currentSortOrder = {
    column: savedSortColumn,    // 'name', 'size', 'mtime' (o la clave que use tu backend)
    direction: savedSortDirection // 'asc' o 'desc'
};

// Función para actualizar y guardar el orden de clasificación
export function setSortOrder(column, direction) {
    currentSortOrder.column = column;
    currentSortOrder.direction = direction;
    localStorage.setItem(LS_SORT_COLUMN, column);
    localStorage.setItem(LS_SORT_DIRECTION, direction);
    console.log(`[Config] Sort order set to: ${column} ${direction} and saved to localStorage.`);
}

export const config = {
    currentPath: '', // Para almacenar la ruta de la carpeta actualmente visualizada
    apiBaseUrl: 'src/api/files.php', // URL base para las llamadas a la API
    // Otros parámetros de configuración pueden ir aquí
};

export const icons = {
    folderClosed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class="ax-secondary"/></svg>`,
    folderOpen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M69.08 271.63L0 390.05V112a48 48 0 0 1 48-48h160l64 64h160a48 48 0 0 1 48 48v48H152a96.31 96.31 0 0 0-82.92 47.63z" class="ax-secondary"/><path d="M152 256h400a24 24 0 0 1 20.73 36.09l-72.46 124.16A64 64 0 0 1 445 448H45a24 24 0 0 1-20.73-36.09l72.45-124.16A64 64 0 0 1 152 256z" class="ax-primary"/></svg>`,
    chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512" class=""><path fill="currentColor" d="M187.8 264.5L41 412.5c-4.7 4.7-12.3 4.7-17 0L4.2 392.7c-4.7-4.7-4.7-12.3 0-17L122.7 256 4.2 136.3c-4.7-4.7-4.7-12.3 0-17L24 99.5c4.7-4.7 12.3-4.7 17 0l146.8 148c4.7 4.7 4.7 12.3 0 17z" class=""></path></svg>`,
    chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class=""><path fill="currentColor" d="M151.5 347.8L3.5 201c-4.7-4.7-4.7-12.3 0-17l19.8-19.8c4.7-4.7 12.3-4.7 17 0L160 282.7l119.7-118.5c4.7-4.7 12.3-4.7 17 0l19.8 19.8c4.7 4.7 4.7 12.3 0 17l-148 146.8c-4.7 4.7-12.3 4.7-17 0z" class=""></path></svg>`,
    folder: '<svg>...</svg>', // Placeholder
    file: '<svg>...</svg>',   // Placeholder
};