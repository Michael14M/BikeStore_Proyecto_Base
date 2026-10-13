import type { NavigationState, Product } from '../types';
import StarRating from '../components/StarRating';
import { formatCOP } from '../data';
import { useActiveProducts } from '../store/productStore';
import { useState } from 'react';

const imgHeroSection = '/assets/020b3.png';
const imgCategoryCard = '/assets/bfa92.png';
const imgCategoryCard1 = '/assets/14b5c.png';
const imgCategoryCard2 = '/assets/58144.png';
const imgCategoryCard3 = '/assets/c924d.png';
const imgPromotionalBannerSection = '/assets/6b85e.png';
const imgArrowRight = '/assets/39460.svg';
const imgArrowRight1 = '/assets/d2c0a.svg';

interface HomePageProps {
  navigate: (state: NavigationState) => void;
  addToCart: (product: Product) => void;
}

// Misma curaduría original de la homepage (por id), pero resuelta en vivo
// contra el store de productos para reflejar ediciones del administrador
// sin cambiar qué productos se destacan aquí.
const FEATURED_IDS = ['canyon-aeroad', 'specialized-epic', 'trek-madone', 'giant-revolt'];
const ACCESSORY_IDS = ['casco-aero', 'guantes-grip', 'luces-led', 'candado-safe'];

const categories = [
  { label: 'MTB', image: imgCategoryCard, category: 'mtb' as const },
  { label: 'RUTA', image: imgCategoryCard1, category: 'ruta' as const },
  { label: 'URBANA', image: imgCategoryCard2, category: 'urbana' as const },
  { label: 'ELÉCTRICA', image: imgCategoryCard3, category: 'electrica' as const },
];

