import type { CartItem, Product } from '../types';
import { apiRequest, resolveImageUrl } from './apiClient';

interface ApiCartItem {
  id_carrito_item: number;
  id_producto: number;
  cantidad: number;
  nombre: string;
  marca: string;
  imagen: string | null;
  precio: number;
  stock: number;
  activo: number;
}

export interface ApiCarrito {
  id_carrito: number;
  items: ApiCartItem[];
}

/**
 * Convierte el carrito del backend a CartItem[]. El backend es la fuente de verdad
 * del precio, la cantidad y el stock; del catálogo cargado solo se toma lo que el
 * carrito no trae (slug, categoría, rating, descripción) para reutilizar los
 * componentes visuales sin cambios.
 */
export function mapCart(api: ApiCarrito, catalog: Product[]): CartItem[] {
  return api.items.map((it) => {
    const known = catalog.find((p) => p.idProducto === it.id_producto);
    const product: Product = {
      id: known?.id ?? `p-${it.id_producto}`,
      idProducto: it.id_producto,
      name: it.nombre,
      brand: it.marca,
      category: known?.category ?? 'accesorios',
      price: Number(it.precio),
      originalPrice: known?.originalPrice,
      image: resolveImageUrl(it.imagen),
      rating: known?.rating ?? 0,
      isOffer: known?.isOffer,
      description: known?.description ?? '',
      stock: it.stock,
      active: Boolean(it.activo),
    };
    return { product, quantity: it.cantidad, itemId: it.id_carrito_item };
  });
}

/** GET /carrito */
export const fetchCart = () => apiRequest<{ carrito: ApiCarrito }>('/carrito').then((r) => r.carrito);

/** POST /carrito/items — OJO: el backend SUMA `cantidad` a la que ya exista. Solo se envía id y cantidad (nunca precio). */
export const addCartItem = (idProducto: number, cantidad: number) =>
  apiRequest<{ carrito: ApiCarrito }>('/carrito/items', {
    method: 'POST',
    body: { id_producto: idProducto, cantidad },
  }).then((r) => r.carrito);

/** PUT /carrito/items/:id — fija la cantidad exacta. */
export const setCartItemQuantity = (itemId: number, cantidad: number) =>
  apiRequest<{ carrito: ApiCarrito }>(`/carrito/items/${itemId}`, { method: 'PUT', body: { cantidad } }).then(
    (r) => r.carrito,
  );

/** DELETE /carrito/items/:id */
export const removeCartItem = (itemId: number) =>
  apiRequest<{ carrito: ApiCarrito }>(`/carrito/items/${itemId}`, { method: 'DELETE' }).then((r) => r.carrito);

/** DELETE /carrito */
export const clearCart = () => apiRequest<{ carrito: ApiCarrito }>('/carrito', { method: 'DELETE' }).then((r) => r.carrito);
