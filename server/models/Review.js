import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    comment: { type: String, trim: true, maxlength: 2000 },
    images: [String],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

/** Recomputes ratingAverage / ratingCount on the product. */
reviewSchema.statics.calcAverageRatings = async function calcAverageRatings(productId) {
  const [stats] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: '$product', count: { $sum: 1 }, avg: { $avg: '$rating' } } },
  ]);
  await mongoose.model('Product').updateOne(
    { _id: productId },
    {
      ratingAverage: stats ? Math.round(stats.avg * 10) / 10 : 0,
      ratingCount: stats ? stats.count : 0,
    }
  );
};

export default mongoose.model('Review', reviewSchema);
