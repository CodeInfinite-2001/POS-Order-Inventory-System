const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    name: {
      type: String,
      trim: true,
      default: function () {
        return this.username;
      },
    },
    salt: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.salt;
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password with salt using PBKDF2 (SHA-512)
userSchema.statics.hashPassword = function (password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

// Set password helper
userSchema.methods.setPassword = function (plainPassword) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = userSchema.statics.hashPassword(plainPassword, this.salt);
};

// Verify password helper
userSchema.methods.verifyPassword = function (plainPassword) {
  if (!this.salt || !this.passwordHash) return false;
  const hash = userSchema.statics.hashPassword(plainPassword, this.salt);
  return crypto.timingSafeEqual(Buffer.from(this.passwordHash), Buffer.from(hash));
};

module.exports = mongoose.model('User', userSchema);
