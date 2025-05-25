<?php

class FileManager
{
    private $baseDir;

    public function __construct($baseDir)
    {
        $this->baseDir = rtrim($baseDir, DIRECTORY_SEPARATOR);
        if (!is_dir($this->baseDir)) {
            // Intentar crear el directorio base si no existe
            if (!mkdir($this->baseDir, 0777, true)) {
                throw new Exception("El directorio base '{$this->baseDir}' no existe y no pudo ser creado.");
            }
        }
    }

    private function sanitizePath($path): string
    {
        // Eliminar cualquier intento de subir de directorio (../)
        $path = str_replace('..', '', $path);
        // Normalizar separadores de directorio
        $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
        return trim($path, DIRECTORY_SEPARATOR);
    }

    private function getFullPath($relativePath): string
    {
        $sanitizedRelativePath = $this->sanitizePath($relativePath);
        $fullPath = $this->baseDir . DIRECTORY_SEPARATOR . $sanitizedRelativePath;

        // Asegurarse de que la ruta resuelta esté dentro del directorio base
        $realBasePath = realpath($this->baseDir);
        $realFullPath = realpath($fullPath);

        if ($realFullPath === false) { // Si la ruta no existe aún (ej. al crear)
            // Comprobar la ruta padre si es posible
            $parentPath = dirname($fullPath);
            $realParentPath = realpath($parentPath);
            if ($realParentPath === false || strpos($realParentPath, $realBasePath) !== 0) {
                throw new Exception("Acceso a ruta inválida o restringida: {$relativePath}");
            }
        } else if (strpos($realFullPath, $realBasePath) !== 0) {
            throw new Exception("Acceso a ruta inválida o restringida: {$relativePath}");
        }

        // Para creación, la ruta puede no existir, así que usamos la ruta construida
        // pero validamos que su base sí esté dentro de $this->baseDir
        if (strpos(realpath(dirname($fullPath)), realpath($this->baseDir)) !== 0 && dirname($fullPath) != realpath($this->baseDir)) {
             // Excepción para el caso en que $relativePath es vacío y $fullPath es igual a $baseDir
            if (!($sanitizedRelativePath === '' && $fullPath === $this->baseDir)){
                throw new Exception("Operación fuera del directorio base no permitida: {$relativePath}");
            }
        }

        return $fullPath;
    }

    public function listDirectory($relativePath = ''): array
    {
        $dirPath = $this->getFullPath($relativePath);
        if (!is_dir($dirPath)) {
            throw new Exception("El directorio no existe: {$relativePath}");
        }

        $items = [];
        $files = scandir($dirPath);
        if ($files === false) {
            throw new Exception("No se pudo leer el directorio: {$relativePath}");
        }

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $filePath = $dirPath . DIRECTORY_SEPARATOR . $file;
            $item = [
                'name' => $file,
                'type' => is_dir($filePath) ? 'folder' : 'file',
                'size' => is_file($filePath) ? filesize($filePath) : null,
                'modified' => filemtime($filePath),
                // 'permissions' => substr(sprintf('%o', fileperms($filePath)), -4), // Opcional
            ];
            if ($item['type'] === 'folder') {
                // Contar items dentro de la carpeta podría ser costoso, opcional
                // $subFiles = scandir($filePath);
                // $item['items'] = $subFiles ? count(array_diff($subFiles, ['.', '..'])) : 0;
            }
            $items[] = $item;
        }
        return $items;
    }

    public function createDirectory($relativePath, $name): bool
    {
        $dirPath = $this->getFullPath($relativePath);
        $newDirPath = $dirPath . DIRECTORY_SEPARATOR . $this->sanitizePath($name);
        if (file_exists($newDirPath)) {
            throw new Exception("La carpeta '{$name}' ya existe en esta ubicación.");
        }
        if (!mkdir($newDirPath, 0777, true)) {
            throw new Exception("No se pudo crear la carpeta '{$name}'. Verifique los permisos.");
        }
        return true;
    }

    public function rename($relativePath, $oldName, $newName, $type): bool
    {
        $dirPath = $this->getFullPath($relativePath);
        $oldPath = $dirPath . DIRECTORY_SEPARATOR . $this->sanitizePath($oldName);
        $newPath = $dirPath . DIRECTORY_SEPARATOR . $this->sanitizePath($newName);

        if (!file_exists($oldPath)) {
            throw new Exception("El archivo o carpeta '{$oldName}' no existe.");
        }
        if (file_exists($newPath)) {
            throw new Exception("Ya existe un archivo o carpeta con el nombre '{$newName}'.");
        }
        // Validar tipo (opcional pero bueno para consistencia)
        if (($type === 'folder' && !is_dir($oldPath)) || ($type === 'file' && !is_file($oldPath))) {
            throw new Exception("El tipo especificado no coincide con el elemento '{$oldName}'.");
        }

        if (!rename($oldPath, $newPath)) {
            throw new Exception("No se pudo renombrar '{$oldName}' a '{$newName}'.");
        }
        return true;
    }

    public function delete($relativePath, $name, $type): bool
    {
        $dirPath = $this->getFullPath($relativePath);
        $itemPath = $dirPath . DIRECTORY_SEPARATOR . $this->sanitizePath($name);

        if (!file_exists($itemPath)) {
            throw new Exception("El archivo o carpeta '{$name}' no existe.");
        }

        if ($type === 'folder') {
            if (!is_dir($itemPath)) {
                throw new Exception("'{$name}' no es una carpeta.");
            }
            // Eliminar recursivamente para carpetas
            return $this->deleteDirectoryRecursive($itemPath);
        } elseif ($type === 'file') {
            if (!is_file($itemPath)) {
                throw new Exception("'{$name}' no es un archivo.");
            }
            if (!unlink($itemPath)) {
                throw new Exception("No se pudo eliminar el archivo '{$name}'.");
            }
        } else {
            throw new Exception("Tipo '{$type}' no válido para eliminación.");
        }
        return true;
    }

    private function deleteDirectoryRecursive($dirPath): bool
    {
        if (!is_dir($dirPath)) return false;
        $files = array_diff(scandir($dirPath), ['.', '..']);
        foreach ($files as $file) {
            (is_dir("$dirPath/$file")) ? $this->deleteDirectoryRecursive("$dirPath/$file") : unlink("$dirPath/$file");
        }
        return rmdir($dirPath);
    }

    public function uploadFile($tmpName, $destinationPathRelative, $fileName): bool
    {
        $destinationDir = $this->getFullPath($destinationPathRelative);
        $safeFileName = basename($this->sanitizePath($fileName)); // Evitar path traversal en el nombre del archivo
        $destinationFile = $destinationDir . DIRECTORY_SEPARATOR . $safeFileName;

        if (!is_uploaded_file($tmpName)) {
            throw new Exception("El archivo '{$safeFileName}' no fue subido mediante HTTP POST.");
        }
        if (file_exists($destinationFile)) {
            // Podrías renombrar, sobrescribir o lanzar error. Aquí lanzamos error.
            throw new Exception("El archivo '{$safeFileName}' ya existe en la ubicación de destino.");
        }
        if (!move_uploaded_file($tmpName, $destinationFile)) {
            throw new Exception("No se pudo mover el archivo subido '{$safeFileName}'.");
        }
        return true;
    }
}

?>