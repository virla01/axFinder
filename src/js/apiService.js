// src/js/apiService.js

const API_BASE_URL = 'http://localhost:8000/src/api/files.php'; // Corregido según la indicación del usuario

async function request(action, params = {}) {
	const url = new URL(API_BASE_URL);
	// Si API_BASE_URL ya es la URL completa del script PHP, no necesitamos window.location.origin
	// y tampoco necesitamos añadir /src/api/files.php si ya está incluido.
	// Asumimos que API_BASE_URL es la URL completa al script files.php

	url.searchParams.append('action', action);
	for (const key in params) {
		if (params.hasOwnProperty(key) && params[key] !== undefined) {
			url.searchParams.append(key, params[key]);
		}
	}

	console.log(`[ApiService] Requesting: ${url.toString()}`);

	try {
		const response = await fetch(url);
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ApiService] HTTP error! status: ${response.status}, text: ${errorText}`);
			throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
		}
		const data = await response.json();
		console.log(`[ApiService] Response for ${action}:`, data);
		if (data.error) {
			console.error(`[ApiService] API Error for ${action}: ${data.error}`);
			throw new Error(data.error);
		}
		return data;
	} catch (error) {
		console.error(`[ApiService] Fetch error for ${action}:`, error);
		throw error; // Re-lanzar para que el llamador lo maneje
	}
}

async function postRequest(action, bodyParams = {}) {
    const url = new URL(API_BASE_URL);
    // La acción puede ir en la URL para consistencia con GET, o solo en el body si se prefiere.
    url.searchParams.append('action', action);

    console.log(`[ApiService] POST Requesting action '${action}' to ${url.toString()} with body:`, bodyParams);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                // Si PHP espera application/x-www-form-urlencoded (típico con $_POST)
                'Content-Type': 'application/x-www-form-urlencoded',
                // Si PHP espera JSON (necesitarías leer php://input y json_decode)
                // 'Content-Type': 'application/json',
            },
            // Para application/x-www-form-urlencoded
            body: new URLSearchParams(bodyParams)
            // Si fuera JSON: body: JSON.stringify(bodyParams)
        });

        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (e) {
                // no hacer nada si el texto no se puede leer
            }
            console.error(`[ApiService] HTTP error! status: ${response.status}, text: ${errorText}`);
            throw new Error(`Error del servidor: ${response.status}${errorText ? ' - ' + errorText : ''}`);
        }

        const data = await response.json();
        console.log(`[ApiService] POST Response for ${action}:`, data);

        if (data.error) {
            console.error(`[ApiService] API Error for ${action} (POST): ${data.error}`);
            throw new Error(data.error);
        }
        return data;
    } catch (error) {
        console.error(`[ApiService] Fetch error for ${action} (POST):`, error);
        // Asegurarse de que el error propagado sea un objeto Error
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(String(error));
        }
    }
}

export const api = {
	testConnection: () => request('test_connection'),
	fetchFolders: (path = '') => request('list_folders', { path }),
	fetchFiles: (path = '', sortBy = 'name', sortOrder = 'asc') => {
		return request('list_files', { folder: path, sort_by: sortBy, sort_order: sortOrder });
	},
	createFolder: (path, folderName) => request('create_folder', { path, folder_name: folderName }),

	/**
	 * Obtiene la configuración del servidor, como la vista por defecto.
	 * @returns {Promise<Object>} Una promesa que resuelve con los datos de configuración del servidor.
	 */
	fetchServerConfig: () => request('get_config'),
	checkFolderEmpty: (path) => request('check_folder_empty', { path }),
	deleteFolder: (path) => postRequest('delete_folder', { path }),
	renameFolder: (currentPath, newName) => postRequest('rename_folder', { path: currentPath, new_name: newName }),

	/**
	 * Sube un archivo con sus metadatos.
	 * @param {FormData} formData - El objeto FormData que contiene el archivo y los metadatos.
	 * @returns {Promise<object>} - Una promesa que resuelve a la respuesta JSON del servidor.
	 */
	async uploadFile(formData) { // Asumo que esta función ya la tienes o la crearás para la subida del modal
		try {
			const response = await fetch(`${API_BASE_URL}?action=upload`, { // Endpoint de ejemplo
				method: 'POST',
				body: formData, // FormData se envía directamente, el navegador pone el Content-Type
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				return { success: false, message: `Error del servidor: ${errorData.message || response.status}` };
			}
			return await response.json();
		} catch (error) {
			console.error('[ApiService] Excepción al subir archivo:', error);
			return { success: false, message: error.message || 'Error de conexión o red.' };
		}
	},

	/**
	 * Actualiza los metadatos de un archivo de imagen.
	 * @param {object} data - Un objeto que contiene la ruta del archivo y los nuevos metadatos.
	 * @param {string} data.path - La ruta del archivo de imagen (ej: "Fotos/imagen.jpg").
	 * @param {object} data.metadata - El objeto con los metadatos actualizados.
	 * @returns {Promise<object>} - Una promesa que resuelve a la respuesta JSON del servidor.
	 */
	async updateImageMetadata(data) {
		const { path, metadata } = data;
		try {
			const response = await fetch(`${API_BASE_URL}?action=updateMetadata`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ path, metadata }), // path es la ruta completa del archivo, no solo la carpeta
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				console.error('[ApiService] Error HTTP al actualizar metadatos:', response.status, errorData);
				return { success: false, message: `Error del servidor: ${errorData.message || response.status}` };
			}

			const result = await response.json();
			console.log('[ApiService] Respuesta de updateImageMetadata:', result);
			return result;

		} catch (error) {
			console.error('[ApiService] Excepción al actualizar metadatos:', error);
			return { success: false, message: error.message || 'Error de conexión o red.' };
		}
	}

	// ... otros endpoints como delete, rename, etc.
};