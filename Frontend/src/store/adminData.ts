import { resetAdminOrders } from './orderStore';
import { resetAdminProducts } from './productStore';
import { resetAdminUsers } from './userStore';

/** Al cerrar sesión (o expirar el token) no debe quedar nada del panel admin en memoria. */
export function resetAdminData(): void {
  resetAdminProducts();
  resetAdminOrders();
  resetAdminUsers();
}
