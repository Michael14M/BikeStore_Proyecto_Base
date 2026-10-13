import { useState } from 'react';
import type { CartItem, NavigationState, Order, User } from '../types';
import { formatCOP } from '../data';
import { createOrder } from '../services/orderService';
import { errorMessage } from '../services/apiClient';
import { showToast } from '../lib/toast';

interface CheckoutPageProps {
  cart: CartItem[];
  cartTotal: number;
  user: User;
  navigate: (state: NavigationState) => void;
  /** Recibe el pedido REAL que devolvió el backend. */
  onOrderComplete: (order: Order) => void;
  /** El pedido no se pudo crear (p. ej. stock insuficiente): App resincroniza el carrito. */
  onOrderFailed: () => void;
}

type PaymentMethod = 'tarjeta' | 'pse' | 'efectivo';

const CITIES = ['Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Cúcuta', 'Ibagué'];

export default function CheckoutPage({ cart, cartTotal, user, navigate, onOrderComplete, onOrderFailed }: CheckoutPageProps) {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('tarjeta');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const shipping = cartTotal >= 500000 ? 0 : 25000;
  const total = cartTotal + shipping;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!address.trim()) e.address = 'Ingresa tu dirección';
    if (!city) e.city = 'Selecciona tu ciudad';
    if (!phone.trim()) e.phone = 'Ingresa tu teléfono';
    if (payment === 'tarjeta') {
      if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Número de tarjeta inválido';
      if (!cardName.trim()) e.cardName = 'Ingresa el nombre del titular';
      if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) e.cardExpiry = 'Formato: MM/AA';
      if (cardCvv.length < 3) e.cardCvv = 'CVV inválido';
    }
    return e;
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (cart.length === 0) { showToast('Tu carrito está vacío.'); return; }
    setLoading(true);
    try {
      // Solo se envía lo que el contrato del backend permite. El pago es simulado:
      // los datos de la tarjeta se validan aquí en pantalla y NUNCA se envían ni se guardan.
      // Precios, subtotal, envío, total y stock los calcula y valida el backend.
      const order = await createOrder({ address, city, phone, paymentMethod: payment });
      onOrderComplete(order);
    } catch (err) {
      showToast(errorMessage(err));
      onOrderFailed();
    } finally {
      setLoading(false);
    }
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div className="bg-[#0d0e10] min-h-screen">
      {/* Header bar */}
      <div className="bg-black border-b border-[#2c2f36] px-16 py-10">
        <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[11px] tracking-widest uppercase mb-1">
          PASO FINAL
        </p>
        <h1 className="font-['Montserrat'] font-black text-[40px] text-white">FINALIZAR COMPRA</h1>
        <p className="font-['Inter'] font-normal text-gray-400 text-[14px] mt-1">
          Hola, <strong className="text-white">{user.name}</strong> — revisa tu pedido antes de confirmar.
        </p>
      </div>

      <form onSubmit={handleConfirm}>
        <div className="px-16 py-12 flex gap-10 items-start">

          {/* ── Left: Form ──────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-8">

            {/* Shipping */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <SectionTitle step="1" label="INFORMACIÓN DE ENVÍO" />
              <div className="grid grid-cols-2 gap-5 mt-6">
                <CField label="Nombre completo" span={2}>
                  <input readOnly value={user.name} className={`${inputBase} bg-gray-50 text-gray-500 cursor-not-allowed`} />
                </CField>
                <CField label="Correo electrónico" span={2}>
                  <input readOnly value={user.email} className={`${inputBase} bg-gray-50 text-gray-500 cursor-not-allowed`} />
                </CField>
                <CField label="Teléfono" error={errors.phone}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
                    placeholder="+57 300 000 0000"
                    className={fieldCls(!!errors.phone)}
                  />
                </CField>
                <CField label="Ciudad" error={errors.city}>
                  <select
                    value={city}
                    onChange={e => { setCity(e.target.value); setErrors(p => ({ ...p, city: '' })); }}
                    className={fieldCls(!!errors.city)}
                  >
                    <option value="">Seleccionar ciudad</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </CField>
                <CField label="Dirección de entrega" span={2} error={errors.address}>
                  <input
                    type="text"
                    value={address}
                    onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })); }}
                    placeholder="Calle, número, barrio, apto..."
                    className={fieldCls(!!errors.address)}
                  />
                </CField>
              </div>
              <div className="mt-5 bg-[#fffbea] border border-[#ffd400]/40 rounded-xl px-4 py-3">
                <p className="font-['Inter'] font-normal text-gray-600 text-[13px]">
                  {cartTotal >= 500000
                    ? '✓ Tu pedido califica para <strong>envío gratis</strong> a toda Colombia.'
                    : '📦 Agrega $' + formatCOP(500000 - cartTotal).replace(' COP', '') + ' más para obtener envío gratis.'}
                </p>
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <SectionTitle step="2" label="MÉTODO DE PAGO" />

              <div className="flex gap-3 mt-6">
                {([
                  { id: 'tarjeta', label: 'Tarjeta' },
                  { id: 'pse', label: 'PSE' },
                  { id: 'efectivo', label: 'Efectivo' },
                ] as { id: PaymentMethod; label: string }[]).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPayment(opt.id)}
                    className={`flex-1 py-3 rounded-xl border-2 font-['Montserrat'] font-bold text-[13px] transition-all cursor-pointer ${
                      payment === opt.id
                        ? 'bg-[#ffd400] border-[#ffd400] text-black'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-[#ffd400]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {payment === 'tarjeta' && (
                <div className="grid grid-cols-2 gap-5 mt-6">
                  <CField label="Número de tarjeta" span={2} error={errors.cardNumber}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={e => { setCardNumber(formatCard(e.target.value)); setErrors(p => ({ ...p, cardNumber: '' })); }}
                      placeholder="0000 0000 0000 0000"
                      className={fieldCls(!!errors.cardNumber)}
                    />
                  </CField>
                  <CField label="Nombre del titular" span={2} error={errors.cardName}>
                    <input
                      type="text"
                      value={cardName}
                      onChange={e => { setCardName(e.target.value); setErrors(p => ({ ...p, cardName: '' })); }}
                      placeholder="Como aparece en la tarjeta"
                      className={fieldCls(!!errors.cardName)}
                    />
                  </CField>
                  <CField label="Fecha de vencimiento" error={errors.cardExpiry}>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => { setCardExpiry(formatExpiry(e.target.value)); setErrors(p => ({ ...p, cardExpiry: '' })); }}
                      placeholder="MM/AA"
                      maxLength={5}
                      className={fieldCls(!!errors.cardExpiry)}
                    />
                  </CField>
                  <CField label="CVV" error={errors.cardCvv}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardCvv}
                      onChange={e => { setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrors(p => ({ ...p, cardCvv: '' })); }}
                      placeholder="•••"
                      className={fieldCls(!!errors.cardCvv)}
                    />
                  </CField>
                </div>
              )}

              {payment === 'pse' && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
                  <p className="font-['Inter'] font-normal text-blue-700 text-[13px] leading-relaxed">
                    Serás redirigido al portal de tu banco para completar el pago de forma segura mediante débito en cuenta.
                  </p>
                </div>
              )}

              {payment === 'efectivo' && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                  <p className="font-['Inter'] font-normal text-gray-600 text-[13px] leading-relaxed">
                    Pago contra entrega. Nuestro mensajero cobrará el valor exacto al momento de la entrega. Ten el dinero listo.
                  </p>
                </div>
              )}

              {/* Security badge */}
              <div className="mt-6 flex items-center gap-2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="font-['Inter'] font-normal text-[12px]">Pago 100% seguro con encriptación SSL</span>
              </div>
            </section>
          </div>

          {/* ── Right: Order summary ─────────────────────────────────── */}
          <div className="w-[380px] flex-shrink-0 flex flex-col gap-5 sticky top-[120px]">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-['Montserrat'] font-black text-gray-900 text-[16px] mb-5">
                RESUMEN DEL PEDIDO
              </h3>
              <div className="flex flex-col gap-4 max-h-[320px] overflow-y-auto pr-1">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 items-center">
                    <div className="w-14 h-14 bg-[#f0f1f2] rounded-xl overflow-hidden flex-shrink-0">
                      <img src={product.image} alt={product.name} className="size-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Montserrat'] font-bold text-gray-900 text-[13px] truncate leading-tight">
                        {product.name}
                      </p>
                      <p className="font-['Inter'] font-normal text-gray-400 text-[12px]">
                        Cant: {quantity}
                      </p>
                    </div>
                    <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[13px] flex-shrink-0">
                      {formatCOP(product.price * quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 mt-5 pt-5 flex flex-col gap-3">
                <Row label="Subtotal" value={formatCOP(cartTotal)} />
                <Row
                  label="Envío"
                  value={shipping === 0 ? 'GRATIS' : formatCOP(shipping)}
                  valueClass={shipping === 0 ? 'text-green-600 font-bold' : undefined}
                />
                <div className="border-t border-gray-100 pt-3">
                  <Row label="TOTAL" value={formatCOP(total)} big />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ffd400] py-5 rounded-2xl font-['Montserrat'] font-black text-[15px] text-black hover:bg-[#e6bf00] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 shadow-lg"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando pago...
                  </span>
                : 'CONFIRMAR PEDIDO'}
            </button>

            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="w-full py-3.5 rounded-xl border border-gray-200 font-['Montserrat'] font-bold text-[13px] text-gray-500 hover:border-[#ffd400] hover:text-[#b8920a] transition-colors cursor-pointer bg-white"
            >
              ← Seguir comprando
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const inputBase = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 font-[\'Inter\'] font-normal text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#ffd400]';

function fieldCls(hasError: boolean) {
  return `${inputBase} ${hasError ? 'border-red-300' : ''}`;
}

function SectionTitle({ step, label }: { step: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-full bg-[#ffd400] flex items-center justify-center flex-shrink-0">
        <span className="font-['Montserrat'] font-black text-black text-[13px]">{step}</span>
      </div>
      <h3 className="font-['Montserrat'] font-black text-gray-900 text-[15px] tracking-wider">{label}</h3>
    </div>
  );
}

function CField({ label, children, span = 1, error }: { label: string; children: React.ReactNode; span?: 1 | 2; error?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span === 2 ? 'col-span-2' : ''}`}>
      <label className="font-['Inter'] font-semibold text-[11px] text-gray-600 tracking-wider uppercase">
        {label}
      </label>
      {children}
      {error && <p className="font-['Inter'] font-normal text-red-500 text-[12px]">{error}</p>}
    </div>
  );
}

function Row({ label, value, big, valueClass }: { label: string; value: string; big?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`font-['Inter'] font-normal text-gray-500 ${big ? 'font-semibold text-gray-900 text-[15px]' : 'text-[13px]'}`}>
        {label}
      </span>
      <span className={`font-['Montserrat'] font-extrabold ${big ? 'text-[#b8920a] text-[18px]' : 'text-gray-800 text-[13px]'} ${valueClass ?? ''}`}>
        {value}
      </span>
    </div>
  );
}
