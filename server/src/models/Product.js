const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    // Total physical inventory on hand = availableStock + reservedStock
    stock: {
      type: Number,
      required: [true, 'Total stock count is required'],
      min: [0, 'Total stock cannot be negative'],
    },
    // Stock currently held by active reservations (pending checkout)
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative'],
    },
    // Stock currently available to be added to cart or checked out
    availableStock: {
      type: Number,
      default: 0,
      min: [0, 'Available stock cannot be negative'],
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
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

// Pre-save validation & calculation
productSchema.pre('save', function (next) {
  if (this.isNew && (this.availableStock === undefined || this.availableStock === 0) && this.stock > 0) {
    this.availableStock = this.stock - (this.reservedStock || 0);
  }
  if (this.availableStock < 0) {
    return next(new Error('Available stock cannot be negative'));
  }
  if (this.reservedStock < 0) {
    return next(new Error('Reserved stock cannot be negative'));
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
