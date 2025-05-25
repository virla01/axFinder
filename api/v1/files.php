<?php

// Se asume que index.php ya ha incluido las clases necesarias y la configuración.
// Y que AuthHandler::requireAuth(); se llamaría en index.php o un middleware global si es necesario.

class FilesController {

    private FileManager $fileManager;
    private array $config;

    public function __construct(array $config) {
        $this->config = $config;
        $this->fileManager = new FileManager($this->config);
    }

    /**
     * GET /api/v1/files/list/{path}
     * Lista el contenido de un directorio.
     * El path es opcional y relativo al directorio de subidas.
     */
    public function getList(?string $encodedPath = null): void {
        $relativePath = '';
        if ($encodedPath) {
            $relativePath = urldecode($encodedPath);
        }
        $relativePath = trim(str_replace('..', '', $relativePath), '/\\');

        try {
            $items = $this->fileManager->listDirectory($relativePath);
            ResponseHandler::success($items);
        } catch (\InvalidArgumentException $e) {
            ResponseHandler::error($e->getMessage(), 400);
        } catch (\RuntimeException $e) {
            ResponseHandler::serverError($e->getMessage());
        } catch (\Exception $e) {
            ResponseHandler::serverError('Error inesperado al listar el directorio: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/v1/files/getall
     * Alias para listar el contenido del directorio raíz.
     */
    public function getAll(): void {
        $this->getList(null);
    }

    /**
     * POST /api/v1/files/upload
     * Sube uno o más archivos.
     * Espera los archivos en $_FILES y un campo 'destination' (opcional) en el cuerpo (form-data).
     */
    public function postUpload(): void {
        $destinationRelativePath = $_POST['destination'] ?? '';
        $destinationRelativePath = trim(str_replace('..', '', $destinationRelativePath), '/\\');

        if (empty($_FILES)) {
            ResponseHandler::error('No se recibieron archivos.', 400);
            return;
        }

        $uploadedFilesInfo = [];
        $fileErrors = []; // Renombrado para claridad

        foreach ($_FILES as $fileKey => $fileData) {
            if (is_array($fileData['name'])) { // Manejo de input name="files[]"
                for ($i = 0; $i < count($fileData['name']); $i++) {
                    if ($fileData['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
                    $singleFileData = [
                        'name' => $fileData['name'][$i],
                        'type' => $fileData['type'][$i],
                        'tmp_name' => $fileData['tmp_name'][$i],
                        'error' => $fileData['error'][$i],
                        'size' => $fileData['size'][$i],
                    ];
                    try {
                        $result = $this->fileManager->uploadFile($singleFileData, $destinationRelativePath);
                        $uploadedFilesInfo[] = $result; // FileManager ahora devuelve info o lanza excepción
                    } catch (\InvalidArgumentException $e) {
                        $fileErrors[] = ['file' => $singleFileData['name'], 'message' => $e->getMessage(), 'code' => 400];
                    } catch (\RuntimeException $e) {
                        $fileErrors[] = ['file' => $singleFileData['name'], 'message' => $e->getMessage(), 'code' => 500];
                    } catch (\Exception $e) {
                        $fileErrors[] = ['file' => $singleFileData['name'], 'message' => 'Error inesperado al subir: ' . $e->getMessage(), 'code' => 500];
                    }
                }
            } else { // Manejo de input name="file"
                if ($fileData['error'] === UPLOAD_ERR_NO_FILE) continue;
                try {
                    $result = $this->fileManager->uploadFile($fileData, $destinationRelativePath);
                    $uploadedFilesInfo[] = $result;
                } catch (\InvalidArgumentException $e) {
                    $fileErrors[] = ['file' => $fileData['name'], 'message' => $e->getMessage(), 'code' => 400];
                } catch (\RuntimeException $e) {
                    $fileErrors[] = ['file' => $fileData['name'], 'message' => $e->getMessage(), 'code' => 500];
                } catch (\Exception $e) {
                    $fileErrors[] = ['file' => $fileData['name'], 'message' => 'Error inesperado al subir: ' . $e->getMessage(), 'code' => 500];
                }
            }
        }

        if (!empty($fileErrors) && empty($uploadedFilesInfo)) {
            // Todos los archivos fallaron
            ResponseHandler::error('Ningún archivo pudo ser subido.', 400, ['upload_errors' => $fileErrors]);
            return;
        }

        if (!empty($fileErrors) && !empty($uploadedFilesInfo)) {
            // Algunos archivos subidos, algunos fallaron
            ResponseHandler::success(['uploaded_files' => $uploadedFilesInfo, 'upload_errors' => $fileErrors], 207); // 207 Multi-Status
            return;
        }

        if (empty($uploadedFilesInfo)) {
            // No se seleccionaron archivos o todos eran UPLOAD_ERR_NO_FILE
            ResponseHandler::error('No se seleccionaron archivos válidos para subir.', 400);
            return;
        }

        ResponseHandler::success($uploadedFilesInfo, 201); // 201 Created
    }

    /**
     * POST /api/v1/files/createfolder
     * Crea una nueva carpeta.
     * Espera 'path' en el cuerpo JSON, que es la ruta relativa completa de la nueva carpeta.
     */
    public function postCreatefolder(array $data): void {
        $relativePath = $data['path'] ?? null;
        if (!$relativePath) {
            ResponseHandler::error('El parámetro "path" es requerido para crear una carpeta.', 400);
            return;
        }
        $relativePath = trim(str_replace('..', '', $relativePath), '/\\');

        try {
            $this->fileManager->createFolder($relativePath);
            ResponseHandler::success(['message' => 'Carpeta creada exitosamente.', 'path' => $relativePath], 201);
        } catch (\InvalidArgumentException $e) {
            ResponseHandler::error($e->getMessage(), 400);
        } catch (\RuntimeException $e) {
            ResponseHandler::serverError($e->getMessage());
        } catch (\Exception $e) {
            ResponseHandler::serverError('Error inesperado al crear la carpeta: ' . $e->getMessage());
        }
    }

    /**
     * DELETE /api/v1/files/delete
     * Elimina un archivo o carpeta.
     * Espera 'path' en el cuerpo JSON.
     */
    public function deleteDelete(array $data): void {
        $relativePath = $data['path'] ?? null;
        if (!$relativePath) {
            ResponseHandler::error('El parámetro "path" es requerido para eliminar.', 400);
            return;
        }
        $relativePath = trim(str_replace('..', '', $relativePath), '/\\');

        try {
            $this->fileManager->delete($relativePath);
            ResponseHandler::success(['message' => 'Elemento eliminado exitosamente.', 'path' => $relativePath]);
        } catch (\InvalidArgumentException $e) {
            ResponseHandler::error($e->getMessage(), 400);
        } catch (\RuntimeException $e) {
            ResponseHandler::serverError($e->getMessage());
        } catch (\Exception $e) {
            ResponseHandler::serverError('Error inesperado al eliminar el elemento: ' . $e->getMessage());
        }
    }

    /**
     * PUT /api/v1/files/rename
     * Renombra un archivo o carpeta.
     * Espera 'old_path' y 'new_name' en el cuerpo JSON.
     */
    public function putRename(array $data): void {
        $oldRelativePath = $data['old_path'] ?? null;
        $newRelativeName = $data['new_name'] ?? null;

        if (!$oldRelativePath || !$newRelativeName) {
            ResponseHandler::error('Los parámetros "old_path" y "new_name" son requeridos.', 400);
            return;
        }
        $oldRelativePath = trim(str_replace('..', '', $oldRelativePath), '/\\');
        $newRelativeName = basename(str_replace(['..', '/', '\\'], '', $newRelativeName));

        if(empty($newRelativeName)){
            ResponseHandler::error('El nuevo nombre no puede estar vacío o contener solo caracteres inválidos.', 400);
            return;
        }

        try {
            $newFullPath = $this->fileManager->rename($oldRelativePath, $newRelativeName);
            ResponseHandler::success(['message' => 'Elemento renombrado exitosamente.', 'old_path' => $oldRelativePath, 'new_path' => $newFullPath]);
        } catch (\InvalidArgumentException $e) {
            ResponseHandler::error($e->getMessage(), 400);
        } catch (\RuntimeException $e) {
            ResponseHandler::serverError($e->getMessage());
        } catch (\Exception $e) {
            ResponseHandler::serverError('Error inesperado al renombrar el elemento: ' . $e->getMessage());
        }
    }

    // Podríamos añadir más métodos como:
    // - getDownload(string $encodedPath) para descargar un archivo
    // - putMove(array $data) para mover archivos/carpetas
    // - getInfo(string $encodedPath) para obtener metadatos detallados de un archivo/carpeta
}