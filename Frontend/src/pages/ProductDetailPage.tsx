import { useState } from 'react';
import type { NavigationState, Product } from '../types';
import { formatCOP } from '../data';
import { useActiveProducts } from '../store/productStore';
import StarRating from '../components/StarRating';

interface ProductDetailPageProps {
  product: Product;
  navigate: (state: NavigationState) => void;
  addToCart: (product: Product) => void;
}

export default function ProductDetailPage({ product, navigate, addToCart }: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const liveProducts = useActiveProducts();
  const related = liveProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-[#0d0e10] min-h-screen">
      {/* Breadcrumb */}
      <div className="px-16 py-5 border-b border-[#2c2f36]">
        <div className="flex items-center gap-2 font-['Inter'] font-normal text-[13px]">
          <button onClick={() => navigate({ page: 'home' })} className="text-gray-400 hover:text-[#ffd400] transition-colors cursor-pointer">
            Inicio
          </button>
          <span className="text-gray-600">/</span>
          <button
            onClick={() => navigate({ page: 'catalog', category: product.category as any })}
            className="text-gray-400 hover:text-[#ffd400] transition-colors cursor-pointer capitalize"
          >
            {product.category}
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-gray-200 truncate max-w-[300px]">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="px-16 py-16">
        <div className="flex gap-16 items-start">
          {/* Image */}
          <div className="w-[560px] flex-shrink-0">
            <div className="bg-[#f0f1f2] aspect-square overflow-hidden rounded-2xl">
              <img
                alt={product.name}
                className="size-full object-cover"
                src={product.image}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-['Inter'] font-bold text-[#ffd400] text-[12px] uppercase tracking-widest">
                  {product.brand}
                </span>
                {product.isOffer && (
                  <span className="bg-[#ffd400] px-2 py-1 rounded-md font-['Inter'] font-black text-black text-[10px]">
                    OFERTA
                  </span>
                )}
              </div>
              <h1 className="font-['Montserrat'] font-black text-[36px] text-white leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <StarRating rating={product.rating} size={18} />
                <span className="font-['Inter'] font-normal text-gray-400 text-[13px]">
                  {product.rating}.0 / 5.0
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="border-y border-[#2c2f36] py-6">
              <div className="flex items-baseline gap-4 flex-wrap">
                <span className="font-['Montserrat'] font-extrabold text-[#ffd400] text-[32px]">
                  {formatCOP(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="font-['Inter'] font-normal line-through text-gray-500 text-[18px]">
                      {formatCOP(product.originalPrice)}
                    </span>
                    <span className="bg-[#ffd400] px-2 py-1 rounded-md font-['Inter'] font-black text-black text-[12px]">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              <p className="font-['Inter'] font-normal text-gray-500 text-[13px] mt-2">
                Precio incluye IVA. Envío disponible a toda Colombia.
              </p>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2">
              {product.stock === 0 ? (
                <>
                  <span className="size-2 rounded-full bg-gray-400" />
                  <span className="font-['Inter'] font-semibold text-gray-400 text-[13px]">Agotado</span>
                </>
              ) : product.stock <= 5 ? (
                <>
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span className="font-['Inter'] font-semibold text-amber-600 text-[13px]">
                    Últimas {product.stock} unidades disponibles
                  </span>
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-green-500" />
                  <span className="font-['Inter'] font-semibold text-green-600 text-[13px]">
                    En stock — {product.stock} unidades disponibles
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="font-['Inter'] font-normal leading-[1.75] text-gray-300 text-[15px]">
              {product.description}
            </p>

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="font-['Inter'] font-semibold text-gray-300 text-[13px] tracking-wider">
                  CANTIDAD
                </span>
                <div className="flex items-center border border-[#3a3d46] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 text-gray-300 hover:text-[#ffd400] transition-colors flex items-center justify-center font-bold text-lg cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center font-['Inter'] font-bold text-white border-x border-[#3a3d46]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 text-gray-300 hover:text-[#ffd400] transition-colors flex items-center justify-center font-bold text-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={product.stock === 0}
                className={`w-full py-5 rounded-2xl font-['Montserrat'] font-black text-[15px] transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  product.stock === 0
                    ? 'bg-gray-200 text-gray-400'
                    : added
                    ? 'bg-green-500 text-white'
                    : 'bg-[#ffd400] text-black hover:bg-[#e6bf00]'
                }`}
              >
                {product.stock === 0 ? 'SIN STOCK' : added ? '¡AGREGADO AL CARRITO!' : 'AGREGAR AL CARRITO'}
              </button>

              <button
                onClick={() => navigate({ page: 'catalog', category: product.category as any })}
                className="w-full py-4 rounded-2xl border border-[#3a3d46] font-['Montserrat'] font-bold text-[13px] text-gray-400 hover:border-[#ffd400] hover:text-[#ffd400] transition-colors cursor-pointer"
              >
                ← SEGUIR EXPLORANDO
              </button>
            </div>

            {/* Features */}
            <div className="border border-[#2c2f36] rounded-2xl p-6 flex flex-col gap-3">
              <p className="font-['Montserrat'] font-bold text-white text-[13px] tracking-wider">
                INFORMACIÓN DE COMPRA
              </p>
              <div className="flex flex-col gap-2">
                {[
                  '✓ Envío gratis a toda Colombia en compras mayores a $500.000',
                  '✓ 30 días para devoluciones sin preguntas',
                  '✓ Garantía oficial del fabricante',
                  '✓ Pago seguro con múltiples métodos',
                ].map((item) => (
                  <p key={item} className="font-['Inter'] font-normal text-gray-400 text-[13px]">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-24">
            <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase mb-2">
              TAMBIÉN TE PUEDE GUSTAR
            </p>
            <p className="font-['Montserrat'] font-black text-[28px] text-white mb-10">
              PRODUCTOS RELACIONADOS
            </p>
            <div className="grid grid-cols-3 gap-6">
              {related.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 flex flex-col gap-0 items-start overflow-hidden rounded-2xl group shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => navigate({ page: 'product', productId: p.id })}
                    className="bg-[#f0f1f2] h-[200px] w-full overflow-hidden relative shrink-0 cursor-pointer block rounded-t-2xl"
                  >
                    <img
                      alt={p.name}
                      className="absolute inset-0 max-w-none object-cover size-full transition-transform duration-500 group-hover:scale-105"
                      src={p.image}
                    />
                  </button>
                  <div className="flex flex-col gap-2 px-4 pt-4 pb-2 w-full">
                    <p className="font-['Inter'] font-bold text-[#b8920a] text-[11px] uppercase tracking-wider">
                      {p.brand}
                    </p>
                    <button
                      onClick={() => navigate({ page: 'product', productId: p.id })}
                      className="font-['Montserrat'] font-bold text-gray-900 text-[14px] hover:text-[#b8920a] transition-colors text-left cursor-pointer"
                    >
                      {p.name}
                    </button>
                    <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[16px]">
                      {formatCOP(p.price)}
                    </p>
                  </div>
                  <div className="px-4 pb-5 w-full">
                    <button
                      onClick={() => addToCart(p)}
                      className="bg-black border-2 border-black flex items-center justify-center py-3 w-full rounded-xl font-['Montserrat'] font-bold text-[12px] text-white hover:bg-[#ffd400] hover:text-black hover:border-[#ffd400] transition-all cursor-pointer"
                    >
                      AGREGAR AL CARRITO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
