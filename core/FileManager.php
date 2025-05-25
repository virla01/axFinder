<?php

// Definir excepciones personalizadas para la biblioteca
class FileOperationException extends \RuntimeException {}
class FileNotFoundException extends FileOperationException {}
class PermissionDeniedException extends FileOperationException {}
class InvalidArgumentException extends \InvalidArgumentException {}
class FileExistsException extends FileOperationException {}

class FileManager {

    protected string $basePath;
    protected array $allowedFileTypes;
    protected int $maxFileSize;

    /**
     * Constructor de FileManager.
     *
     * @param string $basePath El directorio base para todas las operaciones de archivos.
     * @param array $allowedFileTypes Tipos de archivo permitidos para subida (ej: ['jpg', 'png']). Vacío para permitir todos.
     * @param int $maxFileSize Tamaño máximo de archivo en bytes.
     * @throws InvalidArgumentException Si el directorio base no existe, no se puede escribir en él o no se puede resolver su ruta real.
     */
    public function __construct(string $basePath, array $allowedFileTypes = [], int $maxFileSize = 10485760) { // 10 MB por defecto
        if (!is_dir($basePath)) {
            // Intentar crear el directorio base si no existe
            if (!mkdir($basePath, 0775, true)) {
                throw new InvalidArgumentException("El directorio base especificado no existe y no pudo ser creado: {$basePath}");
            }
        }
        if (!is_writable($basePath)) {
            throw new PermissionDeniedException("El directorio base no tiene permisos de escritura: {$basePath}");
        }

        $resolvedBasePath = realpath($basePath);
        if ($resolvedBasePath === false) {
             throw new InvalidArgumentException("No se pudo obtener la ruta real del directorio base: {$basePath}");
        }
        $this->basePath = $resolvedBasePath;
        $this->allowedFileTypes = $allowedFileTypes;
        $this->maxFileSize = $maxFileSize;
    }

