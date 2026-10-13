import { useEffect, useMemo, useRef, useState } from 'react';
import type { CategoryFilter, DashboardData, Order } from '../types';
import { formatCOP } from '../data';
import { refreshAdminOrders, useAllOrders } from '../store/orderStore';
import { refreshAdminProducts, useAllProductsAdmin } from '../store/productStore';
import { fetchDashboard } from '../services/adminService';
import { fetchAdminOrder } from '../services/orderService';
import { errorMessage } from '../services/apiClient';
import { showToast } from '../lib/toast';

type DateRange = 'today' | '7d' | '30d' | 'all';

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Hoy',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  all: 'Todo el histórico',
};

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'Todas las categorías',
  mtb: 'MTB',
  ruta: 'Ruta',
  urbana: 'Urbana',
  electrica: 'Eléctrica',
  accesorios: 'Accesorios',
};

function isWithinRange(dateISO: string, range: DateRange): boolean {
  if (range === 'all') return true;
  const date = new Date(dateISO).getTime();
  const now = Date.now();
  const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
  return now - date <= days * 24 * 60 * 60 * 1000;
}

export default function AdminDashboardPage() {
  const orders = useAllOrders();
  const products = useAllProductsAdmin();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [details, setDetails] = useState<Record<number, Order>>({});
  const requested = useRef<Set<number>>(new Set());
  const [range, setRange] = useState<DateRange>('30d');
  const [category, setCategory] = useState<CategoryFilter>('all');

  /* Todo sale del backend: métricas agregadas (GET /admin/dashboard), pedidos (GET /admin/pedidos)
     y productos (para saber la categoría de cada ítem vendido). */
  useEffect(() => {
    void refreshAdminOrders();
    void refreshAdminProducts();
    fetchDashboard()
      .then(setDash)
      .catch((error) => showToast(errorMessage(error)));
  }, []);

  const ordersInRange = useMemo(() => orders.filter((o) => isWithinRange(o.date, range)), [orders, range]);
  const unfiltered = range === 'all' && category === 'all';

  /* Con filtros activos hacen falta los ítems de cada pedido (el listado no los trae):
     GET /admin/pedidos/:id, una sola vez por pedido. */
  useEffect(() => {
    if (unfiltered) return;
    const missing = ordersInRange
      .filter((o) => o.id !== undefined && !requested.current.has(o.id))
      .slice(0, 100);
    if (!missing.length) return;
    missing.forEach((o) => requested.current.add(o.id as number));
    void Promise.all(missing.map((o) => fetchAdminOrder(o.id as number).catch(() => null))).then((list) => {
      setDetails((prev) => {
        const next = { ...prev };
        for (const d of list) if (d?.id !== undefined) next[d.id] = d;
        return next;
      });
    });
  }, [unfiltered, ordersInRange]);

  const categoryOf = (productId: string) => products.find((p) => String(p.idProducto) === productId)?.category;

  const { totalSales, orderCount, topProducts } = useMemo(() => {
    // Sin filtros: las cifras salen directamente del endpoint del dashboard.
    if (unfiltered && dash) {
      return {
        totalSales: dash.pedidos.ventasTotales,
        orderCount: dash.pedidos.total,
        topProducts: dash.topProductos.map((p) => ({
          id: String(p.productId),
          name: p.name,
          quantity: p.unidades,
          revenue: p.ingresos,
        })),
      };
    }

    const detailed = ordersInRange.map((o) => (o.id !== undefined ? details[o.id] : undefined));
    let sales = 0;
    let count = 0;
    const qtyByProduct = new Map<string, { name: string; quantity: number; revenue: number }>();

    if (category === 'all') {
      // Solo se filtra por fecha: ventas = total de cada pedido del rango (dato real del listado).
      sales = ordersInRange.reduce((sum, o) => sum + o.total, 0);
      count = ordersInRange.length;
    }

    for (const order of detailed) {
      if (!order) continue;
      let hasItemInCategory = false;
      for (const item of order.items) {
        if (category !== 'all' && categoryOf(item.productId) !== category) continue;
        hasItemInCategory = true;
        if (category !== 'all') sales += item.price * item.quantity;
        const acc = qtyByProduct.get(item.productId) ?? { name: item.name, quantity: 0, revenue: 0 };
        acc.quantity += item.quantity;
        acc.revenue += item.price * item.quantity;
        qtyByProduct.set(item.productId, acc);
      }
      if (category !== 'all' && hasItemInCategory) count += 1;
    }

    const top = Array.from(qtyByProduct.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { totalSales: sales, orderCount: count, topProducts: top };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unfiltered, dash, ordersInRange, details, category, products]);

  const filteredOrders = ordersInRange;
  const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;

  // Conteos de inventario: los entrega el backend; mientras carga, se usan los del catálogo admin (también API).
  const activeCount = dash?.productos.activos ?? products.filter((p) => p.active !== false).length;
  const totalProducts = dash?.productos.total ?? products.length;
  const outOfStockCount = dash?.productos.sinStock ?? products.filter((p) => p.active !== false && p.stock === 0).length;
  const lowStockCount =
    dash?.productos.stockBajo ?? products.filter((p) => p.active !== false && p.stock > 0 && p.stock <= 5).length;
  const inactiveCount = dash?.productos.inactivos ?? products.filter((p) => p.active === false).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1.5">
          <label className="font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide">
            Rango de fechas
          </label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DateRange)}
            className="bg-[#f7f7f8] border border-gray-200 rounded-xl px-4 py-2.5 font-['Inter'] font-semibold text-gray-800 text-[13px] outline-none cursor-pointer focus:border-[#ffd400]"
          >
            {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
              <option key={r} value={r}>{RANGE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className="bg-[#f7f7f8] border border-gray-200 rounded-xl px-4 py-2.5 font-['Inter'] font-semibold text-gray-800 text-[13px] outline-none cursor-pointer focus:border-[#ffd400]"
          >
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-5">
        <KpiCard label="Ventas totales" value={formatCOP(totalSales)} accent />
        <KpiCard label="Pedidos" value={String(orderCount)} />
        <KpiCard label="Ticket promedio" value={orderCount > 0 ? formatCOP(Math.round(avgTicket)) : '—'} />
        <KpiCard label="Productos activos" value={`${activeCount} / ${totalProducts}`} />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="font-['Montserrat'] font-black text-[14px] text-black mb-4">⚠️ ALERTAS DE INVENTARIO</p>
          <div className="flex flex-col gap-3">
            <AlertRow label="Sin stock" count={outOfStockCount} tone="red" />
            <AlertRow label="Stock bajo (≤ 5 unidades)" count={lowStockCount} tone="amber" />
            <AlertRow label="Productos inactivos" count={inactiveCount} tone="gray" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="font-['Montserrat'] font-black text-[14px] text-black mb-4">🏆 PRODUCTOS MÁS VENDIDOS</p>
          {topProducts.length === 0 ? (
            <p className="font-['Inter'] font-normal text-gray-400 text-[13px]">
              Sin ventas registradas todavía para este filtro.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-['Montserrat'] font-black text-[#b8920a] text-[13px] w-4">{i + 1}</span>
                    <span className="font-['Inter'] font-semibold text-gray-800 text-[13px] truncate">{p.name}</span>
                  </div>
                  <span className="font-['Inter'] font-bold text-gray-500 text-[12px] whitespace-nowrap">
                    {p.quantity} und · {formatCOP(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="font-['Montserrat'] font-black text-[14px] text-black mb-4">
          PEDIDOS RECIENTES ({filteredOrders.length})
        </p>
        {filteredOrders.length === 0 ? (
          <p className="font-['Inter'] font-normal text-gray-400 text-[13px]">
            Todavía no hay pedidos para el rango seleccionado. Los pedidos aparecen automáticamente aquí cuando un cliente completa el checkout.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredOrders.slice(0, 6).map((o) => (
              <div key={o.orderNumber} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-['Montserrat'] font-bold text-[13px] text-black">{o.orderNumber}</p>
                  <p className="font-['Inter'] font-normal text-[12px] text-gray-500">{o.customerName}</p>
                </div>
                <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[13px]">{formatCOP(o.total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl shadow-sm p-6 ${accent ? 'bg-black' : 'bg-white'}`}>
      <p className={`font-['Inter'] font-semibold text-[11px] uppercase tracking-wide mb-2 ${accent ? 'text-[#ffd400]' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`font-['Montserrat'] font-black text-[24px] ${accent ? 'text-white' : 'text-black'}`}>
        {value}
      </p>
    </div>
  );
}

function AlertRow({ label, count, tone }: { label: string; count: number; tone: 'red' | 'amber' | 'gray' }) {
  const dot = tone === 'red' ? 'bg-red-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-gray-400';
  const text = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-gray-500';
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="font-['Inter'] font-normal text-gray-700 text-[13px]">{label}</span>
      </div>
      <span className={`font-['Montserrat'] font-black text-[14px] ${text}`}>{count}</span>
    </div>
  );
}
