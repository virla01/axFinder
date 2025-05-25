<!-- ELIMINA TODA REFERENCIA A LOGIN Y ROLES Y BASE DE DATOS TAMBIEN REFERENCIAS A PUBLIC -->

# axFinder - Gestor de Archivos Multimedia Modular

AxFinder es un gestor de archivos multimedia modular y configurable, diseñado para permitir la visualización, organización y edición de archivos de forma sencilla e intuitiva. Puede ser implementado en cualquier página web o integrado en frameworks PHP.

## Características Principales

*   **Backend PHP desacoplado**: La lógica de gestión de archivos (`core/FileManager.php`) es una biblioteca independiente.
*   **API RESTful**: Expone endpoints para operaciones de archivos (listar, crear carpeta, subir, renombrar, eliminar) a través de `api/v1/files.php`.
*   **Configurable**: Las rutas base, tipos de archivo permitidos y límites de tamaño se gestionan a través de `config/config.php`.
*   **Frontend Vanilla JS**: Interfaz de usuario básica en `index.html` que consume la API PHP.
*   **Manejo de Errores**: Utiliza excepciones PHP estándar y respuestas JSON estructuradas.

## Estructura del Proyecto

```
axFinder/
├── api/
│   └── v1/
│       └── files.php       # Adaptador HTTP para FileManager, maneja peticiones y respuestas JSON.
├── config/
│   └── config.php          # Configuración principal (rutas, tipos de archivo, etc.).
├── core/
│   ├── FileManager.php     # Biblioteca principal para la lógica de gestión de archivos.
│   ├── ResponseHandler.php # Utilidad para formatear respuestas JSON consistentes.
│   └── ErrorHandler.php    # (Opcional) Manejo global de errores (actualmente simplificado).
├── public/
│   ├── .htaccess           # Reglas de Apache para enrutar todo a index.php (si se usa Apache).
│   └── index.php           # Punto de entrada para la API (carga config y delega a files.php).
├── index.html              # Interfaz de usuario principal (frontend con Vanilla JS).
└── README.md               # Este archivo.
```

**Nota**: El directorio `uploads/` (o el configurado en `base_path` dentro de `config.php`) es donde se almacenarán los archivos gestionados. Este directorio debe ser creado manualmente y tener permisos de escritura para el servidor web.

## Requisitos

*   PHP 8.0 o superior (recomendado 8.1+).
*   Servidor web (Apache, Nginx, Laragon, XAMPP, etc.).
*   Extensión PHP `fileinfo` (para detección de tipos MIME).

## Configuración

1.  **Clonar/Descargar el proyecto.**
2.  **Configurar el servidor web:**
    *   Asegúrate de que el `DocumentRoot` de tu servidor web apunte al directorio raíz del proyecto `axFinder/` si vas a acceder a `index.html` directamente.
    *   Si usas Apache y quieres URLs amigables para la API (ej. `http://localhost/api/v1/files` en lugar de `http://localhost/public/index.php/api/v1/files`), el `DocumentRoot` debería apuntar a `axFinder/public/` y `mod_rewrite` debe estar habilitado.
3.  **Crear el directorio de subidas:**
    *   Crea el directorio especificado en `$config['base_path']` dentro de `config/config.php` (por defecto, podría ser un subdirectorio como `uploads/` dentro de `axFinder/`).
    *   Asegúrate de que este directorio tenga permisos de escritura para el usuario del servidor web (ej. `www-data`).
4.  **Revisar `config/config.php`:**
    *   `'base_path'`: Ruta absoluta en el servidor al directorio raíz donde se gestionarán los archivos. Ejemplo: `__DIR__ . '/../../uploads_directorio_real'`. Es crucial que esta ruta sea correcta y segura.
    *   `'allowed_file_types'`: Array de extensiones de archivo permitidas.
    *   `'max_file_size_mb'`: Tamaño máximo de archivo permitido en MB.
    *   `'base_url_for_api'`: (Opcional, si se necesita) URL base para la API si es diferente del frontend.
    *   `'cors'`: Configuración para Cross-Origin Resource Sharing si el frontend y backend están en dominios diferentes.
    *   `'debug_mode'`: `true` para desarrollo (muestra más errores), `false` para producción.

## Uso

1.  **Iniciar el servidor web** (ej. Laragon, XAMPP, o el servidor interno de PHP para desarrollo: `php -S localhost:8000 -t public` si quieres servir la API desde `public/` o `php -S localhost:8000` desde la raíz para servir `index.html`).
2.  **Acceder a `index.html`** en tu navegador (ej. `http://localhost/axFinder/index.html` o `http://localhost:8000/index.html` dependiendo de tu configuración).
    La interfaz permitirá interactuar con la API para listar, crear carpetas, subir, renombrar y eliminar archivos.

## Endpoints de la API (`api/v1/files.php`)

La API responde a peticiones `GET` y `POST` al script `api/v1/files.php`.
Las acciones se determinan por el parámetro `action` en la query string (para GET) o en el cuerpo `FormData` (para POST).

*   **`GET ?action=list&path={encodedPath}`**: Lista archivos y carpetas.
    *   `path`: (Opcional) Ruta relativa dentro de `base_path`.
*   **`POST (action=upload)`**: Sube uno o más archivos.
    *   Debe ser una petición `multipart/form-data`.
    *   Campo `path`: Directorio de destino relativo a `base_path`.
    *   Campo `files[]`: Array de archivos a subir.
*   **`POST (action=create_folder)`**: Crea una nueva carpeta.
    *   Campo `path`: Ruta donde se creará la nueva carpeta (relativa a `base_path`).
    *   Campo `name`: Nombre de la nueva carpeta.
*   **`POST (action=delete)`**: Elimina un archivo o carpeta.
    *   Campo `path`: Ruta al elemento a eliminar (relativa a `base_path`).
*   **`POST (action=rename)`**: Renombra un archivo o carpeta.
    *   Campo `path`: Ruta actual al elemento.
    *   Campo `newName`: Nuevo nombre para el elemento.

## Próximos Pasos y Mejoras Potenciales

*   **Más Funcionalidades**: Añadir operaciones como mover, copiar, buscar, obtener información detallada, previsualizaciones de imágenes/video.
*   **Pruebas**: Escribir pruebas unitarias y de integración.
*   **Interfaz de Usuario**: Mejorar la UX/UI, añadir drag & drop, selección múltiple avanzada, indicadores de progreso, etc.
*   **Modularización del Frontend**: Separar el JavaScript de `index.html` a su propio archivo `.js`.