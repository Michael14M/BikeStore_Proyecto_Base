const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');
const env = require('../config/env');
const { createToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

const RESET_TOKEN_TTL_MINUTES = 30;

async function registerUser({ nombre, email, password }) {
  if (!nombre || !email || !password) {
    throw new AppError('nombre, email y password son obligatorios', 400);
  }

  const [existing] = await pool.execute(
    'SELECT id_usuario FROM usuarios WHERE email = ?',
    [email]
  );

  if (existing.length) {
    throw new AppError('El correo ya está registrado', 409);
  }

  const hash = await bcrypt.hash(password, 10);

  const [result] = await pool.execute(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, hash, 'cliente']
  );

  return { id_usuario: result.insertId };
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new AppError('email y password son obligatorios', 400);
  }

  const [rows] = await pool.execute(
    'SELECT id_usuario, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = ?',
    [email]
  );

  if (!rows.length) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const user = rows[0];

  if (!user.activo) {
    throw new AppError('Esta cuenta está desactivada. Contacta a un administrador.', 403);
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  delete user.password_hash;

  return { user, token: createToken(user) };
}

async function getMe(id_usuario) {
  const [rows] = await pool.execute(
    'SELECT id_usuario, nombre, email, rol, activo, creado_en FROM usuarios WHERE id_usuario = ?',
    [id_usuario]
  );
  const user = rows[0];
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return user;
}

async function forgotPassword(email) {
  if (!email) throw new AppError('email es obligatorio', 400);

  // Respuesta genérica SIEMPRE, exista o no el correo: evita que alguien use
  // este endpoint para enumerar qué correos están registrados.
  const respuestaGenerica = {
    message: 'Si el correo está registrado, se enviarán instrucciones de recuperación.',
  };

  const [rows] = await pool.execute(
    'SELECT id_usuario, activo FROM usuarios WHERE email = ?',
    [email]
  );
  const user = rows[0];
  if (!user || !user.activo) return respuestaGenerica;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiraEn = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await pool.execute(
    'INSERT INTO tokens_recuperacion (id_usuario, token_hash, expira_en) VALUES (?, ?, ?)',
    [user.id_usuario, tokenHash, expiraEn]
  );

  // ===========================================================================
  // PUNTO DE INTEGRACIÓN FUTURA — proveedor real de correo
  // ---------------------------------------------------------------------------
  // Aquí es donde se debe enviar `rawToken` (NUNCA tokenHash) al correo del
  // usuario, por ejemplo con Nodemailer + SMTP, SendGrid, Resend, etc.:
  //
  //   await mailer.send({
  //     to: email,
  //     subject: 'Recupera tu contraseña — Bike Store',
  //     text: `Usa este código para restablecer tu contraseña: ${rawToken}
  //            (expira en ${RESET_TOKEN_TTL_MINUTES} minutos)`
  //   });
  //
  // Mientras no haya un proveedor de correo configurado, el token se imprime
  // en la consola del servidor para poder probar el flujo completo, y se
  // devuelve en la respuesta SOLO cuando NODE_ENV !== 'production', para que
  // se pueda probar desde Thunder Client sin enviar correos reales.
  // ===========================================================================
  console.log(`[forgot-password] token para ${email}: ${rawToken} (expira en ${RESET_TOKEN_TTL_MINUTES} min)`);

  if (env.nodeEnv !== 'production') {
    return { ...respuestaGenerica, debug_token: rawToken };
  }
  return respuestaGenerica;
}

async function resetPassword({ token, password }) {
  if (!token || !password) {
    throw new AppError('token y password son obligatorios', 400);
  }
  if (password.length < 6) {
    throw new AppError('La contraseña debe tener mínimo 6 caracteres', 400);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const [rows] = await pool.execute(
    'SELECT id_token, id_usuario, expira_en, usado_en FROM tokens_recuperacion WHERE token_hash = ?',
    [tokenHash]
  );
  const registro = rows[0];

  if (!registro) {
    throw new AppError('Token inválido', 400);
  }
  if (registro.usado_en) {
    throw new AppError('Este token ya fue utilizado', 400);
  }
  if (new Date(registro.expira_en) < new Date()) {
    throw new AppError('El token ha expirado. Solicita uno nuevo.', 400);
  }

  const hash = await bcrypt.hash(password, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?',
      [hash, registro.id_usuario]
    );
    // Token de un solo uso (requisito de la Fase 2): se marca usado_en.
    await conn.execute(
      'UPDATE tokens_recuperacion SET usado_en = NOW() WHERE id_token = ?',
      [registro.id_token]
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
}

module.exports = { registerUser, loginUser, getMe, forgotPassword, resetPassword };