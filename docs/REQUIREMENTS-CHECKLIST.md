# ShopEase - Requirements checklist

Status of every item in the project requirements document. The last check was on 1 Oct 2026 with 36 backend tests, 10 frontend tests, a 79-step browser QA, and new-user journey tests.

Legend: ✅ done · 🔄 changed on request · ⚙️ done, needs your own account or keys · ⏭️ optional, not built

## 1. Electronics-specific features
| Requirement | Status | Where |
|---|---|---|
| Specifications table (RAM, storage, battery, display, processor) | ✅ | Product page > Specifications tab (grouped) |
| Variants: color / storage / RAM with own price and stock | ✅ | `VariantSelector`, `Product.variants` |
| Compare 2-4 products side by side | ✅ | `/compare`, same category only, differences highlighted |
| Brand filter | ✅ | Listing filters |
| Warranty info + extended warranty option | ✅ | Product page, Warranty & Returns tab |
| EMI / no-cost EMI display | ✅ | Product page and product cards |
| Exchange offer | ⏭️ | Optional |
| Serial number / IMEI saved in order (admin) | ✅ | Admin > Order detail, shown to the customer and on the invoice |
| 7 day return / replacement window | ✅ | Order detail > Return / Replace |
| GST invoice PDF | ✅ | Order detail > GST invoice (CGST + SGST breakup) |

## 2. User roles
| Role | Status | Notes |
|---|---|---|
| Guest: browse, search, filter, compare, local cart | 🔄 | At your request the store is **login-first**: logged-out visitors see Login / Register only, and the server also rejects cart and order calls without login |
| Customer: checkout, orders, wishlist, reviews, addresses, profile | ✅ | |
| Admin: dashboard, products, categories, orders, users, reviews, coupons, reports | ✅ | Plus banners and an Emails page |

## 3. Functional requirements
### 3.1 Authentication
| Item | Status |
|---|---|
| Register (name, email, phone, password) · Login / Logout | ✅ |
| JWT access token 15 min + refresh token 7 days (httpOnly cookie, rotated, up to 5 devices) | ✅ |
| bcrypt hashing (12 rounds) | ✅ |
| Forgot / reset password by email link (15 min, single use) | ✅ |
| Email verification | ✅ |
| Google login | ⏭️ optional |
| Protected and admin-only routes · profile update · password change | ✅ |

### 3.2 Product catalog
| Item | Status |
|---|---|
| Home: hero banner, featured, deals of the day, category cards, new arrivals, top brands | ✅ |
| Listing with pagination **and** infinite scroll option | ✅ |
| Debounced search with suggestions (name, brand, category) | ✅ |
| Filters: category, brand, price, rating, RAM, storage, battery, screen size, availability, discount | ✅ |
| Sort: price low-high / high-low, newest, rating, popularity (+ discount) | ✅ |
| Product page: zoom gallery, price, discount %, stock, variants, specs, highlights, description, warranty / returns, EMI, reviews, related, add to cart, buy now, wishlist, compare | ✅ |
| Recently viewed | ✅ |
| Compare page | ✅ |

### 3.3 Cart
| Item | Status |
|---|---|
| Add / remove / update quantity with stock validation | ✅ |
| Cart saved in the database for logged-in users | ✅ |
| Guest localStorage cart + merge on login | 🔄 not needed in the login-first store (the merge code still handles any old guest cart) |
| Price summary: subtotal, discount, GST, shipping, total · coupons | ✅ |

### 3.4 Wishlist - ✅ add / remove, move to cart
### 3.5 Checkout
| Item | Status |
|---|---|
| Step 1 address (select / add) · Step 2 summary · Step 3 payment | ✅ |
| Razorpay test mode | ⚙️ add your Razorpay test keys to `server/.env`. Without keys a simulated payment is used, in development only |
| Cash on Delivery | ✅ |
| Shipping: free from Rs. 999, otherwise Rs. 49 | ✅ |
| Confirmation page + confirmation email | ✅ |

### 3.6 Orders - ✅ history, status timeline (Placed > Confirmed > Packed > Shipped > Out for delivery > Delivered), cancel before shipping, return / replace within 7 days, GST invoice, reorder
### 3.7 Reviews - ✅ verified buyers only (delivered order), 1-5 stars + text + **photo upload (up to 4)**, one per product, auto average, helpful votes
### 3.8 Profile - ✅ personal info, multiple addresses (add, edit, delete, default), orders, wishlist, my reviews
### 3.9 Admin panel
| Item | Status |
|---|---|
| Dashboard: sales, orders, users, revenue chart (daily / weekly / monthly), low stock, top selling | ✅ |
| Products: add, edit, delete, **multiple image upload**, variants, specs, stock, featured toggle | ✅ Images go to Cloudinary when keys are set, otherwise to local storage |
| Bulk CSV product upload | ⏭️ optional |
| Categories (with sub-categories) and brands | ✅ |
| Orders: list, filter by status, update status, tracking ID, customer details, approve returns | ✅ |
| Users: list, block / unblock, change role | ✅ |
| Review moderation · coupons (percent / flat, min order, expiry, usage limit) · banners · CSV sales report | ✅ |

