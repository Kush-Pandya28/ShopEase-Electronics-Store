import mongoose from 'mongoose';
import { discountPercent } from '../utils/pricing.js';

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true },
  color: { type: String, trim: true },
  colorHex: { type: String, trim: true },
  storage: { type: String, trim: true },
  ram: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  images: [String],
});

const specSchema = new mongoose.Schema(
  {
    group: { type: String, default: 'General', trim: true },
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    highlights: [String],
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    brandName: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    // price / mrp / stock mirror the variants and are derived automatically
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    images: [{ url: { type: String, required: true }, publicId: String }],
    variants: {
      type: [variantSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one variant is required'],
    },
    specifications: [specSchema],
    stock: { type: Number, default: 0 },
    warranty: {
      months: { type: Number, default: 12 },
      type: { type: String, default: 'Brand warranty' },
      extendedAvailable: { type: Boolean, default: false },
      extendedPrice: { type: Number, default: 0 },
    },
    returnDays: { type: Number, default: 7 },
    emiAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', brandName: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });

productSchema.pre('validate', function deriveFromVariants() {
  if (this.variants?.length) {
    const cheapest = this.variants.reduce((min, v) => (v.price < min.price ? v : min), this.variants[0]);
    this.price = cheapest.price;
    this.mrp = Math.max(cheapest.mrp, cheapest.price);
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    this.discountPercent = discountPercent(this.mrp, this.price);
  }
});

export default mongoose.model('Product', productSchema);
