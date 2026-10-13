/**
 * Mini-store reactivo para datos que vienen de la API (cache de UI, NO fuente de
 * verdad: la fuente de verdad es MySQL). Mantiene el mismo patrón que ya usaba la
 * app (useSyncExternalStore), con una regla importante: el snapshot que se
 * devuelve conserva SIEMPRE la misma referencia mientras el estado no cambie
 * (si no, React entra en el bucle "getSnapshot should be cached").
 */
import { useSyncExternalStore } from 'react';
import { errorMessage } from '../services/apiClient';

export interface ResourceState<T> {
  data: T;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export interface Resource<T> {
  getState: () => ResourceState<T>;
  subscribe: (listener: () => void) => () => void;
  /** Vuelve a pedir los datos a la API. Si ya hay una petición en curso, encola una más al terminar. */
  refresh: () => Promise<void>;
  setData: (data: T) => void;
  reset: () => void;
}

export function createResource<T>(initialData: T, loader: () => Promise<T>): Resource<T> {
  const initialState: ResourceState<T> = { data: initialData, loading: false, loaded: false, error: null };
  let state = initialState;
  const listeners = new Set<() => void>();
  let inflight: Promise<void> | null = null;
  let queued = false;
  let epoch = 0; // se incrementa en reset(): descarta respuestas de peticiones anteriores

  const set = (patch: Partial<ResourceState<T>>) => {
    state = { ...state, ...patch };
    for (const l of listeners) l();
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh() {
      if (inflight) {
        queued = true;
        return inflight;
      }
      const myEpoch = epoch;
      inflight = (async () => {
        do {
          queued = false;
          set({ loading: true, error: null });
          try {
            const data = await loader();
            if (myEpoch !== epoch) return;
            set({ data, loading: false, loaded: true });
          } catch (error) {
            if (myEpoch !== epoch) return;
            set({ loading: false, error: errorMessage(error) });
          }
        } while (queued && myEpoch === epoch);
      })().finally(() => {
        inflight = null;
      });
      return inflight;
    },
    setData(data) {
      set({ data, loaded: true });
    },
    reset() {
      epoch += 1;
      queued = false;
      inflight = null;
      state = initialState;
      for (const l of listeners) l();
    },
  };
}

export function useResource<T>(resource: Resource<T>): ResourceState<T> {
  return useSyncExternalStore(resource.subscribe, resource.getState, resource.getState);
}