export default function HomePage({ navigate, addToCart }: HomePageProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const liveProducts = useActiveProducts();
  const byId = (id: string) => liveProducts.find((p) => p.id === id);
  const featuredProducts = FEATURED_IDS.map(byId).filter((p): p is Product => Boolean(p));
  const accessoryProducts = ACCESSORY_IDS.map(byId).filter((p): p is Product => Boolean(p));

  const handleSubscribe = () => {
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <div className="bg-[#0d0e10] flex flex-col items-start w-full">

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <div className="flex flex-col h-[720px] items-start justify-center px-20 py-[120px] relative w-full overflow-hidden">
        {/* Background image — slightly lighter composite overlay */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <img alt="" className="absolute max-w-none object-cover size-full" src={imgHeroSection} />
          {/* Gentle global tint so image reads naturally */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Stronger gradient only behind the text column */}
          <div className="absolute inset-y-0 left-0 w-[65%] bg-gradient-to-r from-black/75 via-black/55 to-transparent" />
        </div>

        <div className="flex flex-col gap-6 items-start relative z-10 w-full max-w-[760px]">
          <div className="flex gap-2 items-center">
            <div className="bg-[#ffd400] h-0.5 w-6" />
            <p className="font-['Montserrat'] font-extrabold text-[#ffd400] text-[12px] uppercase tracking-widest">
              EDICIONES ULTRA LIMITADAS
            </p>
          </div>
          <h1 className="font-['Montserrat'] font-black leading-[1.05] text-[56px] text-white drop-shadow-lg">
            TU PRÓXIMA AVENTURA EMPIEZA AQUÍ.
          </h1>
          {/* Description — high-contrast white */}
          <p className="font-['Inter'] font-normal leading-[1.65] text-white/90 text-[18px] max-w-[580px]">
            Bicicletas, accesorios y equipamiento para llevar tu pasión más lejos. Diseñados para romper récords y superar límites.
          </p>
          <div className="flex gap-4 items-start pt-3">
            <button
              onClick={() => navigate({ page: 'catalog', category: 'all' })}
              className="bg-[#ffd400] flex items-center justify-center px-9 py-[18px] rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] transition-colors cursor-pointer shadow-lg"
            >
              VER BICICLETAS
            </button>
            <button
              onClick={() => navigate({ page: 'about' })}
              className="border-2 border-white flex items-center justify-center px-9 py-[18px] rounded-xl font-['Montserrat'] font-black text-[14px] text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              CONOCER MÁS
            </button>
          </div>
        </div>
      </div>

      {/* ── Categories Section ───────────────────────────────────────── */}
      <div className="flex flex-col gap-10 items-start px-16 py-24 w-full">
        <div className="flex items-end justify-between w-full">
          <div className="flex flex-col gap-2 items-start">
            <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase">
              CATEGORÍAS
            </p>
            <p className="font-['Montserrat'] font-black text-[32px] text-white">ENCUENTRA TU ESTILO</p>
          </div>
        </div>
        <div className="flex gap-6 items-start w-full">
          {categories.map(({ label, image, category }) => (
            <button
              key={label}
              onClick={() => navigate({ page: 'catalog', category })}
              className="flex flex-[1_0_0] flex-col h-[320px] items-start justify-end min-w-0 overflow-hidden p-6 relative group cursor-pointer rounded-2xl border border-[#2c2f36]"
            >
              <div aria-hidden className="absolute inset-0 pointer-events-none">
                <img
                  alt=""
                  className="absolute max-w-none object-cover size-full transition-transform duration-500 group-hover:scale-105"
                  src={image}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              </div>
              <div className="absolute bg-[#ffd400] h-[4px] left-6 top-6 w-10 rounded-full" />
              <div className="flex flex-col gap-1 items-start relative z-10 w-full">
                <p className="font-['Montserrat'] font-black text-[22px] text-white whitespace-nowrap drop-shadow">
                  {label}
                </p>
                <div className="flex gap-[6px] items-center">
                  <p className="font-['Inter'] font-semibold text-[#ffd400] text-[12px] whitespace-nowrap">
                    EXPLORAR
                  </p>
                  <div className="size-3 relative">
                    <img alt="" className="absolute inset-0 size-full block" src={imgArrowRight} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Products ────────────────────────────────────────── */}
      <div className="bg-[#f5f5f5] flex flex-col gap-12 items-start px-16 py-24 w-full">
        <div className="flex flex-col gap-2 items-center w-full">
          <p className="font-['Inter'] font-extrabold text-[#b8920a] text-[12px] tracking-widest uppercase">
            PREPARADOS PARA LA GLORIA
          </p>
          <p className="font-['Montserrat'] font-black text-[36px] text-[#111111]">PRODUCTOS DESTACADOS</p>
          <div className="bg-[#ffd400] h-[3px] w-20 rounded-full" />
        </div>

        <div className="flex gap-6 items-start w-full">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 flex flex-[1_0_0] flex-col gap-0 items-start min-w-0 overflow-hidden rounded-2xl relative self-stretch group shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product image on light background */}
              <button
                onClick={() => navigate({ page: 'product', productId: product.id })}
                className="bg-[#f0f1f2] h-[260px] w-full overflow-hidden relative shrink-0 cursor-pointer block rounded-t-2xl"
              >
                <img
                  alt={product.name}
                  className="absolute inset-0 max-w-none object-cover size-full transition-transform duration-500 group-hover:scale-105"
                  src={product.image}
                />
                {product.isOffer && (
                  <div className="absolute top-3 left-3 bg-[#ffd400] px-2 py-1 rounded-md">
                    <span className="font-['Inter'] font-black text-black text-[10px]">OFERTA</span>
                  </div>
                )}
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
                  className="font-['Montserrat'] font-bold text-[16px] text-gray-900 hover:text-[#b8920a] transition-colors text-left w-full truncate cursor-pointer"
                >
                  {product.name}
                </button>
                <div className="flex gap-[10px] items-baseline">
                  <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[18px]">
                    {formatCOP(product.price)}
                  </p>
                  {product.originalPrice && (
                    <p className="font-['Inter'] font-normal line-through text-gray-400 text-[13px]">
                      {formatCOP(product.originalPrice)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start px-4 pb-5 w-full mt-auto">
                <button
                  onClick={() => addToCart(product)}
                  className="bg-black border-2 border-black flex items-center justify-center py-3 w-full rounded-xl font-['Montserrat'] font-bold text-[12px] text-white hover:bg-[#ffd400] hover:text-black hover:border-[#ffd400] transition-all cursor-pointer"
                >
                  AGREGAR AL CARRITO
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Promotional Banner ───────────────────────────────────────── */}
      <div className="flex h-[400px] items-center justify-between px-20 relative w-full overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <img alt="" className="absolute max-w-none object-cover size-full" src={imgPromotionalBannerSection} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/30" />
        </div>
        <div className="flex flex-col gap-4 items-start relative z-10 max-w-[640px]">
          <div className="bg-[#ffd400] inline-flex items-start px-3 py-[6px] rounded-md">
            <p className="font-['Inter'] font-black text-[12px] text-black whitespace-nowrap">
              OFERTA DE TEMPORADA
            </p>
          </div>
          <p className="font-['Montserrat'] font-black leading-tight text-[40px] text-white">
            HASTA 40% DE DESCUENTO EN TEMPORADA
          </p>
          <p className="font-['Inter'] font-normal text-white/80 text-[16px]">
            Actualiza tu equipamiento con el rendimiento que exigen los profesionales. Unidades limitadas disponibles.
          </p>
        </div>
        <button
          onClick={() => navigate({ page: 'offers' })}
          className="bg-[#ffd400] flex items-center justify-center px-10 py-5 relative z-10 rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 shadow-lg"
        >
          VER OFERTAS
        </button>
      </div>

      {/* ── Accessories Section ──────────────────────────────────────── */}
      <div className="flex flex-col gap-10 items-start px-16 py-24 w-full bg-[#0d0e10]">
        <div className="flex items-end justify-between w-full">
          <div className="flex flex-col gap-2 items-start">
            <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase">
              EQUÍPATE MEJOR
            </p>
            <p className="font-['Montserrat'] font-black text-[32px] text-white">ACCESORIOS ESENCIALES</p>
          </div>
          <button
            onClick={() => navigate({ page: 'catalog', category: 'accesorios' })}
            className="flex gap-2 items-center cursor-pointer group"
          >
            <p className="font-['Inter'] font-bold text-[#ffd400] text-[13px] group-hover:text-white transition-colors whitespace-nowrap">
              VER TODO EL EQUIPAMIENTO
            </p>
            <div className="size-[14px] relative">
              <img alt="" className="absolute inset-0 size-full block" src={imgArrowRight1} />
            </div>
          </button>
        </div>

        <div className="flex gap-6 items-start w-full">
          {accessoryProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 flex flex-[1_0_0] flex-col gap-0 items-start min-w-0 overflow-hidden rounded-2xl relative group shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => navigate({ page: 'product', productId: product.id })}
                className="bg-[#f0f1f2] h-[200px] w-full overflow-hidden relative shrink-0 cursor-pointer block rounded-t-2xl"
              >
                <img
                  alt={product.name}
                  className="absolute inset-0 max-w-none object-cover size-full transition-transform duration-500 group-hover:scale-105"
                  src={product.image}
                />
              </button>
              <div className="flex flex-col gap-[6px] items-start px-4 pt-3 pb-3 w-full">
                <p className="font-['Montserrat'] font-bold text-gray-900 text-[14px] truncate w-full">
                  {product.name}
                </p>
                <p className="font-['Inter'] font-semibold text-[#b8920a] text-[14px]">
                  {formatCOP(product.price)}
                </p>
              </div>
              <div className="flex flex-col items-start px-4 pb-4 w-full">
                <button
                  onClick={() => addToCart(product)}
                  className="bg-[#ffd400] border-2 border-[#ffd400] flex items-center justify-center py-[10px] w-full rounded-xl font-['Montserrat'] font-bold text-[11px] text-black hover:bg-[#e6bf00] hover:border-[#e6bf00] transition-all cursor-pointer"
                >
                  AÑADIR AL CARRITO
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Newsletter Section ───────────────────────────────────────── */}
      <div className="bg-[#121316] border-y border-[#2c2f36] flex flex-col items-center py-24 w-full">
        <div className="flex flex-col gap-8 items-center w-full max-w-[640px] px-6">
          <div className="flex flex-col gap-3 items-center w-full">
            <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase">
              ÚNETE AL CLUB
            </p>
            <p className="font-['Montserrat'] font-black leading-tight text-[32px] text-center text-white">
              ÚNETE A LA COMUNIDAD BIKE STORE
            </p>
            <p className="font-['Inter'] font-normal leading-[1.6] text-gray-400 text-[15px] text-center">
              Regístrate para recibir ofertas exclusivas, información sobre nuevos lanzamientos de bicicletas y consejos de entrenamiento directamente de profesionales.
            </p>
          </div>
          <div className="flex gap-3 items-center w-full">
            <div className="bg-black border border-[#3a3d46] rounded-xl flex flex-[1_0_0] items-start min-w-0 px-5 py-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                placeholder="Ingresa tu correo electrónico..."
                className="bg-transparent font-['Inter'] font-normal text-white text-[14px] outline-none placeholder-gray-500 w-full"
              />
            </div>
            <button
              onClick={handleSubscribe}
              className="bg-[#ffd400] flex items-center justify-center px-8 py-4 rounded-xl font-['Montserrat'] font-black text-[13px] text-black hover:bg-[#e6bf00] transition-colors cursor-pointer flex-shrink-0"
            >
              {subscribed ? '¡GRACIAS!' : 'SUSCRIBIRSE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
