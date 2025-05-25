<?php

require_once __DIR__ . '/../../core/FileManager.php';
require_once __DIR__ . '/../../core/ResponseHandler.php';
require_once __DIR__ . '/../../config/config.php'; // Para $baseDir

class FilesController
{
    private $fileManager;
    private $baseDir;

    public function __construct()
    {
        global $baseDir; // Acceder a la variable global definida en config.php
        $this->baseDir = rtrim($baseDir, DIRECTORY_SEPARATOR);
        $this->fileManager = new FileManager($this->baseDir);
    }

    private function getPath($relativePath = ''): string
    {
        $path = $this->baseDir;
        if (!empty($relativePath)) {
            $path .= DIRECTORY_SEPARATOR . trim($relativePath, DIRECTORY_SEPARATOR);
        }
        // Normalizar la ruta para evitar problemas con / y \ y puntos ..
        $path = realpath($path);
        if ($path === false || strpos($path, $this->baseDir) !== 0) {
            // Si la ruta no es válida o intenta salir del directorio base, devuelve el directorio base
            // o maneja el error como prefieras.
            // Por seguridad, podríamos lanzar una excepción o devolver un error específico.
            // Aquí, por simplicidad, podríamos devolver el baseDir o una ruta inválida que falle después.
            // throw new Exception("Acceso a ruta inválida o restringida.");
            return $this->baseDir; // O manejar error
        }
        return $path;
    }

    public function getList($path = ''): void
    {
        try {
            $fullPath = $this->getPath($path);
            $files = $this->fileManager->listDirectory($fullPath);
            ResponseHandler::json(['success' => true, 'data' => $files, 'path' => $path]);
        } catch (Exception $e) {
            ResponseHandler::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function postUpload($path = ''): void
    {
        try {
            if (empty($_FILES['files'])) {
                throw new Exception('No se recibieron archivos.');
            }
            $fullPath = $this->getPath($path);
            $uploadedFiles = [];
            foreach ($_FILES['files']['tmp_name'] as $key => $tmpName) {
                if ($_FILES['files']['error'][$key] === UPLOAD_ERR_OK) {
                    $fileName = $_FILES['files']['name'][$key];
                    $this->fileManager->uploadFile($tmpName, $fullPath, $fileName);
                    $uploadedFiles[] = $fileName;
                }
            }
            ResponseHandler::json(['success' => true, 'message' => 'Archivos subidos correctamente.', 'uploaded' => $uploadedFiles]);
        } catch (Exception $e) {
            ResponseHandler::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function postCreatefolder($path = '', $name = ''): void
    {
        try {
            if (empty($name)) {
                throw new Exception('El nombre de la carpeta no puede estar vacío.');
            }
            $fullPath = $this->getPath($path);
            $this->fileManager->createDirectory($fullPath, $name);
            ResponseHandler::json(['success' => true, 'message' => 'Carpeta creada: ' . $name]);
        } catch (Exception $e) {
            ResponseHandler::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function postRename($path = '', $oldName = '', $newName = '', $type = ''): void
    {
        try {
            if (empty($oldName) || empty($newName) || empty($type)) {
                throw new Exception('Faltan parámetros para renombrar.');
            }
            $fullPath = $this->getPath($path);
            $this->fileManager->rename($fullPath, $oldName, $newName, $type);
            ResponseHandler::json(['success' => true, 'message' => "'{$oldName}' renombrado a '{$newName}'."]);
        } catch (Exception $e) {
            ResponseHandler::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function postDelete($path = '', $name = '', $type = ''): void
    {
        try {
            if (empty($name) || empty($type)) {
                throw new Exception('Faltan parámetros para eliminar.');
            }
            $fullPath = $this->getPath($path);
            $this->fileManager->delete($fullPath, $name, $type);
            ResponseHandler::json(['success' => true, 'message' => "'{$name}' eliminado correctamente."]);
        } catch (Exception $e) {
            ResponseHandler::json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getDownload($path = '', $name = ''): void
    {
        try {
            if (empty($name)) {
                throw new Exception('El nombre del archivo es requerido para la descarga.');
            }
            $fullPath = $this->getPath($path);
            $filePath = $fullPath . DIRECTORY_SEPARATOR . $name;

            if (!file_exists($filePath) || is_dir($filePath)) {
                throw new Exception('Archivo no encontrado o es un directorio.');
            }

            // Validar que el archivo está dentro del baseDir por seguridad
            if (strpos(realpath($filePath), $this->baseDir) !== 0) {
                throw new Exception('Acceso denegado al archivo.');
            }

            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($filePath));
            readfile($filePath);
            exit;
        } catch (Exception $e) {
            // No podemos enviar JSON si ya se enviaron headers, pero podemos loguear o mostrar un error simple.
            // En un caso real, se manejaría de forma más robusta.
            http_response_code(404);
            echo "Error: " . $e->getMessage();
            exit;
        }
    }
}

// --- Enrutador simple para las acciones ---
$action = $_REQUEST['action'] ?? ''; // Usar $_REQUEST para GET y POST
$path = $_REQUEST['path'] ?? '';
$name = $_REQUEST['name'] ?? '';
$oldName = $_REQUEST['oldName'] ?? '';
$newName = $_REQUEST['newName'] ?? '';
$type = $_REQUEST['type'] ?? '';

$controller = new FilesController();

switch ($action) {
    case 'list':
        $controller->getList($path);
        break;
    case 'upload':
        $controller->postUpload($path);
        break;
    case 'createfolder':
        $controller->postCreatefolder($path, $name);
        break;
    case 'rename':
        $controller->postRename($path, $oldName, $newName, $type);
        break;
    case 'delete':
        $controller->postDelete($path, $name, $type);
        break;
    case 'download':
        $controller->getDownload($path, $name);
        break;
    default:
        ResponseHandler::json(['success' => false, 'message' => 'Acción no válida.'], 400);
        break;
}

?>