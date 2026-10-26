import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Banner from '../models/Banner.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uniqueSlug } from '../utils/helpers.js';

/**
 * Categories and brands share the same CRUD shape, so the handlers are generated.
 * @param {import('mongoose').Model} Model
 * @param {'category'|'brand'} refField product field that references the model
 * @param {string[]} fields editable fields
 */
const crudFor = (Model, refField, fields) => {
  const label = Model.modelName;
  const pick = (body) => Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

  return {
    list: asyncHandler(async (req, res) => {
      const filter = req.query.all === 'true' ? {} : { isActive: true };
      const [items, counts] = await Promise.all([
        Model.find(filter).sort('name').lean(),
        Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: `$${refField}`, count: { $sum: 1 } } }]),
      ]);
      const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
      res.json({ success: true, items: items.map((i) => ({ ...i, productCount: countMap[String(i._id)] || 0 })) });
    }),

    getBySlug: asyncHandler(async (req, res) => {
      const item = await Model.findOne({ slug: req.params.slug }).lean();
      if (!item) throw new ApiError(404, `${label} not found`);
      res.json({ success: true, item });
    }),

    create: asyncHandler(async (req, res) => {
      const data = pick(req.body);
      const item = await Model.create({ ...data, slug: await uniqueSlug(Model, data.name) });
      res.status(201).json({ success: true, item });
    }),

    update: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new ApiError(404, `${label} not found`);
      const data = pick(req.body);
      if (data.name && data.name !== item.name) item.slug = await uniqueSlug(Model, data.name, item._id);
      item.set(data);
      await item.save();
      if (refField === 'brand' && data.name) {
        await Product.updateMany({ brand: item._id }, { brandName: item.name });
      }
      res.json({ success: true, item });
    }),

    remove: asyncHandler(async (req, res) => {
      const inUse = await Product.countDocuments({ [refField]: req.params.id });
      if (inUse) throw new ApiError(400, `Cannot delete: ${inUse} product(s) still use this ${label.toLowerCase()}`);
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw new ApiError(404, `${label} not found`);
      res.json({ success: true, message: `${label} deleted` });
    }),
  };
};

export const categoryCrud = crudFor(Category, 'category', ['name', 'description', 'image', 'icon', 'parent', 'isActive']);
export const brandCrud = crudFor(Brand, 'brand', ['name', 'logo', 'isActive']);

// ---------- Banners ----------
const BANNER_FIELDS = ['title', 'subtitle', 'image', 'link', 'buttonText', 'position', 'isActive'];
const pickBanner = (body) =>
  Object.fromEntries(BANNER_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

export const getBanners = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  res.json({ success: true, banners: await Banner.find(filter).sort('position').lean() });
});

export const createBanner = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, banner: await Banner.create(pickBanner(req.body)) });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, pickBanner(req.body), { new: true, runValidators: true });
  if (!banner) throw new ApiError(404, 'Banner not found');
  res.json({ success: true, banner });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found');
  res.json({ success: true, message: 'Banner deleted' });
});
