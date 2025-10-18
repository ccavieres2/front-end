// src/lib/api.js

// URL base del backend (usa variable .env o localhost por defecto)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * Devuelve headers con token JWT (si existe en localStorage)
 */
function authHeaders() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Función general para hacer requests
 * - Soporta GET, POST, PUT, DELETE
 * - Maneja errores y parsea JSON automáticamente
 */
async function request(method, path, data = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE}${path}`, options);

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const errorMsg =
      (payload && (payload.detail || payload.message)) ||
      JSON.stringify(payload) ||
      "Error en la solicitud";
    throw new Error(errorMsg);
  }

  return payload;
}

/**
 * Métodos exportados para usar fácilmente en el front-end
 */
export const apiGet = (path) => request("GET", path);
export const apiPost = (path, data) => request("POST", path, data);
export const apiPut = (path, data) => request("PUT", path, data);
export const apiDelete = (path) => request("DELETE", path);
