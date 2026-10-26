import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deleteImage } from '../config/cloudinary.js';
import { escapeRegex, paginate, parseList, sizeToGB, uniqueSlug } from '../utils/helpers.js';

export const SPEC_KEYS = { battery: 'Battery Capacity', screen: 'Screen Size' };

const LIST_FIELDS =
  'title slug brand brandName category price mrp discountPercent images stock ratingAverage ratingCount soldCount isFeatured emiAvailable variants.sku variants.color variants.colorHex variants.ram variants.storage variants.price variants.mrp variants.stock createdAt';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
  popularity: { soldCount: -1 },
  discount: { discountPercent: -1 },
};

const categoryIds = async (slug) => {
  const cat = await Category.findOne({ slug: String(slug) }).select('_id');
  if (!cat) return [];
  const children = await Category.find({ parent: cat._id }).select('_id');
  return [cat._id, ...children.map((c) => c._id)];
};

/** Builds a Mongo filter from query-string filters. */
const buildFilter = async (q) => {
  const filter = { isActive: true };
  const and = [];

  if (q.q) {
    // Search matches product name, brand, tags and category name (e.g. "headphones", "laptop")
    const term = String(q.q).trim();
    const rx = new RegExp(escapeRegex(term), 'i');
    const singular = term.replace(/e?s$/i, '');
    const catRx = new RegExp(escapeRegex(singular.length >= 3 ? singular : term), 'i');
    const cats = await Category.find({ name: catRx }).select('_id');
    filter.$or = [
      { title: rx },
      { brandName: rx },
      { tags: rx },
      ...(cats.length ? [{ category: { $in: cats.map((c) => c._id) } }] : []),
    ];
  }
  if (q.category) filter.category = { $in: await categoryIds(q.category) };

  const brandSlugs = parseList(q.brand);
  if (brandSlugs.length) {
    const brands = await Brand.find({ slug: { $in: brandSlugs } }).select('_id');
    filter.brand = { $in: brands.map((b) => b._id) };
  }

  if (q.minPrice || q.maxPrice) {
    filter.price = {};
    if (q.minPrice) filter.price.$gte = Number(q.minPrice);
    if (q.maxPrice) filter.price.$lte = Number(q.maxPrice);
  }
  if (q.rating) filter.ratingAverage = { $gte: Number(q.rating) };
  if (q.minDiscount) filter.discountPercent = { $gte: Number(q.minDiscount) };
  if (q.inStock === 'true') filter.stock = { $gt: 0 };
  if (q.featured === 'true') filter.isFeatured = true;

  const rams = parseList(q.ram);
  if (rams.length) filter['variants.ram'] = { $in: rams };
  const storages = parseList(q.storage);
  if (storages.length) filter['variants.storage'] = { $in: storages };

  Object.entries(SPEC_KEYS).forEach(([param, key]) => {
    const values = parseList(q[param]);
    if (values.length) and.push({ specifications: { $elemMatch: { key, value: { $in: values } } } });
  });
  if (and.length) filter.$and = and;

  return filter;
};

// GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = await buildFilter(req.query);
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select(LIST_FIELDS)
      .populate('category', 'name slug')
      .sort({ ...sort, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, page, pages: Math.ceil(total / limit) || 1, total });
});

// GET /api/products/filters?category=slug
export const getFilterOptions = asyncHandler(async (req, res) => {
  const match = { isActive: true };
  if (req.query.category) match.category = { $in: await categoryIds(req.query.category) };

  const specValues = (key) =>
    Product.aggregate([
      { $match: match },
      { $unwind: '$specifications' },
      { $match: { 'specifications.key': key } },
      { $group: { _id: '$specifications.value' } },
    ]).then((rows) => rows.map((r) => r._id).sort((a, b) => parseFloat(a) - parseFloat(b)));

  const [brandIds, rams, storages, battery, screen, [range]] = await Promise.all([
    Product.distinct('brand', match),
    Product.distinct('variants.ram', match),
    Product.distinct('variants.storage', match),
    specValues(SPEC_KEYS.battery),
    specValues(SPEC_KEYS.screen),
    Product.aggregate([
      { $match: match },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
  ]);
  const brands = await Brand.find({ _id: { $in: brandIds } })
    .select('name slug')
    .sort('name')
    .lean();
  const bySize = (a, b) => sizeToGB(a) - sizeToGB(b);

  res.json({
    success: true,
    brands,
    ram: rams.filter(Boolean).sort(bySize),
    storage: storages.filter(Boolean).sort(bySize),
    battery,
    screen,
    price: { min: range?.min || 0, max: range?.max || 0 },
  });
});

// GET /api/products/suggest?q=
export const getSuggestions = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, suggestions: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const [products, categories] = await Promise.all([
    Product.find({ isActive: true, $or: [{ title: rx }, { brandName: rx }, { tags: rx }] })
      .select('title slug images price brandName')
      .sort({ soldCount: -1 })
      .limit(6)
      .lean(),
    Category.find({ isActive: true, name: rx }).select('name slug').limit(3).lean(),
  ]);
  return res.json({
    success: true,
    suggestions: products.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      brandName: p.brandName,
      price: p.price,
      image: p.images?.[0]?.url,
    })),
    categories,
  });
});

