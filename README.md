<div align="center">

# 🛍️ Woocommerce Store — Frontend

**A modern, blazing-fast e-commerce storefront built with Next.js 15 + React 19 + Tailwind CSS v4**

Live-like beauty, admin-driven design — everything you change in the admin panel reflects instantly across the whole store.

</div>

---

## ✨ Highlights

- 🎨 **Two store layouts in one** — switch between a classic landing-style home and a modern catalog grid from the admin; the **entire store brand color follows the layout** (indigo for *classic*, forest green for *catalog*).
- 🏠 **Rich storefront home** — hero, featured products, categories, banners, promo sections, countdown deals, testimonials, newsletter.
- 🛒 **Dedicated `/shop` page** — search, filters, sorting, chips, grid + list views, with product cards reused from the active home layout.
- 📦 **Product pages** — gallery, variations, reviews & ratings, "order on WhatsApp", buy now.
- 🧾 **Full checkout & orders** — address + payment method, order-success screen.
- 👤 **Customer accounts** — sign-up / sign-in, order history, wishlist, review writing.
- 🛠 **Admin panel** (`/admin`) — manage products, categories, orders, coupons, reviews, staff, uploads & store config.
- 🎬 **One-time onboarding wizard** across your first run.
- 💬 **Floating chat widget** — WhatsApp (auto-formatting number), Facebook Messenger & call buttons.
- 📱 **Global mobile bottom navigation** — toggleable from the admin via a feature flag.

## 🧰 Tech Stack

| | |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [HeroUI](https://heroui.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Animations | [Framer Motion](https://www.framer.com/motion/), [Swiper](https://swiperjs.com) |
| Notifications | [react-hot-toast](https://react-hot-toast.com) |
| Icons | [react-icons](https://react-icons.github.io/react-icons/) |
| Language | TypeScript |

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- The [backend API](https://github.com/mohiuddinshanto/Woocommerce-Store-Backend) running and reachable

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and point it at your backend API:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run

```bash
npm run dev        # http://localhost:3000
```

### 4. Build for production

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
app/
├─ page.tsx                 # Home (classic / catalog layouts)
├─ shop/page.tsx            # Shop browser (SSR initial layout — no theme flash)
├─ products/[slug]/page.tsx # Product detail
├─ categories/[slug]/page.tsx
├─ checkout/page.tsx
├─ order-success/page.tsx
├─ account/page.tsx
├─ admin/page.tsx           # Admin dashboard
├─ onboarding/page.tsx      # First-run wizard
└─ layout.tsx              # Root layout (inline theme tokens + global StoreTheme)

components/
├─ storefront.tsx           # Classic home + hero, nav, chat widget
├─ catalog-home.tsx         # Catalog (grid) home + CatalogCard
├─ shop-view.tsx            # Shop page logic (filters/cards/list view)
├─ product-view.tsx         # Product detail + reviews
├─ category-view.tsx
├─ store-theme.tsx          # Global layout-aware brand color engine
├─ store-bottom-nav.tsx     # Mobile bottom navigation
├─ admin-panel.tsx          # Full admin interface
├─ account-panel.tsx
└─ site-header.tsx

lib/
└─ wa.ts                    # WhatsApp number → wa.me normalization
```

## 🎨 Theming

- Root `<body>` receives inline CSS variables (`--primary`, `--color-primary`, …) from the admin's theme settings.
- `StoreTheme` watches the admin **Home Layout** and re-applies the palette globally (`classic` → indigo, `catalog` → green) without a page reload.
- `/admin` and `/onboarding` always keep their own palette so management stays distraction-free.

## ✅ Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with `next lint` |

---

<div align="center">

Made with ❤️ · [Open an issue](https://github.com/mohiuddinshanto/Woocomeerce-Store/issues)

</div>