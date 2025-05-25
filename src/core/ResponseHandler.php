<?php

class ResponseHandler
{
    /**
     * Envía una respuesta JSON al cliente.
     *
     * @param mixed $data Los datos a enviar (generalmente un array asociativo).
     * @param int $statusCode El código de estado HTTP (por defecto 200).
     */
    public static function json($data, $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }
}

?>