const express = require('express');
const controller = require('../controllers/carrito.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todo el carrito requiere sesión: siempre opera sobre req.user.id_usuario,
// nunca sobre un id enviado por el cliente (RF-08 / seguridad punto 10).
router.use(authenticate);

router.get('/', controller.getCarrito);
router.post('/items', controller.addItem);
router.put('/items/:id', controller.updateItem);
router.delete('/items/:id', controller.removeItem);
router.delete('/', controller.clearCarrito);

module.exports = router;
