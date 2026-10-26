// Sample electronics catalogue used by seeds/seed.js
// Product photos live in server/public/products (see CREDITS.md there); the SVG drawings below are
// only used for products without a photo, and for category / brand cards.

const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Splits text into lines of at most `max` characters on word boundaries. */
const wrap = (text, max = 16) =>
  String(text)
    .split(/\s+/)
    .reduce((lines, word) => {
      const last = lines[lines.length - 1];
      if (last && `${last} ${word}`.length <= max) lines[lines.length - 1] = `${last} ${word}`;
      else lines.push(word);
      return lines;
    }, [])
    .slice(0, 4);

/** Self-contained SVG placeholder image as a data URI (works offline and in production). */
export const img = (text, bg = '4f46e5') => {
  const lines = wrap(text);
  const lineHeight = 64;
  const startY = 400 - ((lines.length - 1) * lineHeight) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${bg}"/><stop offset="1" stop-color="#${bg}" stop-opacity="0.75"/></linearGradient></defs>
<rect width="800" height="800" fill="url(#g)"/>
<rect x="250" y="120" width="300" height="12" rx="6" fill="#ffffff" fill-opacity="0.25"/>
<text x="400" y="${startY}" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="54" font-weight="700" text-anchor="middle">${lines
    .map((l, i) => `<tspan x="400" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(l)}</tspan>`)
    .join('')}</text>
<text x="400" y="700" fill="#ffffff" fill-opacity="0.7" font-family="Segoe UI, Arial, sans-serif" font-size="30" text-anchor="middle">ShopEase</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// ---------- Product illustrations ----------
// Simple vector drawings of each device type, drawn in "ink" colour on the product's brand colour.
const DEVICE = {
  phone: (ink, scr) => `<rect x="300" y="120" width="200" height="380" rx="36" fill="${ink}"/>
    <rect x="314" y="140" width="172" height="340" rx="24" fill="${scr}"/>
    <rect x="370" y="150" width="60" height="14" rx="7" fill="${ink}"/>
    <circle cx="452" cy="190" r="10" fill="${ink}" opacity=".5"/>`,
  laptop: (ink, scr) => `<rect x="215" y="150" width="370" height="250" rx="16" fill="${ink}"/>
    <rect x="232" y="167" width="336" height="216" rx="8" fill="${scr}"/>
    <path d="M165 410 H635 L600 450 H200 Z" fill="${ink}"/>
    <rect x="360" y="410" width="80" height="10" rx="5" fill="${scr}"/>`,
  tablet: (ink, scr) => `<rect x="250" y="120" width="300" height="390" rx="30" fill="${ink}"/>
    <rect x="268" y="140" width="264" height="350" rx="16" fill="${scr}"/>
    <circle cx="400" cy="130" r="5" fill="${scr}"/>`,
  headphones: (ink, scr) => `<path d="M245 360 A155 155 0 0 1 555 360" fill="none" stroke="${ink}" stroke-width="30" stroke-linecap="round"/>
    <rect x="205" y="320" width="90" height="160" rx="40" fill="${ink}"/>
    <rect x="505" y="320" width="90" height="160" rx="40" fill="${ink}"/>
    <rect x="225" y="345" width="50" height="110" rx="24" fill="${scr}"/>
    <rect x="525" y="345" width="50" height="110" rx="24" fill="${scr}"/>`,
  watch: (ink, scr) => `<rect x="350" y="100" width="100" height="440" rx="30" fill="${ink}" opacity=".55"/>
    <rect x="300" y="210" width="200" height="220" rx="56" fill="${ink}"/>
    <rect x="320" y="230" width="160" height="180" rx="40" fill="${scr}"/>
    <rect x="498" y="280" width="18" height="50" rx="8" fill="${ink}"/>`,
  camera: (ink, scr) => `<rect x="290" y="180" width="100" height="50" rx="12" fill="${ink}"/>
    <rect x="200" y="210" width="400" height="260" rx="40" fill="${ink}"/>
    <circle cx="400" cy="340" r="100" fill="${scr}"/>
    <circle cx="400" cy="340" r="70" fill="${ink}" opacity=".6"/>
    <circle cx="400" cy="340" r="38" fill="${scr}"/>
    <circle cx="540" cy="250" r="14" fill="${scr}"/>`,
  tv: (ink, scr) => `<rect x="150" y="140" width="500" height="300" rx="18" fill="${ink}"/>
    <rect x="166" y="156" width="468" height="268" rx="8" fill="${scr}"/>
    <rect x="375" y="440" width="50" height="40" fill="${ink}"/>
    <rect x="290" y="478" width="220" height="14" rx="7" fill="${ink}"/>`,
  speaker: (ink, scr) => `<rect x="290" y="120" width="220" height="380" rx="46" fill="${ink}"/>
    <circle cx="400" cy="215" r="44" fill="${scr}"/>
    <circle cx="400" cy="380" r="80" fill="${scr}"/>
    <circle cx="400" cy="380" r="34" fill="${ink}" opacity=".6"/>`,
  gamepad: (ink, scr) => `<path d="M260 250 H540 C610 250 650 330 650 400 C650 470 600 500 560 470 L500 420 H300 L240 470 C200 500 150 470 150 400 C150 330 190 250 260 250 Z" fill="${ink}"/>
    <rect x="245" y="320" width="70" height="22" rx="6" fill="${scr}"/>
    <rect x="269" y="296" width="22" height="70" rx="6" fill="${scr}"/>
    <circle cx="520" cy="305" r="16" fill="${scr}"/><circle cx="560" cy="340" r="16" fill="${scr}"/>
    <circle cx="480" cy="340" r="16" fill="${scr}"/><circle cx="520" cy="375" r="16" fill="${scr}"/>`,
  keyboard: (ink, scr) => {
    const keys = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) keys.push(`<rect x="${192 + c * 38}" y="${282 + r * 38}" width="30" height="30" rx="6" fill="${scr}"/>`);
    return `<rect x="170" y="260" width="460" height="200" rx="24" fill="${ink}"/>${keys.join('')}`;
  },
  battery: (ink, scr) => `<rect x="285" y="130" width="230" height="370" rx="40" fill="${ink}"/>
    <rect x="305" y="150" width="190" height="330" rx="28" fill="${scr}"/>
    <path d="M415 210 L340 335 H395 L380 430 L460 300 H405 Z" fill="${ink}"/>`,
  home: (ink, scr) => `<path d="M400 130 L590 280 V490 H210 V280 Z" fill="${ink}"/>
    <rect x="250" y="300" width="300" height="190" fill="${scr}"/>
    <circle cx="400" cy="380" r="56" fill="${ink}" opacity=".7"/>
    <path d="M330 450 Q400 400 470 450" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`,
};

export const CATEGORY_DEVICE = {
  Mobiles: 'phone',
  Laptops: 'laptop',
  Tablets: 'tablet',
  'Headphones & Earbuds': 'headphones',
  Smartwatches: 'watch',
  Cameras: 'camera',
  TVs: 'tv',
  Speakers: 'speaker',
  Gaming: 'gamepad',
  'Computer Accessories': 'keyboard',
  'Chargers & Power Banks': 'battery',
  'Smart Home': 'home',
};

const isLight = (hex) => {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
};

/**
 * Product photo placeholder: a device illustration (by category) on the brand colour,
 * with the product name. `view` 0/1/2 = front / angled left / angled right.
 */
