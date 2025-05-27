<?php
declare(strict_types=1);
// Log para verificar el inicio de la ejecución del script, colocado después de strict_types
error_log("files.php - INICIO EJECUCION (después de strict_types) - " . date('Y-m-d H:i:s'));

// Define el entorno de la aplicación (development o production)
// Esto debe hacerse ANTES de incluir ErrorHandler.php, ya que este lo utiliza.
if (!defined('APP_ENV')) {
    define('APP_ENV', 'development'); // Cambiar a 'production' en un entorno real
}

require_once __DIR__ . '/../core/ResponseHandler.php';
require_once __DIR__ . '/../config/config.php'; // Carga $baseDir y otras configuraciones

// Configuración del manejo de errores PHP según el entorno
if (APP_ENV === 'production') {
    error_reporting(0);
    ini_set('display_errors', '0');
} else {
    // En desarrollo, los errores son útiles, pero nos aseguraremos de que no rompan el JSON más adelante.
    // error_reporting(E_ALL);
    // ini_set('display_errors', '1');
    // Por ahora, para asegurar JSON, incluso en dev, suprimimos la salida directa de errores.
    // Los errores se seguirán registrando si php.ini está configurado para ello.
    ini_set('display_errors', '0');
    error_reporting(E_ALL); // Reportar todos los errores para logging
}

// Establecer un manejador de errores global para capturar errores no controlados y devolver JSON
set_error_handler(function($severity, $message, $file, $line) {
    // No mostrar errores si error_reporting está desactivado (usualmente en producción)
    if (!(error_reporting() & $severity)) {
        return false;
    }
    // Registrar el error
    error_log("PHP Error: [$severity] $message in $file on line $line");
    // Si las cabeceras aún no se han enviado, intentar enviar una respuesta JSON de error.
    if (!headers_sent()) {
        ResponseHandler::error("Error interno del servidor. Consulte los logs para más detalles.", 500);
    }
    exit; // Detener la ejecución para evitar más salida HTML
});

