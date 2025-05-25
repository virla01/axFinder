<?php
// axFinder - Archivo de Configuración

return [
    // Ruta base de la aplicación. Si la aplicación está en la raíz del dominio, dejar vacío ('').
    // Si está en un subdirectorio, por ejemplo http://localhost/axFinder/, entonces '/axFinder/public'.
    // Es importante que esta ruta coincida con cómo se accede a public/index.php desde el navegador,
    // excluyendo el nombre del script (index.php).
    'base_path' => '/axFinder/public', // Ajustar según sea necesario

    // Configuración del directorio de subida de archivos
    'upload_dir' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads',
    'allowed_file_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'zip'],
    'max_file_size_mb' => 10, // Tamaño máximo de archivo en Megabytes

    // Configuración de la base de datos (si se usa)
    /*
    'db' => [
        'host' => 'localhost',
        'dbname' => 'axfinder_db',
        'user' => 'root',
        'password' => '',
        'charset' => 'utf8mb4'
    ],
    */

    // Modo debug (true para desarrollo, false para producción)
    'debug_mode' => true,
];