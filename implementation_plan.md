# AmCart — Implementation Plan (PDF Requirements)
> Generated: April 11, 2026 | Runs locally in Docker

## Current State vs Requirements

| PDF Section | Feature | Status |
|---|---|---|
| §3 Login | Email/password | ✅ Done |
| §4 Register | Email/password only | ⚠️ Missing name, phone, gender |
| §5 Admin Page | Manage products & stock | ❌ Missing entirely |
| §6 Purchase Flow | Add to cart, checkout | ✅ Done |
| §6.4 Wishlist | Save products for later | ❌ Missing |
| §6.10 Cart Qty +/- | Update quantity in cart | ❌ Missing |
| §7 Order Complete | Detailed confirmation | ⚠️ Basic only, no shipping/billing |
| §8 Search | Product search bar | ❌ Missing |
| §9 Product Catalogue | Categories + filters + sort | ❌ Missing |
| §10 Product Detail | Single product page | ❌ Missing |
| §11 Stock | Green/red dot indicator | ⚠️ Text only, no dot |
| §14 Sale | Discounted products page | ❌ Missing |
| §15 Order History | Full history with pagination | ⚠️ Basic done |
| §16 Customer | Profile/account page | ❌ Missing |
| §17 Contact Us | Contact form page | ❌ Missing |
| §18 Reviews | Product review page | ❌ Missing |
| §19 New Products | New products on Home | ❌ Missing |
| §20 Testimonials | Testimonials on Home | ❌ Missing |

---

## Phase 1: Backend Foundation — Model & Schema Extensions
> ⚠️ All other phases depend on this. Do first.
> After any schema change: `docker compose down -v && docker compose up --build` to reset DB.

### Step 1.1 — Extend `User` model
- **File**: `app/models/user.py`
- Add: `full_name` (String, nullable), `phone` (String, nullable), `is_admin` (Boolean, default=False)
- Update `UserResponse` in `app/schemas/user.py` to include new fields

### Step 1.2 — Extend `Product` model
- **File**: `app/models/product.py`
- Add: `category` (String, nullable), `image_url` (String, nullable), `is_featured` (Boolean, default=False), `is_new` (Boolean, default=False), `discount_percentage` (Numeric(5,2), nullable)
- Update `ProductCreate`, `ProductUpdate`, `ProductResponse` in `app/schemas/product.py`

### Step 1.3 — Add `Wishlist` model
- **New file**: `app/models/wishlist.py`
- Fields: `id`, `user_id` (FK → users, CASCADE), `product_id` (FK → products), `created_at`
- Add UniqueConstraint on `(user_id, product_id)`
- New schema: `app/schemas/wishlist.py` — `WishlistItemResponse` with product details

### Step 1.4 — Add `Review` model
- **New file**: `app/models/review.py`
- Fields: `id`, `user_id` (FK → users), `product_id` (FK → products), `rating` (Integer, 1–5), `comment` (Text), `created_at`
- New schema: `app/schemas/review.py` — `ReviewCreate`, `ReviewResponse`

### Step 1.5 — Extend `Order` model
- **File**: `app/models/order.py`
- Add: `shipping_name` (String, nullable), `shipping_address` (String, nullable)

### Step 1.6 — Register new models
- **File**: `app/models/__init__.py`
- Import `Wishlist`, `Review` so `Base.metadata.create_all()` picks them up

---

## Phase 2: Backend API Extensions
> Steps 2.1–2.7 are independent; can be done in parallel after Phase 1.

### Step 2.1 — Admin auth dependency
- **File**: `app/services/auth.py`
- Add `get_current_admin_user` dependency: checks `current_user.is_admin`, raises HTTP 403 if not
- **Admin seeding**: add `POST /admin/seed` endpoint (only works when 0 admin users exist) that creates a default admin user with a hardcoded dev password

