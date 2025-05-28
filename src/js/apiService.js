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

export const api = {
	testConnection: () => request('test_connection'),
	fetchFolders: (path = '') => request('list_folders', { path }),
	fetchFiles: (path = '', sortBy = 'name', sortOrder = 'asc') => {
		return request('list_files', { folder: path, sort_by: sortBy, sort_order: sortOrder });
	},
	createFolder: (path, folderName) => request('create_folder', { path, folder_name: folderName }),
	// ... otros endpoints como delete, rename, upload, etc.
};