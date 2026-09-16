const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [items => items && items.length > 0, 'Order must contain at least one item'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Reserved', 'Paid', 'Cancelled', 'Expired', 'Failed'],
      default: 'Reserved',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      default: 'POS Customer',
    },
    paymentDetails: {
      transactionId: String,
      paymentMethod: String,
      outcome: String,
      paidAt: Date,
    },
    history: {
      type: [orderHistorySchema],
      default: [],
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Helper method to add history log
orderSchema.methods.addHistory = function (status, reason = '') {
  this.history.push({
    status,
    timestamp: new Date(),
    reason,
  });
};

module.exports = mongoose.model('Order', orderSchema);
