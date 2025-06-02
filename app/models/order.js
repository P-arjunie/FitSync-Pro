import mongoose from 'mongoose';

// Order Item Schema for individual items in the order
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    required: true
  }
});

// Main Order Schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'processing', 'paid', 'completed', 'cancelled', 'refunded']
  },
}, {
  timestamps: true
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate unique order number
    const count = await this.constructor.countDocuments();
    const timestamp = Date.now();
    this.orderNumber = `ORD-${timestamp}-${count + 1}`;
  }
  next();
});

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.orderItems.reduce((total, item) => total + item.quantity, 0);
});

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort('-createdAt');
};

// Static method to find pending orders
orderSchema.statics.findPendingOrders = function() {
  return this.find({ status: 'pending' }).sort('-createdAt');
};

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;