import { useEffect, useState } from 'react';
import type { NavigationState, Order, OrderStatus } from '../types';
import { formatCOP } from '../data';
import { fetchMyOrder, fetchMyOrders } from '../services/orderService';
import { errorMessage } from '../services/apiClient';
import { showToast } from '../lib/toast';

interface MyOrdersPageProps {
  navigate: (state: NavigationState) => void;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  procesando: 'Procesando',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const STATUS_TONE: Record<OrderStatus, string> = {
  pendiente: 'bg-amber-50 text-amber-600',
  procesando: 'bg-blue-50 text-blue-600',
  completado: 'bg-green-50 text-green-600',
  cancelado: 'bg-red-50 text-red-500',
};

const PAYMENT_LABELS: Record<string, string> = { tarjeta: 'Tarjeta', pse: 'PSE', efectivo: 'Efectivo' };

/** Historial de pedidos del cliente: GET /api/pedidos y GET /api/pedidos/:id. */
export default function MyOrdersPage({ navigate }: MyOrdersPageProps) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, Order>>({});

  useEffect(() => {
    let cancelled = false;
    fetchMyOrders()
      .then((list) => {
        if (!cancelled) setOrders(list);
      })
      .catch((error) => {
        if (!cancelled) {
          setOrders([]);
          showToast(errorMessage(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDetail = async (order: Order) => {
    if (order.id === undefined) return;
    if (expanded === order.id) {
      setExpanded(null);
      return;
    }
    setExpanded(order.id);
    if (!details[order.id]) {
      try {
        const full = await fetchMyOrder(order.id);
        setDetails((prev) => ({ ...prev, [order.id as number]: full }));
      } catch (error) {
        showToast(errorMessage(error));
      }
    }
  };

  return (
    <div className="bg-[#0d0e10] min-h-screen">
      <div className="bg-black border-b border-[#2c2f36] px-16 py-10">
        <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[11px] tracking-widest uppercase mb-1">
          HISTORIAL
        </p>
        <h1 className="font-['Montserrat'] font-black text-[40px] text-white">MIS PEDIDOS</h1>
      </div>

      <div className="px-16 py-12 max-w-[960px] mx-auto flex flex-col gap-5">
        {orders === null && (
          <p className="font-['Inter'] font-normal text-gray-400 text-[14px]">Cargando tus pedidos...</p>
        )}

        {orders !== null && orders.length === 0 && (
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
            <p className="font-['Montserrat'] font-bold text-gray-900 text-[16px] mb-2">Aún no has realizado pedidos</p>
            <p className="font-['Inter'] font-normal text-gray-500 text-[13px] mb-6">
              Cuando completes una compra, aparecerá aquí.
            </p>
            <button
              onClick={() => navigate({ page: 'catalog', category: 'all' })}
              className="bg-[#ffd400] px-8 py-3 rounded-xl font-['Montserrat'] font-black text-black text-[13px] hover:bg-[#e6bf00] transition-colors cursor-pointer"
            >
              VER PRODUCTOS
            </button>
          </div>
        )}

        {orders?.map((o) => {
          const full = o.id !== undefined ? details[o.id] : undefined;
          const isOpen = expanded === o.id;
          return (
            <div key={o.orderNumber} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-['Montserrat'] font-black text-gray-900 text-[16px]">{o.orderNumber}</p>
                  <p className="font-['Inter'] font-normal text-gray-500 text-[12px]">
                    {new Date(o.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                    {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}
                  </p>
                </div>
                <span className={`font-['Inter'] font-semibold text-[11px] px-2.5 py-1.5 rounded-full ${STATUS_TONE[o.status]}`}>
                  {STATUS_LABELS[o.status]}
                </span>
                <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[16px]">{formatCOP(o.total)}</p>
                <button
                  onClick={() => toggleDetail(o)}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 font-['Inter'] font-semibold text-[12px] text-gray-600 hover:border-[#ffd400] hover:text-[#b8920a] transition-colors cursor-pointer"
                >
                  {isOpen ? 'Ocultar' : 'Ver detalle'}
                </button>
              </div>

              {isOpen && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  {!full ? (
                    <p className="font-['Inter'] font-normal text-gray-400 text-[13px]">Cargando detalle...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex flex-col gap-3">
                        {full.items.map((it) => (
                          <div key={it.productId} className="flex gap-3 items-center">
                            <div className="w-12 h-12 bg-[#f0f1f2] rounded-xl overflow-hidden flex-shrink-0">
                              <img src={it.image} alt={it.name} className="size-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-['Montserrat'] font-bold text-gray-900 text-[13px] truncate">{it.name}</p>
                              <p className="font-['Inter'] font-normal text-gray-400 text-[12px]">Cant: {it.quantity}</p>
                            </div>
                            <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[13px]">
                              {formatCOP(it.price * it.quantity)}
                            </p>
                          </div>
                        ))}
                        <div className="border-t border-gray-100 pt-3 flex flex-col gap-1 font-['Inter'] text-[12px] text-gray-500">
                          <div className="flex justify-between"><span>Subtotal</span><span>{formatCOP(full.subtotal)}</span></div>
                          <div className="flex justify-between">
                            <span>Envío</span><span>{full.shipping === 0 ? 'GRATIS' : formatCOP(full.shipping)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide mb-2">
                          Dirección de entrega
                        </p>
                        <p className="font-['Inter'] font-normal text-[13px] text-gray-700 leading-relaxed">
                          {full.address}
                          <br />
                          {full.city}
                          <br />
                          Tel: {full.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
