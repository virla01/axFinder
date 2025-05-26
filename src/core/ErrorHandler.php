<?php
declare(strict_types=1);

// Por ahora, un manejador de errores muy simple.
// En el futuro, se puede expandir para registrar errores en archivos, enviar notificaciones, etc.

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        // Este código de error no está incluido en error_reporting
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function (Throwable $exception) {
    error_log(
        'Uncaught Exception: ' . $exception->getMessage() .
        ' in ' . $exception->getFile() . ':' . $exception->getLine() .
        "\nStack trace:\n" . $exception->getTraceAsString()
    );

    // No envíes detalles del error al cliente en producción por seguridad.
    // En desarrollo, podrías mostrar más información.
    if (defined('APP_ENV') && APP_ENV === 'development') {
        http_response_code(500);
        echo "<h1>Error Inesperado</h1>";
        echo "<p>Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo más tarde.</p>";
        echo "<p>Detalles (solo desarrollo):<br><pre>";
        echo htmlspecialchars($exception->getMessage()) . "\n";
        echo "En: " . htmlspecialchars($exception->getFile()) . ":" . $exception->getLine() . "\n";
        echo "Stack trace:\n" . htmlspecialchars($exception->getTraceAsString());
        echo "</pre></p>";
    } else {
        http_response_code(500);
        // Considera usar ResponseHandler aquí si ya está disponible y es seguro hacerlo.
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor.']);
    }
    exit;
});

// Definir APP_ENV en tu config.php o al inicio de tu script principal (files.php)
// Ejemplo: define('APP_ENV', 'development'); // o 'production'