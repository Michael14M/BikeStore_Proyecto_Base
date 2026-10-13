/**
 * Cliente HTTP ÚNICO de Bike Store. Todo servicio (auth, productos, carrito,
 * pedidos, admin) pasa por `apiRequest`; ningún otro archivo llama a fetch().
 *
 * Centraliza: URL base (VITE_API_URL), cabecera Authorization con el JWT,
 * JSON/FormData, y la traducción de errores HTTP a mensajes amigables
 * (sin stack traces ni detalles internos).
 */
import { loadJSON, removeKey, saveJSON } from '../lib/storage';

const DEFAULT_API_URL = 'http://localhost:3000/api';

/** URL base de la API. Se configura con VITE_API_URL (ver .env.example). */
export const API_URL = String(import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

/** Origen del backend (sirve /uploads/...): http://localhost:3000 */
export const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
})();

/* ── Token JWT ────────────────────────────────────────────────────────
   Es lo ÚNICO de la sesión que se guarda en el navegador. El usuario y su
   rol NO se persisten: se recuperan del backend con GET /auth/me, porque la
   fuente de verdad del rol es el servidor, no el frontend. */
const TOKEN_KEY = 'token';
export const getToken = (): string | null => loadJSON<string | null>(TOKEN_KEY, null);
export const setToken = (token: string): void => saveJSON(TOKEN_KEY, token);
export const clearToken = (): void => removeKey(TOKEN_KEY);

/* ── Sesión expirada (401 con token) ─────────────────────────────────── */
let unauthorizedHandler: (() => void) | null = null;
/** App registra aquí qué hacer cuando el backend rechaza el token (limpiar sesión + aviso). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Rutas donde un 401 significa "credenciales incorrectas", no "sesión expirada". */
const AUTH_ENTRY_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

function friendlyMessage(status: number, backendMessage: string | undefined, path: string, hadToken: boolean): string {
  const isAuthEntry = AUTH_ENTRY_PATHS.some((p) => path.startsWith(p));
  switch (status) {
    case 401:
      return hadToken && !isAuthEntry
        ? 'Tu sesión expiró. Inicia sesión nuevamente.'
        : backendMessage || 'Credenciales incorrectas.';
    case 403:
      // En el login, el 403 es "cuenta desactivada": ese mensaje del backend es el útil.
      return path.startsWith('/auth/login') && backendMessage
        ? backendMessage
        : 'No tienes permisos para realizar esta acción.';
    case 404:
      return backendMessage || 'No se encontró lo que buscas.';
    case 400:
    case 409:
    case 422:
      return backendMessage || 'No se pudo completar la operación. Revisa los datos e intenta de nuevo.';
    default:
      return status >= 500
        ? 'Ocurrió un error temporal en el servidor. Intenta de nuevo en unos minutos.'
        : backendMessage || 'Ocurrió un error inesperado.';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Cuerpo JSON. */
  body?: unknown;
  /** Cuerpo multipart (subida de imágenes). */
  form?: FormData;
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form; // el navegador fija el boundary de multipart
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: options.method ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
  }

  let data: { message?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    // Respuesta sin JSON: se maneja por código de estado.
  }

  if (!response.ok) {
    const isAuthEntry = AUTH_ENTRY_PATHS.some((p) => path.startsWith(p));
    if (response.status === 401 && token && !isAuthEntry) {
      clearToken();
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, friendlyMessage(response.status, data?.message, path, Boolean(token)));
  }

  return data as T;
}

/** Mensaje para mostrar al usuario a partir de cualquier error capturado. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

/** Las imágenes subidas llegan como /uploads/...: viven en el backend, no en el frontend. */
export function resolveImageUrl(imagen: string | null | undefined): string {
  if (!imagen) return '';
  if (imagen.startsWith('/uploads/')) return `${API_ORIGIN}${imagen}`;
  return imagen;
}

/** Inverso de resolveImageUrl: al guardar, las imágenes subidas vuelven a su forma /uploads/... */
export function unresolveImageUrl(url: string): string {
  const prefix = `${API_ORIGIN}/uploads/`;
  return API_ORIGIN && url.startsWith(prefix) ? url.slice(API_ORIGIN.length) : url;
}
