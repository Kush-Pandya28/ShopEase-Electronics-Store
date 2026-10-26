import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    image: { type: String, required: true },
    link: { type: String, default: '/products' },
    buttonText: { type: String, default: 'Shop now' },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
