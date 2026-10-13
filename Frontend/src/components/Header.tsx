import { useState, useRef, useEffect } from 'react';
import type { NavigationState, User } from '../types';

const imgBrandLogo = '/assets/44336.png';
const imgSearch = '/assets/47f8c.svg';
const imgShoppingCart = '/assets/0758c.svg';

interface HeaderProps {
  nav: NavigationState;
  cartCount: number;
  user: User | null;
  navigate: (state: NavigationState) => void;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onAuthOpen: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export default function Header({
  nav, cartCount, user,
  navigate, onSearchOpen, onCartOpen, onAuthOpen, onLogout,
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const navItems = [
    { label: 'BICICLETAS', action: () => navigate({ page: 'catalog', category: 'all' }) },
    { label: 'ACCESORIOS', action: () => navigate({ page: 'catalog', category: 'accesorios' }) },
  ];

  const initials = user
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <header className="bg-[#f2f2f2] border-b border-[#e0e0e0] sticky top-0 z-50">
      <div className="flex h-[96px] items-center justify-between px-16">

        {/* Logo */}
        <button
          onClick={() => navigate({ page: 'home' })}
          className="h-[90px] w-[120px] relative shrink-0 cursor-pointer"
          aria-label="Ir al inicio"
        >
          <img alt="Bike Store" className="absolute inset-0 size-full object-cover" src={imgBrandLogo} />
        </button>

        {/* Nav */}
        <nav className="flex gap-8 items-center">
          {navItems.map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="py-2 font-['Montserrat'] font-bold text-[13px] text-black hover:text-[#b8920a] transition-colors whitespace-nowrap cursor-pointer"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => navigate({ page: 'offers' })}
            className="py-2 font-['Montserrat'] font-bold text-[13px] text-[#cca600] hover:text-[#ffd400] transition-colors whitespace-nowrap cursor-pointer"
          >
            OFERTAS
          </button>
        </nav>

        {/* Actions */}
        <div className="flex gap-5 items-center">
          {/* Search */}
          <button
            onClick={onSearchOpen}
            className="flex items-center justify-center size-10 hover:opacity-70 transition-opacity cursor-pointer rounded-full hover:bg-black/5"
            aria-label="Buscar"
          >
            <div className="size-5 relative">
              <img alt="" className="absolute inset-0 size-full" src={imgSearch} />
            </div>
          </button>

          {/* Cart */}
          <button
            onClick={onCartOpen}
            className="flex gap-2 items-center hover:opacity-70 transition-opacity cursor-pointer"
            aria-label={`Carrito (${cartCount} artículos)`}
          >
            <div className="size-5 relative">
              <img alt="" className="absolute inset-0 size-full" src={imgShoppingCart} />
            </div>
            <div className="bg-[#ffd400] px-[6px] py-[2px] rounded-full min-w-[20px] flex items-center justify-center">
              <span className="font-['Inter'] font-black text-[11px] text-black">{cartCount}</span>
            </div>
          </button>

          {/* User — dropdown if logged in, else login button */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 cursor-pointer group"
                  aria-label="Menú de usuario"
                >
                  <div className="size-9 rounded-full bg-black flex items-center justify-center border-2 border-[#ffd400] group-hover:border-[#b8920a] transition-colors">
                    <span className="font-['Montserrat'] font-black text-[11px] text-[#ffd400]">
                      {initials}
                    </span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-[220px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="px-5 py-4 border-b border-gray-100 bg-[#fffbea]">
                      <p className="font-['Montserrat'] font-black text-gray-900 text-[14px] truncate">
                        {user.name}
                      </p>
                      <p className="font-['Inter'] font-normal text-gray-500 text-[12px] truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-2">
                      {user.role === 'admin' && (
                        <button
                          onClick={() => { navigate({ page: 'admin', adminView: 'dashboard' }); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-5 py-3 font-['Inter'] font-semibold text-[#b8920a] text-[13px] hover:bg-[#fffbea] transition-colors cursor-pointer text-left"
                        >
                          <span>🛠️</span>
                          Panel de administración
                        </button>
                      )}
                      {[
                        { label: 'Mis pedidos', icon: '📦', action: () => { navigate({ page: 'orders' }); setUserMenuOpen(false); } },
                        { label: 'Mi cuenta', icon: '👤', action: undefined },
                        { label: 'Lista de deseos', icon: '❤️', action: undefined },
                      ].map(({ label, icon, action }) => (
                        <button
                          key={label}
                          onClick={action}
                          className="w-full flex items-center gap-3 px-5 py-3 font-['Inter'] font-normal text-gray-700 text-[13px] hover:bg-gray-50 transition-colors cursor-pointer text-left"
                        >
                          <span>{icon}</span>
                          {label}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => { onLogout(); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-5 py-3 font-['Inter'] font-semibold text-red-500 text-[13px] hover:bg-red-50 transition-colors cursor-pointer text-left"
                        >
                          <span>🚪</span>
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => onAuthOpen('login')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black font-['Montserrat'] font-bold text-[12px] text-black hover:bg-black hover:text-white transition-all cursor-pointer"
                aria-label="Iniciar sesión"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                INGRESAR
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
