// src/js/config.js
console.log('src/js/config.js cargado');

export const fileCache = new Map();

export const currentSortOrder = {
    column: 'name', // 'name', 'size', 'date'
    direction: 'asc' // 'asc', 'desc'
};

export const config = {
    currentPath: '', // Para almacenar la ruta de la carpeta actualmente visualizada
    // Otros parámetros de configuración pueden ir aquí
};