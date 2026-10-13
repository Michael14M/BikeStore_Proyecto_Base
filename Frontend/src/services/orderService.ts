import type { Order, OrderItem, OrderStatus, PaymentMethod } from '../types';
import { apiRequest, resolveImageUrl } from './apiClient';

interface ApiDetalle {
  id_producto: number;
  nombre_producto: string;
  imagen_producto: string | null;
  precio_unitario: number;
  cantidad: number;
}

/** Cubre tanto el listado (resumen) como el detalle (con `items`, dirección, etc.). */
interface ApiPedido {
  id_pedido: number;
  numero_pedido: string;
  subtotal: number;
  envio: number;
  total: number;
  metodo_pago: PaymentMethod;
  estado: OrderStatus;
  fecha: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  items?: ApiDetalle[];
}

export function mapPedido(p: ApiPedido): Order {
  const items: OrderItem[] = (p.items ?? []).map((d) => ({
    productId: String(d.id_producto),
    name: d.nombre_producto,
    image: resolveImageUrl(d.imagen_producto),
    price: Number(d.precio_unitario),
    quantity: d.cantidad,
  }));
  return {
    id: p.id_pedido,
    hasDetail: Array.isArray(p.items),
    orderNumber: p.numero_pedido,
    customerName: p.cliente_nombre ?? '',
    customerEmail: p.cliente_email ?? '',
    items,
    subtotal: Number(p.subtotal),
    shipping: Number(p.envio),
    total: Number(p.total),
    paymentMethod: p.metodo_pago,
    address: p.direccion ?? '',
    city: p.ciudad ?? '',
    phone: p.telefono ?? '',
    date: p.fecha,
    status: p.estado,
  };
}

/** Lo ÚNICO que se envía al crear un pedido. Precios, subtotal, total, envío y stock los calcula el backend. */
export interface CreateOrderInput {
  address: string;
  city: string;
  phone: string;
  paymentMethod: PaymentMethod;
}

/** POST /pedidos — crea el pedido desde el carrito del usuario autenticado (transacción en el backend). */
export const createOrder = (input: CreateOrderInput) =>
  apiRequest<{ pedido: ApiPedido }>('/pedidos', {
    method: 'POST',
    body: {
      direccion: input.address,
      ciudad: input.city,
      telefono: input.phone,
      metodo_pago: input.paymentMethod,
    },
  }).then((r) => mapPedido(r.pedido));

/** GET /pedidos — historial del cliente autenticado. */
export const fetchMyOrders = () =>
  apiRequest<{ pedidos: ApiPedido[] }>('/pedidos').then((r) => r.pedidos.map(mapPedido));

/** GET /pedidos/:id — detalle de un pedido propio. */
export const fetchMyOrder = (id: number) =>
  apiRequest<{ pedido: ApiPedido }>(`/pedidos/${id}`).then((r) => mapPedido(r.pedido));

/* ── Administración ── */

/** GET /admin/pedidos */
export const fetchAdminOrders = () =>
  apiRequest<{ pedidos: ApiPedido[] }>('/admin/pedidos').then((r) => r.pedidos.map(mapPedido));

/** GET /admin/pedidos/:id */
export const fetchAdminOrder = (id: number) =>
  apiRequest<{ pedido: ApiPedido }>(`/admin/pedidos/${id}`).then((r) => mapPedido(r.pedido));

/** PUT /admin/pedidos/:id/estado */
export const setAdminOrderStatus = (id: number, estado: OrderStatus) =>
  apiRequest<{ pedido: ApiPedido }>(`/admin/pedidos/${id}/estado`, { method: 'PUT', body: { estado } }).then((r) =>
    mapPedido(r.pedido),
  );
