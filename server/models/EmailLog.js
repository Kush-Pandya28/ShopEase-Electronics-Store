import mongoose from 'mongoose';

/** One row per email attempt, shown on the admin "Emails" page. Kept for 30 days. */
const emailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    type: { type: String, default: 'general' },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    mode: { type: String, enum: ['smtp', 'preview', 'console'], required: true },
    messageId: String,
    previewUrl: String,
    error: String,
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('EmailLog', emailLogSchema);
