import { useState, useEffect, useRef } from 'react';
import type { NavigationState } from '../types';
import { formatCOP } from '../data';
import { useActiveProducts } from '../store/productStore';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  navigate: (state: NavigationState) => void;
}

export default function SearchOverlay({ open, onClose, navigate }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const products = useActiveProducts();

  const results = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.brand.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  if (!open) return null;

  const handleSelectProduct = (productId: string) => {
    navigate({ page: 'product', productId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      <div
        className="flex-1 bg-black/80"
        style={{ backdropFilter: 'blur(4px)' }}
      />
      <div
        className="bg-[#0d0e10] border-t border-[#2c2f36] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-[800px] mx-auto px-6 py-8">
          <div className="flex items-center gap-4 border-b-2 border-[#ffd400] pb-3 mb-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888c94" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar bicicletas, accesorios, marcas..."
              className="flex-1 bg-transparent font-['Inter'] font-normal text-white text-[18px] outline-none placeholder-[#888c94]"
            />
            <button
              onClick={onClose}
              className="text-[#888c94] hover:text-white transition-colors font-['Inter'] text-[14px] cursor-pointer"
            >
              ESC
            </button>
          </div>

          {results.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product.id)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#181a1e] transition-colors text-left cursor-pointer"
                >
                  <div className="w-12 h-12 bg-[#f0f1f2] flex-shrink-0 overflow-hidden rounded-lg">
                    <img src={product.image} alt={product.name} className="size-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Inter'] font-bold text-[#ffd400] text-[11px] uppercase mb-0.5">
                      {product.brand}
                    </p>
                    <p className="font-['Montserrat'] font-bold text-white text-[14px] truncate">
                      {product.name}
                    </p>
                  </div>
                  <p className="font-['Montserrat'] font-extrabold text-[#ffd400] text-[14px] flex-shrink-0">
                    {formatCOP(product.price)}
                  </p>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <p className="font-['Inter'] font-normal text-[#888c94] text-[14px]">
              No se encontraron resultados para "{query}"
            </p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {['MTB', 'Ruta', 'Eléctrica', 'Cascos', 'Canyon', 'Trek', 'Specialized'].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="bg-[#181a1e] border border-[#2c2f36] px-4 py-2 rounded-lg font-['Inter'] font-semibold text-gray-400 text-[13px] hover:border-[#ffd400] hover:text-[#ffd400] transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
