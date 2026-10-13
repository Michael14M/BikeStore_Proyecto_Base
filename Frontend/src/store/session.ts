/**
 * Datos locales que SOBREVIVEN a la integración con el backend (y por qué):
 *
 *  - token JWT: ver services/apiClient.ts. Es lo único de la sesión que se guarda.
 *  - carrito de INVITADO: el backend solo tiene carrito para usuarios autenticados.
 *    Quien aún no inició sesión puede ir armando su carrito (como antes); es una
 *    cache temporal de UI. Al iniciar sesión se fusiona con el carrito del backend
 *    y se borra de aquí. Con sesión iniciada, el carrito vive SOLO en MySQL.
 *
 * Todo lo demás que antes vivía en localStorage (productos, usuarios con contraseña,
 * pedidos, usuario/rol de la sesión) se eliminó: ahora viene de la API.
 */
import type { CartItem } from '../types';
import { loadJSON, removeKey, saveJSON } from '../lib/storage';

const GUEST_CART_KEY = 'cart';

/** Carrito de invitado. Descarta entradas del formato anterior (sin id numérico de producto). */
export function loadGuestCart(): CartItem[] {
  const raw = loadJSON<unknown>(GUEST_CART_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (i): i is CartItem =>
      !!i &&
      typeof i === 'object' &&
      typeof i.product?.idProducto === 'number' &&
      Number.isInteger(i.quantity) &&
      i.quantity > 0,
  );
}

export function saveGuestCart(cart: CartItem[]): void {
  saveJSON(GUEST_CART_KEY, cart);
}

export function clearGuestCart(): void {
  removeKey(GUEST_CART_KEY);
}

/** Borra datos de versiones anteriores del prototipo (incluye contraseñas en texto plano). */
export function purgeLegacyLocalData(): void {
  for (const key of ['products', 'users', 'orders', 'session_user']) removeKey(key);
}
