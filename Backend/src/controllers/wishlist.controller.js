const service = require('../services/wishlist.service');
const asyncHandler = require('../utils/asyncHandler');
const list = asyncHandler(async (req, res) => {
  const productos = await service.list(req.user.id_usuario);
  res.json({ ok: true, productos });
});
const add = asyncHandler(async (req, res) => {
  await service.add(req.user.id_usuario, req.body.id_producto);
  res.status(201).json({ ok: true, message: 'Producto agregado a favoritos' });
});
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.user.id_usuario, req.params.id);
  res.json({ ok: true, message: 'Producto eliminado de favoritos' });
});
module.exports = { list, add, remove };
