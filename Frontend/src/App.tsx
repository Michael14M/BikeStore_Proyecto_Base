import { useEffect, useState } from 'react';
import type { CartItem, NavigationState, Order, Product, User } from './types';
import { refreshProducts, useActiveProducts } from './store/productStore';
import { purgeLegacyLocalData } from './store/session';
import { useCart } from './store/useCart';
import { resetAdminData } from './store/adminData';
import * as authService from './services/authService';
import { fetchProduct } from './services/productService';
import { ApiError, errorMessage, getToken, setUnauthorizedHandler } from './services/apiClient';
import { showToast } from './lib/toast';
import ToastHost from './components/ToastHost';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SearchOverlay from './components/SearchOverlay';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AboutPage from './pages/AboutPage';
import OffersPage from './pages/OffersPage';
import CheckoutPage from './pages/CheckoutPage';
import ConfirmationPage from './pages/ConfirmationPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminApp from './admin/AdminApp';

export default function App() {
  /* ── Navigation ─────────────────────────────────────────────── */
  const [nav, setNav] = useState<NavigationState>({ page: 'home' });

  const navigate = (state: NavigationState) => {
    setNav(state);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Auth ───────────────────────────────────────────────────────
     La sesión es el JWT (guardado por apiClient). El usuario y su ROL se
     recuperan del backend con GET /auth/me: nunca se confía en un rol guardado
     en el navegador. `authReady` indica que ya se sabe si hay sesión válida. */
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(() => !getToken());
  const [authOpen, setAuthOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  /* ── Catálogo (API) y carrito ───────────────────────────────── */
  const catalog = useActiveProducts();
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, addToCart: addToCartRaw, removeFromCart, updateQuantity, refreshCart, resetCartView } = useCart(
    user,
    authReady,
    catalog,
  );

  const addToCart = (product: Product) => {
    addToCartRaw(product);
    setCartOpen(true);
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  /* Arranque: limpiar datos legados, cargar catálogo real y recuperar sesión (GET /auth/me). */
  useEffect(() => {
    purgeLegacyLocalData();
    void refreshProducts();
    if (!getToken()) return;
    authService
      .fetchMe()
      .then(setUser)
      .catch((error) => {
        // 401: apiClient ya limpió el token y avisó. Sin conexión: avisar y seguir como invitado.
        if (error instanceof ApiError && error.status === 0) showToast(error.message);
      })
      .finally(() => setAuthReady(true));
  }, []);

  /* Token rechazado por el backend (expirado/inválido) en cualquier petición. */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      resetAdminData();
      resetCartView();
      showToast('Tu sesión expiró. Inicia sesión nuevamente.');
    });
    return () => setUnauthorizedHandler(null);
  }, [resetCartView]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  /** What to do immediately after successful auth */
  const [postAuthAction, setPostAuthAction] = useState<'checkout' | null>(null);
  const [authBackLabel, setAuthBackLabel] = useState<string | null>('Volver al carrito');

  const openAuth = (mode: 'login' | 'register' = 'login', afterAction: 'checkout' | null = null, backLabel: string | null = 'Volver al carrito') => {
    setAuthMode(mode);
    setPostAuthAction(afterAction);
    setAuthBackLabel(backLabel);
    setCartOpen(false);
    setAuthOpen(true);
  };

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setAuthOpen(false);
    if (postAuthAction === 'checkout') {
      navigate({ page: 'checkout' });
    }
    setPostAuthAction(null);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    resetAdminData();
    resetCartView(); // el carrito sigue guardado en MySQL y vuelve al iniciar sesión
    if (nav.page === 'checkout' || nav.page === 'confirmation' || nav.page === 'admin' || nav.page === 'orders') {
      navigate({ page: 'home' });
    }
  };

  /* ── Admin route guard + sincronización mínima de la URL /admin ──────
     El proyecto no usa un router: `nav` es el único estado de navegación.
     Para permitir entrar por /admin (o volver a él tras recargar) sin
     introducir una librería de rutas, se hace una sincronización mínima
     con window.location e history.replaceState, sin afectar el resto de
     páginas (que siguen sin URL propia, igual que antes). */
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      navigate({ page: 'admin', adminView: 'dashboard' });
    }
    // Solo al montar: solo nos interesa la URL con la que llegó el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Un cliente sin rol admin nunca debe quedarse en la vista 'admin'.
    // (Solo cuando ya se sabe si hay sesión: mientras /auth/me responde no se expulsa a nadie.)
    if (authReady && nav.page === 'admin' && !isAdmin) {
      navigate({ page: 'home' });
    }
    if (authReady && nav.page === 'orders' && !user) {
      navigate({ page: 'home' });
    }
  }, [authReady, nav.page, isAdmin, user]);

  useEffect(() => {
    if (!authReady) return;
    const targetPath = nav.page === 'admin' && isAdmin ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }
  }, [authReady, nav.page, isAdmin]);

  /* ── Checkout gateway ───────────────────────────────────────── */
  const handleCheckout = () => {
    setCartOpen(false);
    if (user) {
      navigate({ page: 'checkout' });
    } else {
      openAuth('login', 'checkout', 'Volver al carrito');
    }
  };

  /* ── Order ──────────────────────────────────────────────────────
     El pedido lo crea y calcula el backend (POST /pedidos); aquí solo se guarda
     el que devolvió para mostrar la confirmación con datos reales. */
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const handleOrderComplete = (order: Order) => {
    setConfirmedOrder(order);
    void refreshCart(); // el backend vació el carrito al crear el pedido
    void refreshProducts(); // el stock cambió
    navigate({ page: 'confirmation' });
  };

  const handleContinueShopping = () => {
    navigate({ page: 'home' });
  };

  const confirmedItems: CartItem[] = (confirmedOrder?.items ?? []).map((it) => {
    const known = catalog.find((p) => String(p.idProducto) === it.productId);
    return {
      quantity: it.quantity,
      product: {
        id: known?.id ?? `p-${it.productId}`,
        idProducto: Number(it.productId),
        name: it.name,
        brand: known?.brand ?? '',
        category: known?.category ?? 'accesorios',
        price: it.price,
        image: it.image,
        rating: known?.rating ?? 0,
        description: '',
        stock: 0,
      },
    };
  });

  /* ── Search ─────────────────────────────────────────────────── */
  const [searchOpen, setSearchOpen] = useState(false);

  /* ── Derived ────────────────────────────────────────────────── */
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const listedProduct = nav.productId ? catalog.find((p) => p.id === nav.productId) : undefined;
  const listedProductId = listedProduct?.idProducto;

  useEffect(() => {
    setProductDetail(null);
    if (nav.page !== 'product' || listedProductId === undefined) return;
    let cancelled = false;
    fetchProduct(listedProductId)
      .then((p) => {
        if (!cancelled) setProductDetail(p);
      })
      .catch((error) => {
        if (cancelled) return;
        showToast(errorMessage(error));
        if (error instanceof ApiError && error.status === 404) {
          void refreshProducts();
          navigate({ page: 'catalog', category: 'all' });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.page, nav.productId, listedProductId]);

  const selectedProduct = productDetail ?? listedProduct;

  const hideFooter = nav.page === 'checkout' || nav.page === 'confirmation' || nav.page === 'admin';

  return (
    <div className="bg-[#0d0e10] min-h-screen">
      {/* Header is always visible, excepto dentro del panel administrativo,
          que tiene su propia barra superior (ver AdminApp/AdminLayout). */}
      {nav.page !== 'admin' && (
        <Header
          nav={nav}
          cartCount={cartCount}
          user={user}
          navigate={navigate}
          onSearchOpen={() => setSearchOpen(true)}
          onCartOpen={() => setCartOpen(true)}
          onAuthOpen={(mode) => openAuth(mode ?? 'login', null, null)}
          onLogout={handleLogout}
        />
      )}

      <main>
        {nav.page === 'admin' && isAdmin && (
          <AdminApp
            view={nav.adminView ?? 'dashboard'}
            navigate={navigate}
            adminUser={user}
            onLogout={handleLogout}
          />
        )}
        {nav.page === 'home' && (
          <HomePage navigate={navigate} addToCart={addToCart} />
        )}
        {nav.page === 'catalog' && (
          <CatalogPage navigate={navigate} addToCart={addToCart} initialCategory={nav.category} />
        )}
        {nav.page === 'product' && selectedProduct && (
          <ProductDetailPage product={selectedProduct} navigate={navigate} addToCart={addToCart} />
        )}
        {nav.page === 'about' && (
          <AboutPage navigate={navigate} />
        )}
        {nav.page === 'offers' && (
          <OffersPage navigate={navigate} addToCart={addToCart} />
        )}
        {nav.page === 'checkout' && user && (
          <CheckoutPage
            cart={cart}
            cartTotal={cartTotal}
            user={user}
            navigate={navigate}
            onOrderComplete={handleOrderComplete}
            onOrderFailed={() => void refreshCart()}
          />
        )}
        {nav.page === 'orders' && user && (
          <MyOrdersPage navigate={navigate} />
        )}
        {nav.page === 'confirmation' && user && confirmedOrder && (
          <ConfirmationPage
            orderNumber={confirmedOrder.orderNumber}
            cart={confirmedItems}
            cartTotal={confirmedOrder.total}
            user={user}
            navigate={navigate}
            onContinueShopping={handleContinueShopping}
          />
        )}
      </main>

      {!hideFooter && <Footer navigate={navigate} />}

      {/* Cart drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        user={user}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        cartTotal={cartTotal}
        onCheckout={handleCheckout}
      />

      {/* Auth modal — triggered from cart or header, never on load */}
      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        backLabel={authBackLabel}
      />

      {/* Search overlay */}
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        navigate={navigate}
      />

      {/* Avisos de error/confirmación de la API */}
      <ToastHost />
    </div>
  );
}
