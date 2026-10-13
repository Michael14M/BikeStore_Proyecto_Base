const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { ROLES_VALIDOS } = require('../utils/validate');

const SELECT_COLUMNS = 'id_usuario, nombre, email, rol, activo, creado_en, actualizado_en';

async function listUsuarios({ search, rol } = {}) {
  const where = [];
  const params = [];

  if (rol) {
    if (!ROLES_VALIDOS.includes(rol)) {
      throw new AppError(`rol inválido. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}`, 400);
    }
    where.push('rol = ?');
    params.push(rol);
  }

  if (search && search.trim()) {
    where.push('(nombre LIKE ? OR email LIKE ?)');
    const like = `%${search.trim()}%`;
    params.push(like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT ${SELECT_COLUMNS} FROM usuarios ${whereSql} ORDER BY creado_en DESC`,
    params
  );
  return rows;
}

async function getUsuarioById(id) {
  const [rows] = await pool.execute(
    `SELECT ${SELECT_COLUMNS} FROM usuarios WHERE id_usuario = ?`,
    [id]
  );
  const user = rows[0];
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return user;
}

async function ensureEmailUnico(email, idExcluir) {
  const [rows] = await pool.execute(
    'SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario <> ?',
    [email, idExcluir]
  );
  if (rows.length) throw new AppError('Ya existe otro usuario con ese correo', 409);
}

async function updateUsuario(id, data) {
  await getUsuarioById(id); // 404 si no existe

  const campos = [];
  const params = [];

  if (data.nombre !== undefined) {
    if (!String(data.nombre).trim()) throw new AppError('nombre no puede estar vacío', 400);
    campos.push('nombre = ?');
    params.push(String(data.nombre).trim());
  }
  if (data.email !== undefined) {
    const email = String(data.email).trim().toLowerCase();
    if (!email) throw new AppError('email no puede estar vacío', 400);
    await ensureEmailUnico(email, id);
    campos.push('email = ?');
    params.push(email);
  }

  if (!campos.length) throw new AppError('No se enviaron campos para actualizar', 400);

  params.push(id);
  await pool.execute(`UPDATE usuarios SET ${campos.join(', ')} WHERE id_usuario = ?`, params);
  return getUsuarioById(id);
}

async function contarAdminsActivos(excluirId) {
  const params = [];
  let sql = "SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'admin' AND activo = 1";
  if (excluirId) {
    sql += ' AND id_usuario <> ?';
    params.push(excluirId);
  }
  const [rows] = await pool.execute(sql, params);
  return rows[0].n;
}

async function cambiarRol(idObjetivo, idQuienPide, rol) {
  if (!ROLES_VALIDOS.includes(rol)) {
    throw new AppError(`rol inválido. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}`, 400);
  }
  const usuario = await getUsuarioById(idObjetivo);

  if (idObjetivo === idQuienPide) {
    throw new AppError('No puedes cambiar tu propio rol', 400);
  }
  if (usuario.rol === 'admin' && rol !== 'admin') {
    const restantes = await contarAdminsActivos(idObjetivo);
    if (restantes === 0) {
      throw new AppError('Debe existir al menos un administrador activo', 409);
    }
  }

  await pool.execute('UPDATE usuarios SET rol = ? WHERE id_usuario = ?', [rol, idObjetivo]);
  return getUsuarioById(idObjetivo);
}

async function cambiarEstado(idObjetivo, idQuienPide, activo) {
  const usuario = await getUsuarioById(idObjetivo);

  if (idObjetivo === idQuienPide) {
    throw new AppError('No puedes activar/desactivar tu propia cuenta', 400);
  }
  if (usuario.rol === 'admin' && !activo) {
    const restantes = await contarAdminsActivos(idObjetivo);
    if (restantes === 0) {
      throw new AppError('Debe existir al menos un administrador activo', 409);
    }
  }

  await pool.execute('UPDATE usuarios SET activo = ? WHERE id_usuario = ?', [activo ? 1 : 0, idObjetivo]);
  return getUsuarioById(idObjetivo);
}

async function eliminarUsuario(idObjetivo, idQuienPide) {
  const usuario = await getUsuarioById(idObjetivo);

  if (idObjetivo === idQuienPide) {
    throw new AppError('No puedes eliminar tu propia cuenta', 400);
  }
  if (usuario.rol === 'admin') {
    const restantes = await contarAdminsActivos(idObjetivo);
    if (restantes === 0) {
      throw new AppError('Debe existir al menos un administrador activo', 409);
    }
  }

  try {
    await pool.execute('DELETE FROM usuarios WHERE id_usuario = ?', [idObjetivo]);
  } catch (error) {
    // ON DELETE RESTRICT en pedidos.id_usuario (ver sql/bike_store_schema.sql):
    // un usuario con historial de compras no se puede borrar físicamente.
    if (error && error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new AppError(
        'No se puede eliminar: el usuario tiene pedidos asociados. Desactívalo en su lugar (activo = 0).',
        409
      );
    }
    throw error;
  }
}

module.exports = {
  listUsuarios,
  getUsuarioById,
  updateUsuario,
  cambiarRol,
  cambiarEstado,
  eliminarUsuario,
};
