const express = require('express');
const controller = require('../controllers/pedidos.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', controller.crear);
router.get('/', controller.listarMios);
router.get('/:id', controller.verMio);

module.exports = router;
