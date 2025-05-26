<?php
declare(strict_types=1);

// Define el entorno de la aplicación (development o production)
// Esto debería estar idealmente en un archivo de configuración no versionado o variable de entorno del servidor.
// Para este ejemplo, lo ponemos aquí, pero considera moverlo a config.php o similar.
if (!defined('APP_ENV')) {
    define('APP_ENV', 'development'); // Cambiar a 'production' en un entorno real
}

require_once __DIR__ . '/../core/ErrorHandler.php';
require_once __DIR__ . '/../core/ResponseHandler.php';
require_once __DIR__ . '/../config/config.php'; // Carga $baseDir y otras configuraciones

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

if ($action === 'test') {
    ResponseHandler::json([
        'success' => true,
        'message' => 'El endpoint de prueba de files.php funciona correctamente.',
        'baseDir_configurado' => $baseDir,
        'app_env' => APP_ENV
    ]);
} else {
    ResponseHandler::error('Acción no válida.', 400);
}