const pool = require('../config/db');
const AppError = require('../utils/AppError');

async function list(userId) {
  const [rows] = await pool.execute(`SELECT p.id_producto, p.slug, p.nombre, p.marca, p.categoria, p.precio, p.precio_anterior, p.imagen, p.rating, p.descripcion, p.stock, p.activo
    FROM lista_deseos ld JOIN productos p ON p.id_producto = ld.id_producto
    WHERE ld.id_usuario = ? AND p.activo = 1 ORDER BY ld.creado_en DESC`, [userId]);
  return rows;
}
async function add(userId, productId) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Producto inválido', 400);
  const [products] = await pool.execute('SELECT id_producto FROM productos WHERE id_producto = ? AND activo = 1', [id]);
  if (!products.length) throw new AppError('Producto no encontrado', 404);
  await pool.execute('INSERT IGNORE INTO lista_deseos (id_usuario, id_producto) VALUES (?, ?)', [userId, id]);
  return { ok: true };
}
async function remove(userId, productId) {
  await pool.execute('DELETE FROM lista_deseos WHERE id_usuario = ? AND id_producto = ?', [userId, Number(productId)]);
}
module.exports = { list, add, remove };
