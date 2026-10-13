const service = require('../services/carrito.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getCarrito = asyncHandler(async (req, res) => {
  const carrito = await service.getCarrito(req.user.id_usuario);
  res.json({ ok: true, carrito });
});

const addItem = asyncHandler(async (req, res) => {
  const carrito = await service.addItem(req.user.id_usuario, req.body);
  res.status(201).json({ ok: true, message: 'Producto agregado al carrito', carrito });
});

const updateItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  const carrito = await service.updateItem(req.user.id_usuario, id, req.body);
  res.json({ ok: true, message: 'Cantidad actualizada', carrito });
});

const removeItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  const carrito = await service.removeItem(req.user.id_usuario, id);
  res.json({ ok: true, message: 'Ítem eliminado', carrito });
});

const clearCarrito = asyncHandler(async (req, res) => {
  const carrito = await service.clearCarrito(req.user.id_usuario);
  res.json({ ok: true, message: 'Carrito vaciado', carrito });
});

module.exports = { getCarrito, addItem, updateItem, removeItem, clearCarrito };
