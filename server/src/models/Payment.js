const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: 'Mock Gateway',
    },
    gatewayOutcome: {
      type: String,
      enum: ['success', 'failure', 'timeout'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Completed', 'Failed', 'TimedOut'],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

module.exports = mongoose.model('Payment', paymentSchema);
