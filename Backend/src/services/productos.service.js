const pool = require('../config/db');
const AppError = require('../utils/AppError');
const {
  CATEGORIAS_VALIDAS,
  requireFields,
  toPositiveDecimal,
  toNonNegativeInt,
  slugify,
} = require('../utils/validate');

const SELECT_COLUMNS = `
  id_producto, slug, nombre, marca, categoria, precio, precio_anterior,
  imagen, rating, descripcion, stock, activo, creado_en, actualizado_en
`;

async function listProductos({ categoria, search, incluirInactivos }) {
  const where = [];
  const params = [];

  if (!incluirInactivos) {
    where.push('activo = 1');
  }

  if (categoria) {
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      throw new AppError(`Categoría inválida. Debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`, 400);
    }
    where.push('categoria = ?');
    params.push(categoria);
  }

  if (search && search.trim()) {
    where.push('(nombre LIKE ? OR marca LIKE ?)');
    const like = `%${search.trim()}%`;
    params.push(like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT ${SELECT_COLUMNS} FROM productos ${whereSql} ORDER BY id_producto ASC`,
    params
  );
  return rows;
}

async function getProductoById(id, { incluirInactivos } = {}) {
  const [rows] = await pool.execute(
    `SELECT ${SELECT_COLUMNS} FROM productos WHERE id_producto = ?`,
    [id]
  );
  const producto = rows[0];
  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }
  if (!incluirInactivos && !producto.activo) {
    throw new AppError('Producto no encontrado', 404);
  }
  return producto;
}

async function ensureSlugUnico(slug, idExcluir) {
  const params = idExcluir ? [slug, idExcluir] : [slug];
  const sql = idExcluir
    ? 'SELECT id_producto FROM productos WHERE slug = ? AND id_producto <> ?'
    : 'SELECT id_producto FROM productos WHERE slug = ?';
  const [rows] = await pool.execute(sql, params);
  if (rows.length) {
    throw new AppError('Ya existe un producto con ese slug', 409);
  }
}

function validarCamposProducto(data, { parcial = false } = {}) {
  if (!parcial) {
    requireFields(data, ['nombre', 'marca', 'categoria', 'precio', 'descripcion']);
  }
  if (data.categoria !== undefined && !CATEGORIAS_VALIDAS.includes(data.categoria)) {
    throw new AppError(`Categoría inválida. Debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`, 400);
  }
  if (data.precio !== undefined) {
    toPositiveDecimal(data.precio, 'precio');
  }
  if (data.precio_anterior !== undefined && data.precio_anterior !== null) {
    const anterior = toPositiveDecimal(data.precio_anterior, 'precio_anterior');
    const actual = Number(data.precio);
    if (!parcial && anterior <= actual) {
      throw new AppError('precio_anterior debe ser mayor al precio actual', 400);
    }
  }
  if (data.stock !== undefined) {
    toNonNegativeInt(data.stock, 'stock');
  }
  if (data.rating !== undefined) {
    const r = Number(data.rating);
    if (!Number.isFinite(r) || r < 0 || r > 5) {
      throw new AppError('rating debe estar entre 0 y 5', 400);
    }
  }
}

async function createProducto(data) {
  validarCamposProducto(data);

  const slug = data.slug ? slugify(data.slug) : slugify(data.nombre);
  if (!slug) {
    throw new AppError('No se pudo generar un slug válido a partir del nombre', 400);
  }
  await ensureSlugUnico(slug);

  const [result] = await pool.execute(
    `INSERT INTO productos
      (slug, nombre, marca, categoria, precio, precio_anterior, imagen, rating, descripcion, stock, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slug,
      data.nombre,
      data.marca,
      data.categoria,
      data.precio,
      data.precio_anterior ?? null,
      data.imagen ?? null,
      data.rating ?? 5,
      data.descripcion,
      data.stock ?? 0,
      data.activo === undefined ? 1 : (data.activo ? 1 : 0),
    ]
  );

  return getProductoById(result.insertId, { incluirInactivos: true });
}

async function updateProducto(id, data) {
  await getProductoById(id, { incluirInactivos: true }); // 404 si no existe
  validarCamposProducto(data, { parcial: true });

  const campos = [];
  const params = [];

  if (data.slug !== undefined) {
    const slug = slugify(data.slug);
    await ensureSlugUnico(slug, id);
    campos.push('slug = ?');
    params.push(slug);
  }
  const directos = ['nombre', 'marca', 'categoria', 'precio', 'imagen', 'rating', 'descripcion', 'stock'];
  for (const campo of directos) {
    if (data[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      params.push(data[campo]);
    }
  }
  if (data.precio_anterior !== undefined) {
    campos.push('precio_anterior = ?');
    params.push(data.precio_anterior);
  }
  if (data.activo !== undefined) {
    campos.push('activo = ?');
    params.push(data.activo ? 1 : 0);
  }

  if (!campos.length) {
    throw new AppError('No se enviaron campos para actualizar', 400);
  }

  params.push(id);
  await pool.execute(`UPDATE productos SET ${campos.join(', ')} WHERE id_producto = ?`, params);

  return getProductoById(id, { incluirInactivos: true });
}

async function deleteProducto(id) {
  await getProductoById(id, { incluirInactivos: true }); // 404 si no existe
  try {
    await pool.execute('DELETE FROM productos WHERE id_producto = ?', [id]);
  } catch (error) {
    // ON DELETE RESTRICT (carrito_items / detalle_pedido) — ver sql/bike_store_schema.sql
    if (error && error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new AppError(
        'No se puede eliminar: el producto tiene carritos o pedidos asociados. Desactívalo en su lugar (activo = 0).',
        409
      );
    }
    throw error;
  }
}

async function setProductoImagen(id, filename) {
  await getProductoById(id, { incluirInactivos: true }); // 404 si no existe
  const rutaPublica = `/uploads/productos/${filename}`;
  await pool.execute('UPDATE productos SET imagen = ? WHERE id_producto = ?', [rutaPublica, id]);
  return getProductoById(id, { incluirInactivos: true });
}

module.exports = {
  listProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  setProductoImagen,
};
