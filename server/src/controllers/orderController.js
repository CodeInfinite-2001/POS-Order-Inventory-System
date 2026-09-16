const orderService = require('../services/orderService');

/**
 * Controller for Order Creation, Lifecycle, and Cancellation.
 */
class OrderController {
  // POST /api/orders
  async createOrder(req, res, next) {
    try {
      const { items, customerName, reservationDurationSec } = req.body;
      const order = await orderService.createOrder({
        items,
        customerName,
        // Standard: 300 seconds (5 minutes), allows custom duration for testing
        reservationDurationSec: reservationDurationSec ? parseInt(reservationDurationSec, 10) : 300,
      });

      res.status(201).json({
        success: true,
        message: 'Order created and stock successfully reserved for 5 minutes',
        order,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/orders
  async listOrders(req, res, next) {
    try {
      const { status } = req.query;
      const orders = await orderService.listOrders({ status });
      res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/orders/:id
  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      res.json({ success: true, order });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/orders/:id/cancel
  async cancelOrder(req, res, next) {
    try {
      const { reason } = req.body || {};
      const order = await orderService.cancelOrder(req.params.id, reason);
      res.json({
        success: true,
        message: 'Order cancelled and reserved stock restored to available inventory',
        order,
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/orders/:id/expire
  async expireOrder(req, res, next) {
    try {
      const { reason } = req.body || {};
      const order = await orderService.expireOrder(
        req.params.id,
        reason || 'Reservation manually expired / timeout simulated'
      );
      res.json({
        success: true,
        message: 'Order expired and reserved stock released',
        order,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
