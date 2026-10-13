const service = require('../services/productos.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// El catálogo público (sin rol admin) nunca ve inactivos. Un admin puede
// pedir explícitamente ?incluirInactivos=true para su panel.
function puedeVerInactivos(req) {
  return req.user?.rol === 'admin' && req.query.incluirInactivos === 'true';
}

const list = asyncHandler(async (req, res) => {
  const { categoria, search } = req.query;
  const productos = await service.listProductos({
    categoria,
    search,
    incluirInactivos: puedeVerInactivos(req),
  });
  res.json({ ok: true, total: productos.length, productos });
});

const getById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  const producto = await service.getProductoById(id, { incluirInactivos: puedeVerInactivos(req) });
  res.json({ ok: true, producto });
});

const create = asyncHandler(async (req, res) => {
  const producto = await service.createProducto(req.body);
  res.status(201).json({ ok: true, message: 'Producto creado', producto });
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  const producto = await service.updateProducto(id, req.body);
  res.json({ ok: true, message: 'Producto actualizado', producto });
});

const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  await service.deleteProducto(id);
  res.json({ ok: true, message: 'Producto eliminado' });
});

const subirImagen = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  if (!req.file) throw new AppError('Debes enviar un archivo en el campo "imagen"', 400);
  const producto = await service.setProductoImagen(id, req.file.filename);
  res.json({ ok: true, message: 'Imagen actualizada', producto });
});

module.exports = { list, getById, create, update, remove, subirImagen };
