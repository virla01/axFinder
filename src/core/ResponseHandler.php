<?php
declare(strict_types=1);

class ResponseHandler
{
    /**
     * Envía una respuesta JSON al cliente.
     *
     * @param mixed $data Los datos a enviar (serán codificados a JSON).
     * @param int $statusCode El código de estado HTTP (por defecto 200).
     */
    public static function json($data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        // Configuración CORS básica - ajústala según tus necesidades
        header('Access-Control-Allow-Origin: *'); // Permite cualquier origen (en producción, sé más específico)
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

        // Manejar solicitudes OPTIONS (preflight)
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(204); // No Content
            exit;
        }

        try {
            echo json_encode($data);
        } catch (JsonException $e) {
            // Si hay un error al codificar JSON, registra el error y envía una respuesta de error genérica.
            error_log('Error al codificar JSON en ResponseHandler: ' . $e->getMessage());
            http_response_code(500);
            // Evita llamar a json() de nuevo aquí para no causar un bucle infinito si el problema es json_encode en sí.
            echo '{"success":false,"message":"Error interno del servidor al procesar la respuesta."}';
        }
        exit;
    }

    /**
     * Envía una respuesta de error JSON.
     *
     * @param string $message El mensaje de error.
     * @param int $statusCode El código de estado HTTP (por defecto 400 Bad Request).
     * @param array|null $errors Errores adicionales o detalles de validación.
     */
    public static function error(string $message, int $statusCode = 400, ?array $errors = null): void
    {
        $responseData = ['success' => false, 'message' => $message];
        if ($errors !== null) {
            $responseData['errors'] = $errors;
        }
        self::json($responseData, $statusCode);
    }
}