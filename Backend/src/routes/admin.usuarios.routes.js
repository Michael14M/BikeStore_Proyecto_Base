const express = require('express');
const controller = require('../controllers/usuarios.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todo este módulo es exclusivamente para administradores (RF-27 a RF-31).
router.use(authenticate, authorize('admin'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.put('/:id/rol', controller.cambiarRol);
router.put('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.remove);

module.exports = router;
