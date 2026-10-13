/**
 * Carrito de Bike Store.
 *
 *  - Con sesión iniciada: la fuente de verdad es el backend (MySQL). Cada acción
 *    llama a la API y se muestra lo que ésta devuelve; el frontend nunca calcula
 *    ni envía precios (solo id de producto y cantidad). Por eso el carrito se
 *    conserva al cerrar/iniciar sesión.
 *  - Sin sesión (invitado): el backend no tiene carrito para anónimos, así que se
 *    conserva como antes, en memoria + cache local (ver session.ts). Al iniciar
 *    sesión se fusiona con el del backend.
 *
 * Las mutaciones se encolan para que respuestas fuera de orden no pisen el estado.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, Product, User } from '../types';
import { ApiError, errorMessage, getToken } from '../services/apiClient';
import * as cartService from '../services/cartService';
import type { ApiCarrito } from '../services/cartService';
import { showToast } from '../lib/toast';
import { clearGuestCart, loadGuestCart, saveGuestCart } from './session';

export function useCart(user: User | null, authReady: boolean, catalog: Product[]) {
  const [guestCart, setGuestCart] = useState<CartItem[]>(() => (getToken() ? [] : loadGuestCart()));
  const [serverCart, setServerCart] = useState<ApiCarrito | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const cart = useMemo<CartItem[]>(() => {
    if (user) return serverCart ? cartService.mapCart(serverCart, catalog) : [];
    return guestCart;
  }, [user, serverCart, guestCart, catalog]);

  const enqueue = useCallback((task: () => Promise<void>) => {
    queue.current = queue.current.then(task).catch(() => undefined);
    return queue.current;
  }, []);

  /** Cache local del carrito de invitado (nunca del autenticado). */
  useEffect(() => {
    if (!user && authReady) saveGuestCart(guestCart);
  }, [guestCart, user, authReady]);

  const refreshCart = useCallback(async () => {
    try {
      setServerCart(await cartService.fetchCart());
    } catch (error) {
      showToast(errorMessage(error));
    }
  }, []);

  /** Al haber sesión: fusiona el carrito de invitado (si había) y carga el del backend. */
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setServerCart(null);
      return;
    }
    let cancelled = false;
    void enqueue(async () => {
      const guestItems = loadGuestCart();
      let failed = 0;
      for (const item of guestItems) {
        try {
          await cartService.addCartItem(item.product.idProducto as number, item.quantity);
        } catch {
          failed += 1;
        }
      }
      if (guestItems.length) {
        clearGuestCart();
        setGuestCart([]);
        if (failed) {
          showToast(
            `${failed} producto(s) de tu carrito no se pudieron agregar (stock insuficiente o no disponibles).`,
          );
        }
      }
      try {
        const fresh = await cartService.fetchCart();
        if (!cancelled) setServerCart(fresh);
      } catch (error) {
        showToast(errorMessage(error));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, authReady, enqueue]);

  /** Ejecuta una mutación del backend y muestra su resultado; si el ítem ya no existe, resincroniza. */
  const mutate = useCallback(
    (call: () => Promise<ApiCarrito>) =>
      enqueue(async () => {
        try {
          setServerCart(await call());
        } catch (error) {
          showToast(errorMessage(error));
          if (error instanceof ApiError && error.status === 404) await refreshCart();
        }
      }),
    [enqueue, refreshCart],
  );

  const addToCart = useCallback(
    (product: Product) => {
      if (user) {
        if (typeof product.idProducto !== 'number') {
          showToast('Este producto no está disponible para agregar al carrito.');
          return;
        }
        void mutate(() => cartService.addCartItem(product.idProducto as number, 1));
        return;
      }
      setGuestCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        return [...prev, { product, quantity: 1 }];
      });
    },
    [user, mutate],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      if (user) {
        const item = cart.find((i) => i.product.id === productId);
        if (item?.itemId !== undefined) void mutate(() => cartService.removeCartItem(item.itemId as number));
        return;
      }
      setGuestCart((prev) => prev.filter((i) => i.product.id !== productId));
    },
    [user, cart, mutate],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      if (user) {
        const item = cart.find((i) => i.product.id === productId);
        if (item?.itemId !== undefined) void mutate(() => cartService.setCartItemQuantity(item.itemId as number, quantity));
        return;
      }
      setGuestCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
    },
    [user, cart, mutate, removeFromCart],
  );

  /** Al cerrar sesión: el carrito del backend se conserva en MySQL; aquí solo se limpia la vista. */
  const resetCartView = useCallback(() => {
    setServerCart(null);
    setGuestCart([]);
    clearGuestCart();
  }, []);

  return { cart, addToCart, removeFromCart, updateQuantity, refreshCart, resetCartView };
}