### Step 2.2 — Admin router
- **New file**: `app/routers/admin.py`
- All endpoints require `get_current_admin_user` dependency
- `GET /admin/products/` — list all products with stock
- `POST /admin/products/` — create product (name, price, description, category, image_url, initial_quantity, is_featured, is_new, discount_percentage)
- `PUT /admin/products/{id}` — update product fields
- `DELETE /admin/products/{id}` — delete product
- `PUT /admin/products/{id}/stock` — body: `{quantity}` — set stock level
- Register in `app/main.py`

### Step 2.3 — Wishlist router
- **New file**: `app/routers/wishlist.py`
- All endpoints require regular auth
- `POST /wishlist/add` — body: `{product_id}` — idempotent add
- `DELETE /wishlist/remove/{product_id}`
- `GET /wishlist/` — returns list of products in wishlist
- Register in `app/main.py`

### Step 2.4 — Review router
- **New file**: `app/routers/review.py`
- `POST /reviews/` — auth required, body: `{product_id, rating, comment}`
- `GET /reviews/product/{product_id}` — public, paginated (skip/limit)
- `GET /reviews/` — public, all latest reviews (skip/limit)
- Register in `app/main.py`

### Step 2.5 — Extend Product `GET /products/` with search & filters
- **File**: `app/routers/product.py`
- Add query params to product list endpoint:
  - `search` (str) — ILIKE filter on name/description
  - `category` (str)
  - `min_price` (float), `max_price` (float)
  - `in_stock` (bool) — filter to quantity > 0
  - `is_featured` (bool), `is_new` (bool)
  - `sort_by` (str): `name`, `price_asc`, `price_desc`, `newest`
  - `page` (int, default=1), `limit` (int, default=12)
- Return `{products, total, page, pages}` for pagination

### Step 2.6 — User profile endpoint
- **File**: `app/routers/auth.py`
- Add `PUT /auth/profile` — auth required, body: `{full_name, phone}` — updates user record
- `GET /auth/me` already exists — update response to include `full_name`, `phone`, `is_admin`

### Step 2.7 — Cart quantity update endpoint
- **File**: `app/routers/cart.py`
- Add `PUT /cart/update/{product_id}` — auth required, query param: `quantity` (int)
- If quantity <= 0, remove the item; otherwise update quantity
- Add `cartAPI.update(productId, quantity)` to `frontend/src/services/api.js`

### Step 2.8 — Update `POST /orders/checkout`
- **File**: `app/routers/order.py`
- Accept optional body: `{shipping_name, shipping_address}`
- Store on order record

---

## Phase 3: Frontend — New Pages
> Each page is independent; build in parallel after Phase 2 APIs are ready.

### Step 3.1 — Product Detail page
- **New file**: `frontend/src/pages/ProductDetail.jsx`
- **Route**: `/products/:id` — add to `App.jsx`
- Content: product name, price (with strikethrough if discounted), category badge, description, stock dot indicator (🟢/🟡/🔴), quantity picker (1 → max stock), Add to Cart button, Add to Wishlist heart button
- Reviews section below: list of reviews with star rating + comment, avg rating shown
- Uses: `productsAPI.getById(id)`, `reviewAPI.getByProduct(id)`, `cartAPI.add()`, `wishlistAPI.add/remove()`
- Product cards in `Products.jsx` → make image/name clickable `<Link to="/products/:id">`

### Step 3.2 — Wishlist page
- **New file**: `frontend/src/pages/Wishlist.jsx`
- **Route**: `/wishlist` (protected) — add to `App.jsx`
- Product grid with: image, name, price, Remove from Wishlist button, Add to Cart button
- Add `wishlistAPI` to `frontend/src/services/api.js`: `get()`, `add(productId)`, `remove(productId)`
- Add `WishlistContext` or fetch on page load
- Navbar: add wishlist heart icon with count badge (when authenticated)

### Step 3.3 — Profile / Account page
- **New file**: `frontend/src/pages/Profile.jsx`
- **Route**: `/profile` (protected) — add to `App.jsx`
- Show: email (read-only), editable full_name and phone fields
- Save button calls `PUT /auth/profile`
- Add `authAPI.updateProfile(data)` to `api.js`

