import { useEffect, useState } from 'react';
import type { Product } from '../types';
import type { ProductDraft } from '../services/productService';
import { errorMessage } from '../services/apiClient';

interface AdminProductFormProps {
  open: boolean;
  initial: Product | null; // null = creando producto nuevo
  onClose: () => void;
  /** Guarda en la API. Si lanza error, el formulario sigue abierto y muestra el mensaje. */
  onSave: (draft: ProductDraft, imageFile: File | null) => Promise<void>;
}

const CATEGORY_OPTIONS: { value: Product['category']; label: string }[] = [
  { value: 'mtb', label: 'MTB' },
  { value: 'ruta', label: 'Ruta' },
  { value: 'urbana', label: 'Urbana' },
  { value: 'electrica', label: 'Eléctrica' },
  { value: 'accesorios', label: 'Accesorios' },
];

const emptyForm = {
  name: '',
  brand: '',
  category: 'mtb' as Product['category'],
  price: '',
  originalPrice: '',
  stock: '',
  description: '',
  image: '',
  rating: '5',
  active: true,
};

type FormState = typeof emptyForm;

export default function AdminProductForm({ open, initial, onClose, onSave }: AdminProductFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        brand: initial.brand,
        category: initial.category,
        price: String(initial.price),
        originalPrice: initial.originalPrice ? String(initial.originalPrice) : '',
        stock: String(initial.stock),
        description: initial.description,
        image: initial.image,
        rating: String(initial.rating),
        active: initial.active !== false,
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
    setImageFile(null);
    setSaving(false);
  }, [open, initial]);

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim() || !form.description.trim() || (!form.image.trim() && !imageFile)) {
      setError('Completa nombre, marca, descripción e imagen (URL o archivo).');
      return;
    }
    const price = Number(form.price);
    const stock = Number(form.stock);
    const rating = Number(form.rating);
    if (!Number.isFinite(price) || price <= 0) { setError('El precio debe ser un número mayor a 0.'); return; }
    if (!Number.isFinite(stock) || stock < 0) { setError('El stock debe ser un número mayor o igual a 0.'); return; }
    const originalPrice = form.originalPrice.trim() ? Number(form.originalPrice) : undefined;
    if (originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice <= price)) {
      setError('El precio anterior/oferta debe ser mayor al precio actual.');
      return;
    }

    const draft: ProductDraft = {
      name: form.name.trim(),
      brand: form.brand.trim().toUpperCase(),
      category: form.category,
      price,
      originalPrice,
      image: form.image.trim(),
      rating,
      description: form.description.trim(),
      stock,
      active: form.active,
    };
    setSaving(true);
    try {
      await onSave(draft, imageFile);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: 'blur(4px)' }} />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[640px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
      >
        <div className="bg-[#ffd400] h-1.5 w-full rounded-t-2xl" />
        <div className="px-8 py-7">
          <h2 className="font-['Montserrat'] font-black text-[22px] text-black mb-6">
            {initial ? 'EDITAR PRODUCTO' : 'REGISTRAR PRODUCTO'}
          </h2>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Nombre" span={2}>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Ej: Trek Fuel EX 9.9 XTR" />
            </Field>
            <Field label="Marca">
              <input value={form.brand} onChange={(e) => set('brand', e.target.value)} className={inputCls} placeholder="Ej: TREK" />
            </Field>
            <Field label="Categoría">
              <select value={form.category} onChange={(e) => set('category', e.target.value as Product['category'])} className={inputCls}>
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Precio (COP)">
              <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputCls} placeholder="0" />
            </Field>
            <Field label="Precio anterior / oferta (opcional)">
              <input type="number" min="0" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} className={inputCls} placeholder="0" />
            </Field>
            <Field label="Stock">
              <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} className={inputCls} placeholder="0" />
            </Field>
            <Field label="Rating (1 a 5)">
              <select value={form.rating} onChange={(e) => set('rating', e.target.value)} className={inputCls}>
                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Imagen (URL)" span={2}>
              <input value={form.image} onChange={(e) => set('image', e.target.value)} className={inputCls} placeholder="https://... o /assets/archivo.png" />
            </Field>
            <Field label="o subir archivo de imagen (jpg, png o webp, máx. 2 MB)" span={2}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-[#ffd400] file:px-3 file:py-1.5 file:font-bold file:text-black`}
              />
            </Field>
            <Field label="Descripción" span={2}>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={`${inputCls} min-h-[90px] resize-none`} placeholder="Descripción del producto..." />
            </Field>
            <div className="col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('active', !form.active)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.active ? 'bg-[#ffd400]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
              <span className="font-['Inter'] font-semibold text-[13px] text-gray-700">
                {form.active ? 'Producto activo (visible en la tienda)' : 'Producto inactivo (oculto para clientes)'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="font-['Inter'] font-normal text-red-600 text-[13px]">{error}</p>
            </div>
          )}

          <div className="flex gap-3 mt-7">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 font-['Montserrat'] font-bold text-[13px] text-gray-600 hover:border-gray-400 transition-colors cursor-pointer">
              CANCELAR
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-xl bg-[#ffd400] font-['Montserrat'] font-black text-[13px] text-black hover:bg-[#e6bf00] transition-colors cursor-pointer disabled:opacity-60">
              {saving ? 'GUARDANDO...' : initial ? 'GUARDAR CAMBIOS' : 'REGISTRAR PRODUCTO'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-['Inter'] font-normal text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#ffd400]";

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span === 2 ? 'col-span-2' : ''}`}>
      <label className="font-['Inter'] font-semibold text-[11px] text-gray-600 tracking-wider uppercase">{label}</label>
      {children}
    </div>
  );
}
