import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { paginate } from '../utils/helpers.js';

const REVIEW_SORTS = {
  newest: { createdAt: -1 },
  helpful: { helpfulCount: -1, createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

const hasDeliveredOrder = (userId, productId) =>
  Order.exists({ user: userId, status: { $in: ['delivered', 'returned'] }, 'items.product': productId });

// GET /api/reviews/product/:productId?sort=&page=
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) throw new ApiError(400, 'Invalid product id');
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 5, maxLimit: 50 });
  const filter = { product: productId };
  const [reviews, total, distribution] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort(REVIEW_SORTS[req.query.sort] || REVIEW_SORTS.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: distribution.find((d) => d._id === star)?.count || 0,
  }));
  res.json({
    success: true,
    reviews: reviews.map(({ helpful, ...r }) => ({ ...r, helpfulIds: (helpful || []).map(String) })),
    breakdown,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// GET /api/reviews/product/:productId/eligibility
export const getEligibility = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const [delivered, existing] = await Promise.all([
    hasDeliveredOrder(req.user._id, productId),
    Review.findOne({ user: req.user._id, product: productId }).lean(),
  ]);
  res.json({ success: true, canReview: Boolean(delivered) && !existing, hasPurchased: Boolean(delivered), review: existing });
});

// POST /api/reviews/product/:productId
export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!(await Product.exists({ _id: productId }))) throw new ApiError(404, 'Product not found');
  if (!(await hasDeliveredOrder(req.user._id, productId))) {
    throw new ApiError(403, 'Only customers who received this product can review it');
  }
  if (await Review.exists({ user: req.user._id, product: productId })) {
    throw new ApiError(409, 'You have already reviewed this product');
  }

  const { rating, title, comment, images } = req.body;
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    images: Array.isArray(images) ? images.slice(0, 4) : [],
    isVerifiedPurchase: true,
  });
  await Review.calcAverageRatings(productId);
  res.status(201).json({ success: true, review });
});

// PUT /api/reviews/:id
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (String(review.user) !== String(req.user._id)) throw new ApiError(403, 'You can only edit your own review');

  ['rating', 'title', 'comment'].forEach((f) => {
    if (req.body[f] !== undefined) review[f] = req.body[f];
  });
  if (Array.isArray(req.body.images)) review.images = req.body.images.slice(0, 4);
  await review.save();
  await Review.calcAverageRatings(review.product);
  res.json({ success: true, review });
});

// DELETE /api/reviews/:id  (owner)  and  DELETE /api/reviews/admin/:id  (admin)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  const isOwner = String(review.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Not allowed');
  await review.deleteOne();
  await Review.calcAverageRatings(review.product);
  res.json({ success: true, message: 'Review deleted' });
});

// POST /api/reviews/:id/helpful  (toggle)
export const toggleHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (String(review.user) === String(req.user._id)) throw new ApiError(400, 'You cannot vote on your own review');

  const idx = review.helpful.findIndex((id) => String(id) === String(req.user._id));
  if (idx >= 0) review.helpful.splice(idx, 1);
  else review.helpful.push(req.user._id);
  review.helpfulCount = review.helpful.length;
  await review.save();
  res.json({ success: true, helpfulCount: review.helpfulCount, voted: idx < 0 });
});

// GET /api/reviews/me
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'title slug images')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, reviews });
});

// GET /api/reviews/admin/all?rating=&page=
export const getAllReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 20 });
  const filter = req.query.rating ? { rating: Number(req.query.rating) } : {};
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, reviews, page, pages: Math.ceil(total / limit) || 1, total });
});