### Step 3.4 — Contact Us page
- **New file**: `frontend/src/pages/Contact.jsx`
- **Route**: `/contact` (public) — add to `App.jsx`
- Static contact info section (placeholder phone, email, address)
- "Leave a Reply" form: Name*, Email*, Subject*, Message* — client-side validation only (no backend)
- Show success toast on submit

### Step 3.5 — Admin Dashboard
- **New directory**: `frontend/src/pages/admin/`
- **New files**: `AdminLayout.jsx`, `AdminProducts.jsx`
- **Route**: `/admin/products` — protected by new `AdminRoute` component checking `user.is_admin`
- `AdminProducts.jsx`: table of all products (name, price, category, stock, featured/new flags), Edit button opens inline form, Delete button with confirm, "Add Product" button opens form panel
- Add `adminAPI` to `api.js`: `getProducts()`, `createProduct(data)`, `updateProduct(id, data)`, `deleteProduct(id)`, `updateStock(id, qty)`
- Add `AdminRoute` component to `frontend/src/components/AdminRoute.jsx`
- Navbar: show "Admin" link when `user.is_admin === true`

---

## Phase 4: Frontend — Products Page Enhancements
> Enhances existing files. Can be done in parallel with Phase 3.

### Step 4.1 — Search bar
- Add search input to top of `Products.jsx`
- Debounced (300ms) → updates `search` state → passed to `productsAPI.getAll()`
- Clear (×) button; "No results for '...'" empty state

### Step 4.2 — Category filter + sort controls
- Horizontal filter bar in `Products.jsx`
- Category: All / Women / Men dropdown
- In Stock only: toggle checkbox
- Sort: Default / Price ↑ / Price ↓ / Newest — dropdown
- All state → query params → `productsAPI.getAll()`

### Step 4.3 — Pagination
- Replace hardcoded `getAll(0, 50)` with page state (`skip=(page-1)*12, limit=12`)
- Previous / Next buttons + "Page X of Y" label
- Scroll to top on page change

### Step 4.4 — Cart quantity +/- controls
- **File**: `frontend/src/pages/Cart.jsx`
- Replace static qty display with `[-] N [+]` controls per cart item
- Calls `cartAPI.update(productId, newQty)` (Step 2.7)
- Disable `+` when qty = stock limit; disable `-` at 1 (remove shows separately)

### Step 4.5 — Stock dot indicators
- Reusable inline component or className logic
- `qty === 0` → 🔴 red dot + "Out of Stock" (disable Add to Cart button)
- `qty >= 1 && qty <= 5` → 🟡 amber dot + "Only X left"
- `qty > 5` → 🟢 green dot + "In Stock"
- Apply in `Products.jsx` product cards AND `ProductDetail.jsx`

### Step 4.6 — Wishlist heart on product cards
- Add heart icon to each product card in `Products.jsx`
- Filled = in wishlist, outline = not in wishlist
- Toggle calls `wishlistAPI.add/remove()`
- Requires wishlist state loaded on mount (reuse from WishlistContext or local state)

---

## Phase 5: Frontend — Home Page Enhancements
> Enhances `Home.jsx`. Independent of Phases 3–4.

### Step 5.1 — Featured Products section
- Fetch `productsAPI.getAll({is_featured: true, limit: 4})`
- 4-column grid: product image, name, price
- "View All Products" link → `/products`

### Step 5.2 — New Products section
- Fetch `productsAPI.getAll({is_new: true, limit: 4})` or sort by newest
- Same grid layout; add "NEW" badge overlay on each card

### Step 5.3 — Testimonials section (static)
- Hardcoded 3-card section in `Home.jsx`
- Each card: placeholder avatar, customer name, star rating (★★★★★), quote text

---

## Phase 6: Remaining Pages (Lower Priority)

### Step 6.1 — Review page
- **New file**: `frontend/src/pages/Reviews.jsx`
- **Route**: `/reviews` (public)
- Paginated list of all reviews: reviewer email (partial), date, star rating, comment, product name