const listBy = (filter, sort, limit = 10) =>
  Product.find({ isActive: true, ...filter })
    .select(LIST_FIELDS)
    .sort(sort)
    .limit(limit)
    .lean();

// GET /api/products/featured
export const getFeatured = asyncHandler(async (req, res) => {
  res.json({ success: true, products: await listBy({ isFeatured: true }, { soldCount: -1 }) });
});

// GET /api/products/new
export const getNewArrivals = asyncHandler(async (req, res) => {
  res.json({ success: true, products: await listBy({}, { createdAt: -1 }) });
});

// GET /api/products/deals
export const getDeals = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    products: await listBy({ discountPercent: { $gte: 10 }, stock: { $gt: 0 } }, { discountPercent: -1 }),
  });
});

// GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('brand', 'name slug logo')
    .populate('category', 'name slug')
    .lean();
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

// GET /api/products/:id/related
export const getRelated = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('category brand price');
  if (!product) throw new ApiError(404, 'Product not found');
  const products = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .select(LIST_FIELDS)
    .sort({ soldCount: -1 })
    .limit(10)
    .lean();
  res.json({ success: true, products });
});

// POST /api/products/compare  { ids: [] }
export const compareProducts = asyncHandler(async (req, res) => {
  const ids = [...new Set((req.body.ids || []).map(String))].filter((id) => mongoose.isValidObjectId(id));
  if (ids.length < 2 || ids.length > 4) throw new ApiError(400, 'Select 2 to 4 products to compare');

  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .lean();
  const categories = new Set(products.map((p) => String(p.category?._id)));
  if (categories.size > 1) throw new ApiError(400, 'Only products from the same category can be compared');

  // Keep the order the client asked for
  products.sort((a, b) => ids.indexOf(String(a._id)) - ids.indexOf(String(b._id)));
  res.json({ success: true, products });
});

// ---------- Admin ----------
const PRODUCT_FIELDS = [
  'title',
  'description',
  'highlights',
  'brand',
  'category',
  'images',
  'variants',
  'specifications',
  'warranty',
  'returnDays',
  'emiAvailable',
  'isFeatured',
  'isActive',
  'tags',
];

const pickProduct = (body) =>
  Object.fromEntries(PRODUCT_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const assertUniqueSkus = async (variants = [], excludeId) => {
  const skus = variants.map((v) => String(v.sku || '').trim());
  if (skus.some((s) => !s)) throw new ApiError(400, 'Every variant needs a SKU');
  if (new Set(skus).size !== skus.length) throw new ApiError(400, 'Variant SKUs must be unique');
  const clash = await Product.findOne({
    'variants.sku': { $in: skus },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select('title')
    .lean();
  if (clash) throw new ApiError(409, `SKU already used by "${clash.title}"`);
};

// GET /api/products/admin/all
export const getAdminProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ title: rx }, { brandName: rx }, { 'variants.sku': rx }];
  }
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.lowStock === 'true') filter.stock = { $lte: Number(process.env.LOW_STOCK_THRESHOLD) || 5 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select(
        'title slug brandName category price mrp stock images isActive isFeatured soldCount ratingAverage variants.sku'
      )
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, products, page, pages: Math.ceil(total / limit) || 1, total });
});

// GET /api/products/admin/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

// POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const data = pickProduct(req.body);
  const [brand, category] = await Promise.all([Brand.findById(data.brand), Category.findById(data.category)]);
  if (!brand) throw new ApiError(400, 'Invalid brand');
  if (!category) throw new ApiError(400, 'Invalid category');
  await assertUniqueSkus(data.variants);

  const product = await Product.create({
    ...data,
    brandName: brand.name,
    slug: await uniqueSlug(Product, req.body.slug || data.title),
  });
  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const data = pickProduct(req.body);

  if (data.brand) {
    const brand = await Brand.findById(data.brand);
    if (!brand) throw new ApiError(400, 'Invalid brand');
    product.brandName = brand.name;
  }
  if (data.category && !(await Category.exists({ _id: data.category })))
    throw new ApiError(400, 'Invalid category');
  if (data.variants) await assertUniqueSkus(data.variants, product._id);
  if (req.body.slug && req.body.slug !== product.slug) {
    product.slug = await uniqueSlug(Product, req.body.slug, product._id);
  }

  // Remove Cloudinary images that were dropped in the edit
  if (data.images) {
    const kept = new Set(data.images.map((i) => i.publicId).filter(Boolean));
    product.images.filter((i) => i.publicId && !kept.has(i.publicId)).forEach((i) => deleteImage(i.publicId));
  }

  product.set(data);
  await product.save();
  res.json({ success: true, product });
});

// DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await Promise.all(product.images.map((i) => deleteImage(i.publicId)));
  await Review.deleteMany({ product: product._id });
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});
