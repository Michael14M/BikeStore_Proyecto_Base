import type { Product } from '../types';
import { apiRequest, resolveImageUrl, unresolveImageUrl } from './apiClient';

/** Producto tal como lo devuelve el backend (tabla productos). */
interface ApiProducto {
  id_producto: number;
  slug: string;
  nombre: string;
  marca: string;
  categoria: Product['category'];
  precio: number;
  precio_anterior: number | null;
  imagen: string | null;
  rating: number;
  descripcion: string;
  stock: number;
  activo: number;
}

export function mapProducto(p: ApiProducto): Product {
  return {
    id: p.slug,
    idProducto: p.id_producto,
    name: p.nombre,
    brand: p.marca,
    category: p.categoria,
    price: Number(p.precio),
    originalPrice: p.precio_anterior != null ? Number(p.precio_anterior) : undefined,
    image: resolveImageUrl(p.imagen),
    rating: Number(p.rating),
    isOffer: p.precio_anterior != null,
    description: p.descripcion,
    stock: p.stock,
    active: Boolean(p.activo),
  };
}

/** Datos editables de un producto en el formulario del panel admin. */
export interface ProductDraft {
  name: string;
  brand: string;
  category: Product['category'];
  price: number;
  originalPrice?: number;
  /** URL escrita a mano; la imagen subida como archivo se envía aparte (uploadProductImage). */
  image: string;
  rating: number;
  description: string;
  stock: number;
  active: boolean;
}

function toApiPayload(d: ProductDraft) {
  return {
    nombre: d.name,
    marca: d.brand,
    categoria: d.category,
    precio: d.price,
    precio_anterior: d.originalPrice ?? null,
    imagen: d.image ? unresolveImageUrl(d.image) : null,
    rating: d.rating,
    descripcion: d.description,
    stock: d.stock,
    activo: d.active,
  };
}

/** GET /productos — catálogo público (solo activos). */
export async function fetchCatalog(): Promise<Product[]> {
  const res = await apiRequest<{ productos: ApiProducto[] }>('/productos');
  return res.productos.map(mapProducto);
}

/** GET /productos?incluirInactivos=true — solo lo respeta el backend si el JWT es de un admin. */
export async function fetchAdminCatalog(): Promise<Product[]> {
  const res = await apiRequest<{ productos: ApiProducto[] }>('/productos?incluirInactivos=true');
  return res.productos.map(mapProducto);
}

/** GET /productos/:id */
export async function fetchProduct(idProducto: number): Promise<Product> {
  const res = await apiRequest<{ producto: ApiProducto }>(`/productos/${idProducto}`);
  return mapProducto(res.producto);
}

/** POST /productos (admin). El slug lo genera el backend a partir del nombre. */
export async function createProduct(draft: ProductDraft): Promise<Product> {
  const res = await apiRequest<{ producto: ApiProducto }>('/productos', { method: 'POST', body: toApiPayload(draft) });
  return mapProducto(res.producto);
}

/** PUT /productos/:id (admin). */
export async function updateProduct(idProducto: number, draft: ProductDraft): Promise<Product> {
  const res = await apiRequest<{ producto: ApiProducto }>(`/productos/${idProducto}`, {
    method: 'PUT',
    body: toApiPayload(draft),
  });
  return mapProducto(res.producto);
}

/** PUT /productos/:id con solo {activo} — baja/alta lógica. */
export async function setProductActive(idProducto: number, active: boolean): Promise<Product> {
  const res = await apiRequest<{ producto: ApiProducto }>(`/productos/${idProducto}`, {
    method: 'PUT',
    body: { activo: active },
  });
  return mapProducto(res.producto);
}

/** DELETE /productos/:id (admin). El backend lo rechaza (409) si el producto tiene carritos/pedidos. */
export async function deleteProduct(idProducto: number): Promise<void> {
  await apiRequest(`/productos/${idProducto}`, { method: 'DELETE' });
}

/** POST /productos/:id/imagen (admin) — multipart, campo "imagen" (jpg/png/webp, máx. 2 MB). */
export async function uploadProductImage(idProducto: number, file: File): Promise<Product> {
  const form = new FormData();
  form.append('imagen', file);
  const res = await apiRequest<{ producto: ApiProducto }>(`/productos/${idProducto}/imagen`, {
    method: 'POST',
    form,
  });
  return mapProducto(res.producto);
}
