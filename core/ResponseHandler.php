<?php

class ResponseHandler {

    /**
     * Envía una respuesta JSON exitosa.
     *
     * @param mixed $data Los datos a enviar.
     * @param int $statusCode Código de estado HTTP (por defecto 200).
     */
    public static function success($data = [], int $statusCode = 200): void {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($statusCode);
        echo json_encode([
            'status' => 'success',
            'data' => $data
        ]);
        exit;
    }

    /**
     * Envía una respuesta JSON de error.
     *
     * @param string $message Mensaje de error.
     * @param int $statusCode Código de estado HTTP (por defecto 400).
     * @param array|null $errors Errores adicionales o de validación.
     */
    public static function error(string $message, int $statusCode = 400, ?array $errors = null): void {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($statusCode);
        $response = [
            'status' => 'error',
            'message' => $message
        ];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        echo json_encode($response);
        exit;
    }

    /**
     * Envía una respuesta JSON para 'No Encontrado'.
     *
     * @param string $message Mensaje personalizado (opcional).
     */
    public static function notFound(string $message = 'Recurso no encontrado.'): void {
        self::error($message, 404);
    }

    /**
     * Envía una respuesta JSON para 'No Autorizado'.
     *
     * @param string $message Mensaje personalizado (opcional).
     */
    public static function unauthorized(string $message = 'No autorizado.'): void {
        self::error($message, 401);
    }

    /**
     * Envía una respuesta JSON para 'Prohibido'.
     *
     * @param string $message Mensaje personalizado (opcional).
     */
    public static function forbidden(string $message = 'Acceso prohibido.'): void {
        self::error($message, 403);
    }

    /**
     * Envía una respuesta JSON para error de validación.
     *
     * @param array $errors Array asociativo de errores de validación.
     * @param string $message Mensaje general (opcional).
     */
    public static function validationError(array $errors, string $message = 'Error de validación.'): void {
        self::error($message, 422, $errors); // 422 Unprocessable Entity
    }

     /**
     * Envía una respuesta JSON para error interno del servidor.
     *
     * @param string $message Mensaje personalizado (opcional).
     * @param array|null $debugInfo Información de debug (solo si debug_mode está activo).
     */
    public static function serverError(string $message = 'Error interno del servidor.', ?array $debugInfo = null): void {
        global $config;
        $response = [
            'status' => 'error',
            'message' => $message
        ];
        if (isset($config['debug_mode']) && $config['debug_mode'] === true && $debugInfo !== null) {
            $response['debug'] = $debugInfo;
        }
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode($response);
        exit;
    }
}