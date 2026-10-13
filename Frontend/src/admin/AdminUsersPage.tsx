import { useEffect, useMemo, useState } from 'react';
import type { AdminUser, UserRole } from '../types';
import { refreshAdminUsers, removeUser, setUserActive, setUserRole, useAdminUsersStatus, useAllUsers } from '../store/userStore';
import { errorMessage } from '../services/apiClient';
import { showToast } from '../lib/toast';

interface AdminUsersPageProps {
  currentAdminEmail: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  cliente: 'Cliente',
  admin: 'Administrador',
};

export default function AdminUsersPage({ currentAdminEmail }: AdminUsersPageProps) {
  const users = useAllUsers();
  const { loading, loaded } = useAdminUsersStatus();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  useEffect(() => {
    void refreshAdminUsers();
  }, []);

  /** Ejecuta la acción contra la API; si el backend la rechaza, avisa y resincroniza la lista. */
  const run = async (action: () => Promise<void>, okMessage?: string) => {
    try {
      await action();
      if (okMessage) showToast(okMessage, 'success');
    } catch (error) {
      showToast(errorMessage(error));
      void refreshAdminUsers();
    }
  };

  const confirmDelete = (u: AdminUser) => {
    if (!window.confirm(`¿Eliminar definitivamente a ${u.name}? Si tiene pedidos, el sistema no lo permitirá (desactívalo en su lugar).`)) return;
    void run(() => removeUser(u.id), 'Usuario eliminado.');
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, query, roleFilter]);

  const adminCount = users.filter((u) => u.role === 'admin' && u.active).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="bg-[#f7f7f8] border border-gray-200 rounded-xl px-4 py-2.5 font-['Inter'] font-normal text-[13px] text-gray-800 outline-none focus:border-[#ffd400] min-w-[240px]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            className="bg-[#f7f7f8] border border-gray-200 rounded-xl px-4 py-2.5 font-['Inter'] font-semibold text-[13px] text-gray-800 outline-none cursor-pointer focus:border-[#ffd400]"
          >
            <option value="all">Todos los roles</option>
            <option value="cliente">Solo clientes</option>
            <option value="admin">Solo administradores</option>
          </select>
        </div>
        <span className="font-['Inter'] font-normal text-gray-400 text-[12px] whitespace-nowrap">
          {filtered.length} de {users.length} usuarios
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Usuario', 'Correo', 'Rol', 'Registrado', 'Estado', ''].map((h) => (
                <th key={h} className="px-5 py-3 font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isSelf = u.email === currentAdminEmail;
              const wouldRemoveLastAdmin = u.role === 'admin' && u.active && adminCount <= 1;
              return (
                <tr key={u.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <p className="font-['Montserrat'] font-bold text-[13px] text-black">{u.name}</p>
                    {isSelf && <p className="font-['Inter'] font-normal text-[11px] text-[#b8920a]">Esta es tu cuenta</p>}
                  </td>
                  <td className="px-5 py-3 font-['Inter'] font-normal text-[12px] text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      disabled={isSelf || wouldRemoveLastAdmin}
                      onChange={(e) => void run(() => setUserRole(u.id, e.target.value as UserRole), 'Rol actualizado.')}
                      className={`font-['Inter'] font-semibold text-[11px] px-2.5 py-1.5 rounded-full outline-none border-0 ${
                        u.role === 'admin' ? 'bg-black text-[#ffd400]' : 'bg-gray-100 text-gray-600'
                      } ${isSelf || wouldRemoveLastAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <option value="cliente">{ROLE_LABELS.cliente}</option>
                      <option value="admin">{ROLE_LABELS.admin}</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 font-['Inter'] font-normal text-[12px] text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 font-['Inter'] font-semibold text-[11px] px-2.5 py-1 rounded-full ${
                      u.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`size-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      disabled={isSelf || wouldRemoveLastAdmin}
                      onClick={() => void run(() => setUserActive(u.id, !u.active), u.active ? 'Usuario desactivado.' : 'Usuario activado.')}
                      title={wouldRemoveLastAdmin ? 'Debe existir al menos un administrador activo' : undefined}
                      className={`px-3 py-2 rounded-lg font-['Inter'] font-semibold text-[11px] transition-colors ${
                        isSelf || wouldRemoveLastAdmin
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          : u.active
                          ? 'bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer'
                      }`}
                    >
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      disabled={isSelf}
                      onClick={() => confirmDelete(u)}
                      className={`ml-2 px-3 py-2 rounded-lg font-['Inter'] font-semibold text-[11px] transition-colors ${
                        isSelf ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer'
                      }`}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center font-['Inter'] font-normal text-gray-400 text-[13px]">
                  {loading && !loaded ? 'Cargando usuarios...' : 'No se encontraron usuarios con ese criterio.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
