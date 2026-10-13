/**
 * Pedidos del panel admin: vienen de GET /api/admin/pedidos (MySQL). Los pedidos
 * se CREAN únicamente por el checkout real (POST /api/pedidos); aquí no se
 * inventa ni se guarda ninguno localmente.
 */
import type { Order, OrderStatus } from '../types';
import * as orderService from '../services/orderService';
import { createResource, useResource } from './resource';

const adminOrders = createResource<Order[]>([], orderService.fetchAdminOrders);

export const refreshAdminOrders = () => adminOrders.refresh();

export function useAllOrders(): Order[] {
  return useResource(adminOrders).data;
}

export function useAdminOrdersStatus() {
  const { loading, loaded, error } = useResource(adminOrders);
  return { loading, loaded, error };
}

export const getAdminOrdersSnapshot = (): Order[] => adminOrders.getState().data;

/** PUT /admin/pedidos/:id/estado y actualiza la fila en la cache. */
export async function setOrderStatus(id: number, status: OrderStatus): Promise<void> {
  const updated = await orderService.setAdminOrderStatus(id, status);
  adminOrders.setData(
    adminOrders.getState().data.map((o) => (o.id === id ? { ...o, status: updated.status } : o)),
  );
}

export function resetAdminOrders(): void {
  adminOrders.reset();
}
