import { useEffect, useMemo, useState } from 'react';
import { formatCOP } from '../data';
import { refreshAdminOrders, useAllOrders } from '../store/orderStore';
import { refreshAdminProducts, useAllProductsAdmin } from '../store/productStore';

type ReportTab = 'ventas' | 'inventario';

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const orders = useAllOrders();
  const products = useAllProductsAdmin();
  const [tab, setTab] = useState<ReportTab>('ventas');

  // Los reportes se arman con datos reales: pedidos (GET /admin/pedidos) y productos (GET /productos?incluirInactivos=true).
  useEffect(() => {
    void refreshAdminOrders();
    void refreshAdminProducts();
  }, []);

  const salesRows = useMemo(
    () => orders.map((o) => [o.orderNumber, o.customerName, o.customerEmail, new Date(o.date).toLocaleString('es-CO'), o.paymentMethod, o.status, o.total]),
    [orders]
  );
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const inventoryRows = useMemo(
    () => products.map((p) => [p.id, p.name, p.brand, p.category, p.price, p.stock, p.active === false ? 'Inactivo' : 'Activo']),
    [products]
  );

  const exportSalesCSV = () => {
    const csv = toCSV(['Pedido', 'Cliente', 'Correo', 'Fecha', 'Método de pago', 'Estado', 'Total'], salesRows);
    downloadFile(`reporte-ventas-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const exportInventoryCSV = () => {
    const csv = toCSV(['ID', 'Nombre', 'Marca', 'Categoría', 'Precio', 'Stock', 'Estado'], inventoryRows);
    downloadFile(`reporte-inventario-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8;');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex gap-2 bg-white rounded-2xl shadow-sm p-1.5">
          {(['ventas', 'inventario'] as ReportTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-['Montserrat'] font-bold text-[12px] transition-colors cursor-pointer ${
                tab === t ? 'bg-[#ffd400] text-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              {t === 'ventas' ? 'REPORTE DE VENTAS' : 'REPORTE DE INVENTARIO'}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={tab === 'ventas' ? exportSalesCSV : exportInventoryCSV}
            className="bg-black px-5 py-3 rounded-xl font-['Montserrat'] font-bold text-[12px] text-white hover:bg-[#232529] transition-colors cursor-pointer"
          >
            ⬇ EXPORTAR A EXCEL (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="bg-[#ffd400] px-5 py-3 rounded-xl font-['Montserrat'] font-bold text-[12px] text-black hover:bg-[#e6bf00] transition-colors cursor-pointer"
          >
            🖨 IMPRIMIR / EXPORTAR PDF
          </button>
        </div>
      </div>
      <p className="font-['Inter'] font-normal text-gray-400 text-[11px] -mt-3 print:hidden">
        "Exportar a Excel" descarga un archivo .csv (se abre directamente en Excel/Sheets). "Imprimir / Exportar PDF" abre el diálogo de impresión del navegador — ahí puedes elegir "Guardar como PDF".
      </p>

      {tab === 'ventas' ? (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-['Montserrat'] font-black text-[16px] text-black">REPORTE DE VENTAS</p>
            <p className="font-['Montserrat'] font-extrabold text-[#b8920a] text-[16px]">Total: {formatCOP(totalRevenue)}</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {['Pedido', 'Cliente', 'Fecha', 'Pago', 'Estado', 'Total'].map((h) => (
                  <th key={h} className="py-2 font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderNumber} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 font-['Montserrat'] font-bold text-[12px] text-black">{o.orderNumber}</td>
                  <td className="py-2.5 font-['Inter'] text-[12px] text-gray-700">{o.customerName}</td>
                  <td className="py-2.5 font-['Inter'] text-[12px] text-gray-500">{new Date(o.date).toLocaleDateString('es-CO')}</td>
                  <td className="py-2.5 font-['Inter'] text-[12px] text-gray-600 capitalize">{o.paymentMethod}</td>
                  <td className="py-2.5 font-['Inter'] text-[12px] text-gray-600 capitalize">{o.status}</td>
                  <td className="py-2.5 font-['Montserrat'] font-bold text-[12px] text-[#b8920a]">{formatCOP(o.total)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center font-['Inter'] text-gray-400 text-[13px]">Aún no hay pedidos para reportar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="font-['Montserrat'] font-black text-[16px] text-black mb-5">REPORTE DE INVENTARIO</p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {['ID', 'Nombre', 'Marca', 'Categoría', 'Precio', 'Stock', 'Estado'].map((h) => (
                  <th key={h} className="py-2 font-['Inter'] font-semibold text-[11px] text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 font-['Inter'] text-[11px] text-gray-400">{p.id}</td>
                  <td className="py-2.5 font-['Montserrat'] font-bold text-[12px] text-black">{p.name}</td>
                  <td className="py-2.5 font-['Inter'] text-[12px] text-gray-600">{p.brand}</td>
                  <td className="py-2.5 font-['Inter'] text-[12px] text-gray-600 uppercase">{p.category}</td>
                  <td className="py-2.5 font-['Montserrat'] font-bold text-[12px] text-[#b8920a]">{formatCOP(p.price)}</td>
                  <td className="py-2.5 font-['Inter'] text-[12px] text-gray-700">{p.stock}</td>
                  <td className="py-2.5 font-['Inter'] text-[12px] text-gray-600">{p.active === false ? 'Inactivo' : 'Activo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
