import type { CartItem, User } from '../types';
import { formatCOP } from '../data';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  user: User | null;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  cartTotal: number;
  onCheckout: () => void;
}

export default function CartDrawer({
  open, onClose, cart, user,
  removeFromCart, updateQuantity, cartTotal, onCheckout,
}: CartDrawerProps) {
  const shipping = cartTotal >= 500000 ? 0 : 25000;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />}

      <div
        className={`fixed right-0 top-0 h-full w-[420px] bg-[#0d0e10] border-l border-[#2c2f36] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2c2f36]">
          <div className="flex items-center gap-3">
            <h2 className="font-['Montserrat'] font-black text-white text-[18px]">TU CARRITO</h2>
            {cart.length > 0 && (
              <span className="bg-[#ffd400] text-black font-['Inter'] font-black text-[11px] px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-[22px] leading-none cursor-pointer size-8 flex items-center justify-center rounded-full hover:bg-[#2c2f36]"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5">
              <div className="size-16 rounded-full bg-[#1a1c20] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3a3d46" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <p className="font-['Montserrat'] font-bold text-gray-500 text-[14px] text-center">
                Tu carrito está vacío
              </p>
              <button
                onClick={onClose}
                className="bg-[#ffd400] px-8 py-3 rounded-xl font-['Montserrat'] font-black text-black text-[13px] hover:bg-[#e6bf00] transition-colors cursor-pointer"
              >
                VER PRODUCTOS
              </button>
            </div>
          ) : (
            cart.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 items-start pb-4 border-b border-[#1e2126]">
                <div className="w-[80px] h-[80px] bg-[#f0f1f2] flex-shrink-0 overflow-hidden rounded-xl">
                  <img src={product.image} alt={product.name} className="size-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Inter'] font-bold text-[#ffd400] text-[10px] uppercase tracking-widest mb-1">
                    {product.brand}
                  </p>
                  <p className="font-['Montserrat'] font-bold text-white text-[13px] leading-tight mb-2 truncate">
                    {product.name}
                  </p>
                  <p className="font-['Montserrat'] font-extrabold text-[#ffd400] text-[14px] mb-3">
                    {formatCOP(product.price)}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#3a3d46] rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-8 h-8 text-gray-400 hover:text-[#ffd400] hover:bg-[#1a1c20] transition-colors flex items-center justify-center font-bold cursor-pointer"
                      >
                        −
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center font-['Inter'] font-bold text-white text-[13px] border-x border-[#3a3d46]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-8 h-8 text-gray-400 hover:text-[#ffd400] hover:bg-[#1a1c20] transition-colors flex items-center justify-center font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors text-[12px] font-['Inter'] cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-[#2c2f36] flex flex-col gap-4">
            {/* Free shipping callout */}
            {cartTotal < 500000 && (
              <div className="bg-[#1a1c20] border border-[#2c2f36] rounded-xl px-4 py-3">
                <p className="font-['Inter'] font-normal text-gray-400 text-[12px]">
                  Agrega{' '}
                  <strong className="text-[#ffd400]">{formatCOP(500000 - cartTotal)}</strong>
                  {' '}más para obtener <strong className="text-white">envío gratis</strong>
                </p>
                <div className="mt-2 h-1.5 bg-[#2c2f36] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ffd400] rounded-full transition-all"
                    style={{ width: `${Math.min((cartTotal / 500000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-['Inter'] font-normal text-gray-400 text-[13px]">
                <span>Subtotal</span>
                <span className="text-white">{formatCOP(cartTotal)}</span>
              </div>
              <div className="flex justify-between font-['Inter'] font-normal text-gray-400 text-[13px]">
                <span>Envío</span>
                <span className={shipping === 0 ? 'text-green-400 font-semibold' : 'text-white'}>
                  {shipping === 0 ? 'GRATIS' : formatCOP(shipping)}
                </span>
              </div>
            </div>

            {/* Checkout CTA — auth-gated */}
            <button
              onClick={onCheckout}
              className="bg-[#ffd400] w-full py-4 rounded-xl font-['Montserrat'] font-black text-black text-[14px] hover:bg-[#e6bf00] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {user ? (
                'CONTINUAR CON LA COMPRA'
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  INICIAR SESIÓN Y COMPRAR
                </>
              )}
            </button>

            {!user && (
              <p className="font-['Inter'] font-normal text-gray-500 text-[12px] text-center -mt-1">
                Debes iniciar sesión para continuar con el pago
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border border-[#3a3d46] font-['Montserrat'] font-bold text-gray-400 text-[12px] hover:border-[#ffd400] hover:text-[#ffd400] transition-colors cursor-pointer"
            >
              SEGUIR COMPRANDO
            </button>
          </div>
        )}
      </div>
    </>
  );
}
