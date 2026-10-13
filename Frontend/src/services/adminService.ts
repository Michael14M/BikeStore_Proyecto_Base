import type { AdminUser, DashboardData, OrderStatus, UserRole } from '../types';
import { apiRequest } from './apiClient';

interface ApiAdminUser {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: number;
  creado_en: string;
}

const mapAdminUser = (u: ApiAdminUser): AdminUser => ({
  id: u.id_usuario,
  name: u.nombre,
  email: u.email,
  role: u.rol,
  active: Boolean(u.activo),
  createdAt: u.creado_en,
});

/** GET /admin/usuarios */
export const fetchAdminUsers = () =>
  apiRequest<{ usuarios: ApiAdminUser[] }>('/admin/usuarios').then((r) => r.usuarios.map(mapAdminUser));

/** GET /admin/usuarios/:id */
export const fetchAdminUser = (id: number) =>
  apiRequest<{ usuario: ApiAdminUser }>(`/admin/usuarios/${id}`).then((r) => mapAdminUser(r.usuario));

/** PUT /admin/usuarios/:id (nombre y/o email) */
export const updateAdminUser = (id: number, data: { name?: string; email?: string }) =>
  apiRequest<{ usuario: ApiAdminUser }>(`/admin/usuarios/${id}`, {
    method: 'PUT',
    body: { nombre: data.name, email: data.email },
  }).then((r) => mapAdminUser(r.usuario));

/** PUT /admin/usuarios/:id/rol */
export const setAdminUserRole = (id: number, rol: UserRole) =>
  apiRequest<{ usuario: ApiAdminUser }>(`/admin/usuarios/${id}/rol`, { method: 'PUT', body: { rol } }).then((r) =>
    mapAdminUser(r.usuario),
  );

/** PUT /admin/usuarios/:id/estado */
export const setAdminUserActive = (id: number, activo: boolean) =>
  apiRequest<{ usuario: ApiAdminUser }>(`/admin/usuarios/${id}/estado`, { method: 'PUT', body: { activo } }).then(
    (r) => mapAdminUser(r.usuario),
  );

/** DELETE /admin/usuarios/:id — el backend lo rechaza (409) si el usuario tiene pedidos. */
export const deleteAdminUser = (id: number) => apiRequest(`/admin/usuarios/${id}`, { method: 'DELETE' });

/* ── Dashboard ── */

interface ApiDashboard {
  productos: Record<'total_productos' | 'productos_activos' | 'productos_inactivos' | 'productos_sin_stock' | 'productos_stock_bajo', number | string>;
  usuarios: Record<'total_usuarios' | 'total_clientes' | 'total_admins' | 'usuarios_activos' | 'usuarios_inactivos', number | string>;
  pedidos: Record<
    'total_pedidos' | 'ventas_totales' | 'pedidos_pendientes' | 'pedidos_procesando' | 'pedidos_completados' | 'pedidos_cancelados',
    number | string
  >;
  pedidos_recientes: { id_pedido: number; numero_pedido: string; total: number; estado: OrderStatus; fecha: string; cliente_nombre: string }[];
  top_productos: { id_producto: number; nombre_producto: string; unidades_vendidas: number | string; ingresos: number | string }[];
  productos_stock_bajo: { id_producto: number; slug: string; nombre: string; stock: number }[];
}

/** GET /admin/dashboard — métricas agregadas con SQL real. (Los SUM de MySQL pueden llegar como string.) */
export async function fetchDashboard(): Promise<DashboardData> {
  const d = await apiRequest<ApiDashboard>('/admin/dashboard');
  const n = (v: number | string) => Number(v);
  return {
    productos: {
      total: n(d.productos.total_productos),
      activos: n(d.productos.productos_activos),
      inactivos: n(d.productos.productos_inactivos),
      sinStock: n(d.productos.productos_sin_stock),
      stockBajo: n(d.productos.productos_stock_bajo),
    },
    usuarios: {
      total: n(d.usuarios.total_usuarios),
      clientes: n(d.usuarios.total_clientes),
      admins: n(d.usuarios.total_admins),
      activos: n(d.usuarios.usuarios_activos),
      inactivos: n(d.usuarios.usuarios_inactivos),
    },
    pedidos: {
      total: n(d.pedidos.total_pedidos),
      ventasTotales: n(d.pedidos.ventas_totales),
      pendientes: n(d.pedidos.pedidos_pendientes),
      procesando: n(d.pedidos.pedidos_procesando),
      completados: n(d.pedidos.pedidos_completados),
      cancelados: n(d.pedidos.pedidos_cancelados),
    },
    pedidosRecientes: d.pedidos_recientes.map((p) => ({
      id: p.id_pedido,
      orderNumber: p.numero_pedido,
      total: n(p.total),
      status: p.estado,
      date: p.fecha,
      customerName: p.cliente_nombre,
    })),
    topProductos: d.top_productos.map((p) => ({
      productId: p.id_producto,
      name: p.nombre_producto,
      unidades: n(p.unidades_vendidas),
      ingresos: n(p.ingresos),
    })),
    productosStockBajo: d.productos_stock_bajo.map((p) => ({ id: p.id_producto, slug: p.slug, name: p.nombre, stock: p.stock })),
  };
}