    /**
     * Lista archivos y carpetas en una ruta específica.
     *
     * @param string $relativePath Ruta relativa dentro del directorio base.
     * @return array Lista de archivos y carpetas.
     * @throws FileNotFoundException Si el directorio especificado no existe.
     */
    public function listDirectory(string $relativePath = ''): array {
        $currentPath = $this->resolvePath($relativePath);
        if (!is_dir($currentPath)) {
            throw new FileNotFoundException("El directorio especificado no existe: " . $relativePath);
        }

        $items = [];
        $files = scandir($currentPath);
        if ($files === false) {
            throw new FileOperationException("No se pudo leer el contenido del directorio: " . $relativePath);
        }

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $filePath = $currentPath . DIRECTORY_SEPARATOR . $file;
            $itemRelativePath = trim($relativePath . DIRECTORY_SEPARATOR . $file, DIRECTORY_SEPARATOR);
            if ($relativePath === '') { // Si estamos en la raíz, la ruta relativa es solo el nombre del archivo/carpeta
                $itemRelativePath = $file;
            }

            $items[] = [
                'name' => $file,
                'path' => $itemRelativePath,
                'type' => is_dir($filePath) ? 'folder' : 'file',
                'size' => is_file($filePath) ? filesize($filePath) : null,
                'last_modified' => filemtime($filePath),
            ];
        }
        return $items;
    }

    /**
     * Crea una nueva carpeta.
     *
     * @param string $relativePath Ruta relativa donde crear la carpeta (incluyendo el nombre de la nueva carpeta).
     * @return bool True si se creó.
     * @throws InvalidArgumentException Si el nombre de la carpeta está vacío.
     * @throws FileExistsException Si ya existe un archivo o carpeta con ese nombre.
     * @throws FileOperationException Si no se pudo crear la carpeta.
     */
    public function createFolder(string $relativePath): bool {
        $trimmedRelativePath = trim($relativePath);
        if (empty($trimmedRelativePath)) {
            throw new InvalidArgumentException('El nombre de la carpeta no puede estar vacío.');
        }
        $newFolderPath = $this->resolvePath($trimmedRelativePath);

        if (file_exists($newFolderPath)) {
            throw new FileExistsException("Ya existe un archivo o carpeta con ese nombre: " . $trimmedRelativePath);
        }

        if (mkdir($newFolderPath, 0775, true)) {
            return true;
        }
        throw new FileOperationException("No se pudo crear la carpeta: " . $trimmedRelativePath);
    }

    /**
     * Elimina un archivo o carpeta (recursivamente para carpetas).
     *
     * @param string $relativePath Ruta relativa del archivo o carpeta a eliminar.
     * @return bool True si se eliminó.
     * @throws FileNotFoundException Si el archivo o carpeta no existe.
     * @throws FileOperationException Si ocurre un error durante la eliminación.
     */
    public function delete(string $relativePath): bool {
        $pathToDelete = $this->resolvePath($relativePath);

        if (!file_exists($pathToDelete)) {
            throw new FileNotFoundException("El archivo o carpeta no existe: " . $relativePath);
        }

        try {
            if (is_dir($pathToDelete)) {
                return $this->deleteDirectoryRecursive($pathToDelete);
            } elseif (is_file($pathToDelete)) {
                if (unlink($pathToDelete)) {
                    return true;
                }
            }
        } catch (\Exception $e) {
            throw new FileOperationException("Error al eliminar '{$relativePath}': " . $e->getMessage(), 0, $e);
        }
        throw new FileOperationException("No se pudo eliminar el elemento: " . $relativePath);
    }

    protected function deleteDirectoryRecursive(string $dirPath): bool {
        if (!is_dir($dirPath)) {
            // Esto no debería ocurrir si la llamada viene de delete() que ya verifica la existencia.
            throw new FileNotFoundException("Intentando eliminar recursivamente un directorio no existente: " . $dirPath);
        }
        $items = scandir($dirPath);
        if ($items === false) {
            throw new FileOperationException("No se pudo leer el directorio para eliminación recursiva: " . $dirPath);
        }
        $items = array_diff($items, ['.', '..']);
        foreach ($items as $item) {
            $itemPath = $dirPath . DIRECTORY_SEPARATOR . $item;
            if (is_dir($itemPath)) {
                $this->deleteDirectoryRecursive($itemPath);
            } else {
                if (!unlink($itemPath)) {
                    throw new FileOperationException("No se pudo eliminar el archivo durante la eliminación recursiva: " . $itemPath);
                }
            }
        }
        if (!rmdir($dirPath)){
            throw new FileOperationException("No se pudo eliminar el directorio: " . $dirPath);
        }
        return true;
    }

    /**
     * Sube un archivo.
     *
     * @param array $fileData Datos del archivo de $_FILES (debe contener error, tmp_name, name, size).
     * @param string $destinationRelativePath Ruta relativa de destino (directorio).
     * @return array Información del archivo subido.
     * @throws PermissionDeniedException Si el directorio de destino no es válido o no tiene permisos.
     * @throws InvalidArgumentException Si la información del archivo es inválida.
     * @throws FileOperationException Por errores de subida (tipo, tamaño, error al mover).
     */
    public function uploadFile(array $fileData, string $destinationRelativePath = ''): array {
        $destinationPath = $this->resolvePath($destinationRelativePath);

        if (!is_dir($destinationPath) || !is_writable($destinationPath)) {
            throw new PermissionDeniedException('El directorio de destino no es válido o no tiene permisos de escritura: ' . $destinationRelativePath);
        }

        if (!isset($fileData['error']) || !isset($fileData['tmp_name']) || !isset($fileData['name']) || !isset($fileData['size'])){
            throw new InvalidArgumentException('La información del archivo proporcionada es inválida. Faltan claves esperadas (error, tmp_name, name, size).');
        }

        if ($fileData['error'] !== UPLOAD_ERR_OK) {
            throw new FileOperationException($this->getUploadErrorMessage($fileData['error']));
        }

        $fileName = basename($fileData['name']);
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION)); // Conservar para la generación de safeFileName y otros usos potenciales
        $fileSize = $fileData['size'];

        // Validación de tipo MIME más estricta
        if (!empty($this->allowedFileTypes)) {
            $detectedMimeType = null;
            // Priorizar finfo para la detección de tipo MIME
            if (function_exists('finfo_open')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                // Asegurarse de que tmp_name es válido y existe antes de pasarlo a finfo_file
                if ($finfo && !empty($fileData['tmp_name']) && file_exists($fileData['tmp_name'])) {
                    $detectedMimeType = finfo_file($finfo, $fileData['tmp_name']);
                    finfo_close($finfo);
                }
            }

            // Fallback a mime_content_type si finfo falló o no está disponible
            if ((!$detectedMimeType || $detectedMimeType === false) && function_exists('mime_content_type')) {
                // Asegurarse de que tmp_name es válido y existe
                if (!empty($fileData['tmp_name']) && file_exists($fileData['tmp_name'])) {
                    $detectedMimeType = mime_content_type($fileData['tmp_name']);
                }
            }

            if ($detectedMimeType === false || $detectedMimeType === null) {
                throw new FileOperationException("No se pudo determinar el tipo MIME del archivo subido de forma fiable.");
            }

            // Normalizar el tipo MIME detectado (ej., 'text/plain; charset=us-ascii' a 'text/plain')
            $mainMimeType = explode(';', $detectedMimeType)[0];

            if (!in_array($mainMimeType, $this->allowedFileTypes)) {
                throw new FileOperationException("Tipo de archivo MIME no permitido: {$mainMimeType}. Permitidos: " . implode(', ', $this->allowedFileTypes) . ". Detectado originalmente: " . $detectedMimeType);
            }
        }
        // Fin de la validación de tipo MIME

        if ($fileSize > $this->maxFileSize) {
            throw new FileOperationException("El archivo es demasiado grande ({$fileSize} bytes). Máximo permitido: {$this->maxFileSize} bytes (" . round($this->maxFileSize / 1024 / 1024, 2) . " MB).");
        }

        $safeFileName = preg_replace("/[^a-zA-Z0-9\._-]|"
        . preg_quote(DIRECTORY_SEPARATOR, '/') . "/", "", $fileName);
        if (empty($safeFileName)) {
            $safeFileName = "uploaded_file." . $fileExtension;
        }

        $targetFilePath = $destinationPath . DIRECTORY_SEPARATOR . $safeFileName;

        $nameWithoutExt = pathinfo($safeFileName, PATHINFO_FILENAME);
        $i = 1;
        while (file_exists($targetFilePath)) {
            $safeFileName = $nameWithoutExt . '_' . $i . '.' . $fileExtension;
            $targetFilePath = $destinationPath . DIRECTORY_SEPARATOR . $safeFileName;
            $i++;
        }

        if (move_uploaded_file($fileData['tmp_name'], $targetFilePath)) {
            $mimeType = 'application/octet-stream'; // Valor por defecto
            // Usar finfo para una detección de MIME más fiable después de mover el archivo
            if (function_exists('finfo_open')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                if ($finfo && file_exists($targetFilePath)) {
                    $mimeType = finfo_file($finfo, $targetFilePath);
                    finfo_close($finfo);
                }
            } elseif (function_exists('mime_content_type')) { // Fallback
                if (file_exists($targetFilePath)) {
                    $mimeType = mime_content_type($targetFilePath);
                }
            }

            // Normalizar el tipo MIME si incluye charset, etc.
            if ($mimeType && is_string($mimeType) && strpos($mimeType, ';') !== false) {
                $mimeType = explode(';', $mimeType)[0];
            }
            // Asegurar que mimeType no sea false o null, revertir a default si falla la detección
            if ($mimeType === false || $mimeType === null) {
                $mimeType = 'application/octet-stream';
            }

            $finalRelativePath = trim($destinationRelativePath . DIRECTORY_SEPARATOR . $safeFileName, DIRECTORY_SEPARATOR);
            if ($destinationRelativePath === '') {
                $finalRelativePath = $safeFileName;
            }
            return [
                'name' => $safeFileName,
                'path' => $finalRelativePath,
                'type' => 'file',
                'size' => $fileSize,
                'mime_type' => $mimeType
            ];
        }

        throw new FileOperationException('Error al mover el archivo subido a: ' . $targetFilePath);
    }

    /**
     * Renombra un archivo o carpeta.
     *
     * @param string $oldRelativePath Ruta relativa actual.
     * @param string $newBaseName Nuevo nombre base (solo el nombre, sin ruta).
     * @return bool True en éxito.
     * @throws InvalidArgumentException Si el nuevo nombre está vacío o contiene caracteres inválidos.
     * @throws FileNotFoundException Si el archivo/carpeta original no existe.
     * @throws FileExistsException Si ya existe un archivo/carpeta con el nuevo nombre.
     * @throws FileOperationException Si no se pudo renombrar.
     */
    public function rename(string $oldRelativePath, string $newBaseName): bool {
        $trimmedNewBaseName = trim($newBaseName);
        if (empty($trimmedNewBaseName)) {
            throw new InvalidArgumentException('El nuevo nombre no puede estar vacío.');
        }
        if (strpos($trimmedNewBaseName, '/') !== false || strpos($trimmedNewBaseName, '\\') !== false) {
            throw new InvalidArgumentException('El nuevo nombre no puede contener barras diagonales o invertidas.');
        }

        $oldPath = $this->resolvePath($oldRelativePath);
        if (!file_exists($oldPath)) {
            throw new FileNotFoundException("El archivo o carpeta a renombrar no existe: " . $oldRelativePath);
        }

        $parentDir = dirname($oldPath);
        $safeNewName = preg_replace("/[^a-zA-Z0-9\._-]|"
        . preg_quote(DIRECTORY_SEPARATOR, '/') . "/", "", basename($trimmedNewBaseName));

        if (empty($safeNewName)) {
            throw new InvalidArgumentException('El nuevo nombre resultó vacío después de la sanitización.');
        }
        if ($safeNewName === '.' || $safeNewName === '..') {
            throw new InvalidArgumentException('Nombre de archivo o carpeta no válido.');
        }

        $newPath = $parentDir . DIRECTORY_SEPARATOR . $safeNewName;

        if (file_exists($newPath)) {
            throw new FileExistsException("Ya existe un archivo o carpeta con el nuevo nombre '{$safeNewName}' en la ubicación: " . dirname($oldRelativePath));
        }

        if (rename($oldPath, $newPath)) {
            return true;
        }
        throw new FileOperationException("No se pudo renombrar el elemento '{$oldRelativePath}' a '{$safeNewName}'.");
    }

    /**
     * Resuelve una ruta relativa a una ruta absoluta canónica dentro del directorio base.
     * Previene ataques de path traversal.
     *
     * @param string $relativePath
     * @return string Ruta absoluta canónica y validada.
     * @throws PermissionDeniedException Si se intenta acceder fuera del directorio base.
     * @throws InvalidArgumentException Si la ruta base configurada no es válida.
     */
    protected function resolvePath(string $relativePath): string {
        if ($this->basePath === false || !is_dir($this->basePath)) {
            throw new InvalidArgumentException('El directorio base configurado no es válido o no existe.');
        }

        $normalizedRelativePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativePath);
        $normalizedRelativePath = trim($normalizedRelativePath, DIRECTORY_SEPARATOR);

        $fullPath = $this->basePath . DIRECTORY_SEPARATOR . $normalizedRelativePath;
        if ($normalizedRelativePath === '') {
            $fullPath = $this->basePath;
        }

        $canonicalPath = $this->getCanonicalPath($fullPath);

        if (strpos($canonicalPath, $this->basePath) !== 0) {
             // Adicionalmente, verificar si $canonicalPath es exactamente $this->basePath
            // Si lo es, y $normalizedRelativePath no estaba vacío (ej. "../algo" que resuelve a la base), es un intento de escape.
            // Si $normalizedRelativePath estaba vacío, entonces $canonicalPath === $this->basePath es correcto.
            if (!($canonicalPath === $this->basePath && $normalizedRelativePath === '')){
                throw new PermissionDeniedException('Acceso denegado: Intento de acceso fuera del directorio permitido. Solicitado: ' . $relativePath . '; Resuelto a: ' . $canonicalPath . '; Base: ' . $this->basePath);
            }
        }
        return $canonicalPath;
    }

    /**
     * Obtiene la ruta canónica de una ruta absoluta o similar a absoluta.
     * Este método normaliza la ruta, resolviendo '.' y '..' segmentos.
     * No requiere que la ruta exista en el sistema de archivos.
     * Elimina la dependencia de estados globales.
     *
     * @param string $path La ruta a canonizar. Se espera que sea una ruta completa
     *                     (ej. después de ser combinada con un directorio base).
     * @return string La ruta canónica.
     */
    protected function getCanonicalPath(string $path): string {
        $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
        $parts = [];
        $isWindowsDriveLetter = false;
        $driveLetter = '';
        $pathWithoutDrive = $path;

        if (preg_match('/^([a-zA-Z]:)(.*)$/', $path, $matches)) {
            $driveLetter = strtoupper($matches[1]);
            $pathWithoutDrive = $matches[2];
            $isWindowsDriveLetter = true;
        }

        $trimmedPathWithoutDrive = trim($pathWithoutDrive, DIRECTORY_SEPARATOR);
        if ($trimmedPathWithoutDrive === '') {
            $parts = [];
        } else {
            $parts = explode(DIRECTORY_SEPARATOR, $trimmedPathWithoutDrive);
        }

        $absolutes = [];
        foreach ($parts as $part) {
            if ('.' == $part || '' == $part) continue;
            if ('..' == $part) {
                if (!empty($absolutes)) {
                    array_pop($absolutes);
                }
            } else {
                $absolutes[] = $part;
            }
        }

        if ($isWindowsDriveLetter) {
            $reconstructedPath = $driveLetter;
            if (!empty($absolutes)) {
                $reconstructedPath .= DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $absolutes);
            } else {
                $reconstructedPath .= DIRECTORY_SEPARATOR;
            }
            return $reconstructedPath;
        } else {
            $reconstructedPath = DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $absolutes);
            return $reconstructedPath;
        }
    }

    protected function getUploadErrorMessage(int $errorCode): string {
        switch ($errorCode) {
            case UPLOAD_ERR_INI_SIZE:
                return "El archivo excede la directiva upload_max_filesize en php.ini.";
            case UPLOAD_ERR_FORM_SIZE:
                return "El archivo excede la directiva MAX_FILE_SIZE especificada en el formulario HTML.";
            case UPLOAD_ERR_PARTIAL:
                return "El archivo fue solo parcialmente subido.";
            case UPLOAD_ERR_NO_FILE:
                return "Ningún archivo fue subido.";
            case UPLOAD_ERR_NO_TMP_DIR:
                return "Falta la carpeta temporal.";
            case UPLOAD_ERR_CANT_WRITE:
                return "No se pudo escribir el archivo en el disco.";
            case UPLOAD_ERR_EXTENSION:
                return "Una extensión de PHP detuvo la subida del archivo.";
            default:
                return "Error desconocido al subir el archivo (código: {$errorCode}).";
        }
    }
}