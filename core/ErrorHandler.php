<?php

class ErrorHandler {

    public static function register(): void {
        // No mostrar errores directamente en producción, solo loguearlos.
        // En desarrollo, se pueden mostrar para facilitar el debug.
        global $config;
        if (isset($config['debug_mode']) && $config['debug_mode']) {
            ini_set('display_errors', '1');
            ini_set('display_startup_errors', '1');
            error_reporting(E_ALL);
        } else {
            ini_set('display_errors', '0');
            ini_set('display_startup_errors', '0');
            error_reporting(0);
            // Aquí se podría configurar un logger como Monolog para producción
            // Ejemplo: self::setupLogger();
        }

        set_error_handler([self::class, 'handleError']);
        set_exception_handler([self::class, 'handleException']);
        register_shutdown_function([self::class, 'handleShutdown']);
    }

    public static function handleError(int $errno, string $errstr, string $errfile, int $errline): bool {
        // No lanzar excepción para errores suprimidos con @
        if (!(error_reporting() & $errno)) {
            return false;
        }

        // Convertir errores a excepciones para un manejo unificado
        throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
    }

    public static function handleException(\Throwable $exception): void {
        // Limpiar cualquier salida previa
        if (ob_get_level() > 0) {
            ob_end_clean();
        }

        global $config;
        $debugInfo = null;
        if (isset($config['debug_mode']) && $config['debug_mode']) {
            $debugInfo = [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ];
        }

        // Loguear la excepción
        // error_log(sprintf("Excepción: %s en %s:%d", $exception->getMessage(), $exception->getFile(), $exception->getLine()));
        // Aquí se podría usar un logger más avanzado.

        // Enviar respuesta de error genérica
        // Si ResponseHandler está disponible y cargado
        if (class_exists('ResponseHandler')) {
            ResponseHandler::serverError('Ocurrió un error inesperado.', $debugInfo);
        } else {
            // Fallback si ResponseHandler no está disponible
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            $errorResponse = ['status' => 'error', 'message' => 'Ocurrió un error inesperado.'];
            if ($debugInfo) {
                $errorResponse['debug'] = $debugInfo;
            }
            echo json_encode($errorResponse);
        }
        exit;
    }

    public static function handleShutdown(): void {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
            // Limpiar cualquier salida previa
            if (ob_get_level() > 0) {
                ob_end_clean();
            }

            // Crear una pseudo-excepción para manejarla con handleException
            $exception = new \ErrorException($error['message'], 0, $error['type'], $error['file'], $error['line']);
            self::handleException($exception);
        }
    }

    // Ejemplo de cómo se podría configurar un logger (ej. Monolog)
    /*
    private static function setupLogger(): void {
        // global $config;
        // $logPath = $config['log_path'] ?? dirname(__DIR__) . '/logs/app.log';
        // $logger = new \Monolog\Logger('axFinder');
        // $logger->pushHandler(new \Monolog\Handler\StreamHandler($logPath, \Monolog\Logger::WARNING));
        // Aquí se podría registrar el logger para usarlo en handleException
    }
    */
}

// Registrar los manejadores de errores al incluir este archivo
ErrorHandler::register();