const service = require('../services/usuarios.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const list = asyncHandler(async (req, res) => {
  const { search, rol } = req.query;
  const usuarios = await service.listUsuarios({ search, rol });
  res.json({ ok: true, total: usuarios.length, usuarios });
});

const getById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  const usuario = await service.getUsuarioById(id);
  res.json({ ok: true, usuario });
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  const usuario = await service.updateUsuario(id, req.body);
  res.json({ ok: true, message: 'Usuario actualizado', usuario });
});

const cambiarRol = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  if (!req.body.rol) throw new AppError('rol es obligatorio', 400);
  const usuario = await service.cambiarRol(id, req.user.id_usuario, req.body.rol);
  res.json({ ok: true, message: 'Rol actualizado', usuario });
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  if (req.body.activo === undefined) throw new AppError('activo es obligatorio', 400);
  const usuario = await service.cambiarEstado(id, req.user.id_usuario, Boolean(req.body.activo));
  res.json({ ok: true, message: 'Estado actualizado', usuario });
});

const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError('id inválido', 400);
  await service.eliminarUsuario(id, req.user.id_usuario);
  res.json({ ok: true, message: 'Usuario eliminado' });
});

module.exports = { list, getById, update, cambiarRol, cambiarEstado, remove };
