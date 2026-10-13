const express = require('express');
const controller = require('../controllers/productos.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const optionalAuthenticate = require('../middlewares/optionalAuth.middleware');
const { uploadProductoImagen } = require('../middlewares/upload.middleware');

const router = express.Router();

// Públicas (catálogo del cliente, RF-01 a RF-04). optionalAuthenticate solo
// habilita ?incluirInactivos=true cuando quien llama es un admin logueado.
router.get('/', optionalAuthenticate, controller.list);
router.get('/:id', optionalAuthenticate, controller.getById);

// Administración (RF-17 a RF-20) — requieren JWT + rol admin.
router.post('/', authenticate, authorize('admin'), controller.create);
router.put('/:id', authenticate, authorize('admin'), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

// Subida de imagen de un producto existente (punto 9 de la Fase 2).
router.post(
  '/:id/imagen',
  authenticate,
  authorize('admin'),
  uploadProductoImagen,
  controller.subirImagen
);

module.exports = router;