export const productImage = ({ title, brand, bg = '4f46e5', category, view = 0 }) => {
  const light = isLight(bg);
  const ink = light ? '#1f2937' : '#ffffff';
  const scr = light ? '#d1d5db' : 'url(#screen)';
  const text = light ? '#111827' : '#ffffff';
  const draw = (DEVICE[CATEGORY_DEVICE[category]] || DEVICE.phone)(ink, scr);
  const tilt = [0, -9, 9][view] || 0;
  const name = wrap(String(title).split('(')[0].trim(), 24).slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${bg}"/><stop offset="1" stop-color="#${bg}" stop-opacity="${light ? 0.7 : 0.82}"/></linearGradient>
  <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#334155"/><stop offset=".45" stop-color="#0f172a"/><stop offset="1" stop-color="#020617"/></linearGradient>
  <radialGradient id="glow" cx="50%" cy="40%" r="50%"><stop offset="0" stop-color="#ffffff" stop-opacity="${light ? 0.7 : 0.28}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="800" height="800" fill="url(#bg)"/>
<circle cx="400" cy="320" r="300" fill="url(#glow)"/>
<ellipse cx="400" cy="540" rx="210" ry="22" fill="#000" opacity=".18"/>
<g transform="rotate(${tilt} 400 320)">${draw}</g>
<text x="400" y="628" fill="${text}" fill-opacity=".75" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="600" letter-spacing="4" text-anchor="middle">${escapeXml(String(brand).toUpperCase())}</text>
<text x="400" y="682" fill="${text}" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="700" text-anchor="middle">${name
    .map((l, i) => `<tspan x="400" dy="${i === 0 ? 0 : 48}">${escapeXml(l)}</tspan>`)
    .join('')}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const categories = [
  { name: 'Mobiles', icon: 'smartphone', description: 'Latest 5G smartphones' },
  { name: 'Laptops', icon: 'laptop', description: 'Thin and light, gaming and business laptops' },
  { name: 'Tablets', icon: 'tablet', description: 'Tablets for work and play' },
  { name: 'Headphones & Earbuds', icon: 'headphones', description: 'TWS earbuds, neckbands and headphones' },
  { name: 'Smartwatches', icon: 'watch', description: 'Fitness bands and smartwatches' },
  { name: 'Cameras', icon: 'camera', description: 'Mirrorless, DSLR and action cameras' },
  { name: 'TVs', icon: 'tv', description: 'Smart LED, QLED and OLED TVs' },
  { name: 'Speakers', icon: 'speaker', description: 'Bluetooth and smart speakers' },
  { name: 'Gaming', icon: 'gamepad', description: 'Consoles and gaming accessories' },
  { name: 'Computer Accessories', icon: 'keyboard', description: 'Keyboards, mice and monitors' },
  { name: 'Chargers & Power Banks', icon: 'battery', description: 'Fast chargers and power banks' },
  { name: 'Smart Home', icon: 'home', description: 'Smart plugs, bulbs and security cameras' },
];

export const brands = [
  'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Sony', 'HP', 'Dell', 'Lenovo', 'ASUS', 'boAt',
  'JBL', 'Canon', 'LG', 'Logitech', 'Anker', 'Noise', 'Microsoft', 'Google', 'Amazon',
  'Realme', 'Vivo', 'Motorola', 'Acer', 'MSI', 'Bose', 'Sennheiser', 'GoPro', 'Nikon', 'Fire-Boltt',
  'Garmin', 'TP-Link', 'Philips', 'Nintendo', 'Zebronics', 'Ambrane', 'TCL',
  'Nothing', 'OPPO', 'iQOO', 'Marshall', 'Fujifilm', 'DJI', 'HyperX', 'Razer', 'SanDisk', 'Seagate', 'Belkin',
];

const phoneSpecs = ({ screen, display, processor, rearCam, frontCam, battery, charging, os, weight }) => [
  { group: 'Display', key: 'Screen Size', value: screen },
  { group: 'Display', key: 'Display Type', value: display },
  { group: 'Performance', key: 'Processor', value: processor },
  { group: 'Performance', key: 'Operating System', value: os },
  { group: 'Camera', key: 'Rear Camera', value: rearCam },
  { group: 'Camera', key: 'Front Camera', value: frontCam },
  { group: 'Battery', key: 'Battery Capacity', value: battery },
  { group: 'Battery', key: 'Fast Charging', value: charging },
  { group: 'Connectivity', key: 'Network', value: '5G' },
  { group: 'General', key: 'Weight', value: weight },
];

const laptopSpecs = ({ screen, display, processor, gpu, battery, os, weight }) => [
  { group: 'Display', key: 'Screen Size', value: screen },
  { group: 'Display', key: 'Display Type', value: display },
  { group: 'Performance', key: 'Processor', value: processor },
  { group: 'Performance', key: 'Graphics', value: gpu },
  { group: 'Performance', key: 'Operating System', value: os },
  { group: 'Battery', key: 'Battery Capacity', value: battery },
  { group: 'General', key: 'Weight', value: weight },
];

/**
 * Each product: variants carry price/mrp/stock; category & brand are names resolved in seed.js
 */
const baseProducts = [
  // ---------------- Mobiles ----------------
  {
    title: 'Apple iPhone 15 (128 GB)',
    brand: 'Apple',
    category: 'Mobiles',
    bg: '111827',
    isFeatured: true,
    description:
      'iPhone 15 brings Dynamic Island, a 48MP main camera and USB-C. A16 Bionic chip delivers blazing performance with all-day battery life.',
    highlights: ['Dynamic Island', '48MP Main camera with 2x telephoto', 'A16 Bionic chip', 'USB-C connector'],
    variants: [
      { sku: 'IP15-BLK-128', color: 'Black', colorHex: '#1f2937', storage: '128 GB', ram: '6 GB', price: 69900, mrp: 79900, stock: 25 },
      { sku: 'IP15-BLU-256', color: 'Blue', colorHex: '#bfdbfe', storage: '256 GB', ram: '6 GB', price: 79900, mrp: 89900, stock: 12 },
      { sku: 'IP15-PNK-512', color: 'Pink', colorHex: '#fbcfe8', storage: '512 GB', ram: '6 GB', price: 99900, mrp: 109900, stock: 4 },
    ],
    specifications: phoneSpecs({ screen: '6.1 inch', display: 'Super Retina XDR OLED', processor: 'A16 Bionic', rearCam: '48MP + 12MP', frontCam: '12MP', battery: '3349 mAh', charging: '20W', os: 'iOS 17', weight: '171 g' }),
    warranty: { months: 12, type: 'Apple India warranty', extendedAvailable: true, extendedPrice: 7900 },
    tags: ['iphone', 'apple', '5g', 'smartphone'],
    soldCount: 320,
  },
  {
    title: 'Samsung Galaxy S24 Ultra 5G',
    brand: 'Samsung',
    category: 'Mobiles',
    bg: '1e293b',
    isFeatured: true,
    description:
      'Galaxy AI is here. Titanium frame, built-in S Pen, 200MP camera with 100x Space Zoom and Snapdragon 8 Gen 3 for Galaxy.',
    highlights: ['Galaxy AI features', '200MP wide camera, 100x Space Zoom', 'Built-in S Pen', 'Titanium frame'],
    variants: [
      { sku: 'S24U-GRY-256', color: 'Titanium Gray', colorHex: '#6b7280', storage: '256 GB', ram: '12 GB', price: 129999, mrp: 144999, stock: 15 },
      { sku: 'S24U-BLK-512', color: 'Titanium Black', colorHex: '#111827', storage: '512 GB', ram: '12 GB', price: 139999, mrp: 159999, stock: 8 },
    ],
    specifications: phoneSpecs({ screen: '6.8 inch', display: 'Dynamic AMOLED 2X, 120Hz', processor: 'Snapdragon 8 Gen 3', rearCam: '200MP + 50MP + 12MP + 10MP', frontCam: '12MP', battery: '5000 mAh', charging: '45W', os: 'Android 14, One UI 6.1', weight: '232 g' }),
    warranty: { months: 12, type: 'Samsung India warranty', extendedAvailable: true, extendedPrice: 9999 },
    tags: ['samsung', 'galaxy', 's pen', '5g'],
    soldCount: 210,
  },
  {
    title: 'OnePlus 12R 5G',
    brand: 'OnePlus',
    category: 'Mobiles',
    bg: 'b91c1c',
    description: 'Flagship-level Snapdragon 8 Gen 2, 5500 mAh battery with 100W SUPERVOOC and a 120Hz ProXDR display.',
    highlights: ['Snapdragon 8 Gen 2', '100W SUPERVOOC charging', '1.5K 120Hz LTPO display', '5500 mAh battery'],
    variants: [
      { sku: 'OP12R-BLU-128', color: 'Cool Blue', colorHex: '#60a5fa', storage: '128 GB', ram: '8 GB', price: 39999, mrp: 42999, stock: 40 },
      { sku: 'OP12R-GRY-256', color: 'Iron Gray', colorHex: '#4b5563', storage: '256 GB', ram: '16 GB', price: 45999, mrp: 49999, stock: 22 },
    ],
    specifications: phoneSpecs({ screen: '6.78 inch', display: 'AMOLED ProXDR, 120Hz', processor: 'Snapdragon 8 Gen 2', rearCam: '50MP + 8MP + 2MP', frontCam: '16MP', battery: '5500 mAh', charging: '100W', os: 'Android 14, OxygenOS', weight: '207 g' }),
    tags: ['oneplus', 'fast charging', '5g'],
    soldCount: 450,
  },
  {
    title: 'Redmi Note 13 Pro 5G',
    brand: 'Xiaomi',
    category: 'Mobiles',
    bg: 'ea580c',
    description: '200MP OIS camera, 1.5K curved AMOLED and 67W turbo charging at a mid-range price.',
    highlights: ['200MP OIS camera', '120Hz 1.5K AMOLED', '67W Turbo charging', 'IP54 rating'],
    variants: [
      { sku: 'RN13P-BLK-128', color: 'Midnight Black', colorHex: '#111827', storage: '128 GB', ram: '8 GB', price: 23999, mrp: 28999, stock: 60 },
      { sku: 'RN13P-PUR-256', color: 'Fusion Purple', colorHex: '#a78bfa', storage: '256 GB', ram: '12 GB', price: 27999, mrp: 32999, stock: 3 },
    ],
    specifications: phoneSpecs({ screen: '6.67 inch', display: 'AMOLED, 120Hz', processor: 'Snapdragon 7s Gen 2', rearCam: '200MP + 8MP + 2MP', frontCam: '16MP', battery: '5100 mAh', charging: '67W', os: 'Android 13, MIUI 14', weight: '187 g' }),
    tags: ['redmi', 'xiaomi', 'budget', '5g'],
    soldCount: 780,
  },
  {
    title: 'Google Pixel 8a',
    brand: 'Google',
    category: 'Mobiles',
    bg: '0f766e',
    description: 'The helpful phone with Google AI, Tensor G3 chip and a brilliant camera that makes every photo look great.',
    highlights: ['Google Tensor G3', 'Magic Eraser and Best Take', '7 years of OS updates', '120Hz Actua display'],
    variants: [
      { sku: 'PX8A-OBS-128', color: 'Obsidian', colorHex: '#1f2937', storage: '128 GB', ram: '8 GB', price: 52999, mrp: 52999, stock: 18 },
      { sku: 'PX8A-BAY-256', color: 'Bay', colorHex: '#93c5fd', storage: '256 GB', ram: '8 GB', price: 59999, mrp: 59999, stock: 9 },
    ],
    specifications: phoneSpecs({ screen: '6.1 inch', display: 'OLED Actua, 120Hz', processor: 'Google Tensor G3', rearCam: '64MP + 13MP', frontCam: '13MP', battery: '4492 mAh', charging: '18W', os: 'Android 14', weight: '188 g' }),
    tags: ['pixel', 'google', 'camera phone'],
    soldCount: 95,
  },
  // ---------------- Laptops ----------------
  {
    title: 'Apple MacBook Air M3 13-inch',
    brand: 'Apple',
    category: 'Laptops',
    bg: '334155',
    isFeatured: true,
    description: 'Strikingly thin and fast. The M3 chip, up to 18 hours of battery and a Liquid Retina display.',
    highlights: ['Apple M3 chip with 8-core CPU', 'Up to 18 hours battery', '13.6-inch Liquid Retina display', 'Fanless silent design'],
    variants: [
      { sku: 'MBA-M3-MID-8-256', color: 'Midnight', colorHex: '#1e293b', ram: '8 GB', storage: '256 GB', price: 114900, mrp: 114900, stock: 10 },
      { sku: 'MBA-M3-SLV-16-512', color: 'Silver', colorHex: '#e5e7eb', ram: '16 GB', storage: '512 GB', price: 144900, mrp: 154900, stock: 6 },
    ],
    specifications: laptopSpecs({ screen: '13.6 inch', display: 'Liquid Retina, 2560x1664', processor: 'Apple M3', gpu: '8-core GPU', battery: '52.6 Wh', os: 'macOS Sonoma', weight: '1.24 kg' }),
    warranty: { months: 12, type: 'Apple India warranty', extendedAvailable: true, extendedPrice: 14900 },
    tags: ['macbook', 'apple', 'laptop', 'm3'],
    soldCount: 140,
  },
  {
    title: 'HP Pavilion 15 (Intel Core i5 13th Gen)',
    brand: 'HP',
    category: 'Laptops',
    bg: '1d4ed8',
    description: 'Everyday performance with 13th Gen Intel Core i5, FHD IPS display, backlit keyboard and fast charge.',
    highlights: ['Intel Core i5-1335U', '15.6-inch FHD IPS', 'Backlit keyboard', 'HP Fast Charge'],
    variants: [
      { sku: 'HPPAV15-I5-16-512', color: 'Natural Silver', colorHex: '#d1d5db', ram: '16 GB', storage: '512 GB', price: 62990, mrp: 78990, stock: 20 },
    ],
    specifications: laptopSpecs({ screen: '15.6 inch', display: 'FHD IPS, 250 nits', processor: 'Intel Core i5-1335U', gpu: 'Intel Iris Xe', battery: '41 Wh', os: 'Windows 11 Home', weight: '1.75 kg' }),
    tags: ['hp', 'pavilion', 'student laptop'],
    soldCount: 260,
  },
  {
    title: 'Dell Inspiron 14 2-in-1 (Ryzen 7)',
    brand: 'Dell',
    category: 'Laptops',
    bg: '0369a1',
    description: 'A convertible touch laptop with AMD Ryzen 7 7730U, 16GB RAM and a 360 degree hinge.',
    highlights: ['AMD Ryzen 7 7730U', '14-inch FHD+ touch', '360 degree hinge', 'Backlit keyboard + fingerprint reader'],
    variants: [
      { sku: 'DELL-INS14-R7-16-512', color: 'Platinum Silver', colorHex: '#e5e7eb', ram: '16 GB', storage: '512 GB', price: 68990, mrp: 89990, stock: 7 },
    ],
    specifications: laptopSpecs({ screen: '14 inch', display: 'FHD+ Touch, 250 nits', processor: 'AMD Ryzen 7 7730U', gpu: 'AMD Radeon', battery: '54 Wh', os: 'Windows 11 Home', weight: '1.59 kg' }),
    tags: ['dell', 'inspiron', '2-in-1', 'touch'],
    soldCount: 110,
  },
  {
    title: 'ASUS ROG Strix G16 Gaming Laptop (RTX 4060)',
    brand: 'ASUS',
    category: 'Laptops',
    bg: '7f1d1d',
    isFeatured: true,
    description: 'Dominate every game with Intel Core i7 14th Gen, RTX 4060 graphics and a 165Hz display.',
    highlights: ['Intel Core i7-14650HX', 'NVIDIA RTX 4060 8GB', '16-inch 165Hz FHD+', 'ROG Intelligent Cooling'],
    variants: [
      { sku: 'ROG-G16-I7-16-1TB', color: 'Eclipse Gray', colorHex: '#374151', ram: '16 GB', storage: '1 TB', price: 139990, mrp: 169990, stock: 5 },
    ],
    specifications: laptopSpecs({ screen: '16 inch', display: 'FHD+ 165Hz IPS', processor: 'Intel Core i7-14650HX', gpu: 'NVIDIA RTX 4060 8GB', battery: '90 Wh', os: 'Windows 11 Home', weight: '2.5 kg' }),
    tags: ['asus', 'rog', 'gaming laptop', 'rtx'],
    soldCount: 70,
  },
  {
    title: 'Lenovo IdeaPad Slim 3 (Core i3 12th Gen)',
    brand: 'Lenovo',
    category: 'Laptops',
    bg: '475569',
    description: 'Affordable, reliable and light. Great for students and home use.',
    highlights: ['Intel Core i3-1215U', '15.6-inch FHD', 'Dolby Audio', 'Privacy shutter webcam'],
    variants: [
      { sku: 'LEN-IPS3-I3-8-512', color: 'Arctic Grey', colorHex: '#9ca3af', ram: '8 GB', storage: '512 GB', price: 36990, mrp: 55890, stock: 30 },
    ],
    specifications: laptopSpecs({ screen: '15.6 inch', display: 'FHD TN, 250 nits', processor: 'Intel Core i3-1215U', gpu: 'Intel UHD', battery: '38 Wh', os: 'Windows 11 Home', weight: '1.63 kg' }),
    tags: ['lenovo', 'ideapad', 'budget laptop'],
    soldCount: 390,
  },
  // ---------------- Tablets ----------------
  {
    title: 'Apple iPad (10th Generation) Wi-Fi',
    brand: 'Apple',
    category: 'Tablets',
    bg: '2563eb',
    description: 'Colourfully reimagined iPad with a 10.9-inch Liquid Retina display and A14 Bionic chip.',
    highlights: ['10.9-inch Liquid Retina', 'A14 Bionic', 'Landscape front camera', 'USB-C'],
    variants: [
      { sku: 'IPAD10-BLU-64', color: 'Blue', colorHex: '#3b82f6', storage: '64 GB', ram: '4 GB', price: 34900, mrp: 39900, stock: 14 },
      { sku: 'IPAD10-SLV-256', color: 'Silver', colorHex: '#e5e7eb', storage: '256 GB', ram: '4 GB', price: 49900, mrp: 54900, stock: 6 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '10.9 inch' },
      { group: 'Performance', key: 'Processor', value: 'A14 Bionic' },
      { group: 'Battery', key: 'Battery Capacity', value: '7606 mAh' },
      { group: 'General', key: 'Weight', value: '477 g' },
    ],
    tags: ['ipad', 'tablet', 'apple'],
    soldCount: 160,
  },
  {
    title: 'Samsung Galaxy Tab S9 FE',
    brand: 'Samsung',
    category: 'Tablets',
    bg: '16a34a',
    description: 'IP68 water resistant tablet with S Pen in the box and a vivid 90Hz display.',
    highlights: ['S Pen included', 'IP68 rated', '10.9-inch 90Hz display', '8000 mAh battery'],
    variants: [
      { sku: 'TABS9FE-GRY-128', color: 'Gray', colorHex: '#6b7280', storage: '128 GB', ram: '6 GB', price: 31999, mrp: 44999, stock: 11 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '10.9 inch' },
      { group: 'Performance', key: 'Processor', value: 'Exynos 1380' },
      { group: 'Battery', key: 'Battery Capacity', value: '8000 mAh' },
      { group: 'General', key: 'Weight', value: '523 g' },
    ],
    tags: ['samsung', 'tablet', 's pen'],
    soldCount: 85,
  },
  // ---------------- Audio ----------------
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    brand: 'Sony',
    category: 'Headphones & Earbuds',
    bg: '0f172a',
    isFeatured: true,
    description: 'Industry-leading noise cancellation with Auto NC Optimizer, 30 hours battery and crystal clear calls.',
    highlights: ['Industry leading ANC', '30 hours battery', 'Multipoint connection', 'Speak-to-chat'],
    variants: [
      { sku: 'WH1000XM5-BLK', color: 'Black', colorHex: '#111827', price: 26990, mrp: 34990, stock: 20 },
      { sku: 'WH1000XM5-SLV', color: 'Silver', colorHex: '#d1d5db', price: 26990, mrp: 34990, stock: 2 },
    ],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '30 mm' },
      { group: 'Audio', key: 'Noise Cancellation', value: 'Active (ANC)' },
      { group: 'Battery', key: 'Battery Life', value: '30 hours' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.2' },
    ],
    tags: ['sony', 'headphones', 'anc', 'noise cancelling'],
    soldCount: 510,
  },
  {
    title: 'Apple AirPods Pro (2nd Gen) with MagSafe USB-C',
    brand: 'Apple',
    category: 'Headphones & Earbuds',
    bg: '6b7280',
    description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio and personalised Spatial Audio.',
    highlights: ['H2 chip', 'Adaptive Audio', 'USB-C MagSafe case', 'IP54 dust and water resistance'],
    variants: [{ sku: 'APP2-USBC', color: 'White', colorHex: '#f9fafb', price: 22900, mrp: 24900, stock: 35 }],
    specifications: [
      { group: 'Audio', key: 'Noise Cancellation', value: 'Active (ANC)' },
      { group: 'Battery', key: 'Battery Life', value: '6 hours (30 with case)' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.3' },
    ],
    tags: ['airpods', 'earbuds', 'apple', 'tws'],
    soldCount: 640,
  },
  {
    title: 'boAt Airdopes 141 TWS Earbuds',
    brand: 'boAt',
    category: 'Headphones & Earbuds',
    bg: 'dc2626',
    description: '42 hours total playback, ENx noise cancellation for calls and BEAST mode for low latency gaming.',
    highlights: ['42H total playback', 'BEAST mode 80ms latency', 'ENx tech for clear calls', 'IPX4'],
    variants: [
      { sku: 'AD141-BLK', color: 'Bold Black', colorHex: '#111827', price: 1099, mrp: 4490, stock: 150 },
      { sku: 'AD141-BLU', color: 'Cider Cyan', colorHex: '#22d3ee', price: 1199, mrp: 4490, stock: 90 },
    ],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '8 mm' },
      { group: 'Battery', key: 'Battery Life', value: '42 hours' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.1' },
    ],
    tags: ['boat', 'earbuds', 'budget', 'tws'],
    soldCount: 2200,
  },
  // ---------------- Smartwatches ----------------
  {
    title: 'Apple Watch Series 9 GPS 45mm',
    brand: 'Apple',
    category: 'Smartwatches',
    bg: 'be123c',
    description: 'Smarter, brighter and mightier with the S9 chip, double tap gesture and a 2000 nit display.',
    highlights: ['S9 SiP', 'Double tap gesture', 'Blood oxygen and ECG', 'Crash detection'],
    variants: [
      { sku: 'AW9-45-MID', color: 'Midnight', colorHex: '#1e293b', price: 44900, mrp: 44900, stock: 9 },
      { sku: 'AW9-45-RED', color: 'Product RED', colorHex: '#dc2626', price: 44900, mrp: 44900, stock: 5 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '1.9 inch' },
      { group: 'Battery', key: 'Battery Life', value: '18 hours' },
      { group: 'Features', key: 'Health Sensors', value: 'ECG, SpO2, Heart rate, Temperature' },
    ],
    tags: ['apple watch', 'smartwatch'],
    soldCount: 75,
  },
  {
    title: 'Noise ColorFit Pro 5 Smartwatch',
    brand: 'Noise',
    category: 'Smartwatches',
    bg: '7c3aed',
    description: '1.85-inch AMOLED display, Bluetooth calling, 100+ sports modes and 7 day battery.',
    highlights: ['1.85-inch AMOLED', 'Bluetooth calling', '100+ sports modes', '7 day battery'],
    variants: [{ sku: 'NCFP5-BLK', color: 'Jet Black', colorHex: '#111827', price: 3999, mrp: 7999, stock: 70 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '1.85 inch' },
      { group: 'Battery', key: 'Battery Life', value: '7 days' },
    ],
    tags: ['noise', 'smartwatch', 'budget'],
    soldCount: 980,
  },
  // ---------------- Cameras ----------------
  {
    title: 'Canon EOS R50 Mirrorless Camera with 18-45mm Lens',
    brand: 'Canon',
    category: 'Cameras',
    bg: '991b1b',
    description: 'Compact mirrorless camera with 24.2MP APS-C sensor, 4K video and subject detection autofocus.',
    highlights: ['24.2MP APS-C CMOS', '4K 30p uncropped video', 'Dual Pixel CMOS AF II', 'Vari-angle touchscreen'],
    variants: [{ sku: 'EOSR50-KIT', color: 'Black', colorHex: '#111827', price: 68990, mrp: 75995, stock: 6 }],
    specifications: [
      { group: 'Sensor', key: 'Resolution', value: '24.2 MP' },
      { group: 'Video', key: 'Max Video', value: '4K 30fps' },
      { group: 'Display', key: 'Screen Size', value: '3 inch' },
    ],
    tags: ['canon', 'camera', 'mirrorless', 'vlogging'],
    soldCount: 40,
  },
  // ---------------- TVs ----------------
  {
    title: 'Samsung 55" Crystal 4K UHD Smart LED TV',
    brand: 'Samsung',
    category: 'TVs',
    bg: '1e3a8a',
    isFeatured: true,
    description: 'Crystal Processor 4K, PurColor, HDR10+ and Tizen OS with all your favourite apps.',
    highlights: ['Crystal Processor 4K', 'HDR10+', 'Tizen smart OS', '3 HDMI ports'],
    variants: [{ sku: 'SAM-CU8-55', color: 'Black', colorHex: '#111827', price: 44990, mrp: 70900, stock: 8 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '55 inch' },
      { group: 'Display', key: 'Resolution', value: '3840 x 2160 (4K)' },
      { group: 'Audio', key: 'Sound Output', value: '20 W' },
      { group: 'Connectivity', key: 'Ports', value: '3 HDMI, 1 USB' },
    ],
    tags: ['samsung', 'tv', '4k', 'smart tv'],
    soldCount: 150,
  },
  {
    title: 'LG 65" OLED evo C3 4K Smart TV',
    brand: 'LG',
    category: 'TVs',
    bg: '7e22ce',
    description: 'Self-lit OLED pixels, a9 AI Processor Gen6, Dolby Vision IQ and 120Hz for next-gen gaming.',
    highlights: ['OLED evo panel', 'a9 AI Processor Gen6', 'Dolby Vision + Atmos', '4x HDMI 2.1, 120Hz'],
    variants: [{ sku: 'LG-OLED65C3', color: 'Black', price: 219990, mrp: 309990, stock: 3 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '65 inch' },
      { group: 'Display', key: 'Panel', value: 'OLED evo' },
      { group: 'Audio', key: 'Sound Output', value: '40 W' },
    ],
    tags: ['lg', 'oled', 'tv', 'gaming tv'],
    soldCount: 22,
  },
  // ---------------- Speakers ----------------
  {
    title: 'JBL Flip 6 Portable Bluetooth Speaker',
    brand: 'JBL',
    category: 'Speakers',
    bg: 'f97316',
    description: 'Bold JBL Original Pro Sound, IP67 waterproof and dustproof with 12 hours of playtime.',
    highlights: ['JBL Original Pro Sound', 'IP67 waterproof', '12 hours playtime', 'PartyBoost'],
    variants: [
      { sku: 'JBLFLIP6-BLK', color: 'Black', colorHex: '#111827', price: 9999, mrp: 14999, stock: 45 },
      { sku: 'JBLFLIP6-BLU', color: 'Blue', colorHex: '#2563eb', price: 9999, mrp: 14999, stock: 30 },
    ],
    specifications: [
      { group: 'Audio', key: 'Output Power', value: '30 W' },
      { group: 'Battery', key: 'Battery Life', value: '12 hours' },
    ],
    tags: ['jbl', 'speaker', 'bluetooth'],
    soldCount: 330,
  },
  {
    title: 'Amazon Echo Dot (5th Gen) Smart Speaker with Alexa',
    brand: 'Amazon',
    category: 'Smart Home',
    bg: '0e7490',
    description: 'Our best sounding Echo Dot yet with clearer vocals, deeper bass and Alexa at your command.',
    highlights: ['Improved audio', 'Control smart home by voice', 'Temperature sensor', 'Motion detection'],
    variants: [{ sku: 'ECHODOT5-BLU', color: 'Blue', colorHex: '#1e3a8a', price: 4499, mrp: 5499, stock: 80 }],
    specifications: [
      { group: 'Audio', key: 'Speaker', value: '1.73 inch front-firing' },
      { group: 'Connectivity', key: 'Wi-Fi', value: 'Dual band' },
    ],
    tags: ['alexa', 'echo', 'smart home', 'speaker'],
    soldCount: 870,
  },
  // ---------------- Gaming ----------------
  {
    title: 'Sony PlayStation 5 Slim Console',
    brand: 'Sony',
    category: 'Gaming',
    bg: '1e40af',
    isFeatured: true,
    description: 'Lightning-fast loading with an ultra-high speed SSD, haptic feedback and 3D Audio.',
    highlights: ['1 TB SSD', 'Ray tracing', 'Up to 120fps', 'DualSense controller'],
    variants: [
      { sku: 'PS5-SLIM-DISC', color: 'White', storage: '1 TB', price: 54990, mrp: 54990, stock: 10 },
      { sku: 'PS5-SLIM-DIGI', color: 'White', storage: '1 TB Digital', price: 44990, mrp: 49990, stock: 0 },
    ],
    specifications: [
      { group: 'Performance', key: 'CPU', value: '8-core AMD Zen 2' },
      { group: 'Performance', key: 'GPU', value: '10.3 TFLOPS RDNA 2' },
      { group: 'Storage', key: 'SSD', value: '1 TB' },
    ],
    tags: ['ps5', 'playstation', 'console', 'gaming'],
    soldCount: 190,
  },
  {
    title: 'Xbox Wireless Controller - Carbon Black',
    brand: 'Microsoft',
    category: 'Gaming',
    bg: '15803d',
    description: 'Modernised design with textured grip, hybrid D-pad and Bluetooth for Windows, Android and iOS.',
    highlights: ['Hybrid D-pad', 'Textured grip', 'Bluetooth + USB-C', 'Works with PC and mobile'],
    variants: [{ sku: 'XBOXCTRL-BLK', color: 'Carbon Black', colorHex: '#111827', price: 4990, mrp: 5990, stock: 25 }],
    specifications: [{ group: 'Connectivity', key: 'Connection', value: 'Bluetooth, USB-C' }],
    tags: ['xbox', 'controller', 'gamepad'],
    soldCount: 260,
  },
  // ---------------- Computer Accessories ----------------
  {
    title: 'Logitech MX Master 3S Wireless Mouse',
    brand: 'Logitech',
    category: 'Computer Accessories',
    bg: '374151',
    description: '8K DPI tracking on any surface, quiet clicks and MagSpeed electromagnetic scrolling.',
    highlights: ['8000 DPI sensor', 'Quiet clicks', 'MagSpeed scroll wheel', 'USB-C, 70 days battery'],
    variants: [{ sku: 'MXM3S-GRPH', color: 'Graphite', colorHex: '#374151', price: 8995, mrp: 10995, stock: 40 }],
    specifications: [
      { group: 'General', key: 'DPI', value: '200 - 8000' },
      { group: 'Battery', key: 'Battery Life', value: '70 days' },
    ],
    tags: ['logitech', 'mouse', 'wireless'],
    soldCount: 300,
  },
  {
    title: 'Dell 27" 4K UHD IPS Monitor (S2722QC)',
    brand: 'Dell',
    category: 'Computer Accessories',
    bg: '0c4a6e',
    description: '27-inch 4K monitor with USB-C 65W power delivery and built-in speakers.',
    highlights: ['27-inch 4K IPS', 'USB-C 65W charging', 'AMD FreeSync', 'Built-in 3W speakers'],
    variants: [{ sku: 'DELL-S2722QC', color: 'Platinum Silver', price: 27999, mrp: 39999, stock: 9 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '27 inch' },
      { group: 'Display', key: 'Resolution', value: '3840 x 2160' },
      { group: 'Connectivity', key: 'Ports', value: 'USB-C, 2x HDMI' },
    ],
    tags: ['dell', 'monitor', '4k'],
    soldCount: 65,
  },
  // ---------------- Chargers & Power Banks ----------------
  {
    title: 'Anker 737 Power Bank 24000mAh 140W',
    brand: 'Anker',
    category: 'Chargers & Power Banks',
    bg: '1d4ed8',
    description: 'Charge a laptop at 140W with a smart digital display showing output and remaining time.',
    highlights: ['24000 mAh capacity', '140W two-way fast charging', 'Smart digital display', 'Charges 3 devices'],
    variants: [{ sku: 'ANK737-24K', color: 'Black', colorHex: '#111827', price: 10999, mrp: 15999, stock: 4 }],
    specifications: [
      { group: 'Battery', key: 'Battery Capacity', value: '24000 mAh' },
      { group: 'General', key: 'Output', value: '140 W' },
    ],
    tags: ['anker', 'power bank', 'fast charging'],
    soldCount: 120,
  },
  {
    title: 'Samsung 25W USB-C Super Fast Charger',
    brand: 'Samsung',
    category: 'Chargers & Power Banks',
    bg: '111827',
    description: 'Original Samsung 25W PD adapter with USB-C to C cable included.',
    highlights: ['25W Super Fast Charging', 'USB-C PD 3.0', 'Cable included', 'Compact design'],
    variants: [{ sku: 'SAM-25W-TA', color: 'Black', colorHex: '#111827', price: 1299, mrp: 2299, stock: 200 }],
    specifications: [{ group: 'General', key: 'Output', value: '25 W' }],
    tags: ['charger', 'samsung', 'usb-c'],
    soldCount: 1500,
  },
];

