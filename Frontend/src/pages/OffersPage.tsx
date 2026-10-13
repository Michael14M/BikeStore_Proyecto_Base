import { useState } from 'react';
import type { NavigationState, Product } from '../types';
import { formatCOP } from '../data';
import { useActiveProducts } from '../store/productStore';
import StarRating from '../components/StarRating';

const imgBanner = '/assets/6b85e.png';

interface OffersPageProps {
  navigate: (state: NavigationState) => void;
  addToCart: (product: Product) => void;
}

export default function OffersPage({ navigate, addToCart }: OffersPageProps) {
  const [addedId, setAddedId] = useState<string | null>(null);
  const products = useActiveProducts();
  const offers = products.filter((p) => p.isOffer || p.originalPrice);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="bg-[#0d0e10] min-h-screen">
      {/* Banner */}
      <div className="relative h-[400px] flex items-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <img alt="" className="absolute max-w-none object-cover size-full" src={imgBanner} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/20" />
        </div>
        <div className="relative z-10 px-16 flex flex-col gap-4 max-w-[700px]">
          <div className="bg-[#ffd400] inline-flex px-3 py-[6px] rounded-md self-start">
            <p className="font-['Inter'] font-black text-[12px] text-black">OFERTA DE TEMPORADA</p>
          </div>
          <h1 className="font-['Montserrat'] font-black text-[48px] text-white leading-tight">
            HASTA 40% DE DESCUENTO EN TEMPORADA
          </h1>
          <p className="font-['Inter'] font-normal text-white/80 text-[16px]">
            Actualiza tu equipamiento con el rendimiento que exigen los profesionales. Unidades limitadas disponibles.
          </p>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-[#ffd400] px-16 py-4 flex items-center justify-between">
        <p className="font-['Montserrat'] font-black text-black text-[13px]">
          🔥 OFERTAS LIMITADAS — ¡Aprovecha antes de que se agoten!
        </p>
        <p className="font-['Inter'] font-bold text-black text-[12px]">
          {offers.length} PRODUCTOS EN OFERTA
        </p>
      </div>

      {/* Offers Grid */}
      <div className="px-16 py-16">
        <div className="flex flex-col gap-2 mb-10">
          <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase">
            OFERTAS ACTIVAS
          </p>
          <p className="font-['Montserrat'] font-black text-[32px] text-white">PRODUCTOS EN DESCUENTO</p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {offers.map((product) => {
            const discount = product.originalPrice
              ? Math.round((1 - product.price / product.originalPrice) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-200 flex flex-col gap-0 items-start overflow-hidden rounded-2xl relative group shadow-sm hover:shadow-lg transition-shadow"
              >
                {discount > 0 && (
                  <div className="absolute top-3 right-3 z-10 bg-[#ffd400] px-2 py-1 rounded-md">
                    <span className="font-['Inter'] font-black text-black text-[11px]">-{discount}%</span>
                  </div>
                )}
                <button
                  onClick={() => navigate({ page: 'product', productId: product.id })}
                  className="bg-[#f0f1f2] h-[220px] w-full overflow-hidden relative shrink-0 cursor-pointer block rounded-t-2xl"
                >
                  <img
                    alt={product.name}
                    className="absolute inset-0 max-w-none object-cover size-full transition-transform duration-500 group-hover:scale-105"
                    src={product.image}
                  />
                </button>

                <div className="flex flex-col gap-3 items-start px-4 pt-4 pb-2 w-full">
                  <div className="flex items-center justify-between w-full">
                    <p className="font-['Inter'] font-bold text-[#b8920a] text-[11px] uppercase tracking-wider">
                      {product.brand}
                    </p>
                    <StarRating rating={product.rating} />
                  </div>
                  <button
                    onClick={() => navigate({ page: 'product', productId: product.id })}
                    className="font-['Montserrat'] font-bold text-[15px] text-gray-900 hover:text-[#b8920a] transition-colors text-left w-full cursor-pointer leading-tight"
                  >
                    {product.name}
                  </button>
                  <div className="flex flex-col gap-1">
                    <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[18px]">
                      {formatCOP(product.price)}
                    </p>
                    {product.originalPrice && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-['Inter'] font-normal line-through text-gray-400 text-[13px]">
                          {formatCOP(product.originalPrice)}
                        </p>
                        <p className="font-['Inter'] font-bold text-green-600 text-[12px]">
                          Ahorras {formatCOP(product.originalPrice - product.price)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start px-4 pb-5 w-full mt-auto pt-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`border-2 flex items-center justify-center py-3 w-full rounded-xl font-['Montserrat'] font-bold text-[12px] transition-all cursor-pointer ${
                      addedId === product.id
                        ? 'bg-[#ffd400] border-[#ffd400] text-black'
                        : 'bg-black border-black text-white hover:bg-[#ffd400] hover:text-black hover:border-[#ffd400]'
                    }`}
                  >
                    {addedId === product.id ? '¡AGREGADO!' : 'AGREGAR AL CARRITO'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-black border-t border-[#2c2f36] py-16 px-16 text-center">
        <p className="font-['Montserrat'] font-black text-[28px] text-white mb-3">
          ¿NO ENCONTRASTE LO QUE BUSCABAS?
        </p>
        <p className="font-['Inter'] font-normal text-gray-400 text-[15px] mb-8">
          Explora todo nuestro catálogo con más de 300 productos disponibles.
        </p>
        <button
          onClick={() => navigate({ page: 'catalog', category: 'all' })}
          className="bg-[#ffd400] px-12 py-4 rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] transition-colors cursor-pointer"
        >
          VER CATÁLOGO COMPLETO
        </button>
      </div>
    </div>
  );
}
