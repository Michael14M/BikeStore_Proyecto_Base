import { useEffect, useMemo, useState } from 'react';
import type { CategoryFilter, Product } from '../types';
import { formatCOP } from '../data';
import { refreshAdminProducts, refreshProducts, useAdminProductsStatus, useAllProductsAdmin } from '../store/productStore';
import * as productService from '../services/productService';
import type { ProductDraft } from '../services/productService';
import { errorMessage } from '../services/apiClient';
import { showToast } from '../lib/toast';
import AdminProductForm from './AdminProductForm';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'Todas',
  mtb: 'MTB',
  ruta: 'Ruta',
  urbana: 'Urbana',
  electrica: 'Eléctrica',
  accesorios: 'Accesorios',
};

export default function AdminProductsPage() {
  const products = useAllProductsAdmin();
  const { loading, loaded } = useAdminProductsStatus();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [products, category, query]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setFormOpen(true); };

  useEffect(() => {
    void refreshAdminProducts();
  }, []);

  /** Tras cualquier cambio: recargar el catálogo admin y el público (la tienda debe reflejarlo). */
  const syncCatalogs = () => Promise.all([refreshAdminProducts(), refreshProducts()]);

  /** Crea/edita en MySQL; si se eligió un archivo de imagen, lo sube después (necesita el id del producto). */
  const handleSave = async (draft: ProductDraft, file: File | null) => {
    const saved = editing?.idProducto !== undefined
      ? await productService.updateProduct(editing.idProducto, draft)
      : await productService.createProduct(draft);
    if (file && saved.idProducto !== undefined) {
      try {
        await productService.uploadProductImage(saved.idProducto, file);
      } catch (error) {
        showToast(`El producto se guardó, pero la imagen no se pudo subir: ${errorMessage(error)}`);
      }
    }
    await syncCatalogs();
    showToast(editing ? 'Producto actualizado.' : 'Producto registrado.', 'success');
    setFormOpen(false);
  };

  const toggleActive = async (p: Product) => {
    if (p.idProducto === undefined) return;
    try {
      await productService.setProductActive(p.idProducto, p.active === false);
      await syncCatalogs();
      showToast(p.active === false ? 'Producto activado.' : 'Producto desactivado.', 'success');
    } catch (error) {
      showToast(errorMessage(error));
    }
  };

  const removeProduct = async (p: Product) => {
    if (p.idProducto === undefined) return;
    if (!window.confirm(`¿Eliminar definitivamente "${p.name}"? Si tiene carritos o pedidos asociados, el sistema no lo permitirá (desactívalo en su lugar).`)) return;
    try {
      await productService.deleteProduct(p.idProducto);
      await syncCatalogs();
      showToast('Producto eliminado.', 'success');
    } catch (error) {
      showToast(errorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, marca o id..."
            className="bg-[#f7f7f8] border border-gray-200 rounded-xl px-4 py-2.5 font-['Inter'] font-normal text-[13px] text-gray-800 outline-none focus:border-[#ffd400] min-w-[240px]"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className="bg-[#f7f7f8] border border-gray-200 rounded-xl px-4 py-2.5 font-['Inter'] font-semibold text-[13px] text-gray-800 outline-none cursor-pointer focus:border-[#ffd400]"
          >
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <span className="font-['Inter'] font-normal text-gray-400 text-[12px] whitespace-nowrap">
            {filtered.length} de {products.length} productos
          </span>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#ffd400] px-5 py-3 rounded-xl font-['Montserrat'] font-black text-[12px] text-black hover:bg-[#e6bf00] transition-colors cursor-pointer whitespace-nowrap"
        >
          + REGISTRAR PRODUCTO
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Producto', 'Categoría', 'Precio', 'Stock', 'Estado', ''].map((h) => (
                <th key={h} className="px-5 py-3 font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f0f1f2] rounded-lg overflow-hidden flex-shrink-0">
                      <img src={p.image} alt={p.name} className="size-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-['Montserrat'] font-bold text-[13px] text-black truncate max-w-[220px]">{p.name}</p>
                      <p className="font-['Inter'] font-normal text-[11px] text-gray-400">{p.brand} · {p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 font-['Inter'] font-semibold text-[12px] text-gray-600 uppercase">{p.category}</td>
                <td className="px-5 py-3 font-['Montserrat'] font-bold text-[13px] text-[#b8920a]">{formatCOP(p.price)}</td>
                <td className="px-5 py-3 font-['Inter'] font-semibold text-[13px] text-gray-700">{p.stock}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 font-['Inter'] font-semibold text-[11px] px-2.5 py-1 rounded-full ${
                    p.active === false ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'
                  }`}>
                    <span className={`size-1.5 rounded-full ${p.active === false ? 'bg-gray-400' : 'bg-green-500'}`} />
                    {p.active === false ? 'Inactivo' : 'Activo'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => openEdit(p)}
                      className="px-3 py-2 rounded-lg border border-gray-200 font-['Inter'] font-semibold text-[11px] text-gray-600 hover:border-[#ffd400] hover:text-[#b8920a] transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => void toggleActive(p)}
                      className={`px-3 py-2 rounded-lg font-['Inter'] font-semibold text-[11px] transition-colors cursor-pointer ${
                        p.active === false
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-red-50 text-red-500 hover:bg-red-100'
                      }`}
                    >
                      {p.active === false ? 'Activar' : 'Desactivar'}
                    </button>
                    <button
                      onClick={() => void removeProduct(p)}
                      className="px-3 py-2 rounded-lg border border-red-200 font-['Inter'] font-semibold text-[11px] text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center font-['Inter'] font-normal text-gray-400 text-[13px]">
                  {loading && !loaded ? 'Cargando productos...' : 'No se encontraron productos con ese criterio.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminProductForm open={formOpen} initial={editing} onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>
  );
}
