import type { User, UserRole } from '../types';
import { apiRequest, clearToken, setToken } from './apiClient';

/** Usuario tal como lo devuelve el backend (POST /auth/login, GET /auth/me). */
interface ApiUser {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: number;
}

export function mapUser(u: ApiUser): User {
  return { id: u.id_usuario, name: u.nombre, email: u.email, role: u.rol };
}

/** POST /auth/register. El backend NO devuelve token al registrar: hay que iniciar sesión después. */
export async function register(input: { name: string; email: string; password: string }): Promise<void> {
  await apiRequest('/auth/register', {
    method: 'POST',
    body: { nombre: input.name.trim(), email: input.email.trim().toLowerCase(), password: input.password },
  });
}

/** POST /auth/login. Guarda el JWT y devuelve el usuario (con el rol que dice el servidor). */
export async function login(email: string, password: string): Promise<User> {
  const res = await apiRequest<{ token: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
  });
  setToken(res.token);
  return mapUser(res.user);
}

/** GET /auth/me. Recupera la sesión a partir del JWT guardado. */
export async function fetchMe(): Promise<User> {
  const res = await apiRequest<{ user: ApiUser }>('/auth/me');
  return mapUser(res.user);
}

export function logout(): void {
  clearToken();
}

/**
 * POST /auth/forgot-password. Respuesta genérica siempre. Solo en desarrollo
 * (backend con NODE_ENV != production) el backend añade `debug_token`: es el
 * token que en producción se enviaría por correo (ver auth.service.js del backend).
 */
export async function forgotPassword(email: string): Promise<{ message: string; debugToken?: string }> {
  const res = await apiRequest<{ message: string; debug_token?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
  });
  return { message: res.message, debugToken: res.debug_token };
}

/** POST /auth/reset-password. Token de un solo uso con expiración. */
export async function resetPassword(token: string, password: string): Promise<string> {
  const res = await apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token: token.trim(), password },
  });
  return res.message;
}
