import { useState, useMemo } from 'react';
import type { NavigationState, CategoryFilter, Product } from '../types';
import { formatCOP } from '../data';
import { useActiveProducts } from '../store/productStore';
import StarRating from '../components/StarRating';

interface CatalogPageProps {
  navigate: (state: NavigationState) => void;
  addToCart: (product: Product) => void;
  initialCategory?: CategoryFilter;
}

const categoryLabels: Record<CategoryFilter, string> = {
  all: 'TODOS',
  mtb: 'MTB',
  ruta: 'RUTA',
  urbana: 'URBANA',
  electrica: 'ELÉCTRICA',
  accesorios: 'ACCESORIOS',
};

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'rating-desc';

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'default',     label: 'Destacados'        },
  { value: 'price-asc',  label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'rating-desc', label: 'Mejor valorados'   },
];

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 font-['Inter'] font-semibold text-[11px] text-gray-400">
        <span className="size-1.5 rounded-full bg-gray-400 flex-shrink-0" />
        Agotado
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 font-['Inter'] font-semibold text-[11px] text-amber-600">
        <span className="size-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        Últimas {stock} unidades
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-['Inter'] font-semibold text-[11px] text-green-600">
      <span className="size-1.5 rounded-full bg-green-500 flex-shrink-0" />
      En stock
    </span>
  );
}

export default function CatalogPage({ navigate, addToCart, initialCategory = 'all' }: CatalogPageProps) {
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [sort, setSort] = useState<SortKey>('default');
  const [addedId, setAddedId] = useState<string | null>(null);
  const allItems = useActiveProducts();

  const filtered = useMemo(() => {
    const base = category === 'all' ? allItems : allItems.filter(p => p.category === category);
    switch (sort) {
      case 'price-asc':   return [...base].sort((a, b) => a.price - b.price);
      case 'price-desc':  return [...base].sort((a, b) => b.price - a.price);
      case 'rating-desc': return [...base].sort((a, b) => b.rating - a.rating);
      default:            return base;
    }
  }, [category, sort, allItems]);

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) return;
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="bg-[#0d0e10] min-h-screen">

      {/* ── Page hero ─────────────────────────────────────────────── */}
      <div className="bg-black border-b border-[#2c2f36] px-16 py-16">
        <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase mb-2">
          CATÁLOGO
        </p>
        <h1 className="font-['Montserrat'] font-black text-[48px] text-white">
          {category === 'all' ? 'TODOS LOS PRODUCTOS' : categoryLabels[category]}
        </h1>
      </div>

      {/* ── Filter + Sort bar ─────────────────────────────────────── */}
      <div className="bg-[#0d0e10] border-b border-[#2c2f36] px-16 py-5 sticky top-[96px] z-30">
        <div className="flex gap-3 items-center flex-wrap">

          {/* Category pills */}
          <div className="flex gap-2 items-center flex-wrap flex-1">
            {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2.5 rounded-xl border-2 font-['Montserrat'] font-bold text-[12px] transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-[#ffd400] border-[#ffd400] text-black shadow-sm'
                    : 'border-[#3a3d46] text-gray-400 hover:border-[#ffd400] hover:text-[#ffd400]'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Result count */}
          <span className="font-['Inter'] font-normal text-gray-500 text-[13px] whitespace-nowrap">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
          </span>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="appearance-none bg-[#181a1e] border border-[#3a3d46] rounded-xl px-4 pr-9 py-2.5 font-['Inter'] font-semibold text-gray-300 text-[13px] outline-none cursor-pointer hover:border-[#ffd400] transition-colors focus:border-[#ffd400]"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {/* Chevron */}
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Products grid ─────────────────────────────────────────── */}
      <div className="px-16 py-14">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="font-['Montserrat'] font-black text-[24px] text-gray-600">Sin resultados</p>
            <button
              onClick={() => setCategory('all')}
              className="bg-[#ffd400] px-8 py-3 rounded-xl font-['Montserrat'] font-black text-black text-[13px] hover:bg-[#e6bf00] transition-colors cursor-pointer"
            >
              VER TODOS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 xl:grid-cols-4 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addedId={addedId}
                onNavigate={id => navigate({ page: 'product', productId: id })}
                onAdd={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Product Card ──────────────────────────────────────────────────────── */

interface ProductCardProps {
  product: Product;
  addedId: string | null;
  onNavigate: (id: string) => void;
  onAdd: (product: Product) => void;
}

function ProductCard({ product, addedId, onNavigate, onAdd }: ProductCardProps) {
  const isAdded = addedId === product.id;
  const outOfStock = product.stock === 0;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-white border border-gray-200 flex flex-col gap-0 items-start overflow-hidden rounded-2xl relative group shadow-sm hover:shadow-lg transition-shadow">

      {/* Image */}
      <button
        onClick={() => onNavigate(product.id)}
        className="bg-[#f0f1f2] h-[220px] w-full overflow-hidden relative shrink-0 cursor-pointer block rounded-t-2xl"
      >
        <img
          alt={product.name}
          className={`absolute inset-0 max-w-none object-cover size-full transition-transform duration-500 group-hover:scale-105 ${outOfStock ? 'opacity-50 grayscale' : ''}`}
          src={product.image}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discount > 0 && (
            <span className="bg-[#ffd400] px-2 py-1 rounded-md font-['Inter'] font-black text-black text-[10px] leading-none">
              -{discount}%
            </span>
          )}
          {outOfStock && (
            <span className="bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-md font-['Inter'] font-bold text-white text-[10px] leading-none">
              AGOTADO
            </span>
          )}
        </div>
      </button>

      {/* Info */}
      <div className="flex flex-col gap-3 items-start px-4 pt-4 pb-2 w-full">
        <div className="flex items-center justify-between w-full">
          <p className="font-['Inter'] font-bold text-[#b8920a] text-[11px] uppercase tracking-wider">
            {product.brand}
          </p>
          <StarRating rating={product.rating} />
        </div>

        <button
          onClick={() => onNavigate(product.id)}
          className="font-['Montserrat'] font-bold text-[15px] text-gray-900 hover:text-[#b8920a] transition-colors text-left w-full cursor-pointer leading-tight"
        >
          {product.name}
        </button>

        {/* Price */}
        <div className="flex gap-2 items-baseline flex-wrap">
          <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[16px]">
            {formatCOP(product.price)}
          </p>
          {product.originalPrice && (
            <p className="font-['Inter'] font-normal line-through text-gray-400 text-[12px]">
              {formatCOP(product.originalPrice)}
            </p>
          )}
        </div>

        {/* Stock indicator */}
        <StockBadge stock={product.stock} />
      </div>

      {/* Add to cart */}
      <div className="flex flex-col items-start px-4 pb-5 w-full mt-auto pt-2">
        <button
          onClick={() => onAdd(product)}
          disabled={outOfStock}
          className={`border-2 flex items-center justify-center py-3 w-full rounded-xl font-['Montserrat'] font-bold text-[12px] transition-all cursor-pointer disabled:cursor-not-allowed ${
            outOfStock
              ? 'bg-gray-100 border-gray-200 text-gray-400'
              : isAdded
              ? 'bg-[#ffd400] border-[#ffd400] text-black'
              : 'bg-black border-black text-white hover:bg-[#ffd400] hover:text-black hover:border-[#ffd400]'
          }`}
        >
          {outOfStock ? 'SIN STOCK' : isAdded ? '¡AGREGADO!' : 'AGREGAR AL CARRITO'}
        </button>
      </div>
    </div>
  );
}
