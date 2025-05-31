<?php
declare(strict_types=1);
// Log para verificar el inicio de la ejecución del script, colocado después de strict_types
error_log("files.php - INICIO EJECUCION (después de strict_types) - " . date('Y-m-d H:i:s'));

// Define el entorno de la aplicación (development o production)
// Esto debe hacerse ANTES de incluir ErrorHandler.php, ya que este lo utiliza.
if (!defined('APP_ENV')) {
    define('APP_ENV', 'development'); // Cambiar a 'production' en un entorno real
}

require_once __DIR__ . '/../core/ResponseHandler.php';
require_once __DIR__ . '/../config/config.php'; // Carga $baseDir y otras configuraciones

// Configuración del manejo de errores PHP según el entorno
if (APP_ENV === 'production') {
    error_reporting(0);
    ini_set('display_errors', '0');
} else {
    // En desarrollo, los errores son útiles, pero nos aseguraremos de que no rompan el JSON más adelante.
    // error_reporting(E_ALL);
    // ini_set('display_errors', '1');
    // Por ahora, para asegurar JSON, incluso en dev, suprimimos la salida directa de errores.
    // Los errores se seguirán registrando si php.ini está configurado para ello.
    ini_set('display_errors', '0');
    error_reporting(E_ALL); // Reportar todos los errores para logging
}

// Establecer un manejador de errores global para capturar errores no controlados y devolver JSON
set_error_handler(function($severity, $message, $file, $line) {
    // No mostrar errores si error_reporting está desactivado (usualmente en producción)
    if (!(error_reporting() & $severity)) {
        return false;
    }
    // Registrar el error
    error_log("PHP Error: [$severity] $message in $file on line $line");
    // Si las cabeceras aún no se han enviado, intentar enviar una respuesta JSON de error.
    if (!headers_sent()) {
        ResponseHandler::error("Error interno del servidor. Consulte los logs para más detalles.", 500);
    }
    exit; // Detener la ejecución para evitar más salida HTML
});

