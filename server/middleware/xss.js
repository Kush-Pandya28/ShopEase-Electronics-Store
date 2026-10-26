// Defense in depth: React escapes everything it renders, so here we only remove real HTML
// (tags, script/style blocks) and keep ordinary text like "battery > 1 day", "<3" or "A & B" intact.
const BLOCKS = /<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const TAGS = /<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>|<!--[\s\S]*?-->/gi;

export const stripHtml = (text) => text.replace(BLOCKS, '').replace(TAGS, '');

const clean = (value, key) => {
  if (typeof value === 'string') {
    // Passwords are hashed and image data URIs are not rendered as HTML - keep them byte-exact
    if ((key && /password/i.test(key)) || value.startsWith('data:image/')) return value;
    return stripHtml(value);
  }
  if (Array.isArray(value)) return value.map((v) => clean(v));
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    Object.keys(value).forEach((k) => {
      value[k] = clean(value[k], k);
    });
  }
  return value;
};

/** Strips HTML/script tags from every string in the JSON body. */
const xssSanitize = (req, res, next) => {
  if (req.body && !Buffer.isBuffer(req.body)) req.body = clean(req.body);
  next();
};

export default xssSanitize;
