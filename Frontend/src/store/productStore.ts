/**
 * Productos: ya NO se guardan en localStorage ni se siembran desde data.ts.
 * La fuente de verdad es MySQL (GET /api/productos); estos stores son solo una
 * cache reactiva para la UI.
 *
 *  - publicProducts: catálogo de la tienda (solo activos). Lo usan home, catálogo,
 *    ofertas, búsqueda y relacionados.
 *  - adminProducts:  catálogo completo (activos e inactivos). Solo lo carga el panel
 *    admin; el backend entrega inactivos únicamente si el JWT es de un admin.
 */
import type { Product } from '../types';
import * as productService from '../services/productService';
import { createResource, useResource } from './resource';

const publicProducts = createResource<Product[]>([], productService.fetchCatalog);
const adminProducts = createResource<Product[]>([], productService.fetchAdminCatalog);

export const refreshProducts = () => publicProducts.refresh();
export const refreshAdminProducts = () => adminProducts.refresh();

/** Catálogo público (activos). Mantiene la misma referencia mientras no cambie. */
export function useActiveProducts(): Product[] {
  return useResource(publicProducts).data;
}

export function useProductsStatus() {
  const { loading, loaded, error } = useResource(publicProducts);
  return { loading, loaded, error };
}

/** Catálogo completo para el panel admin (incluye inactivos). */
export function useAllProductsAdmin(): Product[] {
  return useResource(adminProducts).data;
}

export function useAdminProductsStatus() {
  const { loading, loaded, error } = useResource(adminProducts);
  return { loading, loaded, error };
}

/** Lectura puntual (fuera de componentes) del catálogo admin. */
export const getAdminProductsSnapshot = (): Product[] => adminProducts.getState().data;

export function resetAdminProducts(): void {
  adminProducts.reset();
}