// Establecer un manejador de excepciones global
set_exception_handler(function($exception) {
    error_log("PHP Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
    if (!headers_sent()) {
        ResponseHandler::error("Excepción interna del servidor: " . $exception->getMessage(), 500);
    }
    exit;
});

// INICIO DE FUNCIONES A AÑADIR/ASEGURAR QUE EXISTEN AQUÍ

/**
 * Aplica una marca de agua a un recurso de imagen GD.
 *
 * @param GdImage $imageResource El recurso de imagen GD al que se aplicará la marca de agua.
 * @param array $watermarkConfig Configuración de la marca de agua (de $axFinderConfig['watermark']).
 * @return GdImage|false El recurso de imagen modificado, la imagen original si la marca de agua está deshabilitada/falla, o false en error crítico.
 */
function applyWatermark(\GdImage $imageResource, array $watermarkConfig): \GdImage|false
{
    if (!isset($watermarkConfig['enabled']) || $watermarkConfig['enabled'] !== true) {
        error_log("applyWatermark: Marca de agua deshabilitada en la configuración.");
        return $imageResource; // Marca de agua no habilitada, devuelve la imagen original
    }

    $imageWidth = imagesx($imageResource);
    $imageHeight = imagesy($imageResource);

    $opacityConfig = $watermarkConfig['opacity'] ?? 50; // Opacidad 0-100 (0=transparente, 100=opaco)
    $margin = $watermarkConfig['margin'] ?? 10;
    $position = $watermarkConfig['position'] ?? 'bottom-right';

    if ($watermarkConfig['type'] === 'image') {
        error_log("applyWatermark: Intentando aplicar marca de agua de tipo IMAGEN. Ruta configurada: " . ($watermarkConfig['image_path'] ?? 'No especificado'));
        if (empty($watermarkConfig['image_path']) || !is_file($watermarkConfig['image_path']) || !is_readable($watermarkConfig['image_path'])) {
            error_log("applyWatermark: Archivo de imagen para marca de agua no encontrado o no legible: " . ($watermarkConfig['image_path'] ?? 'No especificado'));
            return $imageResource; // Devuelve la imagen original si la marca de agua falla
        }
        $watermarkImage = @imagecreatefrompng($watermarkConfig['image_path']); // Asumimos PNG para mejor manejo de alfa
        if (!$watermarkImage) {
            error_log("applyWatermark: No se pudo crear la imagen de marca de agua desde: " . $watermarkConfig['image_path']);
            return $imageResource;
        }

        $watermarkOriginalWidth = imagesx($watermarkImage);
        $watermarkOriginalHeight = imagesy($watermarkImage);

        // --- Inicio: Redimensionar marca de agua si es necesario ---
        $maxWatermarkRelativeWidth = 0.30; // Máximo 30% del ancho de la imagen principal
        $maxWatermarkRelativeHeight = 0.30; // Máximo 30% del alto de la imagen principal

        $maxAllowedWatermarkWidth = (int)($imageWidth * $maxWatermarkRelativeWidth);
        $maxAllowedWatermarkHeight = (int)($imageHeight * $maxWatermarkRelativeHeight);

        $resizedWatermarkWidth = $watermarkOriginalWidth;
        $resizedWatermarkHeight = $watermarkOriginalHeight;

        // Calcular nuevas dimensiones manteniendo la proporción
        if ($resizedWatermarkWidth > $maxAllowedWatermarkWidth) {
            $ratio = $maxAllowedWatermarkWidth / $resizedWatermarkWidth;
            $resizedWatermarkWidth = $maxAllowedWatermarkWidth;
            $resizedWatermarkHeight = (int)($resizedWatermarkHeight * $ratio);
        }

        if ($resizedWatermarkHeight > $maxAllowedWatermarkHeight) {
            $ratio = $maxAllowedWatermarkHeight / $resizedWatermarkHeight;
            $resizedWatermarkHeight = $maxAllowedWatermarkHeight;
            $resizedWatermarkWidth = (int)($resizedWatermarkWidth * $ratio); // Ajustar ancho si la altura fue el limitante
        }

        $watermarkToApply = $watermarkImage; // Por defecto, usar la original cargada

        if ($resizedWatermarkWidth != $watermarkOriginalWidth || $resizedWatermarkHeight != $watermarkOriginalHeight) {
            error_log("applyWatermark: Redimensionando marca de agua de {$watermarkOriginalWidth}x{$watermarkOriginalHeight} a {$resizedWatermarkWidth}x{$resizedWatermarkHeight}");
            $tempResizedWatermark = imagecreatetruecolor($resizedWatermarkWidth, $resizedWatermarkHeight);
            if ($tempResizedWatermark) {
                imagealphablending($tempResizedWatermark, false);
                imagesavealpha($tempResizedWatermark, true);
                $transparent = imagecolorallocatealpha($tempResizedWatermark, 255, 255, 255, 127);
                imagefill($tempResizedWatermark, 0, 0, $transparent);
                imagecopyresampled($tempResizedWatermark, $watermarkImage, 0, 0, 0, 0, $resizedWatermarkWidth, $resizedWatermarkHeight, $watermarkOriginalWidth, $watermarkOriginalHeight);
                imagedestroy($watermarkImage); // Destruir la original cargada que ya no se necesita
                $watermarkToApply = $tempResizedWatermark; // Usar la redimensionada
            } else {
                error_log("applyWatermark: Falló imagecreatetruecolor para redimensionar marca de agua. Se usará la original.");
                // $watermarkToApply sigue siendo $watermarkImage (la original)
                $resizedWatermarkWidth = $watermarkOriginalWidth; // Revertir a dimensiones originales si falla
                $resizedWatermarkHeight = $watermarkOriginalHeight;
            }
        }
        // --- Fin: Redimensionar marca de agua ---

        $watermarkWidth = $resizedWatermarkWidth; // Usar las dimensiones finales (originales o redimensionadas)
        $watermarkHeight = $resizedWatermarkHeight;

        // Calcular posición
        switch ($position) {
            case 'top-left': $destX = $margin; $destY = $margin; break;
            case 'top-center': $destX = ($imageWidth - $watermarkWidth) / 2; $destY = $margin; break;
            case 'top-right': $destX = $imageWidth - $watermarkWidth - $margin; $destY = $margin; break;
            case 'bottom-left': $destX = $margin; $destY = $imageHeight - $watermarkHeight - $margin; break;
            case 'bottom-center': $destX = ($imageWidth - $watermarkWidth) / 2; $destY = $imageHeight - $watermarkHeight - $margin; break;
            case 'bottom-right': $destX = $imageWidth - $watermarkWidth - $margin; $destY = $imageHeight - $watermarkHeight - $margin; break;
            case 'center':
            default:
                $destX = ($imageWidth - $watermarkWidth) / 2;
                $destY = ($imageHeight - $watermarkHeight) / 2;
                error_log("applyWatermark: Posición calculada para imagen (default/center): X=$destX, Y=$destY");
                break;
        }

        // imagecopymerge necesita opacidad 0-100
        error_log("applyWatermark: Aplicando imagecopymerge con opacidad: $opacityConfig");
        imagecopymerge($imageResource, $watermarkToApply, (int)$destX, (int)$destY, 0, 0, $watermarkWidth, $watermarkHeight, $opacityConfig);
        imagedestroy($watermarkToApply); // Destruir la imagen de marca de agua (original o redimensionada)

    } elseif ($watermarkConfig['type'] === 'text') {
        if (empty($watermarkConfig['text'])) {
            error_log("applyWatermark: Texto para marca de agua no especificado.");
            return $imageResource;
        }
        if (empty($watermarkConfig['font_path']) || !is_file($watermarkConfig['font_path']) || !is_readable($watermarkConfig['font_path'])) {
            error_log("applyWatermark: Archivo de fuente para marca de agua no encontrado o no legible: " . ($watermarkConfig['font_path'] ?? 'No especificado'));
            return $imageResource;
        }

        $fontPath = $watermarkConfig['font_path'];
        $fontSize = $watermarkConfig['font_size'] ?? 16;
        $text = $watermarkConfig['text'];
        $rgb = $watermarkConfig['color'] ?? [255, 255, 255];

        // Convertir opacidad de 0-100 a alfa de GD 0-127 (0=opaco, 127=transparente)
        $alpha = 127 - (int)round(($opacityConfig / 100) * 127);
        $textColor = imagecolorallocatealpha($imageResource, $rgb[0], $rgb[1], $rgb[2], $alpha);
        if ($textColor === false) {
             error_log("applyWatermark: No se pudo asignar color para el texto de la marca de agua.");
             return $imageResource;
        }

        $textBox = @imagettfbbox($fontSize, 0, $fontPath, $text);
        if (!$textBox) {
            error_log("applyWatermark: Error al calcular las dimensiones del texto con imagettfbbox para el texto: '$text' y fuente: '$fontPath'");
            return $imageResource;
        }
        $textWidth = $textBox[2] - $textBox[0];
        $textHeight = $textBox[1] - $textBox[7]; // Altura desde la línea base hasta la parte superior
        $textBaselineY = $textBox[1]; // Posición Y de la línea base relativa al punto de inicio (suele ser negativo o cero)

        // Calcular posición para texto (Y es la línea base)
        switch ($position) {
            case 'top-left': $destX = $margin; $destY = $margin - $textBaselineY; break;
            case 'top-center': $destX = ($imageWidth - $textWidth) / 2; $destY = $margin - $textBaselineY; break;
            case 'top-right': $destX = $imageWidth - $textWidth - $margin; $destY = $margin - $textBaselineY; break;
            case 'bottom-left': $destX = $margin; $destY = $imageHeight - $margin; break;
            case 'bottom-center': $destX = ($imageWidth - $textWidth) / 2; $destY = $imageHeight - $margin; break;
            case 'bottom-right': $destX = $imageWidth - $textWidth - $margin; $destY = $imageHeight - $margin; break;
            case 'center':
            default:
                $destX = ($imageWidth - $textWidth) / 2;
                // Para centrar verticalmente el texto, consideramos la altura total del cuadro de texto
                // y la posición de la línea base.
                $textTotalHeight = $textBox[1] - $textBox[7]; // Altura total del glifo
                $destY = ($imageHeight - $textTotalHeight) / 2 - $textBaselineY;
                break;
        }

        // Opcional: Fondo para el texto
        if (isset($watermarkConfig['text_background_color']) && is_array($watermarkConfig['text_background_color'])) {
            $bgRgb = $watermarkConfig['text_background_color'];
            $bgOpacity = $watermarkConfig['text_background_opacity'] ?? 70; // 0-100
            $bgAlpha = 127 - (int)round(($bgOpacity / 100) * 127);
            $bgColor = imagecolorallocatealpha($imageResource, $bgRgb[0], $bgRgb[1], $bgRgb[2], $bgAlpha);
            if ($bgColor !== false) {
                // Coordenadas del rectángulo de fondo
                // $textBox[0] y $textBox[1] son el inferior-izquierdo y superior-izquierdo relativo al punto de inicio del texto
                $bgX1 = (int)($destX + $textBox[0] - $margin/2); // Pequeño padding
                $bgY1 = (int)($destY + $textBox[1] - $margin/2);
                $bgX2 = (int)($destX + $textBox[2] + $margin/2);
                $bgY2 = (int)($destY + $textBox[3] + $margin/2); // textBox[3] es el superior-derecho Y
                imagefilledrectangle($imageResource, $bgX1, $bgY1, $bgX2, $bgY2, $bgColor);
            }
        }

        imagettftext($imageResource, $fontSize, 0, (int)$destX, (int)$destY, $textColor, $fontPath, $text);
    }
    return $imageResource;
}

/**
 * Crea una miniatura de una imagen.
 *
 * @param string $sourcePath Ruta al archivo de imagen original.
 * @param string $destinationPath Ruta donde se guardará la miniatura.
 * @param int $targetWidth Ancho deseado para la miniatura. La altura se calculará para mantener la proporción.
 * @return bool True si la miniatura se creó con éxito, False en caso contrario.
 */
function createThumbnail(string $sourcePath, string $destinationPath, int $targetWidth): bool
{
    // La extensión GD se comprueba antes de llamar a esta función en handleUpload,
    // pero una comprobación aquí no hace daño si se llamase desde otro sitio.
    if (!extension_loaded('gd')) {
        error_log('createThumbnail: GD extension is not available.');
        return false;
    }

    $imageInfo = @getimagesize($sourcePath);
    if ($imageInfo === false) {
        error_log("createThumbnail: getimagesize failed for $sourcePath");
        return false;
    }

    list($originalWidth, $originalHeight, $imageType) = $imageInfo;

    if ($originalWidth == 0 || $originalHeight == 0) {
        error_log("createThumbnail: Invalid image dimensions (width or height is 0) for $sourcePath");
        return false;
    }

    // Calcular la altura de la miniatura manteniendo la proporción
    $aspectRatio = $originalWidth / $originalHeight;
    if ($aspectRatio == 0) { // Evitar división por cero si originalHeight fuera 0 (aunque ya cubierto arriba)
        error_log("createThumbnail: Aspect ratio is zero for $sourcePath");
        return false;
    }
    $targetHeight = (int)floor($targetWidth / $aspectRatio);

    // Crear la imagen de origen según el tipo
    $sourceImage = null;
    switch ($imageType) {
        case IMAGETYPE_JPEG:
            $sourceImage = @imagecreatefromjpeg($sourcePath);
            break;
        case IMAGETYPE_PNG:
            $sourceImage = @imagecreatefrompng($sourcePath);
            break;
        case IMAGETYPE_GIF:
            $sourceImage = @imagecreatefromgif($sourcePath);
            break;
    case IMAGETYPE_WEBP: // Añadir soporte para WebP
        $sourceImage = @imagecreatefromwebp($sourcePath);
        break;
        // Podrías añadir IMAGETYPE_WEBP si tu GD lo soporta y quieres miniaturas WebP
        default:
            error_log("createThumbnail: Unsupported image type ($imageType) for $sourcePath");
            return false;
    }

    if (!$sourceImage) {
        error_log("createThumbnail: Failed to create source image from $sourcePath (type: $imageType)");
        return false;
    }

    $thumbnailImage = imagecreatetruecolor($targetWidth, $targetHeight);

    // Manejo de transparencia para PNG y WEBP
if ($imageType == IMAGETYPE_PNG || $imageType == IMAGETYPE_WEBP) {
        imagealphablending($thumbnailImage, false);
        imagesavealpha($thumbnailImage, true);
        $transparent = imagecolorallocatealpha($thumbnailImage, 255, 255, 255, 127);
        imagefill($thumbnailImage, 0, 0, $transparent); // Usar imagefill para mejor compatibilidad con transparencia
    } elseif ($imageType == IMAGETYPE_GIF) {
        $transparentIndex = imagecolortransparent($sourceImage);
        if ($transparentIndex >= 0) {
            $transparentColor = imagecolorsforindex($sourceImage, $transparentIndex);
            $transparentDest = imagecolorallocate($thumbnailImage, $transparentColor['red'], $transparentColor['green'], $transparentColor['blue']);
            imagecolortransparent($thumbnailImage, $transparentDest);
            imagefill($thumbnailImage, 0, 0, $transparentDest);
        }
    }

    imagecopyresampled($thumbnailImage, $sourceImage, 0, 0, 0, 0, $targetWidth, $targetHeight, $originalWidth, $originalHeight);

    // --- Aplicar Marca de Agua si está configurada ---
    global $axFinderConfig; // Acceder a la configuración global
    if (isset($axFinderConfig['watermark'])) {
        error_log("createThumbnail: Configuración de marca de agua encontrada. 'enabled': " . (isset($axFinderConfig['watermark']['enabled']) && $axFinderConfig['watermark']['enabled'] ? 'true' : 'false'));
        if (isset($axFinderConfig['watermark']['enabled']) && $axFinderConfig['watermark']['enabled'] === true) {
            error_log("createThumbnail: Llamando a applyWatermark para $destinationPath");
            $thumbnailImageWithWatermark = applyWatermark($thumbnailImage, $axFinderConfig['watermark']);
            if ($thumbnailImageWithWatermark instanceof \GdImage) {
                $thumbnailImage = $thumbnailImageWithWatermark;
                error_log("createThumbnail: applyWatermark devolvió una imagen válida. Se usará para guardar.");
            } elseif ($thumbnailImageWithWatermark === false) { // Caso muy crítico
                 error_log("createThumbnail: applyWatermark devolvió FALSE (error crítico) para $destinationPath. Se guardará sin marca de agua.");
            } else {
                error_log("createThumbnail: applyWatermark devolvió un tipo inesperado para $destinationPath. Se guardará sin marca de agua.");
            }
        } else {
            error_log("createThumbnail: Marca de agua NO habilitada en la configuración.");
        }
    } else {
        error_log("createThumbnail: No se encontró la sección 'watermark' en \$axFinderConfig.");
    }
    // --- Fin Marca de Agua ---

    $success = false;
    switch ($imageType) {
        case IMAGETYPE_JPEG: $success = imagejpeg($thumbnailImage, $destinationPath, 85); break;
        case IMAGETYPE_PNG:  $success = imagepng($thumbnailImage, $destinationPath, 7); break;
        case IMAGETYPE_GIF:  $success = imagegif($thumbnailImage, $destinationPath); break;
    case IMAGETYPE_WEBP: $success = imagewebp($thumbnailImage, $destinationPath, 80); break; // Guardar como WebP
    }

    imagedestroy($sourceImage);
    imagedestroy($thumbnailImage);

    return $success;
}

/**
 * Valida y construye una ruta segura dentro del directorio base de almacenamiento.
 *
 * @param string $baseDir El directorio base absoluto y resuelto.
 * @param string $relativePath La ruta relativa proporcionada por el cliente.
 * @param bool $checkExists Opcional. Si es true, verifica que la ruta final exista.
 * @param bool $isFile Opcional. Si es true y $checkExists es true, verifica que sea un archivo. Si es false y $checkExists es true, verifica que sea un directorio.
 * @return string|false La ruta absoluta segura y resuelta, o false si la validación falla.
 */
function getSafePath(string $baseDir, string $relativePath, bool $checkExists = false, bool $isFile = false): string|false {
    // Normalizar slashes y limpiar la ruta relativa
    $normalizedPath = str_replace('\\', '/', $relativePath);
    $normalizedPath = trim($normalizedPath, '/'); // Quitar slashes al inicio y final

    // Evitar que la ruta salga del directorio base (path traversal)
    if (strpos($normalizedPath, '..') !== false) {
        error_log("[getSafePath] Intento de Path Traversal detectado (uso de '..'): $relativePath");
        return false;
    }

    // Construir la ruta completa
    $fullPath = rtrim($baseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $normalizedPath;
    if ($normalizedPath === '' || $normalizedPath === '.') { // Si relativePath es vacía o '.', la ruta es solo baseDir
        $fullPath = $baseDir;
    }

    // Resolver la ruta a su forma canónica (absoluta)
    $realFullPath = realpath($fullPath);

    if ($realFullPath === false) {
        if ($checkExists) {
            error_log("[getSafePath] La ruta no existe y se esperaba que existiera: $fullPath");
            return false;
        }
        $parentDir = dirname($fullPath);
        if (realpath($parentDir) === false || strpos(realpath($parentDir), $baseDir) !== 0) {
            error_log("[getSafePath] El directorio padre para la nueva ruta no es válido o está fuera del base: $parentDir (base: $baseDir)");
            return false;
        }
        if (strpos($fullPath, $baseDir) !== 0 && $fullPath !== $baseDir) { // Añadida comprobación $fullPath !== $baseDir
            error_log("[getSafePath] La ruta intencionada (sin resolver) está fuera del directorio base: $fullPath (base: $baseDir)");
            return false;
        }
        $finalPath = $fullPath;
    } else {
        if (strpos($realFullPath, $baseDir) !== 0) {
            error_log("[getSafePath] Path Traversal detectado. Ruta resuelta ($realFullPath) fuera de la base ($baseDir). Original: $relativePath");
            return false;
        }
        $finalPath = $realFullPath;
    }

    if ($checkExists) {
        if ($isFile) {
            if (!is_file($finalPath)) {
                error_log("[getSafePath] Se esperaba un archivo, pero no se encontró o es un directorio: $finalPath");
                return false;
            }
        } else {
            if (!is_dir($finalPath)) {
                error_log("[getSafePath] Se esperaba un directorio, pero no se encontró o es un archivo: $finalPath");
                return false;
            }
        }
    }
    return $finalPath;
}

/**
 * Maneja la subida de archivos y la creación de metadatos.
 */
function handleUpload(string $baseDir): void {
    error_log("[handleUpload] Iniciando subida...");
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        ResponseHandler::error('Método no permitido.', 405);
        return;
    }

    $currentPath = $_POST['currentPath'] ?? '';
    error_log("[handleUpload] currentPath recibido: " . print_r($currentPath, true));

    $uploadDirRelative = $currentPath;
    if (empty($uploadDirRelative) || $uploadDirRelative === '.') {
        $uploadDirRelative = '';
    }

    // true para checkExists, false para isFile (esperamos un directorio)
    $destinationDirectory = getSafePath($baseDir, $uploadDirRelative, true, false);

    if ($destinationDirectory === false) {
        // Log adicional para entender por qué getSafePath falló
        error_log("[handleUpload] getSafePath falló para baseDir: '$baseDir', uploadDirRelative: '$uploadDirRelative'");
        ResponseHandler::error("Ruta de destino inválida o no accesible para la subida: '$uploadDirRelative'", 400);
        return;
    }
    error_log("[handleUpload] Directorio de destino validado: $destinationDirectory");

    // Crear/verificar el subdirectorio .meta
    $metaDir = rtrim($destinationDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.meta';
    if (!is_dir($metaDir)) {
        if (!mkdir($metaDir, 0755, true)) { // 0755 permisos, true para creación recursiva
            error_log("[handleUpload] Error al crear el directorio de metadatos: $metaDir");
            ResponseHandler::error('Error interno del servidor al preparar el almacenamiento de metadatos.', 500);
            return;
        }
        // Intentar ocultar la carpeta .meta en Windows
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            @exec('attrib +H ' . escapeshellarg($metaDir));
            error_log("[handleUpload] Intentando establecer atributo oculto para .meta: $metaDir (Resultado de exec no capturado directamente)");
        }
        error_log("[handleUpload] Directorio de metadatos creado: $metaDir");
    }

    if (!isset($_FILES['uploaded_image'])) {
        ResponseHandler::error('No se recibió ningún archivo (campo "uploaded_image" esperado).', 400);
        return;
    }

    $file = $_FILES['uploaded_image'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE   => "El archivo excede la directiva upload_max_filesize en php.ini.",
            UPLOAD_ERR_FORM_SIZE  => "El archivo excede la directiva MAX_FILE_SIZE especificada en el formulario HTML.",
            UPLOAD_ERR_PARTIAL    => "El archivo se subió solo parcialmente.",
            UPLOAD_ERR_NO_FILE    => "No se subió ningún archivo.",
            UPLOAD_ERR_NO_TMP_DIR => "Falta la carpeta temporal del servidor.",
            UPLOAD_ERR_CANT_WRITE => "No se pudo escribir el archivo en el disco del servidor.",
            UPLOAD_ERR_EXTENSION  => "Una extensión de PHP detuvo la subida del archivo.",
        ];
        $errorMessage = $uploadErrors[$file['error']] ?? "Error desconocido al subir el archivo.";
        ResponseHandler::error($errorMessage, 500);
        return;
    }

    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $allowedMimeTypes)) {
        ResponseHandler::error("Tipo de archivo no permitido: $mimeType. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP, BMP).", 415);
        return;
    }

    $fileName = basename($file['name']);
    $fileName = preg_replace("/[^a-zA-Z0-9._-]/", "_", $fileName); // Sanitizar nombre
    if (empty($fileName)) { // Si el nombre del archivo queda vacío después de sanitizar
        $fileName = "uploaded_image_" . time(); // Nombre genérico
    }

    $destinationFile = rtrim($destinationDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName;
    // Ajustar la ruta del archivo de metadatos
    $metadataFile = rtrim($metaDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName . '.meta.json';

    // Verificar si el archivo ya existe (opcional, decide cómo manejarlo)
    // if (file_exists($destinationFile)) {
    //     ResponseHandler::error("El archivo '$fileName' ya existe en el destino.", 409); // 409 Conflict
    //     return;
    // }

    error_log("[handleUpload] Intentando mover de {$file['tmp_name']} a $destinationFile");
    if (move_uploaded_file($file['tmp_name'], $destinationFile)) {
        // Preparar metadatos
        $metadata = [];
        $metadataFields = ['caption', 'author', 'publishDate', 'source', 'tags', 'keywords'];
        foreach ($metadataFields as $field) {
            if (isset($_POST[$field])) {
                $metadata[$field] = trim($_POST[$field]); // Usar trim para limpiar espacios
            }
        }

        // Añadir metadatos básicos del archivo
        $metadata['originalName'] = $file['name'];
        $metadata['size'] = $file['size'];
        $metadata['mimeType'] = $mimeType; // $mimeType ya fue determinado por finfo
        $metadata['uploadedAt'] = date('c');
        $metadata['thumbnails'] = []; // Inicializar array para rutas de miniaturas

        // --- Generación de Miniaturas ---
        $thumbnailsDirAbsolute = rtrim($destinationDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.thumbnails';
        if (!is_dir($thumbnailsDirAbsolute)) {
            if (!mkdir($thumbnailsDirAbsolute, 0755, true)) {
                error_log("[handleUpload] Error creating thumbnails directory: $thumbnailsDirAbsolute");
                // Continuar sin miniaturas si falla la creación del directorio, pero registrar el error.
            } else {
                error_log("[handleUpload] Thumbnails directory created: $thumbnailsDirAbsolute");
                // Intentar ocultar la carpeta .thumbnails en Windows
                if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                    @exec('attrib +H ' . escapeshellarg($thumbnailsDirAbsolute));
                    error_log("[handleUpload] Intentando establecer atributo oculto para .thumbnails: $thumbnailsDirAbsolute (Resultado de exec no capturado directamente)");
                }
            }
        }

        $thumbnailWidths = [300, 600, 1200];
        $fileInfo = pathinfo($fileName); // $fileName es el nombre sanitizado
        $filenameWithoutExt = $fileInfo['filename'];
        $extension = strtolower($fileInfo['extension'] ?? '');

        // Tipos de extensión soportados para miniaturas por la función createThumbnail
        $supportedExtensionsForThumbnails = ['jpeg', 'jpg', 'png', 'gif'];

        if (in_array($extension, $supportedExtensionsForThumbnails) && extension_loaded('gd')) {
            foreach ($thumbnailWidths as $width) {
                $thumbFilename = $filenameWithoutExt . '_' . $width . '.' . $extension;
                $thumbDestinationPathAbsolute = rtrim($thumbnailsDirAbsolute, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $thumbFilename;
                $thumbRelativePathForMeta = '.thumbnails/' . $thumbFilename; // Ruta relativa para guardar en .meta.json

                if (createThumbnail($destinationFile, $thumbDestinationPathAbsolute, $width)) {
                    $metadata['thumbnails'][(string)$width] = $thumbRelativePathForMeta; // Usar string como clave para consistencia en JSON
                    error_log("[handleUpload] Thumbnail {$width}px created for {$fileName} at {$thumbRelativePathForMeta}");
                } else {
                    error_log("[handleUpload] Failed to create thumbnail {$width}px for {$destinationFile}");
                }
            }
        } elseif (!extension_loaded('gd')) {
            error_log("[handleUpload] GD extension not loaded. Thumbnails will not be generated for {$fileName}.");
        }
        // --- Fin Generación de Miniaturas ---

        if (file_put_contents($metadataFile, json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))) {
            error_log("[handleUpload] File and metadata (including thumbnails) saved successfully: $destinationFile");
            ResponseHandler::json(['success' => true, 'message' => 'Archivo subido y procesado con éxito.', 'filePath' => ($uploadDirRelative ? $uploadDirRelative . '/' : '') . $fileName, 'metadata' => $metadata]);
        } else {
            error_log("[handleUpload] Archivo subido pero error al guardar metadatos para: $metadataFile");
            // unlink($destinationFile); // Considera eliminar el archivo si los metadatos fallan
            ResponseHandler::error('Archivo subido, pero error al guardar los metadatos.', 500);
        }
    } else {
        error_log("[handleUpload] Error al mover el archivo subido a $destinationFile. Verificar permisos en destino y carpeta temporal PHP. Origen: {$file['tmp_name']}. Código de error del archivo: {$file['error']}");
        ResponseHandler::error('Error al guardar el archivo subido en el servidor.', 500);
    }
}

/**
 * Maneja la actualización de metadatos de una imagen existente.
 */
function handleUpdateMetadata(string $baseDir): void {
    error_log("[handleUpdateMetadata] Iniciando actualización de metadatos...");
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        ResponseHandler::error('Método no permitido.', 405);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        ResponseHandler::error('Error en el JSON de entrada para actualizar metadatos: ' . json_last_error_msg(), 400);
        return;
    }

    $relativePath = $input['path'] ?? null;
    $metadata = $input['metadata'] ?? null;

    if (empty($relativePath) || !is_array($metadata)) {
        ResponseHandler::error('Faltan datos para actualizar metadatos: se requiere "path" (string) y "metadata" (object).', 400);
        return;
    }

    // true para checkExists, true para isFile (esperamos un archivo de imagen)
    $imageFilePath = getSafePath($baseDir, $relativePath, true, true);

    if ($imageFilePath === false) {
        error_log("[handleUpdateMetadata] getSafePath falló para baseDir: '$baseDir', relativePath: '$relativePath'");
        ResponseHandler::error("Archivo no encontrado o ruta inválida para actualizar metadatos: '$relativePath'", 404);
        return;
    }
    error_log("[handleUpdateMetadata] Ruta de imagen validada: $imageFilePath");

    // Determinar la ruta del archivo de metadatos en el subdirectorio .meta
    $imageDir = dirname($imageFilePath);
    $imageFileName = basename($imageFilePath);
    $metaDir = rtrim($imageDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.meta';

     if (!is_dir($metaDir)) {
        error_log("[handleUpdateMetadata] Advertencia: El directorio de metadatos $metaDir no existe para la imagen $imageFilePath. Se intentará crear.");
        if (!mkdir($metaDir, 0755, true)) {
            error_log("[handleUpdateMetadata] Error al crear el directorio de metadatos que faltaba: $metaDir");
        }
    }

    $metadataFilePath = rtrim($metaDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $imageFileName . '.meta.json';

    if (file_put_contents($metadataFilePath, json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        error_log("[handleUpdateMetadata] Metadatos actualizados exitosamente para: $metadataFilePath");
        ResponseHandler::json(['success' => true, 'message' => 'Metadatos actualizados con éxito.']);
    } else {
        error_log("[handleUpdateMetadata] Error al guardar metadatos actualizados en: $metadataFilePath");
        ResponseHandler::error('Error al guardar los metadatos actualizados en el servidor.', 500);
    }
}

// FIN DE FUNCIONES A AÑADIR/ASEGURAR QUE EXISTEN AQUÍ

// Depuración inicial para verificar $baseDir
if (isset($baseDir)) {
    error_log("files.php (Prueba Inicial) - \$baseDir desde config.php: " . print_r($baseDir, true));
} else {
    error_log("files.php (Prueba Inicial) - \$baseDir NO ESTÁ DEFINIDO después de incluir config.php");
    // Si $baseDir no está definido, es un error crítico de configuración.
    // ResponseHandler::error podría no funcionar si hay problemas muy tempranos, así que un die() es más seguro aquí.
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Error crítico: La configuración del directorio base (baseDir) no se ha cargado.']);
    exit;
}

// Simulación de una acción para probar
$action = $_GET['action'] ?? 'test';

try {
    if ($action === 'test') {
        ResponseHandler::json([
            'success' => true,
            'message' => 'El endpoint de prueba de files.php funciona correctamente.',
            'baseDir_configurado' => $baseDir,
            'app_env' => APP_ENV
        ]);
    } elseif ($action === 'get_config') {
        global $axFinderConfig; // Asegurar que $axFinderConfig es accesible
        if (isset($axFinderConfig['general']['defaultViewMode'])) {
            ResponseHandler::json(['success' => true, 'config' => ['defaultViewMode' => $axFinderConfig['general']['defaultViewMode']]]);
        } else {
            error_log("[get_config] Error: defaultViewMode no encontrado en la configuración general.");
            ResponseHandler::error('Configuración de vista por defecto no encontrada en el servidor.', 500);
        }
    } elseif ($action === 'list_folders') {
        $currentPath = $_GET['path'] ?? ''; // Obtener la ruta de la subcarpeta, si se proporciona

        // Validar $currentPath para evitar Path Traversal
        // Validar $currentPath para evitar Path Traversal. Se buscan '..' o cualquier barra (forward o backward)
        // y luego se verifica que la ruta resuelta sea válida y comience con $baseDir.
        if (strpos($currentPath, '..') !== false ||
            (preg_match('/(?:\\\\|\/)/', $currentPath) &&
            (realpath($baseDir . DIRECTORY_SEPARATOR . $currentPath) === false || strpos(realpath($baseDir . DIRECTORY_SEPARATOR . $currentPath), realpath($baseDir)) !== 0)
            )
        ) {
            error_log("[list_folders] Intento de Path Traversal detectado o ruta inválida: $currentPath");
            // Si contiene '..' o si es una ruta que no resuelve dentro de $baseDir
            ResponseHandler::error('Ruta de carpeta inválida.', 400);
            exit;
        }

        $directoryToScan = $baseDir;
        if (!empty($currentPath)) {
            $directoryToScan = $baseDir . DIRECTORY_SEPARATOR . $currentPath;
        }
        error_log("[list_folders] Intentando escanear: $directoryToScan"); // Log para la ruta a escanear

        if (!is_dir($directoryToScan)) {
            error_log("[list_folders] Error: '$directoryToScan' no es un directorio.");
            ResponseHandler::error('El directorio base para listar carpetas no es válido o no existe: ' . $currentPath, 500);
            exit;
        }
        if (!is_readable($directoryToScan)) {
            error_log("[list_folders] Error: '$directoryToScan' no es legible.");
            ResponseHandler::error('El directorio especificado no es legible: ' . $currentPath, 500);
            exit;
        }

        $folders = [];
        error_log("[list_folders] Preparando para escanear: $directoryToScan");

        try {
            $items = scandir($directoryToScan);
            if ($items === false) {
                error_log("[list_folders] scandir() falló para el directorio: $directoryToScan");
                ResponseHandler::error('No se pudo leer el contenido del directorio (scandir falló): ' . $currentPath, 500);
                exit;
            }
            error_log("[list_folders] scandir() completado. Items encontrados: " . count($items));

            global $axFinderConfig;
            if (!isset($axFinderConfig, $axFinderConfig['icons']) || !is_array($axFinderConfig['icons'])) {
                error_log("[list_folders] Error crítico: Configuración de iconos no válida o no encontrada.");
                ResponseHandler::error('Error de configuración interna del servidor (iconos).', 500);
                exit;
            }
            // Log para verificar las claves de iconos disponibles
            // error_log("[list_folders] Claves de iconos disponibles: " . implode(', ', array_keys($axFinderConfig['icons'])));

            foreach ($items as $item) {
                if ($item === '.' || $item === '..') {
                    continue; // Omitir directorios actual y padre
                }
                // Log para cada item procesado
                // error_log("[list_folders] Procesando item: " . print_r($item, true));

                $itemFullPath = $directoryToScan . DIRECTORY_SEPARATOR . $item;
                if (is_dir($itemFullPath)) {
                    $iconSvg = $axFinderConfig['icons']['folderClosed'] ?? '<svg>fallback</svg>';
                    // Omitir las carpetas especiales .meta y .thumbnails
                    if ($item === '.meta' || $item === '.thumbnails') {
                        continue;
                    }

                    $hasSubfolders = false;
                    // Check if the folder has any subdirectories
                    $subItems = scandir($itemFullPath);
                    if ($subItems !== false) {
                        foreach ($subItems as $subItem) {
                            if ($subItem === '.' || $subItem === '..') {
                                continue;
                            }
                            if (is_dir($itemFullPath . DIRECTORY_SEPARATOR . $subItem)) {
                                $hasSubfolders = true;
                                break;
                            }
                        }
                    }
                    $folders[] = [
                        'name' => $item,
                        'type' => 'folder',
                        'path' => !empty($currentPath) ? $currentPath . '/' . $item : $item,
                        'icon' => $iconSvg,
                        'hasSubfolders' => $hasSubfolders
                    ];
                }
            }
            // Si no se encontraron carpetas, se devuelve un array vacío igualmente.
            // El frontend deberá manejar el caso de un array de carpetas vacío.
            ResponseHandler::json(['success' => true, 'folders' => $folders]);

        } catch (Throwable $e) { // Capturar Throwable para errores y excepciones
            error_log("[list_folders] Excepción capturada en el bloque de escaneo: " . $e->getMessage() . " en " . $e->getFile() . ":" . $e->getLine());
            error_log("[list_folders] Stack trace: " . $e->getTraceAsString());
            ResponseHandler::error('Error interno del servidor al procesar la lista de carpetas: ' . $e->getMessage(), 500);
            exit;
        }

    } elseif ($action === 'list_files') {
        $folderName = $_GET['folder'] ?? null;
        $sortBy = $_GET['sort_by'] ?? 'name'; // Obtener parámetro sort_by, default 'name'
        $sortOrder = strtolower($_GET['sort_order'] ?? 'asc'); // Obtener parámetro sort_order, default 'asc'

        // Validar sortOrder para que sea solo 'asc' o 'desc'
        if ($sortOrder !== 'asc' && $sortOrder !== 'desc') {
            $sortOrder = 'asc';
        }

        // Log para depurar los parámetros de ordenación recibidos
        error_log("[list_files] Parámetros de ordenación recibidos - sortBy: {$sortBy}, sortOrder: {$sortOrder}");

        if (!$folderName) {
            ResponseHandler::error('Nombre de carpeta no proporcionado.', 400);
            exit;
        }

        $targetDir = $baseDir; // Por defecto, escanear el baseDir

        // Si el folderName no es 'storage' (que ya es el baseDir), entonces construir la ruta completa.
        if ($folderName !== 'storage') {
            $targetDir = $baseDir . DIRECTORY_SEPARATOR . $folderName;
        }

        if (strpos($folderName, '..') !== false ||
            realpath($targetDir) === false ||
            strpos(realpath($targetDir), realpath($baseDir)) !== 0
           ) {
            error_log("[list_files] Intento de Path Traversal detectado o nombre de carpeta inválido: $folderName");
            ResponseHandler::error('Nombre de carpeta inválido.', 400);
            exit;
        }

        if (!is_dir($targetDir) || !is_readable($targetDir)) {
            ResponseHandler::error("La carpeta '{$folderName}' no es accesible o no existe.", 404);
            exit;
        }

        $items = [];
        $scannedItems = scandir($targetDir);

        if ($scannedItems === false) {
            ResponseHandler::error("No se pudo escanear la carpeta '{$folderName}'.", 500);
            exit;
        }

        function formatFileSize(int $bytes): string {
            $units = ['B', 'KB', 'MB', 'GB', 'TB'];
            $i = 0;
            while ($bytes >= 1024 && $i < count($units) - 1) {
                $bytes /= 1024;
                $i++;
            }
            return round($bytes, 2) . ' ' . $units[$i];
        }

        // Array para mapear frontend sortBy a claves reales de $fileData (y tipo de dato para comparación)
        $sortKeyMap = [
            'name' => ['key' => 'name', 'type' => 'string'],
            'size' => ['key' => 'size_bytes', 'type' => 'numeric'], // Necesitaremos 'size_bytes'
            'mtime' => ['key' => 'mtime', 'type' => 'numeric'],
            'type' => ['key' => 'name', 'type' => 'string'] // Ordenar por extensión (parte del nombre) o añadir una clave 'extension'? Por ahora nombre.
                                                            // Si se quiere ordenar realmente por TIPO (ej. .png antes de .jpg), se necesitará extraer la extensión.
        ];

        // Validar sortBy contra las claves permitidas
        if (!array_key_exists($sortBy, $sortKeyMap)) {
            $sortBy = 'name'; // Default a 'name' si no es válido
        }

        $actualSortKey = $sortKeyMap[$sortBy]['key'];
        $sortType = $sortKeyMap[$sortBy]['type'];

        foreach ($scannedItems as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $itemPath = $targetDir . DIRECTORY_SEPARATOR . $item;
            if (is_file($itemPath)) {
                $iconSvg = $axFinderConfig['icons']['defaultFile'] ?? '';
                $timestamp = filemtime($itemPath);
                $fileSizeBytes = filesize($itemPath); // Obtener tamaño en bytes para ordenar

                $fileData = [
                    'name' => $item,
                    'type' => 'file',
                    'size' => formatFileSize($fileSizeBytes),
                    'size_bytes' => $fileSizeBytes, // Añadir para la ordenación numérica
                    'icon' => $iconSvg,
                    'mtime' => $timestamp,
                ];

                $extension = strtolower(pathinfo($item, PATHINFO_EXTENSION));
                $imageBasePath = $axFinderConfig['general']['imageBasePath'] ?? './storage/';
                if (substr($imageBasePath, -1) !== '/') {
                    $imageBasePath .= '/';
                }

                $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                if (in_array($extension, $imageExtensions)) {
                    $fileData['type'] = 'image'; // Marcar explícitamente como tipo imagen para el frontend
                    $imageRelativePath = $folderName ? $folderName . '/' . rawurlencode($item) : rawurlencode($item);
                    if ($folderName === 'storage') { // Si folderName es literalmente 'storage', significa que estamos en la raíz de baseDir
                        $imageRelativePath = rawurlencode($item);
                    }
                    $fileData['imageUrl'] = $imageBasePath . $imageRelativePath;

                    // --- NUEVA LÓGICA PARA CARGAR METADATOS ---
                    $metaDir = rtrim($targetDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.meta';
                    $metadataFilePath = rtrim($metaDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $item . '.meta.json';

                    error_log("[list_files] Buscando metadatos para $item en: $metadataFilePath");

                    if (is_file($metadataFilePath) && is_readable($metadataFilePath)) {
                        $metadataJson = file_get_contents($metadataFilePath);
                        $metadata = json_decode($metadataJson, true);
                        if (json_last_error() === JSON_ERROR_NONE) {
                            $fileData['metadata'] = $metadata;
                            error_log("[list_files] Metadatos cargados para $item: " . print_r($metadata, true));
                        } else {
                            error_log("[list_files] Error al decodificar JSON de metadatos para $item de $metadataFilePath: " . json_last_error_msg());
                            $fileData['metadata'] = null;
                        }
                    } else {
                        error_log("[list_files] Archivo de metadatos no encontrado o no legible para $item en $metadataFilePath");
                        $fileData['metadata'] = null;
                    }

                    // Construir URLs completas para las miniaturas
                    if (isset($fileData['metadata']['thumbnails']) && is_array($fileData['metadata']['thumbnails'])) {
                        $fileData['thumbnailUrls'] = [];
                        // $imageRelativePath ya contiene la ruta relativa de la imagen original desde la raíz de 'storage'
                        // ej: 'fotos/playa.jpg' o 'playa.jpg'
                        $imageOriginalRelativeDir = dirname($imageRelativePath);
                        if ($imageOriginalRelativeDir === '.') {
                            $imageOriginalRelativeDir = ''; // Para imágenes en la raíz de storage
                        } else {
                            $imageOriginalRelativeDir .= '/'; // ej: 'fotos/'
                        }

                        foreach ($fileData['metadata']['thumbnails'] as $size => $thumbRelPathWithinImageDir) {
                            // $thumbRelPathWithinImageDir es '.thumbnails/playa_300.jpg'
                            $fileData['thumbnailUrls'][(string)$size] = $imageBasePath . $imageOriginalRelativeDir . $thumbRelPathWithinImageDir;
                        }
                    }
                    // --- FIN DE NUEVA LÓGICA ---
                }
                $items[] = $fileData;
            }
        }

        // Lógica de ordenación
        if (!empty($items)) {
            usort($items, function($a, $b) use ($actualSortKey, $sortOrder, $sortType) {
                $valA = $a[$actualSortKey];
                $valB = $b[$actualSortKey];

                if ($sortType === 'numeric') {
                    $comparison = $valA <=> $valB;
                } else { // string, o default a string
                    // Para ordenar por extensión si sortBy es 'type', necesitamos comparar extensiones
                    if ($actualSortKey === 'name' && isset($_GET['sort_by']) && $_GET['sort_by'] === 'type') {
                        $extA = strtolower(pathinfo($a['name'], PATHINFO_EXTENSION));
                        $extB = strtolower(pathinfo($b['name'], PATHINFO_EXTENSION));
                        // Si las extensiones son iguales, ordena por nombre completo
                        if ($extA === $extB) {
                            $comparison = strnatcasecmp($a['name'], $b['name']);
                        } else {
                            $comparison = strnatcasecmp($extA, $extB);
                        }
                    } else {
                         $comparison = strnatcasecmp((string)$valA, (string)$valB); // Comparación natural insensible a mayúsculas/minúsculas
                    }
                }
                return ($sortOrder === 'asc') ? $comparison : -$comparison;
            });
        }
        error_log("[list_files] Items después de ordenar: " . print_r(array_column($items, 'name'), true));

        ResponseHandler::json(['success' => true, 'items' => $items, 'folder' => $folderName]);

    } elseif ($action === 'upload') {
        // Asegúrate que $baseDir esté definida globalmente antes de este punto.
        // Por ejemplo: $baseDir = 'E:\\WEBS\\axFinder\\storage'; O que venga de config.php
        if (!isset($baseDir) || !is_string($baseDir) || empty($baseDir)) {
            error_log("[files.php] Error crítico: \$baseDir no está definido o es inválido antes de llamar a handleUpload.");
            ResponseHandler::error("Error crítico de configuración del servidor (directorio base).", 500);
            exit;
        }
        handleUpload($baseDir);
    } elseif ($action === 'updateMetadata') {
        // Asegúrate que $baseDir esté definida globalmente.
        if (!isset($baseDir) || !is_string($baseDir) || empty($baseDir)) {
            error_log("[files.php] Error crítico: \$baseDir no está definido o es inválido antes de llamar a handleUpdateMetadata.");
            ResponseHandler::error("Error crítico de configuración del servidor (directorio base).", 500);
            exit;
        }
        handleUpdateMetadata($baseDir);
    } else {
        if (empty($action)) {
            error_log("[files.php] Error: La acción está vacía o no fue proporcionada en la URL.");
            ResponseHandler::error('Acción no especificada.', 400);
        } else {
            error_log("[files.php] Error: Acción no válida recibida: " . print_r($action, true));
            ResponseHandler::error('Acción no válida.', 400);
        }
    }
} catch (Throwable $e) {
    // Captura cualquier error o excepción no manejada previamente
    error_log("Error general en files.php: " . $e->getMessage() . " en " . $e->getFile() . ":" . $e->getLine());
    error_log("Stack trace: " . $e->getTraceAsString()); // Añadir stack trace para más detalle
    if (!headers_sent()) { // Solo enviar si no se ha enviado nada antes
        ResponseHandler::error('Ocurrió un error inesperado en el servidor. Revise los logs.', 500);
    }
    exit;
}