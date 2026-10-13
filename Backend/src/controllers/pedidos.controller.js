const service = require('../services/pedidos.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const crear = asyncHandler(async (req, res) => {
  const pedido = await service.crearPedido(req.user.id_usuario, req.body);
  res.status(201).json({ ok: true, message: 'Pedido creado', pedido });
});

const listarMios = asyncHandler(async (req, res) => {
  const pedidos = await service.getPedidosByUsuario(req.user.id_usuario);
  res.json({ ok: true, total: pedidos.length, pedidos });
});

const verMio = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  const esAdmin = req.user.rol === 'admin';
  const pedido = await service.getPedidoById(req.user.id_usuario, id, esAdmin);
  res.json({ ok: true, pedido });
});

// ---- Administración ----

const listarTodos = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  const pedidos = await service.getTodosPedidos({ estado });
  res.json({ ok: true, total: pedidos.length, pedidos });
});

const verCualquiera = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  const pedido = await service.getPedidoById(null, id, true);
  res.json({ ok: true, pedido });
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  if (!req.body.estado) throw new AppError('estado es obligatorio', 400);
  const pedido = await service.cambiarEstadoPedido(id, req.body.estado);
  res.json({ ok: true, message: 'Estado actualizado', pedido });
});

module.exports = { crear, listarMios, verMio, listarTodos, verCualquiera, cambiarEstado };
