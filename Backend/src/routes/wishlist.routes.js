const express = require('express');
const controller = require('../controllers/wishlist.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router = express.Router();
router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.add);
router.delete('/:id', controller.remove);
module.exports = router;
