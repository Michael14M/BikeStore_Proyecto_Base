/**
 * Capa de persistencia local para el prototipo Bike Store.
 *
 * IMPORTANTE (honestidad del prototipo):
 * Esto es SOLO localStorage del navegador, no una base de datos real ni un
 * backend. No hay cifrado de contraseñas (bcrypt) ni tokens de sesión reales
 * (JWT). Sirve para que el prototipo conserve carrito, sesión, productos,
 * usuarios y pedidos entre recargas mientras no exista un backend real
 * (ver RNF-04, RNF-05, RNF-06 pendientes en el análisis de requisitos).
 */

const PREFIX = 'bikestore:';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota excedida, etc.) — se ignora silenciosamente.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Ignorar
  }
}
