/**
 * Avisos breves (errores/confirmaciones de la API). Es el único elemento visual
 * nuevo de la integración: antes no existía dónde mostrar, por ejemplo, un
 * "stock insuficiente" devuelto por el servidor al agregar al carrito.
 */
import { useSyncExternalStore } from 'react';

export type ToastKind = 'error' | 'success' | 'info';
export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

let toasts: ToastMessage[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function showToast(message: string, kind: ToastKind = 'error'): void {
  const id = nextId++;
  toasts = [...toasts, { id, kind, message }].slice(-4);
  emit();
  setTimeout(() => dismissToast(id), kind === 'error' ? 6000 : 4000);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getToasts = () => toasts;

export function useToasts(): ToastMessage[] {
  return useSyncExternalStore(subscribe, getToasts, getToasts);
}
