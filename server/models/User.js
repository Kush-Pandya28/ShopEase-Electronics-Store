import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, match: [/^[6-9]\d{9}$/, 'Invalid phone number'] },
  street: { type: String, required: true, trim: true },
  landmark: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, match: [/^\d{6}$/, 'Pincode must be 6 digits'] },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    avatar: { type: String, default: '' },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    // Hashed refresh tokens, one per logged-in device (max 5)
    refreshTokens: { type: [String], select: false },
    // Just-rotated tokens stay valid for a few seconds so parallel tabs refreshing together don't log out
    graceTokens: { type: [{ hash: String, until: Date, _id: false }], select: false },
    emailVerifyToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

// Database-level guarantee that a mobile number belongs to one account (also stops two
// registrations racing each other). Users without a phone are not part of the index.
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string', $gt: '' } } });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.graceTokens;
    delete ret.emailVerifyToken;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
