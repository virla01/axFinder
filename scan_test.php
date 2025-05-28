<?php
declare(strict_types=1);

// Define the base directory for scanning
$baseDir = __DIR__ . DIRECTORY_SEPARATOR . 'storage';

// Function to recursively scan a directory
function scanDirectory(string $dirPath, string $relativePath = ''): array {
    $results = [
        'folders' => [],
        'files' => []
    ];

    if (!is_dir($dirPath) || !is_readable($dirPath)) {
        return $results; // Return empty if not a readable directory
    }

    $items = scandir($dirPath);
    if ($items === false) {
        return $results; // Return empty if scandir fails
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $itemFullPath = $dirPath . DIRECTORY_SEPARATOR . $item;
        $currentItemRelativePath = ltrim($relativePath . DIRECTORY_SEPARATOR . $item, DIRECTORY_SEPARATOR);

        if (is_dir($itemFullPath)) {
            $hasSubfolders = false;
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
            $results['folders'][] = [
                'name' => $item,
                'path' => $currentItemRelativePath,
                'hasSubfolders' => $hasSubfolders,
                'children' => scanDirectory($itemFullPath, $currentItemRelativePath) // Recursive call
            ];
        } else {
            $results['files'][] = [
                'name' => $item,
                'path' => $currentItemRelativePath,
                'size' => filesize($itemFullPath),
                'mtime' => filemtime($itemFullPath)
            ];
        }
    }

    return $results;
}

// Set headers for JSON output
header('Content-Type: application/json');

try {
    $storageDirName = basename($baseDir);
    $storageDirContent = scanDirectory($baseDir);

    $hasSubfolders = !empty($storageDirContent['folders']);
    $hasFiles = !empty($storageDirContent['files']);

    $rootFolder = [
        'name' => $storageDirName,
        'path' => $storageDirName,
        'hasSubfolders' => $hasSubfolders,
        'hasFiles' => $hasFiles,
        'children' => $storageDirContent
    ];

    echo json_encode(['success' => true, 'data' => [$rootFolder]], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error scanning directory: ' . $e->getMessage()]);
}

?>