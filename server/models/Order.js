import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
];

export const CANCELLABLE_STATUSES = ['placed', 'confirmed', 'packed'];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  slug: String,
  brandName: String,
  image: String,
  variantSku: { type: String, required: true },
  variantLabel: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  mrp: Number,
  serialNumber: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      landmark: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentMethod: { type: String, enum: ['razorpay', 'stripe', 'cod'], required: true },
    paymentResult: {
      id: String,
      razorpayOrderId: { type: String, index: true },
      status: String,
      paidAt: Date,
    },
    itemsPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    coupon: { type: String, default: null },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        date: { type: Date, default: Date.now },
        note: String,
      },
    ],
    trackingId: String,
    courier: String,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    returnRequest: {
      type: { type: String, enum: ['return', 'replace'] },
      reason: String,
      status: { type: String, enum: ['requested', 'approved', 'rejected'] },
      requestedAt: Date,
      resolvedAt: Date,
      adminNote: String,
    },
    invoiceNumber: { type: String, unique: true },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
