import crypto from 'crypto';
import slugify from 'slugify';

export const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Indian mobile number in one canonical form (10 digits), so "+91 98765 43210",
 * "098765-43210" and "9876543210" are treated as the same number.
 */
export const normalizePhone = (value = '') => {
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};

export const toSlug =(text) => slugify(String(text), { lower: true, strict: true, trim: true });

/** Returns a slug that is unique for the given model, appending a counter if needed. */
export const uniqueSlug = async (Model, text, excludeId) => {
  const base = toSlug(text) || 'item';
  let slug = base;
  let n = 1;
   
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
};

export const parseList = (value) =>
  value === undefined || value === null || value === ''
    ? []
    : String(value)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

export const paginate = (query, { defaultLimit = 12, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

/** "8 GB" -> 8, "1 TB" -> 1024, used to sort RAM / storage filter options */
export const sizeToGB = (value = '') => {
  const match = String(value).match(/([\d.]+)\s*(TB|GB|MB)?/i);
  if (!match) return 0;
  const n = parseFloat(match[1]);
  const unit = (match[2] || 'GB').toUpperCase();
  return unit === 'TB' ? n * 1024 : unit === 'MB' ? n / 1024 : n;
};

export const generateInvoiceNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  // 8 crypto-random chars (~1.1e12 combinations per day) so invoice numbers never clash
  const rand = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, 'X').slice(0, 8).toUpperCase();
  return `SE-${ymd}-${rand}`;
};

export const toCsv = (rows) =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell === null || cell === undefined ? '' : String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');
