import type { AdminView, NavigationState, User } from '../types';
import AdminLayout from './AdminLayout';
import AdminDashboardPage from './AdminDashboardPage';
import AdminProductsPage from './AdminProductsPage';
import AdminOrdersPage from './AdminOrdersPage';
import AdminUsersPage from './AdminUsersPage';
import AdminReportsPage from './AdminReportsPage';

interface AdminAppProps {
  view: AdminView;
  navigate: (state: NavigationState) => void;
  adminUser: User;
  onLogout: () => void;
}

/**
 * Punto de entrada del módulo administrativo (Fase 1).
 * Se monta desde App.tsx únicamente cuando nav.page === 'admin' y el
 * usuario logueado tiene role === 'admin' (ver el guard en App.tsx).
 */
export default function AdminApp({ view, navigate, adminUser, onLogout }: AdminAppProps) {
  return (
    <AdminLayout view={view} navigate={navigate} adminUser={adminUser} onLogout={onLogout}>
      {view === 'dashboard' && <AdminDashboardPage />}
      {view === 'productos' && <AdminProductsPage />}
      {view === 'pedidos' && <AdminOrdersPage />}
      {view === 'usuarios' && <AdminUsersPage currentAdminEmail={adminUser.email} />}
      {view === 'reportes' && <AdminReportsPage />}
    </AdminLayout>
  );
}
