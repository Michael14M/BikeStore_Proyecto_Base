const express = require('express');
const controller = require('../controllers/pedidos.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', controller.listarTodos);
router.get('/:id', controller.verCualquiera);
router.put('/:id/estado', controller.cambiarEstado);

module.exports = router;
