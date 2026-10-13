import type { ReactNode } from 'react';
import type { AdminView, NavigationState, User } from '../types';

const NAV_ITEMS: { view: AdminView; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: '📊' },
  { view: 'productos', label: 'Productos', icon: '🚲' },
  { view: 'pedidos', label: 'Pedidos', icon: '📦' },
  { view: 'usuarios', label: 'Usuarios', icon: '👥' },
  { view: 'reportes', label: 'Reportes', icon: '📄' },
];

interface AdminLayoutProps {
  view: AdminView;
  navigate: (state: NavigationState) => void;
  adminUser: User;
  onLogout: () => void;
  children: ReactNode;
}

export default function AdminLayout({ view, navigate, adminUser, onLogout, children }: AdminLayoutProps) {
  const initials = adminUser.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const currentLabel = NAV_ITEMS.find((i) => i.view === view)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex font-['Inter']">
      {/* Sidebar */}
      <aside className="w-[260px] bg-black flex-shrink-0 flex flex-col min-h-screen sticky top-0 self-start print:hidden">
        <div className="px-6 py-8 border-b border-[#232529]">
          <div className="flex items-center gap-2">
            <div className="bg-[#ffd400] h-[3px] w-6 rounded-full" />
            <p className="font-['Montserrat'] font-black text-white text-[14px] tracking-wide">BIKE STORE</p>
          </div>
          <p className="font-['Inter'] font-semibold text-[#ffd400] text-[11px] uppercase tracking-widest mt-2">
            Panel administrativo
          </p>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 px-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => navigate({ page: 'admin', adminView: item.view })}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-['Montserrat'] font-bold text-[12px] tracking-wide transition-colors cursor-pointer text-left ${
                view === item.view
                  ? 'bg-[#ffd400] text-black'
                  : 'text-gray-300 hover:bg-[#1a1c20] hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label.toUpperCase()}
            </button>
          ))}
        </nav>

        <div className="px-4 py-6 border-t border-[#232529]">
          <button
            onClick={() => navigate({ page: 'home' })}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-[#3a3d46] font-['Montserrat'] font-bold text-[11px] text-gray-300 hover:border-[#ffd400] hover:text-[#ffd400] transition-colors cursor-pointer"
          >
            ← VOLVER A LA TIENDA
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 print:hidden">
          <p className="font-['Montserrat'] font-black text-[20px] text-black">
            {currentLabel.toUpperCase()}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-['Montserrat'] font-bold text-[13px] text-black leading-tight">
                {adminUser.name}
              </p>
              <p className="font-['Inter'] font-normal text-[11px] text-gray-500">Administrador</p>
            </div>
            <div className="size-10 rounded-full bg-black flex items-center justify-center border-2 border-[#ffd400] flex-shrink-0">
              <span className="font-['Montserrat'] font-black text-[11px] text-[#ffd400]">{initials}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2.5 rounded-xl border-2 border-black font-['Montserrat'] font-bold text-[12px] text-black hover:bg-black hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              SALIR
            </button>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