### Step 6.2 — Sale / Discount page
- **New file**: `frontend/src/pages/Sale.jsx`
- **Route**: `/sale` (public)
- Products where `discount_percentage > 0`
- Show: original price (strikethrough), discounted price, discount badge (e.g. "-20%")
- Category filter sidebar

### Step 6.3 — Register page extra fields
- **File**: `frontend/src/pages/Register.jsx`
- Add optional: Full Name (text), Phone (tel) fields
- Pass to `POST /auth/register`
- Update `authAPI.register(email, password, fullName, phone)` in `api.js`

### Step 6.4 — Navbar additions
- Add: Wishlist icon + count badge (authenticated only)
- Add: Sale link (public)
- Add: Contact link (public)
- Add: Admin link (admin only)
- Add: Profile/Account link (authenticated only, replace or add under user dropdown)

---

## All Files to Create / Modify

### New backend files
| File | Purpose |
|---|---|
| `app/models/wishlist.py` | Wishlist model |
| `app/models/review.py` | Review model |
| `app/routers/admin.py` | Admin CRUD endpoints |
| `app/routers/wishlist.py` | Wishlist API |
| `app/routers/review.py` | Review API |
| `app/schemas/wishlist.py` | Wishlist schemas |
| `app/schemas/review.py` | Review schemas |

### Modified backend files
| File | Changes |
|---|---|
| `app/models/user.py` | +full_name, +phone, +is_admin |
| `app/models/product.py` | +category, +image_url, +is_featured, +is_new, +discount_percentage |
| `app/models/order.py` | +shipping_name, +shipping_address |
| `app/models/__init__.py` | Register Wishlist, Review |
| `app/schemas/user.py` | Update UserResponse |
| `app/schemas/product.py` | Update Product schemas |
| `app/routers/auth.py` | +PUT /auth/profile |
| `app/routers/product.py` | +search/filter/sort/pagination params |
| `app/routers/cart.py` | +PUT /cart/update/{product_id} |
| `app/routers/order.py` | +shipping fields in checkout |
| `app/services/auth.py` | +get_current_admin_user dependency |
| `app/main.py` | Register new routers |

### New frontend files
| File | Purpose |
|---|---|
| `frontend/src/pages/ProductDetail.jsx` | Single product page |
| `frontend/src/pages/Wishlist.jsx` | Wishlist page |
| `frontend/src/pages/Profile.jsx` | Account/profile page |
| `frontend/src/pages/Contact.jsx` | Contact Us page |
| `frontend/src/pages/Reviews.jsx` | All reviews page |
| `frontend/src/pages/Sale.jsx` | Sale/discounts page |
| `frontend/src/pages/admin/AdminProducts.jsx` | Admin product management |
| `frontend/src/components/AdminRoute.jsx` | Admin-only route guard |

### Modified frontend files
| File | Changes |
|---|---|
| `frontend/src/App.jsx` | Add all new routes |
| `frontend/src/services/api.js` | +wishlistAPI, +reviewAPI, +adminAPI, +authAPI.updateProfile, +cartAPI.update |
| `frontend/src/components/Navbar.jsx` | +wishlist badge, +new links, +admin link |
| `frontend/src/pages/Products.jsx` | +search, +filters, +pagination, +wishlist btn, +card link, +stock dots |
| `frontend/src/pages/Cart.jsx` | +qty +/- controls |
| `frontend/src/pages/Home.jsx` | +featured, +new products, +testimonials |
| `frontend/src/pages/Register.jsx` | +name, +phone fields |

---

## Out of Scope (Local Docker Constraints)
- Facebook/Twitter OAuth login
- Forgot password (no SMTP)
- Order confirmation email (no SMTP; could `print()` to logs)
- Auto-logout on inactivity
- Product image upload (use `image_url` string field instead)
- Product Compare feature

## DB Reset Procedure
Schema changes require DB reset (drops all data):
```bash
docker compose down -v
docker compose up --build