const moreProducts = [
  // ---------------- Mobiles ----------------
  {
    title: 'Apple iPhone 16 Pro (256 GB)',
    brand: 'Apple',
    category: 'Mobiles',
    bg: '44403c',
    isFeatured: true,
    description: 'Titanium design, Camera Control, A18 Pro chip and a 48MP Fusion camera with 5x telephoto.',
    highlights: ['A18 Pro chip', 'Camera Control button', '48MP Fusion + 5x Telephoto', '6.3-inch ProMotion display'],
    variants: [
      { sku: 'IP16P-DES-256', color: 'Desert Titanium', colorHex: '#c8a27a', storage: '256 GB', ram: '8 GB', price: 129900, mrp: 129900, stock: 14 },
      { sku: 'IP16P-NAT-512', color: 'Natural Titanium', colorHex: '#a8a29e', storage: '512 GB', ram: '8 GB', price: 149900, mrp: 149900, stock: 6 },
      { sku: 'IP16P-BLK-1TB', color: 'Black Titanium', colorHex: '#292524', storage: '1 TB', ram: '8 GB', price: 169900, mrp: 169900, stock: 3 },
    ],
    specifications: phoneSpecs({ screen: '6.3 inch', display: 'Super Retina XDR ProMotion 120Hz', processor: 'A18 Pro', rearCam: '48MP + 48MP + 12MP', frontCam: '12MP', battery: '3582 mAh', charging: '30W', os: 'iOS 18', weight: '199 g' }),
    warranty: { months: 12, type: 'Apple India warranty', extendedAvailable: true, extendedPrice: 9900 },
    tags: ['iphone', 'apple', 'pro', '5g'],
    soldCount: 180,
  },
  {
    title: 'Samsung Galaxy A55 5G',
    brand: 'Samsung',
    category: 'Mobiles',
    bg: '0e7490',
    description: 'Metal frame, IP67 rating, 50MP OIS camera and 4 generations of Android upgrades.',
    highlights: ['Super AMOLED 120Hz', '50MP OIS camera', 'IP67 water resistance', 'Samsung Knox Vault'],
    variants: [
      { sku: 'A55-NAVY-128', color: 'Awesome Navy', colorHex: '#1e3a8a', storage: '128 GB', ram: '8 GB', price: 36999, mrp: 42999, stock: 30 },
      { sku: 'A55-ICE-256', color: 'Awesome Iceblue', colorHex: '#bae6fd', storage: '256 GB', ram: '12 GB', price: 42999, mrp: 48999, stock: 18 },
    ],
    specifications: phoneSpecs({ screen: '6.6 inch', display: 'Super AMOLED, 120Hz', processor: 'Exynos 1480', rearCam: '50MP + 12MP + 5MP', frontCam: '32MP', battery: '5000 mAh', charging: '25W', os: 'Android 14, One UI 6.1', weight: '213 g' }),
    tags: ['samsung', 'galaxy', 'mid range', '5g'],
    soldCount: 520,
  },
  {
    title: 'realme 12 Pro+ 5G',
    brand: 'Realme',
    category: 'Mobiles',
    bg: 'a16207',
    description: 'Periscope portrait camera with 3x optical zoom, luxury watch design and 67W SUPERVOOC.',
    highlights: ['64MP periscope telephoto', 'Sony IMX890 OIS main camera', '120Hz curved AMOLED', '67W SUPERVOOC'],
    variants: [
      { sku: 'RM12PP-BLU-256', color: 'Submarine Blue', colorHex: '#1e40af', storage: '256 GB', ram: '8 GB', price: 29999, mrp: 36999, stock: 35 },
      { sku: 'RM12PP-RED-512', color: 'Explorer Red', colorHex: '#b91c1c', storage: '512 GB', ram: '12 GB', price: 33999, mrp: 39999, stock: 12 },
    ],
    specifications: phoneSpecs({ screen: '6.7 inch', display: 'Curved AMOLED, 120Hz', processor: 'Snapdragon 7s Gen 2', rearCam: '50MP + 64MP + 8MP', frontCam: '32MP', battery: '5000 mAh', charging: '67W', os: 'Android 14, realme UI 5', weight: '196 g' }),
    tags: ['realme', 'periscope', 'camera phone', '5g'],
    soldCount: 610,
  },
  {
    title: 'vivo V30 Pro 5G',
    brand: 'Vivo',
    category: 'Mobiles',
    bg: '6d28d9',
    description: 'ZEISS co-engineered portrait cameras, Aura Light and a slim 3D curved display.',
    highlights: ['ZEISS portrait system', '50MP Eye AF selfie', 'Aura Light portrait', '80W FlashCharge'],
    variants: [{ sku: 'V30P-BLK-256', color: 'Andaman Blue', colorHex: '#0369a1', storage: '256 GB', ram: '8 GB', price: 41999, mrp: 46999, stock: 16 }],
    specifications: phoneSpecs({ screen: '6.78 inch', display: '3D Curved AMOLED, 120Hz', processor: 'MediaTek Dimensity 8200', rearCam: '50MP + 50MP + 50MP', frontCam: '50MP', battery: '5000 mAh', charging: '80W', os: 'Android 14, Funtouch OS 14', weight: '188 g' }),
    tags: ['vivo', 'zeiss', 'selfie', '5g'],
    soldCount: 240,
  },
  {
    title: 'Motorola Edge 50 Fusion 5G',
    brand: 'Motorola',
    category: 'Mobiles',
    bg: '9f1239',
    description: 'Vegan leather finish, IP68 protection, pOLED 144Hz curved display and near stock Android.',
    highlights: ['144Hz curved pOLED', 'IP68 underwater protection', '50MP Sony LYTIA 700C', '68W TurboPower'],
    variants: [
      { sku: 'ME50F-PNK-128', color: 'Hot Pink', colorHex: '#db2777', storage: '128 GB', ram: '8 GB', price: 22999, mrp: 25999, stock: 28 },
      { sku: 'ME50F-BLU-256', color: 'Marshmallow Blue', colorHex: '#93c5fd', storage: '256 GB', ram: '12 GB', price: 24999, mrp: 27999, stock: 2 },
    ],
    specifications: phoneSpecs({ screen: '6.7 inch', display: 'pOLED, 144Hz', processor: 'Snapdragon 7s Gen 2', rearCam: '50MP + 13MP', frontCam: '32MP', battery: '5000 mAh', charging: '68W', os: 'Android 14', weight: '175 g' }),
    tags: ['motorola', 'moto', 'clean android', '5g'],
    soldCount: 330,
  },
  // ---------------- Laptops ----------------
  {
    title: 'Acer Aspire 7 Gaming Laptop (Ryzen 5, GTX 1650)',
    brand: 'Acer',
    category: 'Laptops',
    bg: '14532d',
    description: 'Entry gaming and creator laptop with AMD Ryzen 5 5500U and NVIDIA GTX 1650 graphics.',
    highlights: ['AMD Ryzen 5 5500U', 'NVIDIA GTX 1650 4GB', '15.6-inch FHD 144Hz', 'Upgradable to 32GB RAM'],
    variants: [{ sku: 'ACR-A7-R5-16-512', color: 'Charcoal Black', colorHex: '#1f2937', ram: '16 GB', storage: '512 GB', price: 52990, mrp: 74999, stock: 11 }],
    specifications: laptopSpecs({ screen: '15.6 inch', display: 'FHD IPS 144Hz', processor: 'AMD Ryzen 5 5500U', gpu: 'NVIDIA GTX 1650 4GB', battery: '48 Wh', os: 'Windows 11 Home', weight: '2.15 kg' }),
    tags: ['acer', 'aspire', 'gaming laptop', 'budget gaming'],
    soldCount: 210,
  },
  {
    title: 'MSI Katana 15 Gaming Laptop (i7, RTX 4050)',
    brand: 'MSI',
    category: 'Laptops',
    bg: '450a0a',
    description: 'Sharp as a blade: Intel Core i7 13th Gen with RTX 4050 and a 144Hz display for serious gaming.',
    highlights: ['Intel Core i7-13620H', 'NVIDIA RTX 4050 6GB', '15.6-inch FHD 144Hz', 'Cooler Boost 5'],
    variants: [{ sku: 'MSI-KAT15-I7-16-1TB', color: 'Black', colorHex: '#111827', ram: '16 GB', storage: '1 TB', price: 89990, mrp: 124990, stock: 4 }],
    specifications: laptopSpecs({ screen: '15.6 inch', display: 'FHD IPS 144Hz', processor: 'Intel Core i7-13620H', gpu: 'NVIDIA RTX 4050 6GB', battery: '53.5 Wh', os: 'Windows 11 Home', weight: '2.25 kg' }),
    tags: ['msi', 'katana', 'gaming laptop', 'rtx'],
    soldCount: 95,
  },
  {
    title: 'HP Victus 15 Gaming Laptop (Ryzen 7, RTX 3050)',
    brand: 'HP',
    category: 'Laptops',
    bg: '1e3a8a',
    description: 'Balanced gaming performance with Ryzen 7 7840HS, RTX 3050 and an anti-glare 144Hz panel.',
    highlights: ['AMD Ryzen 7 7840HS', 'NVIDIA RTX 3050 6GB', '144Hz FHD display', 'OMEN Gaming Hub'],
    variants: [{ sku: 'HP-VIC15-R7-16-512', color: 'Performance Blue', colorHex: '#1d4ed8', ram: '16 GB', storage: '512 GB', price: 67990, mrp: 86999, stock: 9 }],
    specifications: laptopSpecs({ screen: '15.6 inch', display: 'FHD IPS 144Hz', processor: 'AMD Ryzen 7 7840HS', gpu: 'NVIDIA RTX 3050 6GB', battery: '70 Wh', os: 'Windows 11 Home', weight: '2.29 kg' }),
    tags: ['hp', 'victus', 'gaming laptop'],
    soldCount: 150,
  },
  {
    title: 'Lenovo Yoga Slim 7 (Intel Core Ultra 7)',
    brand: 'Lenovo',
    category: 'Laptops',
    bg: '312e81',
    description: 'Premium AI PC with Intel Core Ultra 7, a 2.8K OLED display and all-day battery in a 1.39 kg body.',
    highlights: ['Intel Core Ultra 7 155H', '14-inch 2.8K OLED 120Hz', '32GB LPDDR5x RAM', 'Up to 16 hours battery'],
    variants: [{ sku: 'LEN-YS7-U7-32-1TB', color: 'Luna Grey', colorHex: '#6b7280', ram: '32 GB', storage: '1 TB', price: 104990, mrp: 138890, stock: 5 }],
    specifications: laptopSpecs({ screen: '14 inch', display: '2.8K OLED 120Hz', processor: 'Intel Core Ultra 7 155H', gpu: 'Intel Arc', battery: '65 Wh', os: 'Windows 11 Home', weight: '1.39 kg' }),
    tags: ['lenovo', 'yoga', 'oled', 'ultrabook', 'ai pc'],
    soldCount: 60,
  },
  // ---------------- Tablets ----------------
  {
    title: 'Xiaomi Pad 6 (Snapdragon 870)',
    brand: 'Xiaomi',
    category: 'Tablets',
    bg: '0f766e',
    description: 'Flagship-grade tablet with a 144Hz 2.8K display, quad speakers with Dolby Atmos and 8840 mAh battery.',
    highlights: ['11-inch 2.8K 144Hz', 'Snapdragon 870', 'Quad speakers, Dolby Atmos', '33W fast charging'],
    variants: [
      { sku: 'XPAD6-GRY-128', color: 'Graphite Grey', colorHex: '#4b5563', storage: '128 GB', ram: '6 GB', price: 23999, mrp: 29999, stock: 20 },
      { sku: 'XPAD6-BLU-256', color: 'Mist Blue', colorHex: '#93c5fd', storage: '256 GB', ram: '8 GB', price: 26999, mrp: 33999, stock: 8 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '11 inch' },
      { group: 'Performance', key: 'Processor', value: 'Snapdragon 870' },
      { group: 'Battery', key: 'Battery Capacity', value: '8840 mAh' },
      { group: 'General', key: 'Weight', value: '490 g' },
    ],
    tags: ['xiaomi', 'pad', 'tablet'],
    soldCount: 270,
  },
  {
    title: 'Apple iPad Air 11-inch (M2) Wi-Fi',
    brand: 'Apple',
    category: 'Tablets',
    bg: '7c3aed',
    description: 'Serious performance in a thin and light design with the M2 chip and Apple Pencil Pro support.',
    highlights: ['Apple M2 chip', '11-inch Liquid Retina', 'Apple Pencil Pro support', 'Landscape 12MP front camera'],
    variants: [
      { sku: 'IPADAIR-M2-PUR-128', color: 'Purple', colorHex: '#c4b5fd', storage: '128 GB', ram: '8 GB', price: 59900, mrp: 59900, stock: 10 },
      { sku: 'IPADAIR-M2-STAR-256', color: 'Starlight', colorHex: '#f5f5dc', storage: '256 GB', ram: '8 GB', price: 69900, mrp: 69900, stock: 5 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '11 inch' },
      { group: 'Performance', key: 'Processor', value: 'Apple M2' },
      { group: 'Battery', key: 'Battery Capacity', value: '7606 mAh' },
      { group: 'General', key: 'Weight', value: '462 g' },
    ],
    warranty: { months: 12, type: 'Apple India warranty', extendedAvailable: true, extendedPrice: 6900 },
    tags: ['ipad air', 'apple', 'tablet', 'm2'],
    soldCount: 90,
  },
  // ---------------- Audio ----------------
  {
    title: 'Bose QuietComfort Ultra Wireless Headphones',
    brand: 'Bose',
    category: 'Headphones & Earbuds',
    bg: '1c1917',
    description: 'World-class noise cancellation with Bose Immersive Audio for spatial sound anywhere.',
    highlights: ['World-class ANC', 'Immersive spatial audio', '24 hours battery', 'CustomTune calibration'],
    variants: [
      { sku: 'BOSE-QCU-BLK', color: 'Black', colorHex: '#111827', price: 35900, mrp: 39900, stock: 8 },
      { sku: 'BOSE-QCU-SMK', color: 'White Smoke', colorHex: '#e7e5e4', price: 35900, mrp: 39900, stock: 5 },
    ],
    specifications: [
      { group: 'Audio', key: 'Noise Cancellation', value: 'Active (ANC)' },
      { group: 'Battery', key: 'Battery Life', value: '24 hours' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.3' },
    ],
    tags: ['bose', 'headphones', 'anc', 'premium'],
    soldCount: 70,
  },
  {
    title: 'Sennheiser Momentum True Wireless 4',
    brand: 'Sennheiser',
    category: 'Headphones & Earbuds',
    bg: '27272a',
    description: 'Audiophile-grade TWS with Snapdragon Sound, adaptive ANC and 30 hours total battery.',
    highlights: ['7mm TrueResponse drivers', 'Snapdragon Sound, aptX Lossless', 'Adaptive ANC', '30 hours with case'],
    variants: [{ sku: 'SEN-MTW4-BLK', color: 'Black Graphite', colorHex: '#27272a', price: 24990, mrp: 34990, stock: 12 }],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '7 mm' },
      { group: 'Audio', key: 'Noise Cancellation', value: 'Adaptive ANC' },
      { group: 'Battery', key: 'Battery Life', value: '30 hours' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.4' },
    ],
    tags: ['sennheiser', 'earbuds', 'tws', 'audiophile'],
    soldCount: 55,
  },
  {
    title: 'OnePlus Buds 3 TWS Earbuds',
    brand: 'OnePlus',
    category: 'Headphones & Earbuds',
    bg: '334155',
    description: 'Dual drivers, 49dB smart ANC and up to 44 hours of battery with 10-minute fast charge.',
    highlights: ['Dual dynamic drivers', '49dB adaptive ANC', '44 hours playback', 'Dual connection'],
    variants: [
      { sku: 'OPB3-GRY', color: 'Metallic Gray', colorHex: '#6b7280', price: 4999, mrp: 5499, stock: 60 },
      { sku: 'OPB3-BLU', color: 'Splendid Blue', colorHex: '#2563eb', price: 4999, mrp: 5499, stock: 45 },
    ],
    specifications: [
      { group: 'Audio', key: 'Noise Cancellation', value: 'Active (ANC), 49dB' },
      { group: 'Battery', key: 'Battery Life', value: '44 hours' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.3' },
    ],
    tags: ['oneplus', 'earbuds', 'tws', 'anc'],
    soldCount: 890,
  },
  {
    title: 'boAt Rockerz 450 Bluetooth Headphones',
    brand: 'boAt',
    category: 'Headphones & Earbuds',
    bg: 'be123c',
    description: 'On-ear wireless headphones with 40mm drivers, 15 hours playback and padded ear cushions.',
    highlights: ['40mm dynamic drivers', '15 hours playback', 'Dual mode: BT + AUX', 'Lightweight foldable design'],
    variants: [
      { sku: 'RKZ450-BLK', color: 'Luscious Black', colorHex: '#111827', price: 1499, mrp: 3990, stock: 120 },
      { sku: 'RKZ450-RED', color: 'Hazel Beige', colorHex: '#d6c7a1', price: 1499, mrp: 3990, stock: 80 },
    ],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '40 mm' },
      { group: 'Battery', key: 'Battery Life', value: '15 hours' },
    ],
    tags: ['boat', 'headphones', 'budget'],
    soldCount: 3100,
  },
  // ---------------- Smartwatches ----------------
  {
    title: 'Samsung Galaxy Watch 7 (44mm, Bluetooth)',
    brand: 'Samsung',
    category: 'Smartwatches',
    bg: '0f172a',
    description: 'Galaxy AI health insights, dual-frequency GPS and advanced sleep coaching on your wrist.',
    highlights: ['BioActive sensor', 'Dual frequency GPS', 'Energy Score with Galaxy AI', 'Sapphire crystal glass'],
    variants: [
      { sku: 'GW7-44-GRN', color: 'Green', colorHex: '#3f6212', price: 32999, mrp: 36999, stock: 10 },
      { sku: 'GW7-44-SLV', color: 'Silver', colorHex: '#d1d5db', price: 32999, mrp: 36999, stock: 7 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '1.5 inch' },
      { group: 'Battery', key: 'Battery Life', value: '40 hours' },
      { group: 'Features', key: 'Health Sensors', value: 'ECG, BIA, Heart rate, SpO2' },
    ],
    tags: ['galaxy watch', 'samsung', 'smartwatch'],
    soldCount: 110,
  },
  {
    title: 'Fire-Boltt Phoenix Ultra Smartwatch',
    brand: 'Fire-Boltt',
    category: 'Smartwatches',
    bg: 'c2410c',
    description: 'Stainless steel luxury smartwatch with Bluetooth calling, AI voice assistant and 120+ sports modes.',
    highlights: ['1.39-inch HD display', 'Bluetooth calling', 'Metal body', '120+ sports modes'],
    variants: [
      { sku: 'FB-PHXU-BLK', color: 'Black', colorHex: '#111827', price: 1799, mrp: 9999, stock: 150 },
      { sku: 'FB-PHXU-GLD', color: 'Gold', colorHex: '#ca8a04', price: 1899, mrp: 9999, stock: 90 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '1.39 inch' },
      { group: 'Battery', key: 'Battery Life', value: '7 days' },
    ],
    tags: ['fire-boltt', 'smartwatch', 'budget'],
    soldCount: 2600,
  },
  {
    title: 'Garmin Forerunner 265 GPS Running Watch',
    brand: 'Garmin',
    category: 'Smartwatches',
    bg: '155e75',
    description: 'AMOLED running watch with training readiness, HRV status and up to 13 days of battery.',
    highlights: ['1.3-inch AMOLED', 'Training readiness & HRV', 'Multi-band GPS', 'Up to 13 days battery'],
    variants: [{ sku: 'GRM-FR265-BLK', color: 'Black', colorHex: '#111827', price: 44990, mrp: 49990, stock: 4 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '1.3 inch' },
      { group: 'Battery', key: 'Battery Life', value: '13 days' },
      { group: 'Features', key: 'GPS', value: 'Multi-band GNSS' },
    ],
    tags: ['garmin', 'running watch', 'gps'],
    soldCount: 35,
  },
  // ---------------- Cameras ----------------
  {
    title: 'GoPro HERO12 Black Action Camera',
    brand: 'GoPro',
    category: 'Cameras',
    bg: '0c0a09',
    isFeatured: true,
    description: '5.3K60 video, HyperSmooth 6.0 stabilisation, HDR and waterproof to 10 metres.',
    highlights: ['5.3K60 + 4K120 video', 'HyperSmooth 6.0', 'Waterproof to 10m', '27MP photos with HDR'],
    variants: [{ sku: 'GP-H12-BLK', color: 'Black', colorHex: '#111827', price: 37990, mrp: 45000, stock: 9 }],
    specifications: [
      { group: 'Sensor', key: 'Resolution', value: '27 MP' },
      { group: 'Video', key: 'Max Video', value: '5.3K 60fps' },
      { group: 'Display', key: 'Screen Size', value: '2.27 inch' },
    ],
    tags: ['gopro', 'action camera', 'vlogging'],
    soldCount: 120,
  },
  {
    title: 'Nikon Z50 Mirrorless Camera with 16-50mm Lens',
    brand: 'Nikon',
    category: 'Cameras',
    bg: '713f12',
    description: 'Compact DX-format mirrorless camera with 20.9MP sensor, 4K video and a flip-down selfie screen.',
    highlights: ['20.9MP DX CMOS', '4K UHD video', '11 fps continuous', 'Flip-down touchscreen'],
    variants: [{ sku: 'NKN-Z50-KIT', color: 'Black', colorHex: '#111827', price: 72990, mrp: 82995, stock: 4 }],
    specifications: [
      { group: 'Sensor', key: 'Resolution', value: '20.9 MP' },
      { group: 'Video', key: 'Max Video', value: '4K 30fps' },
      { group: 'Display', key: 'Screen Size', value: '3.2 inch' },
    ],
    tags: ['nikon', 'mirrorless', 'camera'],
    soldCount: 28,
  },
  // ---------------- TVs ----------------
  {
    title: 'Sony Bravia 55" 4K Ultra HD Google TV (X75L)',
    brand: 'Sony',
    category: 'TVs',
    bg: '172554',
    description: '4K Processor X1, Motionflow XR and Google TV with hands-free voice search.',
    highlights: ['4K Processor X1', 'Google TV + Chromecast', 'Dolby Audio', 'Motionflow XR 200'],
    variants: [{ sku: 'SONY-X75L-55', color: 'Black', colorHex: '#111827', price: 57990, mrp: 99900, stock: 6 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '55 inch' },
      { group: 'Display', key: 'Resolution', value: '3840 x 2160 (4K)' },
      { group: 'Audio', key: 'Sound Output', value: '20 W' },
    ],
    tags: ['sony', 'bravia', 'google tv', '4k'],
    soldCount: 90,
  },
  {
    title: 'TCL 43" Full HD Smart Android LED TV',
    brand: 'TCL',
    category: 'TVs',
    bg: 'b91c1c',
    description: 'Budget-friendly Android smart TV with HDR, Micro Dimming and Dolby Audio.',
    highlights: ['Full HD HDR', 'Android TV with Play Store', 'Dolby Audio', 'Bezel-less design'],
    variants: [{ sku: 'TCL-43S5400', color: 'Black', colorHex: '#111827', price: 17990, mrp: 36990, stock: 22 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '43 inch' },
      { group: 'Display', key: 'Resolution', value: '1920 x 1080 (FHD)' },
      { group: 'Audio', key: 'Sound Output', value: '24 W' },
    ],
    tags: ['tcl', 'android tv', 'budget tv'],
    soldCount: 420,
  },
  // ---------------- Speakers ----------------
  {
    title: 'Sony SRS-XB100 Portable Bluetooth Speaker',
    brand: 'Sony',
    category: 'Speakers',
    bg: '1d4ed8',
    description: 'Compact EXTRA BASS speaker with IP67 protection, strap and 16 hours of battery.',
    highlights: ['EXTRA BASS sound', 'IP67 waterproof & dustproof', '16 hours battery', 'Built-in mic for calls'],
    variants: [
      { sku: 'SRSXB100-BLK', color: 'Black', colorHex: '#111827', price: 3990, mrp: 5990, stock: 55 },
      { sku: 'SRSXB100-ORG', color: 'Orange', colorHex: '#f97316', price: 3990, mrp: 5990, stock: 30 },
    ],
    specifications: [
      { group: 'Audio', key: 'Output Power', value: '5 W' },
      { group: 'Battery', key: 'Battery Life', value: '16 hours' },
    ],
    tags: ['sony', 'speaker', 'bluetooth', 'portable'],
    soldCount: 540,
  },
  {
    title: 'Zebronics Juke Bar 9500 5.1 Soundbar with Subwoofer',
    brand: 'Zebronics',
    category: 'Speakers',
    bg: '18181b',
    description: '525W Dolby Atmos 5.1 soundbar with wireless subwoofer and satellite speakers for home theatre.',
    highlights: ['525W total output', 'Dolby Atmos 5.1', 'Wireless subwoofer', 'HDMI eARC'],
    variants: [{ sku: 'ZEB-JB9500', color: 'Black', colorHex: '#111827', price: 18999, mrp: 32999, stock: 7 }],
    specifications: [
      { group: 'Audio', key: 'Output Power', value: '525 W' },
      { group: 'Connectivity', key: 'Ports', value: 'HDMI eARC, Optical, USB, Bluetooth' },
    ],
    tags: ['zebronics', 'soundbar', 'home theatre', 'dolby atmos'],
    soldCount: 140,
  },
  // ---------------- Gaming ----------------
  {
    title: 'Nintendo Switch OLED Model',
    brand: 'Nintendo',
    category: 'Gaming',
    bg: 'dc2626',
    description: 'Vibrant 7-inch OLED screen, wide adjustable stand, 64GB storage and enhanced audio.',
    highlights: ['7-inch OLED screen', 'Play at home or on the go', '64 GB internal storage', 'Wired LAN port in dock'],
    variants: [
      { sku: 'NSW-OLED-NEON', color: 'Neon Red/Blue', colorHex: '#ef4444', storage: '64 GB', price: 32990, mrp: 34990, stock: 8 },
      { sku: 'NSW-OLED-WHT', color: 'White', colorHex: '#f9fafb', storage: '64 GB', price: 32990, mrp: 34990, stock: 6 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '7 inch' },
      { group: 'Storage', key: 'Internal', value: '64 GB' },
      { group: 'Battery', key: 'Battery Life', value: '4.5 - 9 hours' },
    ],
    tags: ['nintendo', 'switch', 'console', 'handheld'],
    soldCount: 130,
  },
  {
    title: 'Sony DualSense Wireless Controller for PS5',
    brand: 'Sony',
    category: 'Gaming',
    bg: '3730a3',
    description: 'Haptic feedback, adaptive triggers and a built-in microphone for immersive PS5 gaming.',
    highlights: ['Haptic feedback', 'Adaptive triggers', 'Built-in mic and headset jack', 'USB-C charging'],
    variants: [
      { sku: 'DS5-WHT', color: 'White', colorHex: '#f9fafb', price: 5390, mrp: 6390, stock: 40 },
      { sku: 'DS5-BLK', color: 'Midnight Black', colorHex: '#111827', price: 5590, mrp: 6590, stock: 25 },
    ],
    specifications: [{ group: 'Connectivity', key: 'Connection', value: 'Bluetooth, USB-C' }],
    tags: ['ps5', 'controller', 'dualsense', 'gamepad'],
    soldCount: 470,
  },
  {
    title: 'Logitech G502 X Plus Wireless Gaming Mouse',
    brand: 'Logitech',
    category: 'Gaming',
    bg: '1e1b4b',
    description: 'Iconic G502 shape with LIGHTFORCE hybrid switches, LIGHTSPEED wireless and RGB lighting.',
    highlights: ['HERO 25K sensor', 'LIGHTFORCE hybrid switches', 'LIGHTSPEED wireless', '13 programmable controls'],
    variants: [{ sku: 'G502XP-BLK', color: 'Black', colorHex: '#111827', price: 12995, mrp: 16995, stock: 15 }],
    specifications: [
      { group: 'General', key: 'DPI', value: '100 - 25600' },
      { group: 'Battery', key: 'Battery Life', value: '130 hours' },
    ],
    tags: ['logitech', 'gaming mouse', 'wireless'],
    soldCount: 160,
  },
  // ---------------- Computer Accessories ----------------
  {
    title: 'Logitech MX Keys S Wireless Keyboard',
    brand: 'Logitech',
    category: 'Computer Accessories',
    bg: '52525b',
    description: 'Low-profile, fluid typing with smart backlighting and multi-device Easy-Switch.',
    highlights: ['Spherically dished keys', 'Smart backlighting', 'Connect up to 3 devices', 'USB-C, 10 days battery'],
    variants: [{ sku: 'MXKEYS-S-GRPH', color: 'Graphite', colorHex: '#374151', price: 10995, mrp: 13995, stock: 20 }],
    specifications: [
      { group: 'Connectivity', key: 'Connection', value: 'Bluetooth, Logi Bolt' },
      { group: 'Battery', key: 'Battery Life', value: '10 days (backlight on)' },
    ],
    tags: ['logitech', 'keyboard', 'wireless'],
    soldCount: 140,
  },
  {
    title: 'LG UltraGear 27" QHD 180Hz Gaming Monitor',
    brand: 'LG',
    category: 'Computer Accessories',
    bg: '831843',
    description: '27-inch Nano IPS QHD panel with 180Hz refresh, 1ms response and NVIDIA G-SYNC compatibility.',
    highlights: ['27-inch QHD Nano IPS', '180Hz, 1ms GtG', 'HDR10, DCI-P3 98%', 'G-SYNC Compatible'],
    variants: [{ sku: 'LG-27GR83Q', color: 'Black', colorHex: '#111827', price: 26999, mrp: 44999, stock: 8 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '27 inch' },
      { group: 'Display', key: 'Resolution', value: '2560 x 1440' },
      { group: 'Display', key: 'Refresh Rate', value: '180 Hz' },
    ],
    tags: ['lg', 'ultragear', 'gaming monitor'],
    soldCount: 75,
  },
  {
    title: 'TP-Link Archer AX23 Wi-Fi 6 Router',
    brand: 'TP-Link',
    category: 'Computer Accessories',
    bg: '0891b2',
    description: 'Dual-band AX1800 Wi-Fi 6 router with 4 antennas and OneMesh support for whole-home coverage.',
    highlights: ['AX1800 dual band Wi-Fi 6', '4 high-gain antennas', 'OneMesh compatible', 'WPA3 security'],
    variants: [{ sku: 'TPL-AX23', color: 'Black', colorHex: '#111827', price: 3999, mrp: 7999, stock: 50 }],
    specifications: [
      { group: 'Connectivity', key: 'Wi-Fi', value: 'Wi-Fi 6, 1800 Mbps' },
      { group: 'Connectivity', key: 'Ports', value: '1 WAN + 4 LAN Gigabit' },
    ],
    tags: ['tp-link', 'router', 'wifi 6'],
    soldCount: 690,
  },
  // ---------------- Chargers & Power Banks ----------------
  {
    title: 'Ambrane 20000mAh 22.5W Fast Charging Power Bank',
    brand: 'Ambrane',
    category: 'Chargers & Power Banks',
    bg: '166534',
    description: 'Compact 20000 mAh power bank with 22.5W fast charging, Type-C PD and triple output.',
    highlights: ['20000 mAh capacity', '22.5W fast charging', 'Type-C PD in/out', 'Charge 3 devices'],
    variants: [
      { sku: 'AMB-20K-BLK', color: 'Black', colorHex: '#111827', price: 1399, mrp: 2999, stock: 180 },
      { sku: 'AMB-20K-BLU', color: 'Blue', colorHex: '#1d4ed8', price: 1399, mrp: 2999, stock: 90 },
    ],
    specifications: [
      { group: 'Battery', key: 'Battery Capacity', value: '20000 mAh' },
      { group: 'General', key: 'Output', value: '22.5 W' },
    ],
    tags: ['ambrane', 'power bank', 'fast charging'],
    soldCount: 2800,
  },
  {
    title: 'Apple 20W USB-C Power Adapter',
    brand: 'Apple',
    category: 'Chargers & Power Banks',
    bg: '6b7280',
    description: 'Fast, efficient charging at home, in the office or on the go for iPhone and iPad.',
    highlights: ['20W USB-C PD', 'Fast charge iPhone to 50% in 30 min', 'Compact design', 'Original Apple'],
    variants: [{ sku: 'APL-20W-USBC', color: 'White', colorHex: '#f9fafb', price: 1699, mrp: 1900, stock: 150 }],
    specifications: [{ group: 'General', key: 'Output', value: '20 W' }],
    tags: ['apple', 'charger', 'usb-c'],
    soldCount: 1900,
  },
  // ---------------- Smart Home ----------------
  {
    title: 'Philips Hue White & Colour Ambiance Smart Bulb (E27)',
    brand: 'Philips',
    category: 'Smart Home',
    bg: 'a21caf',
    description: '16 million colours, voice control with Alexa and Google Assistant, schedules and scenes.',
    highlights: ['16 million colours', 'Works with Alexa & Google', 'Bluetooth + Zigbee', 'Schedules & routines'],
    variants: [{ sku: 'HUE-E27-COL', color: 'White', colorHex: '#f9fafb', price: 3499, mrp: 4499, stock: 60 }],
    specifications: [
      { group: 'General', key: 'Wattage', value: '9 W' },
      { group: 'Connectivity', key: 'Protocol', value: 'Bluetooth, Zigbee' },
    ],
    tags: ['philips', 'hue', 'smart bulb', 'smart home'],
    soldCount: 320,
  },
  {
    title: 'TP-Link Tapo C210 360° Wi-Fi Security Camera',
    brand: 'TP-Link',
    category: 'Smart Home',
    bg: '0f766e',
    description: '3MP home security camera with pan/tilt, night vision up to 9m, motion detection and two-way audio.',
    highlights: ['3MP 2K resolution', '360° pan / 114° tilt', 'Night vision up to 9m', 'Two-way audio'],
    variants: [{ sku: 'TAPO-C210', color: 'White', colorHex: '#f9fafb', price: 2199, mrp: 4999, stock: 85 }],
    specifications: [
      { group: 'Video', key: 'Resolution', value: '3 MP (2304 x 1296)' },
      { group: 'Connectivity', key: 'Wi-Fi', value: '2.4 GHz' },
    ],
    tags: ['tp-link', 'tapo', 'security camera', 'cctv'],
    soldCount: 1700,
  },
  {
    title: 'Xiaomi Smart Air Purifier 4',
    brand: 'Xiaomi',
    category: 'Smart Home',
    bg: '4b5563',
    description: 'True HEPA filter with 400 m³/h CADR, OLED display and app + voice control.',
    highlights: ['True HEPA filter', 'CADR 400 m³/h', 'Real-time PM2.5 display', 'Works with Alexa & Google'],
    variants: [{ sku: 'XMI-AP4', color: 'White', colorHex: '#f9fafb', price: 11999, mrp: 16999, stock: 0 }],
    specifications: [
      { group: 'General', key: 'Coverage', value: 'Up to 48 m²' },
      { group: 'General', key: 'Noise', value: '32.1 dB (sleep mode)' },
    ],
    tags: ['xiaomi', 'air purifier', 'smart home'],
    soldCount: 260,
  },
];

