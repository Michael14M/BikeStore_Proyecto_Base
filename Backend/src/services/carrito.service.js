const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { toPositiveInt } = require('../utils/validate');

async function getOrCreateCarritoId(id_usuario) {
  const [rows] = await pool.execute(
    'SELECT id_carrito FROM carritos WHERE id_usuario = ?',
    [id_usuario]
  );
  if (rows.length) return rows[0].id_carrito;

  const [result] = await pool.execute(
    'INSERT INTO carritos (id_usuario) VALUES (?)',
    [id_usuario]
  );
  return result.insertId;
}

async function getCarrito(id_usuario) {
  const id_carrito = await getOrCreateCarritoId(id_usuario);

  const [items] = await pool.execute(
    `SELECT
        ci.id_carrito_item, ci.id_producto, ci.cantidad, ci.agregado_en,
        p.nombre, p.marca, p.imagen, p.precio, p.stock, p.activo
     FROM carrito_items ci
     JOIN productos p ON p.id_producto = ci.id_producto
     WHERE ci.id_carrito = ?
     ORDER BY ci.agregado_en ASC`,
    [id_carrito]
  );

  const itemsConSubtotal = items.map((it) => ({
    ...it,
    subtotal: Number(it.precio) * it.cantidad,
  }));

  const total = itemsConSubtotal.reduce((acc, it) => acc + it.subtotal, 0);
  const cantidadTotal = itemsConSubtotal.reduce((acc, it) => acc + it.cantidad, 0);

  return { id_carrito, items: itemsConSubtotal, cantidadTotal, total };
}

async function getProductoDisponible(id_producto) {
  const [rows] = await pool.execute(
    'SELECT id_producto, nombre, precio, stock, activo FROM productos WHERE id_producto = ?',
    [id_producto]
  );
  const producto = rows[0];
  if (!producto) throw new AppError('Producto no encontrado', 404);
  if (!producto.activo) throw new AppError('Este producto ya no está disponible', 409);
  return producto;
}

async function addItem(id_usuario, { id_producto, cantidad }) {
  const idProducto = toPositiveInt(id_producto, 'id_producto');
  const cant = toPositiveInt(cantidad ?? 1, 'cantidad');

  const producto = await getProductoDisponible(idProducto);
  const id_carrito = await getOrCreateCarritoId(id_usuario);

  const [existing] = await pool.execute(
    'SELECT id_carrito_item, cantidad FROM carrito_items WHERE id_carrito = ? AND id_producto = ?',
    [id_carrito, idProducto]
  );

  const cantidadFinal = (existing[0]?.cantidad ?? 0) + cant;
  if (cantidadFinal > producto.stock) {
    throw new AppError(
      `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, solicitado: ${cantidadFinal}`,
      409
    );
  }

  if (existing.length) {
    await pool.execute(
      'UPDATE carrito_items SET cantidad = ? WHERE id_carrito_item = ?',
      [cantidadFinal, existing[0].id_carrito_item]
    );
  } else {
    await pool.execute(
      'INSERT INTO carrito_items (id_carrito, id_producto, cantidad) VALUES (?, ?, ?)',
      [id_carrito, idProducto, cant]
    );
  }

  return getCarrito(id_usuario);
}

async function getItemConDueño(id_usuario, id_carrito_item) {
  const [rows] = await pool.execute(
    `SELECT ci.id_carrito_item, ci.id_producto, c.id_usuario
     FROM carrito_items ci
     JOIN carritos c ON c.id_carrito = ci.id_carrito
     WHERE ci.id_carrito_item = ?`,
    [id_carrito_item]
  );
  const item = rows[0];
  if (!item) throw new AppError('Ítem de carrito no encontrado', 404);
  if (item.id_usuario !== id_usuario) {
    // No revelamos que el ítem existe en otro carrito: mismo mensaje que "no encontrado".
    throw new AppError('Ítem de carrito no encontrado', 404);
  }
  return item;
}

async function updateItem(id_usuario, id_carrito_item, { cantidad }) {
  const cant = toPositiveInt(cantidad, 'cantidad');
  const item = await getItemConDueño(id_usuario, id_carrito_item);
  const producto = await getProductoDisponible(item.id_producto);

  if (cant > producto.stock) {
    throw new AppError(
      `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`,
      409
    );
  }

  await pool.execute(
    'UPDATE carrito_items SET cantidad = ? WHERE id_carrito_item = ?',
    [cant, id_carrito_item]
  );

  return getCarrito(id_usuario);
}

async function removeItem(id_usuario, id_carrito_item) {
  await getItemConDueño(id_usuario, id_carrito_item);
  await pool.execute('DELETE FROM carrito_items WHERE id_carrito_item = ?', [id_carrito_item]);
  return getCarrito(id_usuario);
}

async function clearCarrito(id_usuario) {
  const id_carrito = await getOrCreateCarritoId(id_usuario);
  await pool.execute('DELETE FROM carrito_items WHERE id_carrito = ?', [id_carrito]);
  return getCarrito(id_usuario);
}

module.exports = {
  getCarrito,
  addItem,
  updateItem,
  removeItem,
  clearCarrito,
  getOrCreateCarritoId,
};
