import { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import { errorMessage } from '../services/apiClient';

const imgBrandLogo = '/assets/44336.png';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
  /** Label shown on the back link — null hides it */
  backLabel?: string | null;
}

type Mode = 'login' | 'register' | 'forgot';

export default function AuthModal({ open, initialMode = 'login', onClose, onSuccess, backLabel = 'Volver al carrito' }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'sent' | 'reset'>('request');
  const [resetToken, setResetToken] = useState('');
  /** Solo en desarrollo: el backend devuelve el token que en producción llegaría por correo. */
  const [devToken, setDevToken] = useState('');
  const [notice, setNotice] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setError('');
      setForgotStep('request');
      setResetToken('');
      setDevToken('');
      setNotice('');
      setLoading(false);
      setTimeout(() => firstInputRef.current?.focus(), 120);
    }
  }, [open, initialMode]);

  useEffect(() => {
    setError('');
  }, [mode, email, password, name, confirmPassword, resetToken]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Por favor completa todos los campos.'); return; }
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      onSuccess(user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) { setError('Por favor completa todos los campos.'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres.'); return; }
    setLoading(true);
    try {
      await authService.register({ name, email, password });
      // El backend no devuelve token al registrar: se inicia sesión con las mismas credenciales.
      const user = await authService.login(email, password);
      onSuccess(user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.debugToken) {
        setDevToken(res.debugToken);
        setResetToken(res.debugToken);
      }
      setForgotStep('sent');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !password.trim()) { setError('Por favor completa todos los campos.'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres.'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(resetToken, password);
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
      setForgotStep('request');
      setMode('login');
      setNotice('Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85" style={{ backdropFilter: 'blur(6px)' }} />

      {/* Card */}
      <div
        className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Yellow accent bar */}
        <div className="bg-[#ffd400] h-1.5 w-full" />

        <div className="px-10 pt-8 pb-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-[72px] w-[96px] relative">
              <img alt="Bike Store" className="absolute inset-0 size-full object-contain" src={imgBrandLogo} />
            </div>
          </div>

          {/* ── LOGIN ─────────────────────────────────────────────── */}
          {mode === 'login' && (
            <>
              <div className="text-center mb-7">
                <p className="font-['Inter'] font-extrabold text-[#b8920a] text-[11px] tracking-widest uppercase mb-1">
                  BIENVENIDO
                </p>
                <h2 className="font-['Montserrat'] font-black text-[26px] text-black leading-tight">
                  INICIAR SESIÓN
                </h2>
              </div>

              {notice && (
                <div className="mb-4 bg-[#fffbea] border border-[#ffd400]/40 rounded-xl px-4 py-3">
                  <p className="font-['Inter'] font-normal text-gray-600 text-[13px]">{notice}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Field label="Correo electrónico" error={''}>
                  <input
                    ref={firstInputRef}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className={inputCls(!!error && !email)}
                    autoComplete="email"
                  />
                </Field>

                <Field label="Contraseña" error={''}>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls(!!error && !password)}
                    autoComplete="current-password"
                  />
                </Field>

                {error && <ErrorMsg msg={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full bg-[#ffd400] py-4 rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? <Spinner /> : 'INICIAR SESIÓN'}
                </button>
              </form>

              <button
                onClick={() => setMode('forgot')}
                className="mt-4 w-full text-center font-['Inter'] font-normal text-[13px] text-gray-500 hover:text-[#b8920a] transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <span className="font-['Inter'] font-normal text-gray-500 text-[13px]">
                  ¿No tienes una cuenta?{' '}
                </span>
                <button
                  onClick={() => setMode('register')}
                  className="font-['Montserrat'] font-black text-[13px] text-black hover:text-[#b8920a] transition-colors cursor-pointer underline underline-offset-2"
                >
                  CREAR CUENTA
                </button>
              </div>
            </>
          )}

          {/* ── REGISTER ──────────────────────────────────────────── */}
          {mode === 'register' && (
            <>
              <div className="text-center mb-7">
                <p className="font-['Inter'] font-extrabold text-[#b8920a] text-[11px] tracking-widest uppercase mb-1">
                  ÚNETE A BIKE STORE
                </p>
                <h2 className="font-['Montserrat'] font-black text-[26px] text-black leading-tight">
                  CREAR CUENTA
                </h2>
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <Field label="Nombre completo" error={''}>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className={inputCls(!!error && !name)}
                    autoComplete="name"
                  />
                </Field>

                <Field label="Correo electrónico" error={''}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className={inputCls(!!error && !email)}
                    autoComplete="email"
                  />
                </Field>

                <Field label="Contraseña" error={''}>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={inputCls(!!error && password.length < 6)}
                    autoComplete="new-password"
                  />
                </Field>

                <Field label="Confirmar contraseña" error={''}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className={inputCls(!!error && password !== confirmPassword)}
                    autoComplete="new-password"
                  />
                </Field>

                {error && <ErrorMsg msg={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full bg-[#ffd400] py-4 rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? <Spinner /> : 'CREAR CUENTA'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <span className="font-['Inter'] font-normal text-gray-500 text-[13px]">
                  ¿Ya tienes una cuenta?{' '}
                </span>
                <button
                  onClick={() => setMode('login')}
                  className="font-['Montserrat'] font-black text-[13px] text-black hover:text-[#b8920a] transition-colors cursor-pointer underline underline-offset-2"
                >
                  INICIAR SESIÓN
                </button>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD ───────────────────────────────────── */}
          {mode === 'forgot' && (
            <>
              <div className="text-center mb-7">
                <p className="font-['Inter'] font-extrabold text-[#b8920a] text-[11px] tracking-widest uppercase mb-1">
                  RECUPERAR ACCESO
                </p>
                <h2 className="font-['Montserrat'] font-black text-[26px] text-black leading-tight">
                  RESTABLECER CONTRASEÑA
                </h2>
              </div>

              {forgotStep === 'sent' ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="size-16 rounded-full bg-[#ffd400] flex items-center justify-center text-[28px]">✓</div>
                  <p className="font-['Montserrat'] font-bold text-gray-900 text-[15px]">¡Correo enviado!</p>
                  <p className="font-['Inter'] font-normal text-gray-500 text-[13px] leading-relaxed max-w-[280px]">
                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                  </p>
                  {devToken && (
                    <div className="w-full bg-[#fffbea] border border-[#ffd400]/40 rounded-xl px-4 py-3 text-left">
                      <p className="font-['Inter'] font-semibold text-gray-600 text-[11px] uppercase tracking-wide mb-1">
                        Modo desarrollo — código de recuperación
                      </p>
                      <p className="font-['Inter'] font-normal text-gray-700 text-[12px] break-all">{devToken}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setForgotStep('reset')}
                    className="mt-1 w-full bg-[#ffd400] py-4 rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    TENGO MI CÓDIGO
                  </button>
                  <button
                    onClick={() => setMode('login')}
                    className="font-['Montserrat'] font-black text-[13px] text-black hover:text-[#b8920a] transition-colors cursor-pointer underline underline-offset-2"
                  >
                    VOLVER AL INICIO DE SESIÓN
                  </button>
                </div>
              ) : forgotStep === 'reset' ? (
                <form onSubmit={handleReset} className="flex flex-col gap-4">
                  <Field label="Código de recuperación" error={''}>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      placeholder="Pega aquí tu código"
                      className={inputCls(!!error && !resetToken)}
                      autoComplete="one-time-code"
                    />
                  </Field>
                  <Field label="Nueva contraseña" error={''}>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className={inputCls(!!error && password.length < 6)}
                      autoComplete="new-password"
                    />
                  </Field>
                  <Field label="Confirmar contraseña" error={''}>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className={inputCls(!!error && password !== confirmPassword)}
                      autoComplete="new-password"
                    />
                  </Field>
                  {error && <ErrorMsg msg={error} />}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 w-full bg-[#ffd400] py-4 rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <Spinner /> : 'RESTABLECER CONTRASEÑA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center font-['Inter'] font-normal text-[13px] text-gray-500 hover:text-[#b8920a] transition-colors cursor-pointer"
                  >
                    ← Volver al inicio de sesión
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgot} className="flex flex-col gap-4">
                  <p className="font-['Inter'] font-normal text-gray-500 text-[13px] leading-relaxed -mt-2 mb-1">
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                  </p>
                  <Field label="Correo electrónico" error={''}>
                    <input
                      ref={firstInputRef}
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className={inputCls(!!error && !email)}
                    />
                  </Field>
                  {error && <ErrorMsg msg={error} />}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 w-full bg-[#ffd400] py-4 rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <Spinner /> : 'ENVIAR ENLACE'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center font-['Inter'] font-normal text-[13px] text-gray-500 hover:text-[#b8920a] transition-colors cursor-pointer"
                  >
                    ← Volver al inicio de sesión
                  </button>
                </form>
              )}
            </>
          )}

          {/* Back to cart / close */}
          {backLabel && (
            <button
              onClick={onClose}
              className="mt-5 w-full text-center font-['Inter'] font-normal text-[12px] text-gray-400 hover:text-black transition-colors cursor-pointer"
            >
              ← {backLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared micro-components ──────────────────────────────────────────── */

function Field({ label, children, error }: { label: string; children: React.ReactNode; error: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-['Inter'] font-semibold text-[12px] text-gray-700 tracking-wide uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <p className="font-['Inter'] font-normal text-red-600 text-[13px]">{msg}</p>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Procesando...
    </span>
  );
}

function inputCls(hasError: boolean) {
  return [
    'w-full bg-white border-2 rounded-xl px-4 py-3.5',
    'font-[\'Inter\'] font-normal text-[14px] text-gray-900',
    'placeholder-gray-400 outline-none transition-colors',
    hasError ? 'border-red-300' : 'border-gray-200',
    'focus:border-[#ffd400]',
  ].join(' ');
}
