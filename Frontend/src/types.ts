export interface Product {
  /** Identificador de la tienda = slug del producto (ej. 'canyon-aeroad'). */
  id: string;
  /** id numérico real (id_producto) en MySQL; es el que usa la API para carrito/admin. */
  idProducto?: number;
  name: string;
  brand: string;
  category: 'mtb' | 'ruta' | 'urbana' | 'electrica' | 'accesorios';
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  isOffer?: boolean;
  description: string;
  stock: number;
  /** Visibilidad del producto en la tienda del cliente. Por defecto true (activo). */
  active?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  /** id_carrito_item en el backend (solo existe cuando el carrito es del usuario autenticado). */
  itemId?: number;
}

export type UserRole = 'cliente' | 'admin';

export interface User {
  /** id_usuario en la base de datos. */
  id?: number;
  name: string;
  email: string;
  role: UserRole;
}

/** Ítem congelado de un pedido: guarda los datos del producto al momento de la compra. */
export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export type PaymentMethod = 'tarjeta' | 'pse' | 'efectivo';
export type OrderStatus = 'pendiente' | 'procesando' | 'completado' | 'cancelado';

export interface Order {
  /** id_pedido en la base de datos. */
  id?: number;
  /** false cuando viene de un listado (sin ítems/dirección) y falta pedir el detalle. */
  hasDetail?: boolean;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  address: string;
  city: string;
  phone: string;
  date: string; // ISO string
  status: OrderStatus;
}

export type PageType = 'home' | 'catalog' | 'product' | 'about' | 'offers' | 'checkout' | 'confirmation' | 'orders' | 'admin';
export type CategoryFilter = 'all' | 'mtb' | 'ruta' | 'urbana' | 'electrica' | 'accesorios';
export type AdminView = 'dashboard' | 'productos' | 'pedidos' | 'usuarios' | 'reportes';

export interface NavigationState {
  page: PageType;
  category?: CategoryFilter;
  productId?: string;
  /** Sub-vista activa dentro del panel administrativo. */
  adminView?: AdminView;
}

/** Usuario tal como lo administra el panel (viene de GET /api/admin/usuarios). */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

/** Respuesta de GET /api/admin/dashboard, con nombres de campo del frontend. */
export interface DashboardData {
  productos: { total: number; activos: number; inactivos: number; sinStock: number; stockBajo: number };
  usuarios: { total: number; clientes: number; admins: number; activos: number; inactivos: number };
  pedidos: {
    total: number;
    ventasTotales: number;
    pendientes: number;
    procesando: number;
    completados: number;
    cancelados: number;
  };
  pedidosRecientes: { id: number; orderNumber: string; total: number; status: OrderStatus; date: string; customerName: string }[];
  topProductos: { productId: number; name: string; unidades: number; ingresos: number }[];
  productosStockBajo: { id: number; slug: string; name: string; stock: number }[];
}
