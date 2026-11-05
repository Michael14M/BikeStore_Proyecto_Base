import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { NavigationState, Order, User } from '../types';
import { formatCOP } from '../data';
import { updateProfile } from '../services/customerService';
import { fetchMyOrder, fetchMyOrders } from '../services/orderService';
import { errorMessage } from '../services/apiClient';
import { showToast } from '../lib/toast';

type Tab = 'resumen' | 'pedidos' | 'direcciones' | 'pagos' | 'perfil';

const STATUS_LABEL: Record<Order['status'], string> = {
  pendiente: 'Pendiente', procesando: 'En preparación', completado: 'Completado', cancelado: 'Cancelado',
};
const STATUS_CLASS: Record<Order['status'], string> = {
  pendiente: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  procesando: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300',
  completado: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  cancelado: 'border-red-400/30 bg-red-400/10 text-red-300',
};
const PAYMENT_LABEL: Record<string, string> = { tarjeta: 'Tarjeta', pse: 'PSE', efectivo: 'Efectivo' };

function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  const paths: Record<string, ReactNode> = {
    chart: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    card: <><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M2.5 9h19M7 15h4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    truck: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"/>,
  };
  return <svg {...common}>{paths[name] ?? paths.user}</svg>;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AccountPage({ user, onUpdated, navigate, onLogout }: {
  user: User;
  onUpdated: (u: User) => void;
  navigate: (state: NavigationState) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>('resumen');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, Order>>({});
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setName(user.name); setEmail(user.email); }, [user.name, user.email]);
  useEffect(() => {
    let cancelled = false;
    fetchMyOrders().then((list) => { if (!cancelled) setOrders(list); })
      .catch((error) => { if (!cancelled) { setOrders([]); showToast(errorMessage(error)); } });
    return () => { cancelled = true; };
  }, []);

  const latestOrder = orders?.[0] ?? null;
  const activeOrders = useMemo(() => (orders ?? []).filter(o => o.status === 'pendiente' || o.status === 'procesando').length, [orders]);
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  const loadDetails = async (order: Order) => {
    if (!order.id) return order;
    if (orderDetails[order.id]) return orderDetails[order.id];
    const detail = await fetchMyOrder(order.id);
    setOrderDetails(prev => ({ ...prev, [order.id as number]: detail }));
    return detail;
  };

  const toggleOrder = async (order: Order) => {
    if (expandedOrder === order.id) { setExpandedOrder(null); return; }
    setExpandedOrder(order.id ?? null);
    try { await loadDetails(order); } catch (error) { showToast(errorMessage(error)); }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      const updated = await updateProfile({ nombre: name.trim(), email: email.trim() });
      onUpdated(updated); showToast('Tus datos se actualizaron correctamente.');
    } catch (error) { showToast(errorMessage(error)); }
    finally { setBusy(false); }
  };

  const latestDetail = latestOrder?.id ? orderDetails[latestOrder.id] : undefined;
  useEffect(() => {
    if (latestOrder?.id && !orderDetails[latestOrder.id]) {
      fetchMyOrder(latestOrder.id).then(detail => setOrderDetails(prev => ({ ...prev, [latestOrder.id as number]: detail }))).catch(() => undefined);
    }
    // The newest order is loaded once after the order list arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestOrder?.id]);
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'resumen', label: 'Resumen General', icon: 'chart' },
    { id: 'pedidos', label: 'Mis Pedidos', icon: 'box' },
    { id: 'direcciones', label: 'Direcciones de Envío', icon: 'pin' },
    { id: 'pagos', label: 'Métodos de Pago', icon: 'card' },
    { id: 'perfil', label: 'Datos del Perfil', icon: 'user' },
  ];
  const panel = 'rounded-2xl border border-[#292526] bg-[#171415] p-5 md:p-6';
  const inset = 'rounded-xl border border-[#302b2c] bg-[#100e0f] p-4';
  const muted = 'text-[#a99b94]';

  return (
    <main className="min-h-screen bg-[#0a0909] px-4 py-7 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[#292526] pb-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs text-[#a99b94]"><button onClick={() => navigate({ page: 'home' })} className="hover:text-[#ffd400]">Inicio</button><span className="mx-2">/</span><span className="text-[#ffd400]">Mi Cuenta</span></p>
            <h1 className="font-['Montserrat'] text-2xl font-black tracking-wide md:text-3xl">PANEL DE USUARIO</h1>
          </div>
          <div className="rounded-xl border border-[#302b2c] bg-[#171415] px-7 py-3 text-center">
            <span className={`block text-xs ${muted}`}>Pedidos realizados</span>
            <strong className="font-['Montserrat'] text-xl text-[#ffd400]">{orders?.length ?? '—'}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className={`${panel} h-fit lg:sticky lg:top-28`}>
            <div className="mb-5 border-b border-[#302b2c] pb-6 text-center">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#ffd400] bg-[#292526] font-['Montserrat'] text-xl font-black text-[#ffd400]">{initials || 'BS'}</div>
              <h2 className="font-['Montserrat'] text-lg font-extrabold">{user.name}</h2>
              <p className={`break-all text-xs ${muted}`}>{user.email}</p>
            </div>
            <nav className="space-y-1.5" aria-label="Secciones de mi cuenta">
              {tabs.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${tab === item.id ? 'bg-[#ffd400] text-black' : 'text-[#c6b9b2] hover:bg-[#242021] hover:text-white'}`}>
                  <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.id === 'pedidos' && activeOrders > 0 && <span className="rounded-full bg-[#ffd400] px-2 py-0.5 text-[10px] font-black text-black">{activeOrders} activos</span>}
                </button>
              ))}
              <button onClick={() => navigate({ page: 'wishlist' })} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#c6b9b2] transition hover:bg-[#242021] hover:text-white">
                <Icon name="heart" className="h-[18px] w-[18px]" /> Lista de deseos
              </button>
              <div className="mt-4 border-t border-[#302b2c] pt-3">
                <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"><Icon name="logout" className="h-[18px] w-[18px]" />Cerrar Sesión</button>
              </div>
            </nav>
          </aside>

          <section className="min-w-0 space-y-6">
            {tab === 'resumen' && <>
              <div className={panel}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#302b2c] pb-4">
                  <div><span className={`text-xs ${muted}`}>Último pedido realizado</span><h3 className="font-['Montserrat'] text-lg font-extrabold">{latestOrder ? `Orden #${latestOrder.orderNumber}` : 'Aún no tienes pedidos'}</h3></div>
                  {latestOrder && <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CLASS[latestOrder.status]}`}>{STATUS_LABEL[latestOrder.status]}</span>}
                </div>
                {!latestOrder ? <div className="py-7 text-center"><p className={`mb-4 text-sm ${muted}`}>Cuando realices tu primera compra, podrás consultar aquí su estado.</p><button onClick={() => navigate({ page: 'catalog', category: 'all' })} className="rounded-lg bg-[#ffd400] px-5 py-2.5 text-sm font-extrabold text-black hover:bg-[#e6c000]">Explorar catálogo</button></div> : <>
                  <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(['pendiente', 'procesando', 'completado'] as const).map((status, index) => {
                      const active = latestOrder.status !== 'cancelado' && (latestOrder.status === 'completado' || (latestOrder.status === 'procesando' ? index <= 1 : index === 0));
                      return <div key={status} className="flex items-center gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-[#ffd400] text-black' : 'bg-[#292526] text-[#766c67]'}`}><Icon name={index === 2 ? 'home' : index === 1 ? 'truck' : 'check'} className="h-4 w-4" /></div><div><p className={`text-xs font-bold ${active ? 'text-white' : 'text-[#766c67]'}`}>{index === 0 ? 'Recibido' : index === 1 ? 'En preparación' : 'Completado'}</p><p className="text-[10px] text-[#766c67]">{active ? dateLabel(latestOrder.date) : 'Pendiente'}</p></div></div>;
                    })}
                  </div>
                  <div className={`${inset} flex flex-col justify-between gap-4 sm:flex-row sm:items-center`}>
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#403839] bg-[#242021] text-[#ffd400]"><Icon name="box" className="h-7 w-7" /></div>
                      <div className="min-w-0"><p className="text-sm font-bold">{latestDetail?.items?.[0]?.name ?? (latestDetail ? 'Pedido sin productos disponibles' : 'Cargando productos del pedido…')}</p><p className={`mt-1 text-xs ${muted}`}>{latestDetail?.items?.length ? `${latestDetail.items.length} producto(s) · ${formatCOP(latestOrder.total)}` : `Realizado el ${dateLabel(latestOrder.date)}`}</p></div>
                    </div>
                    <button onClick={() => { setTab('pedidos'); if (latestOrder) void toggleOrder(latestOrder); }} className="shrink-0 text-left text-xs font-bold text-[#ffd400] hover:underline">Ver detalle ›</button>
                  </div>
                </>}
              </div>
              <div className={panel}>
                <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-['Montserrat'] font-extrabold"><Icon name="home" className="h-5 w-5 text-[#ffd400]"/> Dirección de tu último pedido</h3><button onClick={() => setTab('direcciones')} className="text-xs font-bold text-[#ffd400] hover:underline">Ver direcciones</button></div>
                {latestOrder ? <div className={`${inset} space-y-1 text-xs`}><p className="font-bold">{latestOrder.customerName || user.name}</p><p className={muted}>{latestDetail?.address || latestOrder.address || 'Consulta el detalle del pedido para ver la dirección.'}</p><p className={muted}>{latestDetail?.city || latestOrder.city}</p><p className={muted}>Tel: {latestDetail?.phone || latestOrder.phone || 'No registrado'}</p></div> : <p className={`text-sm ${muted}`}>Todavía no hay direcciones asociadas a tus pedidos.</p>}
              </div>
            </>}

            {tab === 'pedidos' && <div className={panel}>
              <div className="mb-5"><h3 className="font-['Montserrat'] text-xl font-extrabold">Historial de Pedidos</h3><p className={`mt-1 text-xs ${muted}`}>Consulta tus compras y el estado de cada pedido.</p></div>
              {orders === null ? <p className={`text-sm ${muted}`}>Cargando tus pedidos…</p> : orders.length === 0 ? <p className={`py-8 text-center text-sm ${muted}`}>Aún no has realizado pedidos.</p> : <div className="space-y-4">{orders.map(order => {
                const detail = order.id ? orderDetails[order.id] : undefined;
                return <article key={order.orderNumber} className="overflow-hidden rounded-xl border border-[#302b2c] bg-[#100e0f]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#302b2c] bg-[#211d1e] p-4"><div><p className="text-sm font-extrabold">#{order.orderNumber}</p><p className={`mt-1 text-xs ${muted}`}>{dateLabel(order.date)} · {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</p></div><div className="flex items-center gap-3"><span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${STATUS_CLASS[order.status]}`}>{STATUS_LABEL[order.status]}</span><strong className="text-sm text-[#ffd400]">{formatCOP(order.total)}</strong></div></div>
                  <div className="flex items-center justify-between gap-3 p-4"><span className={`text-xs ${muted}`}>{detail ? `${detail.items.length} producto(s)` : 'Ver productos y dirección de entrega'}</span><button onClick={() => void toggleOrder(order)} className="rounded-lg border border-[#554a45] px-3 py-2 text-xs font-bold text-[#ffd400] hover:border-[#ffd400]">{expandedOrder === order.id ? 'Ocultar detalle' : 'Ver detalle'}</button></div>
                  {expandedOrder === order.id && <div className="space-y-3 border-t border-[#302b2c] p-4">{!detail ? <p className={`text-xs ${muted}`}>Cargando detalle…</p> : <><div className="space-y-3">{detail.items.map(item => <div key={item.productId} className="flex items-center gap-3"><img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg bg-[#292526] object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.name}</p><p className={`text-[11px] ${muted}`}>Cantidad: {item.quantity}</p></div><span className="text-xs font-bold text-[#ffd400]">{formatCOP(item.price * item.quantity)}</span></div>)}</div><div className={`border-t border-[#302b2c] pt-3 text-xs ${muted}`}><p>{detail.address}</p><p>{detail.city}</p><p>Tel: {detail.phone}</p></div></>}</div>}
                </article>;
              })}</div>}
            </div>}

            {tab === 'direcciones' && <div className={panel}><h3 className="font-['Montserrat'] text-xl font-extrabold">Direcciones de Envío</h3><p className={`mb-5 mt-1 text-xs ${muted}`}>Direcciones registradas en tus compras anteriores.</p>{orders === null ? <p className={`text-sm ${muted}`}>Cargando direcciones…</p> : orders.length === 0 ? <p className={`text-sm ${muted}`}>Aún no hay direcciones guardadas. La dirección se solicita al finalizar una compra.</p> : <div className="space-y-3">{orders.map(order => <div key={order.orderNumber} className={inset}><div className="mb-2 flex items-center justify-between gap-3"><strong className="text-sm">Pedido #{order.orderNumber}</strong><span className="text-[10px] text-[#ffd400]">{dateLabel(order.date)}</span></div><p className={`text-xs ${muted}`}>{order.address || 'Dirección no disponible en este pedido'}</p><p className={`mt-1 text-xs ${muted}`}>{order.city}</p><p className={`mt-1 text-xs ${muted}`}>Tel: {order.phone || 'No registrado'}</p></div>)}</div>}<p className={`mt-5 text-[11px] ${muted}`}>La versión actual no cuenta con una agenda independiente para crear, editar o eliminar direcciones; aquí se muestran las utilizadas en tus pedidos.</p></div>}

            {tab === 'pagos' && <div className={panel}><h3 className="font-['Montserrat'] text-xl font-extrabold">Métodos de Pago</h3><p className={`mb-5 mt-1 text-xs ${muted}`}>Métodos utilizados en tus pedidos.</p>{orders === null ? <p className={`text-sm ${muted}`}>Cargando métodos…</p> : orders.length === 0 ? <p className={`text-sm ${muted}`}>Todavía no has realizado pagos.</p> : <div className="grid gap-3 sm:grid-cols-2">{Array.from(new Set(orders.map(o => o.paymentMethod))).map(method => <div key={method} className={inset}><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#292526] text-[#ffd400]"><Icon name="card"/></div><p className="font-bold">{PAYMENT_LABEL[method] ?? method}</p><p className={`mt-1 text-xs ${muted}`}>Usado en {orders.filter(o => o.paymentMethod === method).length} pedido(s)</p></div>)}</div>}<p className={`mt-5 text-[11px] ${muted}`}>Por seguridad, BIKE STORE no almacena ni muestra números de tarjetas bancarias. Los datos de pago se gestionan durante el proceso de compra.</p></div>}

            {tab === 'perfil' && <div className={panel}><h3 className="font-['Montserrat'] text-xl font-extrabold">Datos del Perfil</h3><p className={`mb-6 mt-1 text-xs ${muted}`}>Actualiza la información vinculada a tu cuenta.</p><form onSubmit={saveProfile} className="max-w-2xl space-y-5"><div><label className="mb-2 block text-xs font-bold text-[#cfc5c0]">Nombre completo</label><input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-[#393233] bg-[#100e0f] px-4 py-3 text-sm text-white outline-none focus:border-[#ffd400]"/></div><div><label className="mb-2 block text-xs font-bold text-[#cfc5c0]">Correo electrónico</label><input required type="email" maxLength={150} value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-[#393233] bg-[#100e0f] px-4 py-3 text-sm text-white outline-none focus:border-[#ffd400]"/></div><p className={`text-[11px] ${muted}`}>Estos son los campos que actualmente permite actualizar el servicio de perfil.</p><div className="flex justify-end"><button disabled={busy} className="rounded-xl bg-[#ffd400] px-6 py-3 text-xs font-black text-black transition hover:bg-[#e6c000] disabled:opacity-50">{busy ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}</button></div></form></div>}
          </section>
        </div>
      </div>
    </main>
  );
}
