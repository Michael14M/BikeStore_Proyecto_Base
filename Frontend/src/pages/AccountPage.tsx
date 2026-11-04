import { useState } from 'react';
import type { User } from '../types';
import { updateProfile } from '../services/customerService';
import { showToast } from '../lib/toast';

export default function AccountPage({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { const updated = await updateProfile({ nombre: name, email }); onUpdated(updated); showToast('Tus datos se actualizaron correctamente.'); }
    catch (err) { showToast(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.'); }
    finally { setBusy(false); }
  };
  return <section className="min-h-[65vh] bg-[#0d0e10] px-6 md:px-16 py-14"><p className="font-['Montserrat'] font-extrabold text-[#ffd400] text-xs tracking-widest">TU PERFIL</p><h1 className="font-['Montserrat'] font-black text-white text-4xl mt-2 mb-10">MI CUENTA</h1><form onSubmit={submit} className="max-w-2xl bg-white rounded-2xl p-7 md:p-10 space-y-6"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label><input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-[#d5ad00]" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label><input required type="email" maxLength={150} value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-[#d5ad00]" /></div><p className="text-xs text-gray-500">Tu información se guarda de forma segura en tu cuenta.</p><button disabled={busy} className="bg-[#ffd400] hover:bg-[#e8c000] disabled:opacity-60 text-black font-['Montserrat'] font-extrabold rounded-lg px-7 py-3">{busy?'GUARDANDO…':'GUARDAR CAMBIOS'}</button></form></section>;
}
