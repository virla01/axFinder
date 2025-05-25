# axFinder API

Una API PHP para la gestión de archivos, inspirada en CKFinder pero diseñada para ser un backend independiente.

## Estructura del Proyecto

```
axFinder/
├── api/                    # Endpoints de la API (Controladores)
│   └── v1/
│       └── files.php       # Controlador para operaciones de archivos y carpetas
│       └── (otros_controladores.php)
├── config/
│   └── config.php          # Archivo de configuración principal
├── core/
│   ├── AuthHandler.php     # Lógica de autenticación y autorización
│   ├── ErrorHandler.php    # Manejo global de errores y excepciones
│   ├── FileManager.php     # Lógica principal para la gestión de archivos/carpetas
│   └── ResponseHandler.php # Utilidades para formatear respuestas JSON
├── public/                 # Directorio público accesible desde la web
│   ├── .htaccess           # Reglas de reescritura para Apache (URLs amigables)
│   └── index.php           # Punto de entrada principal y router de la API
└── uploads/                # Directorio para los archivos subidos (protegido)
└── README.md               # Este archivo
```

## Requisitos

*   PHP 8.0 o superior (recomendado 8.1+)
*   Servidor web (Apache con `mod_rewrite` o Nginx)
*   Extensión PHP `fileinfo` (para `mime_content_type`)
*   (Opcional) Composer para manejo de dependencias futuras (ej. para JWT, logging avanzado).

## Configuración

1.  **Clonar/Descargar el proyecto.**
2.  **Configurar el servidor web:**
    *   Asegúrate de que el `DocumentRoot` de tu servidor web apunte al directorio `public/`.
    *   Para Apache, `mod_rewrite` debe estar habilitado para que `.htaccess` funcione.
    *   Para Nginx, necesitarás configurar las reglas de reescritura equivalentes.
3.  **Crear el directorio `uploads/`:**
    *   Asegúrate de que el directorio `axFinder/uploads/` exista y tenga permisos de escritura para el usuario del servidor web (ej. `www-data`).
4.  **Configurar `config/config.php`:**
    *   Abre `config/config.php`.
    *   Ajusta `'base_path'`: Si tu aplicación está en `http://localhost/axFinder/`, el `base_path` debe ser `'/axFinder/public'`. Si está en la raíz del dominio, podría ser `''` o `'/'` dependiendo de tu `index.php` y `.htaccess`.
    *   Ajusta `'upload_dir'` si es necesario (aunque por defecto debería funcionar).
    *   Configura `'jwt_secret_key'` con una cadena aleatoria y segura si planeas usar autenticación JWT.
    *   Revisa `'allowed_file_types'` y `'max_file_size_mb'`.
    *   Ajusta `'cors'` si tu frontend se sirve desde un origen diferente.
    *   Establece `'debug_mode'` a `false` en producción.
5.  **(Opcional) Instalar dependencias con Composer:**
    *   Si se añaden dependencias (ej. `firebase/php-jwt`), ejecuta `composer install` en la raíz del proyecto.

## Endpoints de la API (Ejemplos Iniciales bajo `/api/v1/files`)

La base de la URL para los endpoints será algo como `http://tu-dominio.com/BASE_PATH_CONFIGURADO/api/v1/`.
Si `base_path` es `'/axFinder/public'`, entonces `http://tu-dominio.com/axFinder/public/api/v1/`.

*   **`GET /files/list[/{encodedPath}]`**: Lista archivos y carpetas.
    *   `{encodedPath}`: (Opcional) Ruta relativa codificada en URL dentro del directorio `uploads`. Ejemplo: `subfolder%2Fanotherfolder`.
    *   Si no se provee `encodedPath`, lista la raíz del directorio `uploads`.
*   **`POST /files/upload`**: Sube uno o más archivos.
    *   Debe ser una petición `multipart/form-data`.
    *   Los archivos se envían bajo cualquier nombre de campo (ej. `myFile`, `files[]`).
    *   Puede incluir un campo `destination` (opcional) para especificar una subcarpeta de destino.
*   **`POST /files/createfolder`**: Crea una nueva carpeta.
    *   Cuerpo JSON: `{ "path": "ruta/relativa/a/nueva_carpeta" }`
*   **`DELETE /files/delete`**: Elimina un archivo o carpeta.
    *   Cuerpo JSON: `{ "path": "ruta/relativa/a/elemento_a_eliminar" }`
*   **`PUT /files/rename`**: Renombra un archivo o carpeta.
    *   Cuerpo JSON: `{ "old_path": "ruta/relativa/actual", "new_name": "nuevo_nombre_sin_ruta" }`

**Autenticación:**
Actualmente, `AuthHandler.php` tiene placeholders. La autenticación real (ej. JWT) necesita ser implementada. Por defecto, para desarrollo inicial, `AuthHandler::isAuthenticated()` puede devolver `true` temporalmente, pero `AuthHandler::requireAuth()` se llama en los métodos del controlador.

## Cómo Probar

Puedes usar herramientas como Postman o Insomnia para probar los endpoints de la API.

1.  Asegúrate de que tu servidor web esté corriendo y configurado correctamente.
2.  Envía peticiones a los endpoints listados arriba.
    *   Para `POST`, `PUT`, `DELETE` que esperan un cuerpo JSON, asegúrate de establecer la cabecera `Content-Type: application/json`.
    *   Para subida de archivos, usa `multipart/form-data`.

## Próximos Pasos Sugeridos

*   Implementar un sistema de autenticación robusto (JWT es una buena opción).
*   Añadir logging más detallado (ej. con Monolog).
*   Expandir `FileManager.php` con más funcionalidades (mover, copiar, buscar, obtener información detallada de archivos, previsualizaciones).
*   Crear más controladores para otras entidades si es necesario (ej. `users.php` si hay gestión de usuarios).
*   Escribir pruebas unitarias y de integración.
*   Mejorar la sanitización de entradas y la seguridad general.
*   Considerar el uso de una librería de routing más avanzada para `public/index.php`.
*   Implementar la gestión de permisos por usuario/rol para acceder a diferentes archivos/carpetas.