// Establecer un manejador de excepciones global
set_exception_handler(function($exception) {
    error_log("PHP Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
    if (!headers_sent()) {
        ResponseHandler::error("Excepción interna del servidor: " . $exception->getMessage(), 500);
    }
    exit;
});

// Depuración inicial para verificar $baseDir
if (isset($baseDir)) {
    error_log("files.php (Prueba Inicial) - \$baseDir desde config.php: " . print_r($baseDir, true));
} else {
    error_log("files.php (Prueba Inicial) - \$baseDir NO ESTÁ DEFINIDO después de incluir config.php");
    // Si $baseDir no está definido, es un error crítico de configuración.
    // ResponseHandler::error podría no funcionar si hay problemas muy tempranos, así que un die() es más seguro aquí.
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Error crítico: La configuración del directorio base (baseDir) no se ha cargado.']);
    exit;
}

// Simulación de una acción para probar
$action = $_GET['action'] ?? 'test';

try {
    if ($action === 'test') {
    ResponseHandler::json([
        'success' => true,
        'message' => 'El endpoint de prueba de files.php funciona correctamente.',
        'baseDir_configurado' => $baseDir,
        'app_env' => APP_ENV
    ]);
} elseif ($action === 'list_folders') {
    $currentPath = $_GET['path'] ?? ''; // Obtener la ruta de la subcarpeta, si se proporciona

    // Validar $currentPath para evitar Path Traversal
    // Validar $currentPath para evitar Path Traversal. Se buscan '..' o cualquier barra (forward o backward)
    // y luego se verifica que la ruta resuelta sea válida y comience con $baseDir.
    if (strpos($currentPath, '..') !== false ||
        (preg_match('/(?:\\\\|\/)/', $currentPath) &&
        (realpath($baseDir . DIRECTORY_SEPARATOR . $currentPath) === false || strpos(realpath($baseDir . DIRECTORY_SEPARATOR . $currentPath), realpath($baseDir)) !== 0)
        )
    ) {
        error_log("[list_folders] Intento de Path Traversal detectado o ruta inválida: $currentPath");
        // Si contiene '..' o si es una ruta que no resuelve dentro de $baseDir
        ResponseHandler::error('Ruta de carpeta inválida.', 400);
        exit;
    }

    $directoryToScan = $baseDir;
    if (!empty($currentPath)) {
        $directoryToScan = $baseDir . DIRECTORY_SEPARATOR . $currentPath;
    }
    error_log("[list_folders] Intentando escanear: $directoryToScan"); // Log para la ruta a escanear

    if (!is_dir($directoryToScan)) {
        error_log("[list_folders] Error: '$directoryToScan' no es un directorio.");
        ResponseHandler::error('El directorio base para listar carpetas no es válido o no existe: ' . $currentPath, 500);
        exit;
    }
    if (!is_readable($directoryToScan)) {
        error_log("[list_folders] Error: '$directoryToScan' no es legible.");
        ResponseHandler::error('El directorio especificado no es legible: ' . $currentPath, 500);
        exit;
    }

    $folders = [];
    error_log("[list_folders] Preparando para escanear: $directoryToScan");

    try {
        $items = scandir($directoryToScan);
        if ($items === false) {
            error_log("[list_folders] scandir() falló para el directorio: $directoryToScan");
            ResponseHandler::error('No se pudo leer el contenido del directorio (scandir falló): ' . $currentPath, 500);
            exit;
        }
        error_log("[list_folders] scandir() completado. Items encontrados: " . count($items));

        global $axFinderConfig;
        if (!isset($axFinderConfig, $axFinderConfig['icons']) || !is_array($axFinderConfig['icons'])) {
            error_log("[list_folders] Error crítico: Configuración de iconos no válida o no encontrada.");
            ResponseHandler::error('Error de configuración interna del servidor (iconos).', 500);
            exit;
        }
        // Log para verificar las claves de iconos disponibles
        // error_log("[list_folders] Claves de iconos disponibles: " . implode(', ', array_keys($axFinderConfig['icons'])));

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            // Log para cada item procesado
            // error_log("[list_folders] Procesando item: " . print_r($item, true));

            $itemFullPath = $directoryToScan . DIRECTORY_SEPARATOR . $item;
            if (is_dir($itemFullPath)) {
                $iconSvg = $axFinderConfig['icons']['folderClosed'] ?? '<svg>fallback</svg>';
                $folders[] = [
                    'name' => $item,
                    'type' => 'folder',
                    'path' => !empty($currentPath) ? $currentPath . '/' . $item : $item,
                    'icon' => $iconSvg
                ];
            }
        }
        // Si no se encontraron carpetas, se devuelve un array vacío igualmente.
        // El frontend deberá manejar el caso de un array de carpetas vacío.
        ResponseHandler::json(['success' => true, 'folders' => $folders]);

    } catch (Throwable $e) { // Capturar Throwable para errores y excepciones
        error_log("[list_folders] Excepción capturada en el bloque de escaneo: " . $e->getMessage() . " en " . $e->getFile() . ":" . $e->getLine());
        error_log("[list_folders] Stack trace: " . $e->getTraceAsString());
        ResponseHandler::error('Error interno del servidor al procesar la lista de carpetas: ' . $e->getMessage(), 500);
        exit;
    }

} elseif ($action === 'list_files') {
    $folderName = $_GET['folder'] ?? null;

    if (!$folderName) {
        ResponseHandler::error('Nombre de carpeta no proporcionado.', 400);
        exit;
    }

    // Validar que $folderName no contenga caracteres peligrosos (ej. '..', '/', '\') para evitar Path Traversal
    // y asegurar que la ruta resuelta esté dentro de $baseDir.
    $folderPath = $baseDir . DIRECTORY_SEPARATOR . $folderName;
    // Se permite que $folderName contenga separadores de directorio ('/' o '\').
    // La validación principal se hace con realpath() para asegurar que la ruta final
    // esté dentro de $baseDir y no contenga '..'.
    if (strpos($folderName, '..') !== false || // Prevenir secuencias '..' explícitas
        realpath($folderPath) === false || // La ruta debe ser válida
        strpos(realpath($folderPath), realpath($baseDir)) !== 0 // La ruta debe estar dentro de $baseDir
       ) {
        error_log("[list_files] Intento de Path Traversal detectado o nombre de carpeta inválido: $folderName");
        ResponseHandler::error('Nombre de carpeta inválido.', 400);
        exit;
    }

    $targetDir = $baseDir . DIRECTORY_SEPARATOR . $folderName;

    if (!is_dir($targetDir) || !is_readable($targetDir)) {
        ResponseHandler::error("La carpeta '{$folderName}' no es accesible o no existe.", 404);
        exit;
    }

    $items = [];
    $scannedItems = scandir($targetDir);

    if ($scannedItems === false) {
        ResponseHandler::error("No se pudo escanear la carpeta '{$folderName}'.", 500);
        exit;
    }

    // Función para formatear el tamaño del archivo
    function formatFileSize(int $bytes): string {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }

    foreach ($scannedItems as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $itemPath = $targetDir . DIRECTORY_SEPARATOR . $item;
        // Solo procesar si es un archivo
        if (is_file($itemPath)) {
            $iconSvg = $axFinderConfig['icons']['defaultFile'] ?? ''; // Icono por defecto para archivos

            $fileData = [
                'name' => $item,
                'type' => 'file', // Solo se procesan archivos
                'size' => formatFileSize(filesize($itemPath)),
                'icon' => $iconSvg,
            ];

            $extension = strtolower(pathinfo($item, PATHINFO_EXTENSION));
            $imageBasePath = $axFinderConfig['general']['imageBasePath'] ?? './storage/';
            if (substr($imageBasePath, -1) !== '/') {
                $imageBasePath .= '/';
            }

            $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
            if (in_array($extension, $imageExtensions)) {
                $fileData['imageUrl'] = $imageBasePath . $folderName . '/' . rawurlencode($item);
            }
            $items[] = $fileData;
        }
    }
    ResponseHandler::json(['success' => true, 'items' => $items, 'folder' => $folderName]);

} elseif ($action === 'get_config') {
    // Asegurarse de que $axFinderConfig está disponible
    if (isset($axFinderConfig)) {
        ResponseHandler::json(['success' => true, 'config' => $axFinderConfig]);
    } else {
        ResponseHandler::error('La configuración de AxFinder no está disponible.', 500);
    }
    } else {
        ResponseHandler::error('Acción no válida.', 400);
    }
} catch (Throwable $e) {
    // Captura cualquier error o excepción no manejada previamente
    error_log("Error general en files.php: " . $e->getMessage() . " en " . $e->getFile() . ":" . $e->getLine());
    if (!headers_sent()) { // Solo enviar si no se ha enviado nada antes
        ResponseHandler::error('Ocurrió un error inesperado en el servidor.', 500);
    }
    exit;
}