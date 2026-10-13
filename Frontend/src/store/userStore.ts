/**
 * Usuarios del panel admin: vienen de GET /api/admin/usuarios (MySQL).
 * Ya no existe ninguna lista de usuarios ni contraseñas en el navegador: el
 * registro y el login los resuelve el backend (bcrypt + JWT).
 */
import type { AdminUser, UserRole } from '../types';
import * as adminService from '../services/adminService';
import { createResource, useResource } from './resource';

const adminUsers = createResource<AdminUser[]>([], adminService.fetchAdminUsers);

export const refreshAdminUsers = () => adminUsers.refresh();

export function useAllUsers(): AdminUser[] {
  return useResource(adminUsers).data;
}

export function useAdminUsersStatus() {
  const { loading, loaded, error } = useResource(adminUsers);
  return { loading, loaded, error };
}

function replaceUser(updated: AdminUser) {
  adminUsers.setData(adminUsers.getState().data.map((u) => (u.id === updated.id ? updated : u)));
}

export async function setUserRole(id: number, role: UserRole): Promise<void> {
  replaceUser(await adminService.setAdminUserRole(id, role));
}

export async function setUserActive(id: number, active: boolean): Promise<void> {
  replaceUser(await adminService.setAdminUserActive(id, active));
}

export async function removeUser(id: number): Promise<void> {
  await adminService.deleteAdminUser(id);
  adminUsers.setData(adminUsers.getState().data.filter((u) => u.id !== id));
}

export function resetAdminUsers(): void {
  adminUsers.reset();
}
