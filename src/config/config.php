<?php
if (!defined('APP_ENV')) {
    define('APP_ENV', 'development');
}
$baseDir = 'E:\WEBS\axFinder\storage';

$axFinderConfig = [
    'general' => [
        'defaultViewMode' => 'grid', // 'grid' o 'list'
        'language' => 'es',          // Idioma por defecto (ej. 'en', 'es')
        'availableLanguages' => ['en', 'es'], // Idiomas disponibles con archivos JSON correspondientes
        'translations' => [],        // Almacenará las traducciones cargadas, inicializar como array vacío
        'maxUploadSize' => 10,       // Tamaño máximo de subida en MB
        'allowedFileTypes' => ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
        'rootPath' => '',           // Ruta raíz para la navegación
        'imageBasePath' => './storage/', // Usado para construir URLs de imágenes si es necesario
    ],
    'images' => [
        'createThumbnails' => true,  // Crear miniaturas automáticamente
        'optimizeImages' => true,    // Optimizar imágenes al subir
        'thumbnailSize' => 200,      // Tamaño de las miniaturas en píxeles
        'defaultWatermark' => '',    // Marca de agua por defecto
    ],
    'icons' => [
        'folderOpen' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M69.08 271.63L0 390.05V112a48 48 0 0 1 48-48h160l64 64h160a48 48 0 0 1 48 48v48H152a96.31 96.31 0 0 0-82.92 47.63z" class="ax-secondary"/><path d="M152 256h400a24 24 0 0 1 20.73 36.09l-72.46 124.16A64 64 0 0 1 445 448H45a24 24 0 0 1-20.73-36.09l72.45-124.16A64 64 0 0 1 152 256z" class="ax-primary"/></svg>',
        'folderClosed' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class="ax-secondary"/></svg>',
        'defaultFile' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="w-auto h-5"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M256 0H24A23.94 23.94 0 0 0 0 23.88V488a23.94 23.94 0 0 0 23.88 24H360a23.94 23.94 0 0 0 24-23.88V128H272a16 16 0 0 1-16-16z" class="ax-secondary"/><path d="M384 121.9v6.1H272a16 16 0 0 1-16-16V0h6.1a24 24 0 0 1 17 7l97.9 98a23.9 23.9 0 0 1 7 16.9z" class="ax-primary"/></svg>',
        // Iconos específicos para carpetas por nombre
        'Fotos' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M384 128H272a16 16 0 0 1-16-16V0H24A23.94 23.94 0 0 0 0 23.88V488a23.94 23.94 0 0 0 23.88 24H360a23.94 23.94 0 0 0 24-23.88V128zm-271.46 48a48 48 0 1 1-48 48 48 48 0 0 1 48-48zm208 240h-256l.46-48.48L104.51 328c4.69-4.69 11.8-4.2 16.49.48L160.54 368 264 264.48a12 12 0 0 1 17 0L320.54 304z" class="ax-secondary"/><path d="M377 105L279.1 7a24 24 0 0 0-17-7H256v112a16 16 0 0 0 16 16h112v-6.1a23.9 23.9 0 0 0-7-16.9zM112.54 272a48 48 0 1 0-48-48 48 48 0 0 0 48 48zM264 264.45L160.54 368 121 328.48c-4.69-4.68-11.8-5.17-16.49-.48L65 367.52 64.54 416h256V304L281 264.48a12 12 0 0 0-17-.03z" class="ax-primary"/></svg>',
        'Videos' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M384 128H272a16 16 0 0 1-16-16V0H24A23.94 23.94 0 0 0 0 23.88V488a23.94 23.94 0 0 0 23.88 24H360a23.94 23.94 0 0 0 24-23.88V128zm-64 264c0 21.44-25.94 32-41 17l-55-55v38a24 24 0 0 1-24 24H88a24 24 0 0 1-24-24V280a24 24 0 0 1 24-24h112a24 24 0 0 1 24 24v38.06l55-55c15-15.06 41-4.5 41 16.94z" class="ax-secondary"/><path d="M377 105L279.1 7a24 24 0 0 0-17-7H256v112a16 16 0 0 0 16 16h112v-6.1a23.9 23.9 0 0 0-7-16.9zm-98 158.06l-55 55V280a24 24 0 0 0-24-24H88a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h112a24 24 0 0 0 24-24v-38l55 55c15.06 15 41 4.44 41-17V280c0-21.44-26-32-41-16.94z" class="ax-primary"/></svg>',
        'Audios' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M384 128H272a16 16 0 0 1-16-16V0H24A23.94 23.94 0 0 0 0 23.88V488a23.94 23.94 0 0 0 23.88 24H360a23.94 23.94 0 0 0 24-23.88V128zM160 404a12 12 0 0 1-20.5 8.5L104 376H76a12 12 0 0 1-12-12v-56a12 12 0 0 1 12-12h28l35.5-36.48A12 12 0 0 1 160 268zm33.24-51.13a24.05 24.05 0 0 0 0-33.57c-22.08-22.91 12.2-56.48 34.38-33.66a72.64 72.64 0 0 1 0 100.9c-21.78 22.38-56.86-10.48-34.38-33.7zm86.2 83.66c-21.67 22.4-56.66-10.31-34.19-33.52a96.39 96.39 0 0 0 0-133.85c-22-22.81 12.22-56.32 34.19-33.51 54.08 55.87 54.08 144.94 0 200.85z" class="ax-secondary"/><path d="M377 105L279.1 7a24 24 0 0 0-17-7H256v112a16 16 0 0 0 16 16h112v-6.1a23.9 23.9 0 0 0-7-16.9zM148 256a12 12 0 0 0-8.53 3.53L104 296H76a12 12 0 0 0-12 12v56a12 12 0 0 0 12 12h28l35.5 36.48A12 12 0 0 0 160 404V268a12 12 0 0 0-12-12zm79.59 29.61c-22.18-22.82-56.46 10.75-34.38 33.66a24.05 24.05 0 0 1 0 33.57c-22.48 23.22 12.6 56.08 34.38 33.67a72.64 72.64 0 0 0 .03-100.9zm51.82-50c-22-22.81-56.16 10.7-34.19 33.51a96.39 96.39 0 0 1 0 133.85c-22.47 23.21 12.52 55.92 34.19 33.52 54.08-55.91 54.08-145 0-200.88z" class="ax-primary"/></svg>',
        'Pdfs' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zm93.8-218.9c-2.9 0-3 30.9 2 46.9 5.6-10 6.4-46.9-2-46.9zm80.2 142.1c37.1 15.8 42.8 9 42.8 9 4.1-2.7-2.5-11.9-42.8-9zm-79.9-48c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM272 128a16 16 0 0 1-16-16V0H24A23.94 23.94 0 0 0 0 23.88V488a23.94 23.94 0 0 0 23.88 24H360a23.94 23.94 0 0 0 24-23.88V128zm21.9 254.4c-16.9 0-42.3-7.7-64-19.5-24.9 4.1-53.2 14.7-79 23.2-25.4 43.8-43.2 61.8-61.1 61.8-5.5 0-15.9-3.1-21.5-10-19.1-23.5 27.4-54.1 54.5-68 .1 0 .1-.1.2-.1 12.1-21.2 29.2-58.2 40.8-85.8-8.5-32.9-13.1-58.7-8.1-77 5.4-19.7 43.1-22.6 47.8 6.8 5.4 17.6-1.7 45.7-6.2 64.2 9.4 24.8 22.7 41.6 42.7 53.8 19.3-2.5 59.7-6.4 73.6 7.2 11.5 11.4 9.5 43.4-19.7 43.4z" class="ax-secondary"/><path d="M377 105L279.1 7a24 24 0 0 0-17-7H256v112a16 16 0 0 0 16 16h112v-6.1a23.9 23.9 0 0 0-7-16.9zM240 331.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM86.1 428.1c5.8-15.7 28.2-33.9 34.9-40.2-21.7 34.8-34.9 41-34.9 40.2zm93.8-218.9c8.4 0 7.6 36.9 2 46.9-5-16-4.9-46.9-2-46.9zM151.8 366c11.1-19.4 20.7-42.5 28.4-62.7 9.6 17.4 21.8 31.2 34.5 40.8-23.9 4.7-44.6 14.9-62.9 21.9zm151.1-5.7s-5.7 6.8-42.8-9c40.3-2.9 46.9 6.3 42.8 9z" class="ax-primary"/></svg>',
        'Documentos' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M384 128H272a16 16 0 0 1-16-16V0H24A23.94 23.94 0 0 0 0 23.88V488a23.94 23.94 0 0 0 23.88 24H360a23.94 23.94 0 0 0 24-23.88V128zm-96 244a12 12 0 0 1-12 12H108a12 12 0 0 1-12-12v-8a12 12 0 0 1 12-12h168a12 12 0 0 1 12 12zm0-64a12 12 0 0 1-12 12H108a12 12 0 0 1-12-12v-8a12 12 0 0 1 12-12h168a12 12 0 0 1 12 12zm0-64a12 12 0 0 1-12 12H108a12 12 0 0 1-12-12v-8a12 12 0 0 1 12-12h168a12 12 0 0 1 12 12z" class="ax-secondary"/><path d="M377 105L279.1 7a24 24 0 0 0-17-7H256v112a16 16 0 0 0 16 16h112v-6.1a23.9 23.9 0 0 0-7-16.9zM276 352H108a12 12 0 0 0-12 12v8a12 12 0 0 0 12 12h168a12 12 0 0 0 12-12v-8a12 12 0 0 0-12-12zm0-64H108a12 12 0 0 0-12 12v8a12 12 0 0 0 12 12h168a12 12 0 0 0 12-12v-8a12 12 0 0 0-12-12zm0-64H108a12 12 0 0 0-12 12v8a12 12 0 0 0 12 12h168a12 12 0 0 0 12-12v-8a12 12 0 0 0-12-12z" class="ax-primary"/></svg>',
        'Galerias' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><defs><style>.ax-secondary{opacity:.4}</style></defs><path d="M272 128a16 16 0 0 1-16-16V0h-96v32h-32V0H24A23.94 23.94 0 0 0 0 23.88V488a23.94 23.94 0 0 0 23.88 24H360a23.94 23.94 0 0 0 24-23.88V128zM95.9 32h32v32h-32zm83.47 342.08a52.43 52.43 0 1 1-102.74-21L96 256v-32h32v-32H96v-32h32v-32H96V96h32V64h32v32h-32v32h32v32h-32v32h32v32h-32v32h22.33a12.08 12.08 0 0 1 11.8 9.7l17.3 87.7a52.54 52.54 0 0 1-.06 20.68z" class="ax-secondary"/><path d="M377 105L279.1 7a24 24 0 0 0-17-7H256v112a16 16 0 0 0 16 16h112v-6.1a23.9 23.9 0 0 0-7-16.9zM127.9 32h-32v32h32zM96 160v32h32v-32zM160 0h-32v32h32zM96 96v32h32V96zm83.43 257.4l-17.3-87.7a12.08 12.08 0 0 0-11.8-9.7H128v-32H96v32l-19.37 97.1a52.43 52.43 0 1 0 102.8.3zm-51.1 36.6c-17.9 0-32.5-12-32.5-27s14.5-27 32.4-27 32.5 12.1 32.5 27-14.5 27-32.4 27zM160 192h-32v32h32zm0-64h-32v32h32zm0-64h-32v32h32z" class="ax-primary"/></svg>',
        'chevronDown' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-auto h-4 pr-4"><path fill="currentColor" d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" class=""></path></svg>',
        'chevronRight' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" class="w-auto h-4 pr-4"><path fill="currentColor" d="M24.707 38.101L4.908 57.899c-4.686 4.686-4.686 12.284 0 16.971L185.607 256 4.908 437.13c-4.686 4.686-4.686 12.284 0 16.971L24.707 473.9c4.686 4.686 12.284 4.686 16.971 0l209.414-209.414c4.686-4.686 4.686-12.284 0-16.971L41.678 38.101c-4.687-4.687-12.285-4.687-16.971 0z" class=""></path></svg>',
    ],
    // La sección 'fileTypes' se eliminará o se modificará drásticamente ya que los iconos ahora se basan en nombres de carpeta.
    // Por ahora, la comentaremos para evitar errores, y luego decidiremos si es necesaria para otra cosa.
    /*
    'fileTypes' => [
        // Mapeo de extensiones a claves de iconos SVG (ej. 'jpg' => 'imageFile')
        // Esto necesita ser revisado según la nueva lógica de iconos por carpeta.
        'jpg' => 'imageFile',
        'jpeg' => 'imageFile',
        'png' => 'imageFile',
        'gif' => 'imageFile',
        'mp4' => 'videoFile',
        'webm' => 'videoFile',
        'mp3' => 'audioFile',
        'wav' => 'audioFile',
        'pdf' => 'pdfFile',
        'txt' => 'textFile',
        'doc' => 'docFile',
        'docx' => 'docFile',
        'xls' => 'xlsFile',
        'xlsx' => 'xlsFile',
        'zip' => 'zipFile',
        // ... más tipos de archivo
    ],
    */
    'watermark' => [
        'enabled' => true, // Poner a true para habilitar la marca de agua en las miniaturas
        'type' => 'image',  // 'image' o 'text'

        // Configuración para marca de agua de tipo 'image'
        // Asegúrate de que esta ruta sea correcta y el archivo exista.
        // Ejemplo: si config.php está en src/config y watermark.png está en la raíz en una carpeta 'assets'
    'image_path' => __DIR__ . '/../../assets/watermark.png', // Corregido para subir dos niveles

        // Configuración para marca de agua de tipo 'text'
        // 'text' => '© AxFinder ' . date('Y'),
        // 'font_path' => __DIR__ . '/../../assets/fonts/arial.ttf', // Ruta a un archivo de fuente .TTF
        // 'font_size' => 16, // Tamaño de la fuente en puntos
        // 'color' => [255, 255, 255], // Color del texto en RGB (ej. blanco)
        // 'text_background_color' => null, // Opcional: [0,0,0] para fondo negro, null para sin fondo
        // 'text_background_opacity' => 70, // Opacidad del fondo del texto (0-100) si se usa

        'opacity' => 30,        // Opacidad de la marca de agua (0=transparente, 100=opaca)
        'position' => 'center', // Opciones: 'center', 'top-center', 'bottom-center',
                                // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        'margin' => 10,         // Margen en píxeles (para posiciones de esquina y top/bottom-center)
    ],
];