### 3.10 Emails
| Item | Status |
|---|---|
| Welcome, order confirmation, shipped, out for delivery, delivered, cancelled, password reset, low stock alert to admin | ✅ |
| Real delivery to inboxes | ⚙️ run `setup-email.bat` with a Gmail App Password. Until then emails go to a test mailbox (Admin > Emails > View) |
| Back-in-stock / price-drop alerts | ⏭️ optional |

## 4. Non-functional requirements
| Area | Status |
|---|---|
| Performance: lazy images, API pagination, MongoDB indexes, code-split routes, offline SVG placeholders | ✅ |
| Security: bcrypt, JWT, helmet, CORS whitelist, rate limit (strict on login, counts failed attempts only), validation, NoSQL injection and XSS sanitisation, HTTPS-ready cookies | ✅ |
| Responsive 360-1920 px (checked at 360 and 390 px, no horizontal scroll) | ✅ |
| Accessibility: alt text, labels, keyboard support, focus rings | ✅ |
| SEO: react-helmet-async titles / meta, slug URLs | ✅ |
| Scalability: modular, stateless API, Cloudinary | ✅ |
| Reliability: global error handler, status codes, winston + morgan logging | ✅ |
| Maintainability: ESLint, Prettier, folder structure, README | ✅ (Husky ⏭️ optional) |

## 5. Tech stack - ✅ everything listed is used
The one exception is `xss-clean`, which is unmaintained. It was replaced by a small custom sanitiser that keeps `< > &` in normal text.

## 6. Folder structure - ✅ matches the spec
This includes `middleware/admin.js` and `services/paymentService.js`. Wishlist state lives in RTK Query instead of a separate slice.

## 7. Database schemas - ✅ all 9 models with the listed fields and indexes
Extras: `variants.colorHex`, `warranty.extendedPrice`, `refreshTokens[]`, `returnRequest.type`, and an `EmailLog` model.

## 8. API endpoints - ✅ every listed endpoint exists
Extras: filter options, suggestions, review photos, the email log, and a test email. See `docs/ShopEase.postman_collection.json`.

## 9. Frontend routes - ✅ all routes from the table, plus `/verify-email/:token`, `/admin/catalog`, `/admin/reviews`, `/admin/emails`

## 10. Business rules - ✅ all checked by tests
Variant price, discount %, GST 18% with CGST/SGST, shipping rule, stock minus on order and plus on cancel, paid only after the signature is verified, review only after delivery, cancel only before shipping, return within 7 days, coupon expiry / min order / usage limit, compare only within the same category.

## 11. Environment variables - ✅ `server/.env.example` (+ email, admin login, payment mock, low stock)
## 12. Security checklist - ✅ all 10 items
## 13. Testing plan - ✅ Jest + Supertest (auth, products, cart, orders, coupons, payments, uploads, sessions), Vitest + RTL (cart slice, ProductCard, Login), Postman collection, browser QA
## 14. Roadmap - ✅ weeks 1-5 scope delivered
## 15. Deployment steps - ⚙️ documented in the README, but deploying needs your MongoDB Atlas, Cloudinary, Render / Railway and Vercel accounts
## 16. README checklist - ✅ name, tagline, screenshots, features, badges, structure, setup, API docs, demo credentials, future scope, repo topics. The live demo link is ⚙️ added after deployment
## 17. Optional advanced features - partly: ✅ dark mode, recently viewed. The rest ⏭️ (listed in the README under Future scope)
## 18. Final deliverables
| Deliverable | Status |
|---|---|
| Working website (frontend + backend) | ✅ locally with `start.bat` · ⚙️ live after deployment |
| GitHub repo with clean commits | ⚙️ git is not installed on this computer. Install git, then `git init`, commit and push to your GitHub |
| README with screenshots and setup guide | ✅ |
| Postman collection | ✅ `docs/ShopEase.postman_collection.json` |
| Seed script with 20+ products | ✅ 105 products, 12 categories, 47 brands |
| Demo admin and customer credentials | ✅ admin from `server/.env`, customer `customer@shopease.com` |
