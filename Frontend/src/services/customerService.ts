import type { Product, User } from '../types';
import { apiRequest } from './apiClient';
import { mapProducto } from './productService';

interface ApiUser { id_usuario: number; nombre: string; email: string; rol: User['role']; activo: number }
export async function updateProfile(input: { nombre: string; email: string }): Promise<User> {
  const res = await apiRequest<{ user: ApiUser }>('/auth/me', { method: 'PUT', body: input });
  return { id: res.user.id_usuario, name: res.user.nombre, email: res.user.email, role: res.user.rol };
}
export async function fetchWishlist(): Promise<Product[]> {
  const res = await apiRequest<{ productos: any[] }>('/lista-deseos');
  return res.productos.map(mapProducto);
}
export async function addWishlist(idProducto: number): Promise<void> {
  await apiRequest('/lista-deseos', { method: 'POST', body: { id_producto: idProducto } });
}
export async function removeWishlist(idProducto: number): Promise<void> {
  await apiRequest(`/lista-deseos/${idProducto}`, { method: 'DELETE' });
}
