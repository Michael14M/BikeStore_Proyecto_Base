import type { CartItem, NavigationState, User } from '../types';
import { formatCOP } from '../data';

interface ConfirmationPageProps {
  orderNumber: string;
  cart: CartItem[];
  cartTotal: number;
  user: User;
  navigate: (state: NavigationState) => void;
  onContinueShopping: () => void;
}

export default function ConfirmationPage({ orderNumber, cart, cartTotal, user, navigate, onContinueShopping }: ConfirmationPageProps) {
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + 5);
  const dateStr = estimatedDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="bg-[#0d0e10] min-h-screen flex flex-col items-center justify-start py-20 px-6">
      <div className="w-full max-w-[640px] flex flex-col gap-6">

        {/* Success card */}
        <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
          {/* Animated checkmark */}
          <div className="size-20 rounded-full bg-[#ffd400] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <p className="font-['Inter'] font-extrabold text-[#b8920a] text-[11px] tracking-widest uppercase mb-2">
            PEDIDO CONFIRMADO
          </p>
          <h1 className="font-['Montserrat'] font-black text-[32px] text-gray-900 leading-tight mb-3">
            ¡GRACIAS, {user.name.split(' ')[0].toUpperCase()}!
          </h1>
          <p className="font-['Inter'] font-normal text-gray-500 text-[15px] leading-relaxed mb-6">
            Tu pedido ha sido recibido y está siendo procesado. Recibirás un correo de confirmación en <strong className="text-gray-700">{user.email}</strong>.
          </p>

          {/* Order number */}
          <div className="bg-[#fffbea] border-2 border-[#ffd400] rounded-2xl px-6 py-4 inline-flex flex-col items-center gap-1 mb-6">
            <p className="font-['Inter'] font-normal text-gray-500 text-[12px] tracking-wider uppercase">
              Número de pedido
            </p>
            <p className="font-['Montserrat'] font-black text-[22px] text-gray-900">{orderNumber}</p>
          </div>

          {/* Estimated delivery */}
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4l3 5v3h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span className="font-['Inter'] font-normal text-[13px]">
              Entrega estimada: <strong className="text-gray-800 capitalize">{dateStr}</strong>
            </span>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="font-['Montserrat'] font-black text-gray-900 text-[15px] mb-5 tracking-wider">
            RESUMEN DE TU PEDIDO
          </h3>
          <div className="flex flex-col gap-4">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-[#f0f1f2] rounded-xl overflow-hidden flex-shrink-0">
                  <img src={product.image} alt={product.name} className="size-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Inter'] font-bold text-[#b8920a] text-[11px] uppercase tracking-wider mb-0.5">
                    {product.brand}
                  </p>
                  <p className="font-['Montserrat'] font-bold text-gray-900 text-[14px] truncate leading-tight">
                    {product.name}
                  </p>
                  <p className="font-['Inter'] font-normal text-gray-400 text-[12px]">Cant: {quantity}</p>
                </div>
                <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[14px] flex-shrink-0">
                  {formatCOP(product.price * quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-5 pt-4 flex items-center justify-between">
            <span className="font-['Montserrat'] font-black text-gray-900 text-[15px]">TOTAL PAGADO</span>
            <span className="font-['Montserrat'] font-black text-[#b8920a] text-[20px]">
              {formatCOP(cartTotal)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinueShopping}
            className="w-full bg-[#ffd400] py-5 rounded-2xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] active:scale-[0.99] transition-all cursor-pointer shadow-lg"
          >
            SEGUIR COMPRANDO
          </button>
          <button
            onClick={() => navigate({ page: 'catalog', category: 'all' })}
            className="w-full py-4 rounded-2xl border border-[#3a3d46] font-['Montserrat'] font-bold text-[13px] text-gray-400 hover:border-[#ffd400] hover:text-[#ffd400] transition-colors cursor-pointer"
          >
            VER MÁS PRODUCTOS
          </button>
        </div>
      </div>
    </div>
  );
}