const extraProducts = [
  // ---------------- Mobiles ----------------
  {
    title: 'Nothing Phone (2a) 5G',
    brand: 'Nothing',
    category: 'Mobiles',
    bg: '18181b',
    isFeatured: true,
    description: 'Iconic transparent design with the Glyph Interface, a 6.7-inch 120Hz AMOLED and clean Nothing OS.',
    highlights: ['Glyph Interface lights', 'Dimensity 7200 Pro', '50MP + 50MP dual camera', '45W fast charging'],
    variants: [
      { sku: 'NP2A-BLK-128', color: 'Black', colorHex: '#111827', storage: '128 GB', ram: '8 GB', price: 23999, mrp: 25999, stock: 40 },
      { sku: 'NP2A-WHT-256', color: 'White', colorHex: '#f9fafb', storage: '256 GB', ram: '12 GB', price: 27999, mrp: 29999, stock: 18 },
    ],
    specifications: phoneSpecs({ screen: '6.7 inch', display: 'Flexible AMOLED, 120Hz', processor: 'MediaTek Dimensity 7200 Pro', rearCam: '50MP + 50MP', frontCam: '32MP', battery: '5000 mAh', charging: '45W', os: 'Android 14, Nothing OS 2.5', weight: '190 g' }),
    tags: ['nothing', 'glyph', 'transparent', '5g'],
    soldCount: 560,
  },
  {
    title: 'OPPO Reno12 Pro 5G',
    brand: 'OPPO',
    category: 'Mobiles',
    bg: '0f766e',
    description: 'AI-powered portrait camera with 2x telephoto, a slim curved body and 80W SUPERVOOC charging.',
    highlights: ['50MP portrait telephoto', 'AI Eraser 2.0', '120Hz curved AMOLED', '80W SUPERVOOC'],
    variants: [{ sku: 'RENO12P-SLV-256', color: 'Space Brown', colorHex: '#78716c', storage: '256 GB', ram: '12 GB', price: 36999, mrp: 40999, stock: 22 }],
    specifications: phoneSpecs({ screen: '6.7 inch', display: '3D Curved AMOLED, 120Hz', processor: 'MediaTek Dimensity 7300-Energy', rearCam: '50MP + 50MP + 8MP', frontCam: '50MP', battery: '5000 mAh', charging: '80W', os: 'Android 14, ColorOS 14', weight: '180 g' }),
    tags: ['oppo', 'reno', 'portrait', '5g'],
    soldCount: 280,
  },
  {
    title: 'iQOO Neo 9 Pro 5G',
    brand: 'iQOO',
    category: 'Mobiles',
    bg: 'b45309',
    description: 'Performance flagship killer with Snapdragon 8 Gen 2, 144Hz display and a dedicated gaming chip.',
    highlights: ['Snapdragon 8 Gen 2', '144Hz 1.5K AMOLED', 'Supercomputing chip Q1', '120W FlashCharge'],
    variants: [
      { sku: 'IQNEO9P-RED-128', color: 'Fiery Red', colorHex: '#dc2626', storage: '128 GB', ram: '8 GB', price: 35999, mrp: 39999, stock: 26 },
      { sku: 'IQNEO9P-BLU-256', color: 'Conqueror Black', colorHex: '#111827', storage: '256 GB', ram: '12 GB', price: 39999, mrp: 43999, stock: 14 },
    ],
    specifications: phoneSpecs({ screen: '6.78 inch', display: 'LTPO AMOLED, 144Hz', processor: 'Snapdragon 8 Gen 2', rearCam: '50MP + 8MP', frontCam: '16MP', battery: '5160 mAh', charging: '120W', os: 'Android 14, Funtouch OS 14', weight: '196 g' }),
    tags: ['iqoo', 'gaming phone', 'performance', '5g'],
    soldCount: 470,
  },
  {
    title: 'Samsung Galaxy M35 5G',
    brand: 'Samsung',
    category: 'Mobiles',
    bg: '1e40af',
    description: 'A big 6000 mAh battery, 120Hz Super AMOLED and 50MP OIS camera for everyday reliability.',
    highlights: ['6000 mAh battery', '120Hz Super AMOLED', '50MP OIS camera', '4 years of OS upgrades'],
    variants: [
      { sku: 'M35-BLU-128', color: 'Moonlight Blue', colorHex: '#1e3a8a', storage: '128 GB', ram: '6 GB', price: 17999, mrp: 24499, stock: 65 },
      { sku: 'M35-GRY-256', color: 'Thunder Grey', colorHex: '#4b5563', storage: '256 GB', ram: '8 GB', price: 21499, mrp: 27999, stock: 30 },
    ],
    specifications: phoneSpecs({ screen: '6.6 inch', display: 'Super AMOLED, 120Hz', processor: 'Exynos 1380', rearCam: '50MP + 8MP + 2MP', frontCam: '13MP', battery: '6000 mAh', charging: '25W', os: 'Android 14, One UI 6.1', weight: '222 g' }),
    tags: ['samsung', 'galaxy m', 'big battery', 'budget', '5g'],
    soldCount: 890,
  },
  {
    title: 'Xiaomi 14 Civi 5G (Leica)',
    brand: 'Xiaomi',
    category: 'Mobiles',
    bg: '0e7490',
    description: 'Leica Summilux optics in a slim and light design with Snapdragon 8s Gen 3 and dual front cameras.',
    highlights: ['Leica Summilux lens', 'Snapdragon 8s Gen 3', '32MP dual selfie cameras', '67W HyperCharge'],
    variants: [{ sku: 'X14CIVI-BLU-256', color: 'Cruise Blue', colorHex: '#38bdf8', storage: '256 GB', ram: '12 GB', price: 42999, mrp: 47999, stock: 12 }],
    specifications: phoneSpecs({ screen: '6.55 inch', display: 'AMOLED, 120Hz', processor: 'Snapdragon 8s Gen 3', rearCam: '50MP + 50MP + 12MP', frontCam: '32MP + 32MP', battery: '4700 mAh', charging: '67W', os: 'Android 14, HyperOS', weight: '177 g' }),
    tags: ['xiaomi', 'leica', 'camera phone', '5g'],
    soldCount: 150,
  },
  // ---------------- Laptops ----------------
  {
    title: 'Apple MacBook Pro 14" (M3 Pro)',
    brand: 'Apple',
    category: 'Laptops',
    bg: '27272a',
    isFeatured: true,
    description: 'Pro performance with the M3 Pro chip, a Liquid Retina XDR display and up to 18 hours of battery.',
    highlights: ['Apple M3 Pro, 11-core CPU', '14.2-inch Liquid Retina XDR', '18GB unified memory', 'HDMI, SDXC, 3x Thunderbolt'],
    variants: [{ sku: 'MBP14-M3P-18-512', color: 'Space Black', colorHex: '#1c1917', ram: '18 GB', storage: '512 GB', price: 199900, mrp: 199900, stock: 4 }],
    specifications: laptopSpecs({ screen: '14.2 inch', display: 'Liquid Retina XDR 120Hz', processor: 'Apple M3 Pro', gpu: '14-core GPU', battery: '72.4 Wh', os: 'macOS Sonoma', weight: '1.61 kg' }),
    warranty: { months: 12, type: 'Apple India warranty', extendedAvailable: true, extendedPrice: 18900 },
    tags: ['macbook pro', 'apple', 'm3 pro', 'creator laptop'],
    soldCount: 45,
  },
  {
    title: 'ASUS Vivobook 15 (Core i5 12th Gen)',
    brand: 'ASUS',
    category: 'Laptops',
    bg: '1e3a8a',
    description: 'Thin and light everyday laptop with an FHD display, fingerprint login and fast SSD storage.',
    highlights: ['Intel Core i5-1235U', '15.6-inch FHD', 'Fingerprint sensor', '180 degree lay-flat hinge'],
    variants: [{ sku: 'ASUS-VB15-I5-16-512', color: 'Quiet Blue', colorHex: '#1e40af', ram: '16 GB', storage: '512 GB', price: 49990, mrp: 68990, stock: 24 }],
    specifications: laptopSpecs({ screen: '15.6 inch', display: 'FHD IPS, 250 nits', processor: 'Intel Core i5-1235U', gpu: 'Intel Iris Xe', battery: '42 Wh', os: 'Windows 11 Home', weight: '1.7 kg' }),
    tags: ['asus', 'vivobook', 'student laptop'],
    soldCount: 330,
  },
  {
    title: 'HP Envy x360 14 2-in-1 OLED (Ryzen 7)',
    brand: 'HP',
    category: 'Laptops',
    bg: '312e81',
    description: 'Convertible 2.8K OLED touch laptop with pen support, Ryzen 7 8840HS and a 5MP IR camera.',
    highlights: ['14-inch 2.8K OLED touch', 'AMD Ryzen 7 8840HS', 'Pen included', '5MP IR webcam'],
    variants: [{ sku: 'HP-ENVY14-R7-16-1TB', color: 'Atmospheric Blue', colorHex: '#334155', ram: '16 GB', storage: '1 TB', price: 89990, mrp: 106999, stock: 7 }],
    specifications: laptopSpecs({ screen: '14 inch', display: '2.8K OLED Touch 120Hz', processor: 'AMD Ryzen 7 8840HS', gpu: 'AMD Radeon 780M', battery: '59 Wh', os: 'Windows 11 Home', weight: '1.39 kg' }),
    tags: ['hp', 'envy', 'oled', '2-in-1'],
    soldCount: 60,
  },
  {
    title: 'Dell G15 Gaming Laptop (i7, RTX 4060)',
    brand: 'Dell',
    category: 'Laptops',
    bg: '14532d',
    description: 'Game Shift cooling, RTX 4060 graphics and a 165Hz display built for long gaming sessions.',
    highlights: ['Intel Core i7-13650HX', 'NVIDIA RTX 4060 8GB', '15.6-inch FHD 165Hz', 'Alienware-inspired cooling'],
    variants: [{ sku: 'DELL-G15-I7-16-1TB', color: 'Dark Shadow Grey', colorHex: '#374151', ram: '16 GB', storage: '1 TB', price: 112990, mrp: 139990, stock: 6 }],
    specifications: laptopSpecs({ screen: '15.6 inch', display: 'FHD 165Hz, 3ms', processor: 'Intel Core i7-13650HX', gpu: 'NVIDIA RTX 4060 8GB', battery: '86 Wh', os: 'Windows 11 Home', weight: '2.81 kg' }),
    tags: ['dell', 'g15', 'gaming laptop', 'rtx'],
    soldCount: 85,
  },
  // ---------------- Tablets ----------------
  {
    title: 'Lenovo Tab M11 with Pen (Wi-Fi + 4G)',
    brand: 'Lenovo',
    category: 'Tablets',
    bg: '475569',
    description: 'Family tablet with an 11-inch 90Hz display, quad Dolby Atmos speakers and Lenovo Tab Pen included.',
    highlights: ['11-inch 90Hz display', 'Lenovo Tab Pen included', 'Quad speakers, Dolby Atmos', '4G LTE calling'],
    variants: [{ sku: 'LEN-TABM11-128', color: 'Luna Grey', colorHex: '#6b7280', storage: '128 GB', ram: '8 GB', price: 19999, mrp: 31000, stock: 28 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '11 inch' },
      { group: 'Performance', key: 'Processor', value: 'MediaTek Helio G88' },
      { group: 'Battery', key: 'Battery Capacity', value: '7040 mAh' },
      { group: 'General', key: 'Weight', value: '465 g' },
    ],
    tags: ['lenovo', 'tablet', 'pen', '4g'],
    soldCount: 210,
  },
  {
    title: 'OnePlus Pad 2 (12.1-inch)',
    brand: 'OnePlus',
    category: 'Tablets',
    bg: '57534e',
    description: 'Snapdragon 8 Gen 3 powered tablet with a 3K 144Hz display and six speakers.',
    highlights: ['Snapdragon 8 Gen 3', '12.1-inch 3K 144Hz', 'Six speaker system', '67W SUPERVOOC'],
    variants: [{ sku: 'OPPAD2-GRY-256', color: 'Nimbus Gray', colorHex: '#78716c', storage: '256 GB', ram: '12 GB', price: 42999, mrp: 47999, stock: 9 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '12.1 inch' },
      { group: 'Performance', key: 'Processor', value: 'Snapdragon 8 Gen 3' },
      { group: 'Battery', key: 'Battery Capacity', value: '9510 mAh' },
      { group: 'General', key: 'Weight', value: '584 g' },
    ],
    tags: ['oneplus', 'pad', 'tablet'],
    soldCount: 70,
  },
  {
    title: 'Amazon Kindle Paperwhite (16 GB)',
    brand: 'Amazon',
    category: 'Tablets',
    bg: '1f2937',
    description: 'Glare-free 7-inch display, adjustable warm light and weeks of battery life. Waterproof for reading anywhere.',
    highlights: ['7-inch glare-free display', 'Adjustable warm light', 'Up to 12 weeks battery', 'IPX8 waterproof'],
    variants: [{ sku: 'KINDLE-PW-16', color: 'Black', colorHex: '#111827', storage: '16 GB', price: 16999, mrp: 17999, stock: 35 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '7 inch' },
      { group: 'Display', key: 'Display Type', value: 'E Ink, 300 ppi' },
      { group: 'General', key: 'Weight', value: '211 g' },
    ],
    tags: ['kindle', 'ebook reader', 'amazon'],
    soldCount: 400,
  },
  // ---------------- Headphones & Earbuds ----------------
  {
    title: 'Sony WF-1000XM5 Wireless Noise Cancelling Earbuds',
    brand: 'Sony',
    category: 'Headphones & Earbuds',
    bg: '0f172a',
    isFeatured: true,
    description: 'The best noise cancelling earbuds from Sony with Dynamic Driver X and crystal clear calls.',
    highlights: ['Best-in-class ANC', 'Dynamic Driver X', 'LDAC Hi-Res wireless', '24 hours with case'],
    variants: [
      { sku: 'WF1000XM5-BLK', color: 'Black', colorHex: '#111827', price: 19990, mrp: 24990, stock: 18 },
      { sku: 'WF1000XM5-SLV', color: 'Silver', colorHex: '#d1d5db', price: 19990, mrp: 24990, stock: 9 },
    ],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '8.4 mm' },
      { group: 'Audio', key: 'Noise Cancellation', value: 'Active (ANC)' },
      { group: 'Battery', key: 'Battery Life', value: '24 hours (with case)' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.3, LDAC' },
    ],
    tags: ['sony', 'earbuds', 'anc', 'tws'],
    soldCount: 230,
  },
  {
    title: 'JBL Tune 770NC Wireless Over-Ear Headphones',
    brand: 'JBL',
    category: 'Headphones & Earbuds',
    bg: '1d4ed8',
    description: 'Adaptive noise cancelling with JBL Pure Bass sound and up to 70 hours of playtime.',
    highlights: ['Adaptive noise cancelling', 'JBL Pure Bass', '70 hours battery', 'Multi-point connection'],
    variants: [
      { sku: 'JBL770NC-BLK', color: 'Black', colorHex: '#111827', price: 7999, mrp: 9999, stock: 45 },
      { sku: 'JBL770NC-BLU', color: 'Blue', colorHex: '#2563eb', price: 7999, mrp: 9999, stock: 25 },
    ],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '40 mm' },
      { group: 'Audio', key: 'Noise Cancellation', value: 'Adaptive ANC' },
      { group: 'Battery', key: 'Battery Life', value: '70 hours' },
    ],
    tags: ['jbl', 'headphones', 'anc'],
    soldCount: 380,
  },
  {
    title: 'Marshall Major V Wireless On-Ear Headphones',
    brand: 'Marshall',
    category: 'Headphones & Earbuds',
    bg: '292524',
    description: 'Iconic Marshall design with signature sound, 100+ hours of wireless playtime and wireless charging.',
    highlights: ['100+ hours playtime', 'Wireless charging', 'Custom M-button', 'Foldable iconic design'],
    variants: [{ sku: 'MRSH-MAJ5-BLK', color: 'Black', colorHex: '#1c1917', price: 14999, mrp: 17999, stock: 12 }],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '40 mm' },
      { group: 'Battery', key: 'Battery Life', value: '100 hours' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.3' },
    ],
    tags: ['marshall', 'headphones', 'premium'],
    soldCount: 95,
  },
  {
    title: 'Nothing Ear (a) TWS Earbuds',
    brand: 'Nothing',
    category: 'Headphones & Earbuds',
    bg: 'ca8a04',
    description: 'Transparent design, 45dB smart ANC and LDAC support with up to 42.5 hours of battery.',
    highlights: ['45dB smart ANC', 'LDAC Hi-Res audio', '42.5 hours with case', 'IP54 earbuds'],
    variants: [
      { sku: 'NEARA-YLW', color: 'Yellow', colorHex: '#facc15', price: 7999, mrp: 8999, stock: 40 },
      { sku: 'NEARA-WHT', color: 'White', colorHex: '#f9fafb', price: 7999, mrp: 8999, stock: 30 },
    ],
    specifications: [
      { group: 'Audio', key: 'Noise Cancellation', value: 'Active (ANC), 45dB' },
      { group: 'Battery', key: 'Battery Life', value: '42.5 hours' },
      { group: 'Connectivity', key: 'Bluetooth', value: '5.3, LDAC' },
    ],
    tags: ['nothing', 'earbuds', 'tws', 'anc'],
    soldCount: 310,
  },
  // ---------------- Smartwatches ----------------
  {
    title: 'OnePlus Watch 2 (Wear OS)',
    brand: 'OnePlus',
    category: 'Smartwatches',
    bg: '334155',
    description: 'Dual-engine architecture for up to 100 hours of smart mode battery with full Wear OS by Google.',
    highlights: ['Up to 100 hours smart mode', 'Wear OS 4 with Google apps', 'Dual-frequency GPS', 'Sapphire crystal'],
    variants: [{ sku: 'OPW2-BLK', color: 'Black Steel', colorHex: '#1f2937', price: 24999, mrp: 27999, stock: 10 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '1.43 inch' },
      { group: 'Battery', key: 'Battery Life', value: '100 hours' },
      { group: 'Features', key: 'GPS', value: 'Dual-frequency L1 + L5' },
    ],
    tags: ['oneplus', 'smartwatch', 'wear os'],
    soldCount: 65,
  },
  {
    title: 'Google Pixel Watch 2 (LTE)',
    brand: 'Google',
    category: 'Smartwatches',
    bg: '0f766e',
    description: 'Fitbit health tracking, Safety features and a polished aluminium dome design with Wear OS.',
    highlights: ['Fitbit heart rate tracking', 'Safety Check & Emergency SOS', 'LTE connectivity', '24 hours battery'],
    variants: [{ sku: 'PXW2-LTE-SLV', color: 'Polished Silver', colorHex: '#e5e7eb', price: 39900, mrp: 39900, stock: 5 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '1.2 inch' },
      { group: 'Battery', key: 'Battery Life', value: '24 hours' },
      { group: 'Features', key: 'Health Sensors', value: 'Heart rate, SpO2, ECG, skin temperature' },
    ],
    tags: ['pixel watch', 'google', 'smartwatch', 'lte'],
    soldCount: 30,
  },
  {
    title: 'boAt Wave Sigma 3 Smartwatch',
    brand: 'boAt',
    category: 'Smartwatches',
    bg: 'be123c',
    description: 'Big 2.01-inch display, Bluetooth calling with dial pad, 700+ active modes and a crest app health ecosystem.',
    highlights: ['2.01-inch HD display', 'BT calling + dial pad', '700+ active modes', '7 day battery'],
    variants: [
      { sku: 'WSIGMA3-BLK', color: 'Active Black', colorHex: '#111827', price: 1199, mrp: 7990, stock: 200 },
      { sku: 'WSIGMA3-PNK', color: 'Cherry Blossom', colorHex: '#f9a8d4', price: 1299, mrp: 7990, stock: 90 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '2.01 inch' },
      { group: 'Battery', key: 'Battery Life', value: '7 days' },
    ],
    tags: ['boat', 'smartwatch', 'budget'],
    soldCount: 3400,
  },
  // ---------------- Cameras ----------------
  {
    title: 'Sony Alpha ZV-E10 Vlog Camera with 16-50mm Lens',
    brand: 'Sony',
    category: 'Cameras',
    bg: '111827',
    isFeatured: true,
    description: 'Interchangeable-lens vlog camera with a flip-out screen, Product Showcase mode and 4K video.',
    highlights: ['24.2MP APS-C sensor', 'Vari-angle flip screen', 'Product Showcase setting', 'Directional 3-capsule mic'],
    variants: [{ sku: 'SONY-ZVE10-KIT', color: 'Black', colorHex: '#111827', price: 58990, mrp: 69990, stock: 8 }],
    specifications: [
      { group: 'Sensor', key: 'Resolution', value: '24.2 MP' },
      { group: 'Video', key: 'Max Video', value: '4K 30fps' },
      { group: 'Display', key: 'Screen Size', value: '3 inch' },
    ],
    tags: ['sony', 'vlog camera', 'mirrorless', 'youtube'],
    soldCount: 140,
  },
  {
    title: 'Fujifilm Instax Mini 12 Instant Camera',
    brand: 'Fujifilm',
    category: 'Cameras',
    bg: 'db2777',
    description: 'Point, shoot and print in seconds. Automatic exposure and a close-up mode for perfect selfies.',
    highlights: ['Prints in about 90 seconds', 'Automatic exposure', 'Close-up selfie mode', 'Fun pastel colours'],
    variants: [
      { sku: 'INSTAX12-PNK', color: 'Blossom Pink', colorHex: '#f9a8d4', price: 6999, mrp: 7999, stock: 50 },
      { sku: 'INSTAX12-BLU', color: 'Pastel Blue', colorHex: '#93c5fd', price: 6999, mrp: 7999, stock: 35 },
    ],
    specifications: [
      { group: 'General', key: 'Film', value: 'Instax Mini film' },
      { group: 'Battery', key: 'Battery Life', value: '100 shots (2x AA)' },
    ],
    tags: ['fujifilm', 'instax', 'instant camera', 'gift'],
    soldCount: 520,
  },
  {
    title: 'DJI Osmo Pocket 3 Gimbal Camera',
    brand: 'DJI',
    category: 'Cameras',
    bg: '27272a',
    description: 'Pocket-size 3-axis gimbal camera with a 1-inch sensor, 4K/120fps and a rotating 2-inch screen.',
    highlights: ['1-inch CMOS sensor', '4K 120fps', '3-axis mechanical stabilisation', 'Rotatable 2-inch OLED'],
    variants: [{ sku: 'DJI-POCKET3', color: 'Black', colorHex: '#111827', price: 44990, mrp: 49990, stock: 6 }],
    specifications: [
      { group: 'Sensor', key: 'Resolution', value: '9.4 MP (1-inch)' },
      { group: 'Video', key: 'Max Video', value: '4K 120fps' },
      { group: 'Display', key: 'Screen Size', value: '2 inch' },
    ],
    tags: ['dji', 'gimbal', 'vlogging', 'action camera'],
    soldCount: 75,
  },
  // ---------------- TVs ----------------
  {
    title: 'Xiaomi 55" X Pro 4K QLED Google TV',
    brand: 'Xiaomi',
    category: 'TVs',
    bg: 'ea580c',
    description: 'QLED colour with Dolby Vision IQ, 30W Dolby Audio speakers and Google TV with built-in Chromecast.',
    highlights: ['4K QLED, Dolby Vision IQ', 'Google TV', '30W Dolby Audio, DTS:X', 'Metal bezel-less design'],
    variants: [{ sku: 'MI-XPRO55-QLED', color: 'Black', colorHex: '#111827', price: 39999, mrp: 59999, stock: 10 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '55 inch' },
      { group: 'Display', key: 'Resolution', value: '3840 x 2160 (4K)' },
      { group: 'Audio', key: 'Sound Output', value: '30 W' },
    ],
    tags: ['xiaomi', 'mi tv', 'qled', 'google tv'],
    soldCount: 220,
  },
  {
    title: 'Sony Bravia 7 65" 4K Mini LED Google TV',
    brand: 'Sony',
    category: 'TVs',
    bg: '1e1b4b',
    description: 'Mini LED backlight with XR Backlight Master Drive, AI processor XR and Acoustic Multi-Audio sound.',
    highlights: ['Mini LED, XR Backlight', 'Cognitive Processor XR', 'Dolby Vision & Atmos', 'PS5 perfect features'],
    variants: [{ sku: 'SONY-BRAVIA7-65', color: 'Black', colorHex: '#111827', price: 179990, mrp: 249900, stock: 3 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '65 inch' },
      { group: 'Display', key: 'Panel', value: 'Mini LED' },
      { group: 'Audio', key: 'Sound Output', value: '30 W' },
    ],
    tags: ['sony', 'bravia', 'mini led', 'premium tv'],
    soldCount: 18,
  },
  {
    title: 'TCL 55" C645 4K QLED Google TV',
    brand: 'TCL',
    category: 'TVs',
    bg: '991b1b',
    description: 'Affordable QLED with HDR10+, 120Hz game accelerator and Dolby Atmos.',
    highlights: ['4K QLED, HDR10+', '120Hz Game Accelerator', 'Dolby Atmos', 'Hands-free voice control'],
    variants: [{ sku: 'TCL-55C645', color: 'Black', colorHex: '#111827', price: 34990, mrp: 77990, stock: 15 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '55 inch' },
      { group: 'Display', key: 'Resolution', value: '3840 x 2160 (4K)' },
      { group: 'Audio', key: 'Sound Output', value: '20 W' },
    ],
    tags: ['tcl', 'qled', 'google tv'],
    soldCount: 260,
  },
  // ---------------- Speakers ----------------
  {
    title: 'Marshall Emberton II Portable Bluetooth Speaker',
    brand: 'Marshall',
    category: 'Speakers',
    bg: '44403c',
    description: 'Compact speaker with True Stereophonic 360° sound, IP67 rating and 30+ hours of playtime.',
    highlights: ['True Stereophonic sound', '30+ hours playtime', 'IP67 dust & water resistant', 'Stack Mode'],
    variants: [{ sku: 'MRSH-EMB2-BLK', color: 'Black & Brass', colorHex: '#1c1917', price: 14999, mrp: 18999, stock: 14 }],
    specifications: [
      { group: 'Audio', key: 'Output Power', value: '20 W' },
      { group: 'Battery', key: 'Battery Life', value: '30 hours' },
    ],
    tags: ['marshall', 'speaker', 'bluetooth', 'premium'],
    soldCount: 120,
  },
  {
    title: 'boAt Stone 1200 Bluetooth Speaker',
    brand: 'boAt',
    category: 'Speakers',
    bg: '0369a1',
    description: '14W stereo sound with RGB LEDs, IPX7 water resistance and 9 hours of playback.',
    highlights: ['14W stereo sound', 'RGB LED lights', 'IPX7 water resistance', 'TWS pairing'],
    variants: [{ sku: 'STONE1200-BLU', color: 'Blue', colorHex: '#2563eb', price: 2999, mrp: 6990, stock: 75 }],
    specifications: [
      { group: 'Audio', key: 'Output Power', value: '14 W' },
      { group: 'Battery', key: 'Battery Life', value: '9 hours' },
    ],
    tags: ['boat', 'speaker', 'budget'],
    soldCount: 1100,
  },
  {
    title: 'JBL Charge 5 Portable Waterproof Speaker',
    brand: 'JBL',
    category: 'Speakers',
    bg: 'c2410c',
    description: 'Bold JBL Pro Sound, 20 hours of play, IP67 protection and a built-in power bank to charge your phone.',
    highlights: ['JBL Pro Sound with tweeter', '20 hours playtime', 'IP67 waterproof', 'Built-in power bank'],
    variants: [
      { sku: 'JBLCHG5-BLK', color: 'Black', colorHex: '#111827', price: 14999, mrp: 18999, stock: 22 },
      { sku: 'JBLCHG5-RED', color: 'Red', colorHex: '#dc2626', price: 14999, mrp: 18999, stock: 11 },
    ],
    specifications: [
      { group: 'Audio', key: 'Output Power', value: '40 W' },
      { group: 'Battery', key: 'Battery Life', value: '20 hours' },
    ],
    tags: ['jbl', 'speaker', 'waterproof', 'party'],
    soldCount: 300,
  },
  // ---------------- Gaming ----------------
  {
    title: 'Microsoft Xbox Series S 512GB Console',
    brand: 'Microsoft',
    category: 'Gaming',
    bg: 'f9fafb',
    description: 'Go all-digital with the smallest, sleekest Xbox. Next-gen speed at 1440p up to 120fps.',
    highlights: ['512 GB custom NVMe SSD', '1440p up to 120 fps', 'Xbox Game Pass ready', 'Quick Resume'],
    variants: [{ sku: 'XBOX-SERIES-S', color: 'Robot White', colorHex: '#f9fafb', storage: '512 GB', price: 34990, mrp: 34990, stock: 12 }],
    specifications: [
      { group: 'Performance', key: 'CPU', value: '8-core AMD Zen 2' },
      { group: 'Performance', key: 'GPU', value: '4 TFLOPS RDNA 2' },
      { group: 'Storage', key: 'SSD', value: '512 GB' },
    ],
    tags: ['xbox', 'console', 'gaming', 'game pass'],
    soldCount: 160,
  },
  {
    title: 'Nintendo Switch Lite Handheld Console',
    brand: 'Nintendo',
    category: 'Gaming',
    bg: '0d9488',
    description: 'Compact and lightweight handheld Nintendo Switch for gaming on the go.',
    highlights: ['5.5-inch touchscreen', 'Built-in controls', 'Plays all handheld Switch games', 'Lightweight 275 g'],
    variants: [
      { sku: 'NSW-LITE-TRQ', color: 'Turquoise', colorHex: '#2dd4bf', storage: '32 GB', price: 18990, mrp: 19999, stock: 15 },
      { sku: 'NSW-LITE-GRY', color: 'Grey', colorHex: '#6b7280', storage: '32 GB', price: 18990, mrp: 19999, stock: 10 },
    ],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '5.5 inch' },
      { group: 'Battery', key: 'Battery Life', value: '3 - 7 hours' },
    ],
    tags: ['nintendo', 'switch lite', 'handheld'],
    soldCount: 90,
  },
  {
    title: 'HyperX Cloud III Wired Gaming Headset',
    brand: 'HyperX',
    category: 'Gaming',
    bg: 'b91c1c',
    description: 'Legendary HyperX comfort with angled 53mm drivers, DTS Headphone:X spatial audio and a clear mic.',
    highlights: ['53mm angled drivers', 'DTS Headphone:X', 'Noise-cancelling detachable mic', 'Memory foam comfort'],
    variants: [{ sku: 'HYPX-CLOUD3-BLK', color: 'Black', colorHex: '#111827', price: 7490, mrp: 9990, stock: 30 }],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '53 mm' },
      { group: 'Connectivity', key: 'Connection', value: '3.5mm, USB-C, USB-A' },
    ],
    tags: ['hyperx', 'gaming headset', 'pc gaming'],
    soldCount: 200,
  },
  {
    title: 'Razer BlackShark V2 X Gaming Headset',
    brand: 'Razer',
    category: 'Gaming',
    bg: '15803d',
    description: 'Esports headset with TriForce 50mm drivers, passive noise cancellation and 7.1 surround sound.',
    highlights: ['TriForce 50mm drivers', '7.1 surround sound (PC)', 'HyperClear cardioid mic', 'Only 240 g'],
    variants: [{ sku: 'RZR-BSV2X-BLK', color: 'Black', colorHex: '#111827', price: 3999, mrp: 6499, stock: 45 }],
    specifications: [
      { group: 'Audio', key: 'Driver Size', value: '50 mm' },
      { group: 'Connectivity', key: 'Connection', value: '3.5mm' },
    ],
    tags: ['razer', 'gaming headset', 'esports'],
    soldCount: 420,
  },
  // ---------------- Computer Accessories ----------------
  {
    title: 'SanDisk Extreme Portable SSD 1TB',
    brand: 'SanDisk',
    category: 'Computer Accessories',
    bg: '991b1b',
    description: 'Up to 1050MB/s read speeds in a rugged, drop- and water-resistant pocket-size design.',
    highlights: ['Up to 1050 MB/s read', 'IP65 water & dust resistant', '3 metre drop protection', 'USB-C (USB 3.2 Gen 2)'],
    variants: [
      { sku: 'SDX-SSD-1TB', color: 'Black', colorHex: '#111827', storage: '1 TB', price: 8999, mrp: 16999, stock: 40 },
      { sku: 'SDX-SSD-2TB', color: 'Black', colorHex: '#111827', storage: '2 TB', price: 15999, mrp: 28999, stock: 20 },
    ],
    specifications: [
      { group: 'Performance', key: 'Read Speed', value: '1050 MB/s' },
      { group: 'Connectivity', key: 'Interface', value: 'USB-C 3.2 Gen 2' },
    ],
    tags: ['sandisk', 'ssd', 'portable storage'],
    soldCount: 650,
  },
  {
    title: 'Seagate One Touch 2TB External Hard Drive',
    brand: 'Seagate',
    category: 'Computer Accessories',
    bg: '166534',
    description: 'Slim portable hard drive with a fabric finish, password protection and Rescue data recovery.',
    highlights: ['2 TB capacity', 'Password protection', 'Rescue data recovery (3 years)', 'USB 3.0'],
    variants: [{ sku: 'SGT-ONETOUCH-2TB', color: 'Space Grey', colorHex: '#4b5563', storage: '2 TB', price: 6499, mrp: 9999, stock: 55 }],
    specifications: [
      { group: 'Storage', key: 'Capacity', value: '2 TB' },
      { group: 'Connectivity', key: 'Interface', value: 'USB 3.0' },
    ],
    tags: ['seagate', 'hard drive', 'storage'],
    soldCount: 720,
  },
  {
    title: 'Logitech MK270 Wireless Keyboard & Mouse Combo',
    brand: 'Logitech',
    category: 'Computer Accessories',
    bg: '1f2937',
    description: 'Reliable wireless keyboard and mouse with one tiny receiver, 8 hot keys and long battery life.',
    highlights: ['2.4 GHz wireless, one receiver', '8 media hot keys', '36 month keyboard battery', 'Spill resistant'],
    variants: [{ sku: 'LOGI-MK270', color: 'Black', colorHex: '#111827', price: 1795, mrp: 2295, stock: 150 }],
    specifications: [
      { group: 'Connectivity', key: 'Connection', value: '2.4 GHz USB receiver' },
      { group: 'Battery', key: 'Battery Life', value: '36 months (keyboard)' },
    ],
    tags: ['logitech', 'keyboard', 'mouse', 'combo'],
    soldCount: 2500,
  },
  {
    title: 'Samsung Odyssey G3 24" FHD 180Hz Gaming Monitor',
    brand: 'Samsung',
    category: 'Computer Accessories',
    bg: '1e3a8a',
    description: 'Fast 180Hz refresh with 1ms response, AMD FreeSync Premium and a height adjustable stand.',
    highlights: ['24-inch FHD VA', '180Hz, 1ms MPRT', 'AMD FreeSync Premium', 'Height adjustable stand'],
    variants: [{ sku: 'SAM-ODY-G3-24', color: 'Black', colorHex: '#111827', price: 12499, mrp: 21999, stock: 18 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '24 inch' },
      { group: 'Display', key: 'Resolution', value: '1920 x 1080' },
      { group: 'Display', key: 'Refresh Rate', value: '180 Hz' },
    ],
    tags: ['samsung', 'odyssey', 'gaming monitor'],
    soldCount: 190,
  },
  // ---------------- Chargers & Power Banks ----------------
  {
    title: 'Anker Nano 65W GaN USB-C Charger (3 Ports)',
    brand: 'Anker',
    category: 'Chargers & Power Banks',
    bg: '0284c7',
    description: 'Charge a laptop, phone and earbuds together from one compact GaN charger.',
    highlights: ['65W total output', '2x USB-C + 1x USB-A', 'GaN II technology', 'Foldable plug'],
    variants: [{ sku: 'ANK-NANO65', color: 'White', colorHex: '#f9fafb', price: 3999, mrp: 5999, stock: 60 }],
    specifications: [{ group: 'General', key: 'Output', value: '65 W' }],
    tags: ['anker', 'gan charger', 'usb-c', 'laptop charger'],
    soldCount: 540,
  },
  {
    title: 'Belkin BoostCharge Pro 3-in-1 MagSafe Charging Stand',
    brand: 'Belkin',
    category: 'Chargers & Power Banks',
    bg: '57534e',
    description: 'Official MagSafe 15W charging for iPhone, plus Apple Watch fast charging and AirPods in one stand.',
    highlights: ['Official MagSafe 15W', 'Apple Watch fast charging', 'AirPods charging pad', 'Power adapter included'],
    variants: [{ sku: 'BLK-MAGSAFE-3IN1', color: 'White', colorHex: '#f9fafb', price: 12999, mrp: 14999, stock: 9 }],
    specifications: [{ group: 'General', key: 'Output', value: '15 W (MagSafe)' }],
    tags: ['belkin', 'magsafe', 'wireless charger', 'apple'],
    soldCount: 60,
  },
  {
    title: 'Xiaomi 20000mAh 33W Power Bank 4i',
    brand: 'Xiaomi',
    category: 'Chargers & Power Banks',
    bg: '0f172a',
    description: '33W fast charging power bank with triple output and 12-layer chip protection.',
    highlights: ['20000 mAh capacity', '33W fast charging', 'Triple output', 'Type-C input/output'],
    variants: [{ sku: 'MI-PB4I-20K', color: 'Black', colorHex: '#111827', price: 2199, mrp: 3999, stock: 120 }],
    specifications: [
      { group: 'Battery', key: 'Battery Capacity', value: '20000 mAh' },
      { group: 'General', key: 'Output', value: '33 W' },
    ],
    tags: ['xiaomi', 'mi', 'power bank'],
    soldCount: 1800,
  },
  // ---------------- Smart Home ----------------
  {
    title: 'Amazon Echo Show 5 (3rd Gen) Smart Display',
    brand: 'Amazon',
    category: 'Smart Home',
    bg: '155e75',
    description: 'Compact smart display with Alexa: video calls, a smart alarm clock and smart home controls at a glance.',
    highlights: ['5.5-inch display', 'Alexa voice control', '2MP camera with shutter', 'Smart home dashboard'],
    variants: [{ sku: 'ECHOSHOW5-G3', color: 'Charcoal', colorHex: '#374151', price: 6999, mrp: 10999, stock: 30 }],
    specifications: [
      { group: 'Display', key: 'Screen Size', value: '5.5 inch' },
      { group: 'Connectivity', key: 'Wi-Fi', value: 'Dual band' },
    ],
    tags: ['alexa', 'echo show', 'smart display', 'smart home'],
    soldCount: 330,
  },
  {
    title: 'Amazon Fire TV Stick 4K Max with Alexa Voice Remote',
    brand: 'Amazon',
    category: 'Smart Home',
    bg: 'ea580c',
    description: 'Turn any TV smart with 4K Ultra HD streaming, Wi-Fi 6E and Alexa voice remote with app buttons.',
    highlights: ['4K Ultra HD, Dolby Vision', 'Wi-Fi 6E support', 'Alexa Voice Remote', '16 GB storage'],
    variants: [{ sku: 'FIRETV-4KMAX', color: 'Black', colorHex: '#111827', storage: '16 GB', price: 5999, mrp: 7999, stock: 95 }],
    specifications: [
      { group: 'Video', key: 'Resolution', value: '4K Ultra HD' },
      { group: 'Connectivity', key: 'Wi-Fi', value: 'Wi-Fi 6E' },
    ],
    tags: ['fire tv', 'streaming', 'alexa', 'smart tv'],
    soldCount: 1400,
  },
  {
    title: 'Xiaomi Robot Vacuum S10 (Lidar)',
    brand: 'Xiaomi',
    category: 'Smart Home',
    bg: '4b5563',
    description: 'Laser navigation robot vacuum and mop with 4000Pa suction and app or voice control.',
    highlights: ['LDS laser navigation', '4000 Pa suction', '2-in-1 sweep and mop', 'Works with Alexa & Google'],
    variants: [{ sku: 'MI-ROBOVAC-S10', color: 'White', colorHex: '#f9fafb', price: 19999, mrp: 29999, stock: 8 }],
    specifications: [
      { group: 'General', key: 'Suction', value: '4000 Pa' },
      { group: 'Battery', key: 'Battery Capacity', value: '3200 mAh' },
    ],
    tags: ['xiaomi', 'robot vacuum', 'smart home', 'cleaning'],
    soldCount: 110,
  },
];

export const products = [...baseProducts, ...moreProducts, ...extraProducts];

// Bump when sample products are added, so existing local databases receive the new ones
export const SEED_VERSION = 6; // 5: real product photos (public/products), 6: better / more photos
