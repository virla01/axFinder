// src/js/config.js
console.log('src/js/config.js cargado');

export const fileCache = new Map();

export const currentSortOrder = {
    column: 'name', // 'name', 'size', 'date'
    direction: 'asc' // 'asc', 'desc'
};

export const config = {
    currentPath: '', // Para almacenar la ruta de la carpeta actualmente visualizada
    apiBaseUrl: 'src/api/files.php', // URL base para las llamadas a la API
    // Otros parámetros de configuración pueden ir aquí
};

export const icons = {
    folderClosed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class="ax-secondary"/></svg>`,
    folderOpen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M69.08 271.63L0 390.05V112a48 48 0 0 1 48-48h160l64 64h160a48 48 0 0 1 48 48v48H152a96.31 96.31 0 0 0-82.92 47.63z" class="ax-secondary"/><path d="M152 256h400a24 24 0 0 1 20.73 36.09l-72.46 124.16A64 64 0 0 1 445 448H45a24 24 0 0 1-20.73-36.09l72.45-124.16A64 64 0 0 1 152 256z" class="ax-primary"/></svg>`,
    chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" class="w-auto h-3"><path fill="currentColor" d="M24.707 38.101L4.908 57.899c-4.686 4.686-4.686 12.284 0 16.971L185.607 256 4.908 437.13c-4.686 4.686-4.686 12.284 0 16.971L24.707 473.9c4.686 4.686 12.284 4.686 16.971 0l209.414-209.414c4.686-4.686 4.686-12.284 0-16.971L41.678 38.101c-4.687-4.687-12.285-4.687-16.971 0z" class=""></path></svg>`,
    chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-auto h-3"><path fill="currentColor" d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" class=""></path></svg>`
};