<?php
// axFinder API - Punto de Entrada Principal

// Definir constantes básicas (ej. ruta raíz del proyecto)
define('ROOT_PATH', dirname(__DIR__));
define('DS', DIRECTORY_SEPARATOR);

// Autocarga de clases (simplificado, considera Composer para proyectos más grandes)
spl_autoload_register(function ($className) {
    $corePath = ROOT_PATH . DS . 'core' . DS . str_replace('\\', DS, $className) . '.php';
    $apiPath_v1 = ROOT_PATH . DS . 'api' . DS . 'v1' . DS . str_replace('\\', DS, $className) . '.php';

    if (file_exists($corePath)) {
        require_once $corePath;
    } elseif (file_exists($apiPath_v1)) {
        require_once $apiPath_v1;
    }
});

// Cargar configuración
if (file_exists(ROOT_PATH . DS . 'config' . DS . 'config.php')) {
    require_once ROOT_PATH . DS . 'config' . DS . 'config.php';
} else {
    // Manejo básico de error si no existe config.php
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Archivo de configuración no encontrado.']);
    exit;
}

// Routing simple (ejemplo básico, se puede expandir o usar una librería de routing)
header('Content-Type: application/json; charset=utf-8');

$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Eliminar el nombre del script base si está en la URI (ej. /axFinder/public/index.php)
$base_path = ''; // Ajustar si la app no está en la raíz del dominio
if (isset($config['base_path'])) {
    $base_path = $config['base_path'];
}

$route_path = str_replace($base_path, '', $request_uri);
$route_path = trim($route_path, '/');
$path_parts = explode('/', $route_path);

// Ejemplo de enrutamiento básico
// /api/v1/resource/action
if (isset($path_parts[0]) && $path_parts[0] === 'api' && isset($path_parts[1]) && $path_parts[1] === 'v1') {
    $resource = $path_parts[2] ?? null;
    $action_or_id = $path_parts[3] ?? null;
    $id = $path_parts[4] ?? null; // Para rutas como /api/v1/files/get/123

    $controller_file = ROOT_PATH . DS . 'api' . DS . 'v1' . DS . $resource . '.php';

    if ($resource && file_exists($controller_file)) {
        require_once $controller_file;
        $controller_class = ucfirst($resource) . 'Controller'; // Asume una convención como FilesController

        if (class_exists($controller_class)) {
            // Pasar la configuración al constructor del controlador
            $controller_instance = new $controller_class($config);
            $method_to_call = strtolower($request_method) . ucfirst($action_or_id); // ej. getList, postUpload

            // Determinar el método a llamar basado en el método HTTP y la acción
            // Esto es muy simplificado y necesitará más lógica
            $target_method = '';

            switch ($request_method) {
                case 'GET':
                    if ($action_or_id && !is_numeric($action_or_id)) { // /api/v1/files/list
                        $target_method = 'get' . ucfirst($action_or_id);
                    } elseif ($action_or_id && is_numeric($action_or_id)) { // /api/v1/files/123 (obtener por ID)
                        $target_method = 'getById';
                        $id_param = $action_or_id;
                    } else { // /api/v1/files (listar todos)
                        $target_method = 'getAll';
                    }
                    break;
                case 'POST':
                     // /api/v1/files/create o /api/v1/files/upload
                    $target_method = 'post' . ucfirst($action_or_id);
                    break;
                case 'PUT':
                    // /api/v1/files/update/123
                    $target_method = 'put' . ucfirst($action_or_id);
                    $id_param = $id;
                    break;
                case 'DELETE':
                    // /api/v1/files/delete/123
                    $target_method = 'delete' . ucfirst($action_or_id);
                    $id_param = $id;
                    break;
                default:
                    http_response_code(405); // Method Not Allowed
                    echo json_encode(['error' => 'Método no permitido']);
                    exit;
            }

            if (method_exists($controller_instance, $target_method)) {
                // Pasar parámetros (ej. ID, datos del POST)
                // Aquí se necesitaría parsear el body para POST/PUT
                $params = [];
                if (isset($id_param)) $params[] = $id_param;
                if ($request_method === 'POST' || $request_method === 'PUT') {
                    $input_data = json_decode(file_get_contents('php://input'), true);
                    if ($input_data) $params[] = $input_data;
                }
                call_user_func_array([$controller_instance, $target_method], $params);
            } else {
                http_response_code(404);
                echo json_encode(['error' => "Acción '{$target_method}' no encontrada en el recurso '{$resource}'."]);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => "Controlador para el recurso '{$resource}' no encontrado."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => "Recurso '{$resource}' no encontrado."]);
    }

} else {
    // Ruta no encontrada o no es de la API
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint no encontrado.']);
}

exit;
?>