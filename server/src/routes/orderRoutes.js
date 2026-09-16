const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Order Lifecycle endpoints
router.post('/', orderController.createOrder.bind(orderController));
router.get('/', orderController.listOrders.bind(orderController));
router.get('/:id', orderController.getOrderById.bind(orderController));
router.post('/:id/cancel', orderController.cancelOrder.bind(orderController));
router.post('/:id/expire', orderController.expireOrder.bind(orderController));

module.exports = router;
