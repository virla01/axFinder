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

// INICIO DE FUNCIONES A AÑADIR/ASEGURAR QUE EXISTEN AQUÍ

/**
 * Valida y construye una ruta segura dentro del directorio base de almacenamiento.
 *
 * @param string $baseDir El directorio base absoluto y resuelto.
 * @param string $relativePath La ruta relativa proporcionada por el cliente.
 * @param bool $checkExists Opcional. Si es true, verifica que la ruta final exista.
 * @param bool $isFile Opcional. Si es true y $checkExists es true, verifica que sea un archivo. Si es false y $checkExists es true, verifica que sea un directorio.
 * @return string|false La ruta absoluta segura y resuelta, o false si la validación falla.
 */
function getSafePath(string $baseDir, string $relativePath, bool $checkExists = false, bool $isFile = false): string|false {
    // Normalizar slashes y limpiar la ruta relativa
    $normalizedPath = str_replace('\\', '/', $relativePath);
    $normalizedPath = trim($normalizedPath, '/'); // Quitar slashes al inicio y final

    // Evitar que la ruta salga del directorio base (path traversal)
    if (strpos($normalizedPath, '..') !== false) {
        error_log("[getSafePath] Intento de Path Traversal detectado (uso de '..'): $relativePath");
        return false;
    }

    // Construir la ruta completa
    $fullPath = rtrim($baseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $normalizedPath;
    if ($normalizedPath === '' || $normalizedPath === '.') { // Si relativePath es vacía o '.', la ruta es solo baseDir
        $fullPath = $baseDir;
    }

    // Resolver la ruta a su forma canónica (absoluta)
    $realFullPath = realpath($fullPath);

    if ($realFullPath === false) {
        if ($checkExists) {
            error_log("[getSafePath] La ruta no existe y se esperaba que existiera: $fullPath");
            return false;
        }
        $parentDir = dirname($fullPath);
        if (realpath($parentDir) === false || strpos(realpath($parentDir), $baseDir) !== 0) {
            error_log("[getSafePath] El directorio padre para la nueva ruta no es válido o está fuera del base: $parentDir (base: $baseDir)");
            return false;
        }
        if (strpos($fullPath, $baseDir) !== 0 && $fullPath !== $baseDir) { // Añadida comprobación $fullPath !== $baseDir
            error_log("[getSafePath] La ruta intencionada (sin resolver) está fuera del directorio base: $fullPath (base: $baseDir)");
            return false;
        }
        $finalPath = $fullPath; 
    } else {
        if (strpos($realFullPath, $baseDir) !== 0) {
            error_log("[getSafePath] Path Traversal detectado. Ruta resuelta ($realFullPath) fuera de la base ($baseDir). Original: $relativePath");
            return false;
        }
        $finalPath = $realFullPath;
    }
    
    if ($checkExists) {
        if ($isFile) {
            if (!is_file($finalPath)) {
                error_log("[getSafePath] Se esperaba un archivo, pero no se encontró o es un directorio: $finalPath");
                return false;
            }
        } else { 
            if (!is_dir($finalPath)) {
                error_log("[getSafePath] Se esperaba un directorio, pero no se encontró o es un archivo: $finalPath");
                return false;
            }
        }
    }
    return $finalPath;
}

/**
 * Maneja la subida de archivos y la creación de metadatos.
 */
function handleUpload(string $baseDir): void {
    error_log("[handleUpload] Iniciando subida...");
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        ResponseHandler::error('Método no permitido.', 405);
        return;
    }

    $currentPath = $_POST['currentPath'] ?? '';
    error_log("[handleUpload] currentPath recibido: " . print_r($currentPath, true));

    $uploadDirRelative = $currentPath;
    if (empty($uploadDirRelative) || $uploadDirRelative === '.') {
        $uploadDirRelative = ''; 
    }
    
    // true para checkExists, false para isFile (esperamos un directorio)
    $destinationDirectory = getSafePath($baseDir, $uploadDirRelative, true, false); 

    if ($destinationDirectory === false) {
        // Log adicional para entender por qué getSafePath falló
        error_log("[handleUpload] getSafePath falló para baseDir: '$baseDir', uploadDirRelative: '$uploadDirRelative'");
        ResponseHandler::error("Ruta de destino inválida o no accesible para la subida: '$uploadDirRelative'", 400);
        return;
    }
    error_log("[handleUpload] Directorio de destino validado: $destinationDirectory");

    // Crear/verificar el subdirectorio .meta
    $metaDir = rtrim($destinationDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.meta';
    if (!is_dir($metaDir)) {
        if (!mkdir($metaDir, 0755, true)) { // 0755 permisos, true para creación recursiva
            error_log("[handleUpload] Error al crear el directorio de metadatos: $metaDir");
            ResponseHandler::error('Error interno del servidor al preparar el almacenamiento de metadatos.', 500);
            return;
        }
        error_log("[handleUpload] Directorio de metadatos creado: $metaDir");
    }

    if (!isset($_FILES['uploaded_image'])) {
        ResponseHandler::error('No se recibió ningún archivo (campo "uploaded_image" esperado).', 400);
        return;
    }

    $file = $_FILES['uploaded_image'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE   => "El archivo excede la directiva upload_max_filesize en php.ini.",
            UPLOAD_ERR_FORM_SIZE  => "El archivo excede la directiva MAX_FILE_SIZE especificada en el formulario HTML.",
            UPLOAD_ERR_PARTIAL    => "El archivo se subió solo parcialmente.",
            UPLOAD_ERR_NO_FILE    => "No se subió ningún archivo.",
            UPLOAD_ERR_NO_TMP_DIR => "Falta la carpeta temporal del servidor.",
            UPLOAD_ERR_CANT_WRITE => "No se pudo escribir el archivo en el disco del servidor.",
            UPLOAD_ERR_EXTENSION  => "Una extensión de PHP detuvo la subida del archivo.",
        ];
        $errorMessage = $uploadErrors[$file['error']] ?? "Error desconocido al subir el archivo.";
        ResponseHandler::error($errorMessage, 500);
        return;
    }

    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $allowedMimeTypes)) {
        ResponseHandler::error("Tipo de archivo no permitido: $mimeType. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP, BMP).", 415);
        return;
    }

    $fileName = basename($file['name']);
    $fileName = preg_replace("/[^a-zA-Z0-9._-]/", "_", $fileName); // Sanitizar nombre
    if (empty($fileName)) { // Si el nombre del archivo queda vacío después de sanitizar
        $fileName = "uploaded_image_" . time(); // Nombre genérico
    }

    $destinationFile = rtrim($destinationDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName;
    // Ajustar la ruta del archivo de metadatos
    $metadataFile = rtrim($metaDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName . '.meta.json';
    
    // Verificar si el archivo ya existe (opcional, decide cómo manejarlo)
    // if (file_exists($destinationFile)) {
    //     ResponseHandler::error("El archivo '$fileName' ya existe en el destino.", 409); // 409 Conflict
    //     return;
    // }

    error_log("[handleUpload] Intentando mover de {$file['tmp_name']} a $destinationFile");
    if (move_uploaded_file($file['tmp_name'], $destinationFile)) {
        $metadata = [];
        $metadataFields = ['caption', 'author', 'publishDate', 'source', 'tags', 'keywords'];
        foreach ($metadataFields as $field) {
            if (isset($_POST[$field])) {
                $metadata[$field] = $_POST[$field];
            }
        }
        if (file_put_contents($metadataFile, json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            error_log("[handleUpload] Archivo y metadatos guardados exitosamente: $destinationFile");
            ResponseHandler::json(['success' => true, 'message' => 'Archivo y metadatos subidos con éxito.', 'filePath' => ($uploadDirRelative ? $uploadDirRelative . '/' : '') . $fileName]);
        } else {
            error_log("[handleUpload] Archivo subido pero error al guardar metadatos para: $metadataFile");
            // unlink($destinationFile); // Considera eliminar el archivo si los metadatos fallan
            ResponseHandler::error('Archivo subido, pero error al guardar los metadatos.', 500);
        }
    } else {
        error_log("[handleUpload] Error al mover el archivo subido a $destinationFile. Verificar permisos en destino y carpeta temporal PHP. Origen: {$file['tmp_name']}. Código de error del archivo: {$file['error']}");
        ResponseHandler::error('Error al guardar el archivo subido en el servidor.', 500);
    }
}

/**
 * Maneja la actualización de metadatos de una imagen existente.
 */
function handleUpdateMetadata(string $baseDir): void {
    error_log("[handleUpdateMetadata] Iniciando actualización de metadatos...");
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        ResponseHandler::error('Método no permitido.', 405);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        ResponseHandler::error('Error en el JSON de entrada para actualizar metadatos: ' . json_last_error_msg(), 400);
        return;
    }

    $relativePath = $input['path'] ?? null;
    $metadata = $input['metadata'] ?? null;

    if (empty($relativePath) || !is_array($metadata)) {
        ResponseHandler::error('Faltan datos para actualizar metadatos: se requiere "path" (string) y "metadata" (object).', 400);
        return;
    }
    
    // true para checkExists, true para isFile (esperamos un archivo de imagen)
    $imageFilePath = getSafePath($baseDir, $relativePath, true, true); 

    if ($imageFilePath === false) {
        error_log("[handleUpdateMetadata] getSafePath falló para baseDir: '$baseDir', relativePath: '$relativePath'");
        ResponseHandler::error("Archivo no encontrado o ruta inválida para actualizar metadatos: '$relativePath'", 404);
        return;
    }
    error_log("[handleUpdateMetadata] Ruta de imagen validada: $imageFilePath");

    // Determinar la ruta del archivo de metadatos en el subdirectorio .meta
    $imageDir = dirname($imageFilePath);
    $imageFileName = basename($imageFilePath);
    $metaDir = rtrim($imageDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.meta';
    
     if (!is_dir($metaDir)) {
        error_log("[handleUpdateMetadata] Advertencia: El directorio de metadatos $metaDir no existe para la imagen $imageFilePath. Se intentará crear.");
        if (!mkdir($metaDir, 0755, true)) {
            error_log("[handleUpdateMetadata] Error al crear el directorio de metadatos que faltaba: $metaDir");
        }
    }

    $metadataFilePath = rtrim($metaDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $imageFileName . '.meta.json';

    if (file_put_contents($metadataFilePath, json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        error_log("[handleUpdateMetadata] Metadatos actualizados exitosamente para: $metadataFilePath");
        ResponseHandler::json(['success' => true, 'message' => 'Metadatos actualizados con éxito.']);
    } else {
        error_log("[handleUpdateMetadata] Error al guardar metadatos actualizados en: $metadataFilePath");
        ResponseHandler::error('Error al guardar los metadatos actualizados en el servidor.', 500);
    }
}

// FIN DE FUNCIONES A AÑADIR/ASEGURAR QUE EXISTEN AQUÍ

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
    } elseif ($action === 'get_config') {
        global $axFinderConfig; // Asegurar que $axFinderConfig es accesible
        if (isset($axFinderConfig['general']['defaultViewMode'])) {
            ResponseHandler::json(['success' => true, 'config' => ['defaultViewMode' => $axFinderConfig['general']['defaultViewMode']]]);
        } else {
            error_log("[get_config] Error: defaultViewMode no encontrado en la configuración general.");
            ResponseHandler::error('Configuración de vista por defecto no encontrada en el servidor.', 500);
        }
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
                    $hasSubfolders = false;
                    // Check if the folder has any subdirectories
                    $subItems = scandir($itemFullPath);
                    if ($subItems !== false) {
                        foreach ($subItems as $subItem) {
                            if ($subItem === '.' || $subItem === '..') {
                                continue;
                            }
                            if (is_dir($itemFullPath . DIRECTORY_SEPARATOR . $subItem)) {
                                $hasSubfolders = true;
                                break;
                            }
                        }
                    }
                    $folders[] = [
                        'name' => $item,
                        'type' => 'folder',
                        'path' => !empty($currentPath) ? $currentPath . '/' . $item : $item,
                        'icon' => $iconSvg,
                        'hasSubfolders' => $hasSubfolders
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
        $sortBy = $_GET['sort_by'] ?? 'name'; // Obtener parámetro sort_by, default 'name'
        $sortOrder = strtolower($_GET['sort_order'] ?? 'asc'); // Obtener parámetro sort_order, default 'asc'

        // Validar sortOrder para que sea solo 'asc' o 'desc'
        if ($sortOrder !== 'asc' && $sortOrder !== 'desc') {
            $sortOrder = 'asc';
        }
        
        // Log para depurar los parámetros de ordenación recibidos
        error_log("[list_files] Parámetros de ordenación recibidos - sortBy: {$sortBy}, sortOrder: {$sortOrder}");

        if (!$folderName) {
            ResponseHandler::error('Nombre de carpeta no proporcionado.', 400);
            exit;
        }

        $targetDir = $baseDir; // Por defecto, escanear el baseDir

        // Si el folderName no es 'storage' (que ya es el baseDir), entonces construir la ruta completa.
        if ($folderName !== 'storage') {
            $targetDir = $baseDir . DIRECTORY_SEPARATOR . $folderName;
        }

        if (strpos($folderName, '..') !== false ||
            realpath($targetDir) === false ||
            strpos(realpath($targetDir), realpath($baseDir)) !== 0
           ) {
            error_log("[list_files] Intento de Path Traversal detectado o nombre de carpeta inválido: $folderName");
            ResponseHandler::error('Nombre de carpeta inválido.', 400);
            exit;
        }

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

        function formatFileSize(int $bytes): string {
            $units = ['B', 'KB', 'MB', 'GB', 'TB'];
            $i = 0;
            while ($bytes >= 1024 && $i < count($units) - 1) {
                $bytes /= 1024;
                $i++;
            }
            return round($bytes, 2) . ' ' . $units[$i];
        }

        // Array para mapear frontend sortBy a claves reales de $fileData (y tipo de dato para comparación)
        $sortKeyMap = [
            'name' => ['key' => 'name', 'type' => 'string'],
            'size' => ['key' => 'size_bytes', 'type' => 'numeric'], // Necesitaremos 'size_bytes'
            'mtime' => ['key' => 'mtime', 'type' => 'numeric'],
            'type' => ['key' => 'name', 'type' => 'string'] // Ordenar por extensión (parte del nombre) o añadir una clave 'extension'? Por ahora nombre.
                                                            // Si se quiere ordenar realmente por TIPO (ej. .png antes de .jpg), se necesitará extraer la extensión.
        ];

        // Validar sortBy contra las claves permitidas
        if (!array_key_exists($sortBy, $sortKeyMap)) {
            $sortBy = 'name'; // Default a 'name' si no es válido
        }

        $actualSortKey = $sortKeyMap[$sortBy]['key'];
        $sortType = $sortKeyMap[$sortBy]['type'];

        foreach ($scannedItems as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $itemPath = $targetDir . DIRECTORY_SEPARATOR . $item;
            if (is_file($itemPath)) {
                $iconSvg = $axFinderConfig['icons']['defaultFile'] ?? '';
                $timestamp = filemtime($itemPath);
                $fileSizeBytes = filesize($itemPath); // Obtener tamaño en bytes para ordenar

                $fileData = [
                    'name' => $item,
                    'type' => 'file',
                    'size' => formatFileSize($fileSizeBytes),
                    'size_bytes' => $fileSizeBytes, // Añadir para la ordenación numérica
                    'icon' => $iconSvg,
                    'mtime' => $timestamp,
                ];

                $extension = strtolower(pathinfo($item, PATHINFO_EXTENSION));
                $imageBasePath = $axFinderConfig['general']['imageBasePath'] ?? './storage/';
                if (substr($imageBasePath, -1) !== '/') {
                    $imageBasePath .= '/';
                }

                $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                if (in_array($extension, $imageExtensions)) {
                    $fileData['type'] = 'image'; // Marcar explícitamente como tipo imagen para el frontend
                    $imageRelativePath = $folderName ? $folderName . '/' . rawurlencode($item) : rawurlencode($item);
                    if ($folderName === 'storage') { // Si folderName es literalmente 'storage', significa que estamos en la raíz de baseDir
                        $imageRelativePath = rawurlencode($item);
                    }
                    $fileData['imageUrl'] = $imageBasePath . $imageRelativePath;

                    // --- NUEVA LÓGICA PARA CARGAR METADATOS ---
                    $metaDir = rtrim($targetDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.meta';
                    $metadataFilePath = rtrim($metaDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $item . '.meta.json';
                    
                    error_log("[list_files] Buscando metadatos para $item en: $metadataFilePath");

                    if (is_file($metadataFilePath) && is_readable($metadataFilePath)) {
                        $metadataJson = file_get_contents($metadataFilePath);
                        $metadata = json_decode($metadataJson, true);
                        if (json_last_error() === JSON_ERROR_NONE) {
                            $fileData['metadata'] = $metadata;
                            error_log("[list_files] Metadatos cargados para $item: " . print_r($metadata, true));
                        } else {
                            error_log("[list_files] Error al decodificar JSON de metadatos para $item de $metadataFilePath: " . json_last_error_msg());
                            $fileData['metadata'] = null; 
                        }
                    } else {
                        error_log("[list_files] Archivo de metadatos no encontrado o no legible para $item en $metadataFilePath");
                        $fileData['metadata'] = null; 
                    }
                    // --- FIN DE NUEVA LÓGICA ---
                }
                $items[] = $fileData;
            }
        }

        // Lógica de ordenación
        if (!empty($items)) {
            usort($items, function($a, $b) use ($actualSortKey, $sortOrder, $sortType) {
                $valA = $a[$actualSortKey];
                $valB = $b[$actualSortKey];

                if ($sortType === 'numeric') {
                    $comparison = $valA <=> $valB;
                } else { // string, o default a string
                    // Para ordenar por extensión si sortBy es 'type', necesitamos comparar extensiones
                    if ($actualSortKey === 'name' && isset($_GET['sort_by']) && $_GET['sort_by'] === 'type') { 
                        $extA = strtolower(pathinfo($a['name'], PATHINFO_EXTENSION));
                        $extB = strtolower(pathinfo($b['name'], PATHINFO_EXTENSION));
                        // Si las extensiones son iguales, ordena por nombre completo
                        if ($extA === $extB) {
                            $comparison = strnatcasecmp($a['name'], $b['name']);
                        } else {
                            $comparison = strnatcasecmp($extA, $extB);
                        }
                    } else {
                         $comparison = strnatcasecmp((string)$valA, (string)$valB); // Comparación natural insensible a mayúsculas/minúsculas
                    }
                }
                return ($sortOrder === 'asc') ? $comparison : -$comparison;
            });
        }
        error_log("[list_files] Items después de ordenar: " . print_r(array_column($items, 'name'), true));

        ResponseHandler::json(['success' => true, 'items' => $items, 'folder' => $folderName]);

    } elseif ($action === 'upload') {
        // Asegúrate que $baseDir esté definida globalmente antes de este punto.
        // Por ejemplo: $baseDir = 'E:\\WEBS\\axFinder\\storage'; O que venga de config.php
        if (!isset($baseDir) || !is_string($baseDir) || empty($baseDir)) {
            error_log("[files.php] Error crítico: \$baseDir no está definido o es inválido antes de llamar a handleUpload.");
            ResponseHandler::error("Error crítico de configuración del servidor (directorio base).", 500);
            exit;
        }
        handleUpload($baseDir);
    } elseif ($action === 'updateMetadata') {
        // Asegúrate que $baseDir esté definida globalmente.
        if (!isset($baseDir) || !is_string($baseDir) || empty($baseDir)) {
            error_log("[files.php] Error crítico: \$baseDir no está definido o es inválido antes de llamar a handleUpdateMetadata.");
            ResponseHandler::error("Error crítico de configuración del servidor (directorio base).", 500);
            exit;
        }
        handleUpdateMetadata($baseDir);
    } else {
        if (empty($action)) {
            error_log("[files.php] Error: La acción está vacía o no fue proporcionada en la URL.");
            ResponseHandler::error('Acción no especificada.', 400);
        } else {
            error_log("[files.php] Error: Acción no válida recibida: " . print_r($action, true));
            ResponseHandler::error('Acción no válida.', 400);
        }
    }
} catch (Throwable $e) {
    // Captura cualquier error o excepción no manejada previamente
    error_log("Error general en files.php: " . $e->getMessage() . " en " . $e->getFile() . ":" . $e->getLine());
    error_log("Stack trace: " . $e->getTraceAsString()); // Añadir stack trace para más detalle
    if (!headers_sent()) { // Solo enviar si no se ha enviado nada antes
        ResponseHandler::error('Ocurrió un error inesperado en el servidor. Revise los logs.', 500);
    }
    exit;
}