<?php

class ErrorHandler
{
    public static function register(): void
    {
        // Mostrar todos los errores durante el desarrollo.
        // En producción, esto debería configurarse para loguear errores y no mostrarlos al usuario.
        error_reporting(E_ALL);
        ini_set('display_errors', '1'); // '0' en producción
        ini_set('log_errors', '1'); // Siempre loguear errores
        // ini_set('error_log', '/path/to/your/php-error.log'); // Especificar archivo de log en producción

        set_error_handler([self::class, 'handleError']);
        set_exception_handler([self::class, 'handleException']);
        register_shutdown_function([self::class, 'handleShutdown']);
    }

    public static function handleError($errno, $errstr, $errfile, $errline): bool
    {
        // No lanzar excepción para errores suprimidos con @
        if (!(error_reporting() & $errno)) {
            return false;
        }
        throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
    }

    public static function handleException($exception): void
    {
        // Limpiar cualquier salida previa
        if (ob_get_level() > 0) {
            ob_end_clean();
        }

        http_response_code(500); // Error interno del servidor por defecto

        // Si ResponseHandler está disponible y la excepción no ocurrió antes de su carga
        if (class_exists('ResponseHandler')) {
            ResponseHandler::json([
                'success' => false,
                'message' => 'Error interno del servidor.',
                'error' => [
                    'message' => $exception->getMessage(),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    // 'trace' => $exception->getTraceAsString() // Podría ser demasiado verboso para el cliente
                ]
            ], 500);
        } else {
            // Fallback si ResponseHandler no está disponible
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => false,
                'message' => 'Error interno del servidor: ' . $exception->getMessage()
            ]);
        }
        exit;
    }

    public static function handleShutdown(): void
    {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
            // Limpiar cualquier salida previa
            if (ob_get_level() > 0) {
                ob_end_clean();
            }
            // Crear una instancia de ErrorException para manejarla con handleException
            $exception = new \ErrorException($error['message'], 0, $error['type'], $error['file'], $error['line']);
            self::handleException($exception);
        }
    }
}

// Registrar el manejador de errores tan pronto como sea posible.
ErrorHandler::register();

?>