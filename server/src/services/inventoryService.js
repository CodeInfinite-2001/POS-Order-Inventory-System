const Product = require('../models/Product');

/**
 * Concurrency-safe inventory management service.
 * Uses atomic MongoDB operations ($gte query guard with $inc) to guarantee
 * that no overselling can ever happen, even under intense concurrent load.
 */
class InventoryService {
  /**
   * Atomically reserves stock for a list of items.
   * If any item cannot be reserved due to insufficient availableStock,
   * any items reserved earlier in this batch are rolled back immediately.
   *
   * @param {Array<{ productId: string, quantity: number }>} items
   * @param {object|null} session - Optional MongoDB transaction session
   * @returns {Promise<Array<object>>} Updated products
   */
  async reserveStockForItems(items, session = null) {
    const reservedItems = [];

    try {
      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        if (qty <= 0) {
          throw new Error(`Invalid reservation quantity: ${qty}`);
        }

        // Atomic conditional update: only decrement if availableStock >= qty
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            availableStock: { $gte: qty },
          },
          {
            $inc: {
              availableStock: -qty,
              reservedStock: qty,
            },
          },
          { new: true, session }
        );

        if (!updatedProduct) {
          const currentProd = await Product.findById(item.productId);
          const name = currentProd ? currentProd.name : item.productId;
          const available = currentProd ? currentProd.availableStock : 0;
          const err = new Error(
            `Insufficient stock for "${name}". Available: ${available}, requested: ${qty}`
          );
          err.statusCode = 400;
          err.code = 'OUT_OF_STOCK';
          err.productId = item.productId;
          throw err;
        }

        reservedItems.push({
          productId: item.productId,
          quantity: qty,
          product: updatedProduct,
        });
      }

      return reservedItems;
    } catch (error) {
      // Compensating rollback for any items reserved before the failure
      for (const reserved of reservedItems) {
        try {
          await Product.findByIdAndUpdate(
            reserved.productId,
            {
              $inc: {
                availableStock: reserved.quantity,
                reservedStock: -reserved.quantity,
              },
            },
            { session }
          );
        } catch (rollbackErr) {
          console.error('[InventoryService] Rollback error for product:', reserved.productId, rollbackErr);
        }
      }
      throw error;
    }
  }

  /**
   * Releases previously reserved stock back to available stock.
   * Used when an order expires, is cancelled, or payment fails.
   *
   * @param {Array<{ productId: string, quantity: number }>} items
   * @param {object|null} session - Optional MongoDB session
   */
  async releaseReservedStock(items, session = null) {
    const results = [];
    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      const updated = await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            availableStock: qty,
            reservedStock: -qty,
          },
        },
        { new: true, session }
      );
      results.push(updated);
    }
    return results;
  }

  /**
   * Finalizes stock deduction upon successful payment.
   * Total physical stock is permanently decremented, and reservedStock is cleared.
   * Available stock was already decremented during reservation.
   *
   * @param {Array<{ productId: string, quantity: number }>} items
   * @param {object|null} session - Optional MongoDB session
   */
  async finalizeReservedStock(items, session = null) {
    const results = [];
    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      const updated = await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            stock: -qty,
            reservedStock: -qty,
          },
        },
        { new: true, session }
      );
      results.push(updated);
    }
    return results;
  }

  /**
   * Gets current stock status for a product.
   */
  async getStockStatus(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    return {
      productId: product._id,
      name: product.name,
      stock: product.stock,
      reservedStock: product.reservedStock,
      availableStock: product.availableStock,
    };
  }
}

module.exports = new InventoryService();
