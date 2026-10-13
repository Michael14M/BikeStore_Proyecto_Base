import { dismissToast, useToasts } from '../lib/toast';

export default function ToastHost() {
  const toasts = useToasts();
  if (!toasts.length) return null;

  return (
    <div
      className="fixed top-24 right-6 z-[90] flex flex-col gap-3 w-[340px] max-w-[calc(100vw-3rem)]"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl bg-[#0d0e10] ${
            t.kind === 'error' ? 'border-red-500/60' : 'border-[#ffd400]/60'
          }`}
        >
          <span className={`mt-1.5 size-2 rounded-full flex-shrink-0 ${t.kind === 'error' ? 'bg-red-500' : 'bg-[#ffd400]'}`} />
          <p className="flex-1 font-['Inter'] font-normal text-white text-[13px] leading-snug">{t.message}</p>
          <button
            onClick={() => dismissToast(t.id)}
            aria-label="Cerrar aviso"
            className="text-gray-400 hover:text-white text-[16px] leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
