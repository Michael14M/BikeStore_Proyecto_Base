import { Fragment, useEffect, useMemo, useState } from 'react';
import type { Order, OrderStatus } from '../types';
import { formatCOP } from '../data';
import { refreshAdminOrders, setOrderStatus, useAdminOrdersStatus, useAllOrders } from '../store/orderStore';
import { fetchAdminOrder } from '../services/orderService';
import { errorMessage } from '../services/apiClient';
import { showToast } from '../lib/toast';

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

const PAYMENT_LABELS: Record<string, string> = {
  tarjeta: 'Tarjeta',
  pse: 'PSE',
  efectivo: 'Efectivo',
};

export default function AdminOrdersPage() {
  const orders = useAllOrders();
  const { loading, loaded } = useAdminOrdersStatus();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  /** Detalle (ítems, dirección) por número de pedido: el listado de la API no lo trae. */
  const [details, setDetails] = useState<Record<string, Order>>({});

  useEffect(() => {
    void refreshAdminOrders();
  }, []);

  const changeStatus = async (o: Order, status: OrderStatus) => {
    if (o.id === undefined) return;
    try {
      await setOrderStatus(o.id, status);
      showToast(`Pedido ${o.orderNumber}: estado actualizado a "${STATUS_LABELS[status]}".`, 'success');
    } catch (error) {
      showToast(errorMessage(error));
      void refreshAdminOrders();
    }
  };

  const toggleDetail = async (o: Order) => {
    if (expanded === o.orderNumber) {
      setExpanded(null);
      return;
    }
    setExpanded(o.orderNumber);
    if (!details[o.orderNumber] && o.id !== undefined) {
      try {
        const full = await fetchAdminOrder(o.id);
        setDetails((prev) => ({ ...prev, [o.orderNumber]: full }));
      } catch (error) {
        showToast(errorMessage(error));
      }
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.toLowerCase();
    return orders.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q));
  }, [orders, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-center justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por número de pedido, cliente o correo..."
          className="bg-[#f7f7f8] border border-gray-200 rounded-xl px-4 py-2.5 font-['Inter'] font-normal text-[13px] text-gray-800 outline-none focus:border-[#ffd400] min-w-[280px] flex-1"
        />
        <span className="font-['Inter'] font-normal text-gray-400 text-[12px] whitespace-nowrap">
          {filtered.length} de {orders.length} pedidos
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-['Inter'] font-normal text-gray-400 text-[13px]">
              {loading && !loaded
                ? 'Cargando pedidos...'
                : 'Todavía no hay pedidos registrados. Cada compra completada por un cliente en el checkout aparecerá aquí automáticamente.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Pedido', 'Cliente', 'Fecha', 'Pago', 'Total', 'Estado', ''].map((h) => (
                  <th key={h} className="px-5 py-3 font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <Fragment key={o.orderNumber}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-['Montserrat'] font-bold text-[13px] text-black">{o.orderNumber}</td>
                    <td className="px-5 py-3">
                      <p className="font-['Inter'] font-semibold text-[13px] text-gray-800">{o.customerName}</p>
                      <p className="font-['Inter'] font-normal text-[11px] text-gray-400">{o.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 font-['Inter'] font-normal text-[12px] text-gray-500">
                      {new Date(o.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3 font-['Inter'] font-semibold text-[12px] text-gray-600">{PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}</td>
                    <td className="px-5 py-3 font-['Montserrat'] font-extrabold text-[13px] text-[#b8920a]">{formatCOP(o.total)}</td>
                    <td className="px-5 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => void changeStatus(o, e.target.value as OrderStatus)}
                        className={`font-['Inter'] font-semibold text-[11px] px-2.5 py-1.5 rounded-full outline-none cursor-pointer border-0 ${STATUS_TONE[o.status]}`}
                      >
                        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => void toggleDetail(o)}
                        className="px-3 py-2 rounded-lg border border-gray-200 font-['Inter'] font-semibold text-[11px] text-gray-600 hover:border-[#ffd400] hover:text-[#b8920a] transition-colors cursor-pointer"
                      >
                        {expanded === o.orderNumber ? 'Ocultar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                  {expanded === o.orderNumber && (() => {
                    const d = details[o.orderNumber];
                    if (!d) {
                      return (
                        <tr className="bg-[#fafafa] border-b border-gray-100">
                          <td colSpan={7} className="px-6 py-5 font-['Inter'] text-[12px] text-gray-400">Cargando detalle...</td>
                        </tr>
                      );
                    }
                    return (
                    <tr className="bg-[#fafafa] border-b border-gray-100">
                      <td colSpan={7} className="px-6 py-5">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide mb-2">Productos</p>
                            <div className="flex flex-col gap-1.5">
                              {d.items.map((it) => (
                                <div key={it.productId} className="flex justify-between font-['Inter'] text-[12px]">
                                  <span className="text-gray-700">{it.name} × {it.quantity}</span>
                                  <span className="font-semibold text-gray-800">{formatCOP(it.price * it.quantity)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-gray-200 mt-3 pt-2 flex flex-col gap-1 font-['Inter'] text-[12px]">
                              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCOP(d.subtotal)}</span></div>
                              <div className="flex justify-between text-gray-500"><span>Envío</span><span>{d.shipping === 0 ? 'Gratis' : formatCOP(d.shipping)}</span></div>
                            </div>
                          </div>
                          <div>
                            <p className="font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide mb-2">Envío</p>
                            <p className="font-['Inter'] text-[12px] text-gray-700 leading-relaxed">
                              {d.address}<br />
                              {d.city}<br />
                              Tel: {d.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    );
                  })()}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
