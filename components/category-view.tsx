"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiShoppingBag, FiZap } from "react-icons/fi";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
type Product = { id: string; slug: string; name: string; price: string; salePrice: string | null; description?: string; images: string[]; productType?: string; category: { name: string; slug: string } };
type CartItem = { id: string; slug: string; name: string; images: string[]; price: number; categoryId: string; qty: number };
const money = (v: number | string) => "৳ " + Number(v).toLocaleString("en-BD");

export function CategoryView({ slug }: { slug: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>(slug.replaceAll("-", " "));
  const [loading, setLoading] = useState(true);
  const [allowAddToCart, setAllowAddToCart] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/products?category=${encodeURIComponent(slug)}`).then(r => r.json()),
      fetch(`${apiUrl}/api/categories`).then(r => r.json()),
      fetch(`${apiUrl}/api/store/status`).then(r => r.json())
    ]).then(([items, cats, status]: [Product[], { id: string; slug: string; name: string }[], { config?: { featureFlags?: { addToCart?: boolean } } }]) => {
      setProducts(items);
      const match = cats.find(c => c.slug === slug);
      if (match) setCategoryName(match.name);
      setAllowAddToCart(status?.config?.featureFlags?.addToCart !== false);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  function add(p: Product) {
    if (p.productType === "VARIABLE") {
      window.location.href = "/products/" + p.slug;
      return;
    }
    const price = Number(p.salePrice ?? p.price);
    const old = JSON.parse(localStorage.getItem("epic-cart") ?? "[]");
    const hit = old.find((i: CartItem) => i.id === p.id);
    localStorage.setItem("epic-cart", JSON.stringify(hit ? old.map((i: CartItem) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...old, { id: p.id, slug: p.slug, name: p.name, images: p.images, price, categoryId: p.category.slug, qty: 1 }]));
    window.location.href = "/#shop";
  }

  function buyNow(p: Product) {
    add(p);
    window.location.href = "/checkout";
  }

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center animate-pulse">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-cyan animate-spin" />
          </div>
          <p className="eyebrow">CATEGORY</p>
          <p className="muted">Loading this collection…</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-between gap-3 px-[6vw] pt-8 max-w-[1400px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <FiArrowLeft /> Collection
        </Link>
        <span className="font-mono text-[0.75rem] tracking-widest text-slate-400 uppercase">
          Home <span className="mx-1 text-slate-300">/</span> Shop <span className="mx-1 text-slate-300">/</span>{" "}
          <span className="text-primary">{categoryName}</span>
        </span>
      </nav>

      <section className="relative overflow-hidden px-[6vw] pt-10 pb-6 max-w-[1400px] mx-auto">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-gradient-to-br from-primary/15 to-cyan/15 blur-3xl"
        />
        <div className="relative">
          <span className="eyebrow">COLLECTION</span>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              {categoryName}
            </h1>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-mono text-sm font-semibold text-slate-500 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-cyan" />
              {products.length} {products.length === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="muted mt-3 max-w-lg">
            Explore every product in this collection — handpicked quality, honest prices.
          </p>
        </div>
      </section>

      <section className="catalog pt-4">
        {products.length ? (
          <div className="product-grid">
            {products.map(p => {
              const hasSale = Boolean(p.salePrice && Number(p.salePrice) < Number(p.price));
              return (
                <article className="product-card" key={p.id}>
                  <Link href={`/products/${p.slug}`} className="product-image">
                    <Image src={p.images[0]} alt={p.name} fill sizes="(max-width: 650px) 100vw, 33vw" />
                    {hasSale && <span className="sale-tag">SALE</span>}
                  </Link>
                  <div className="product-info">
                    <span className="category-label">{p.category.name}</span>
                    <h3>{p.name}</h3>
                    {p.description && <p className="product-card-desc">{p.description}</p>}
                    <div className="product-meta">
                      <div className="price">
                        {hasSale && <del>{money(p.price)}</del>}
                        {money(p.salePrice ?? p.price)}
                      </div>
                      <button className={`add-bag-btn ${allowAddToCart ? "" : "order-now-btn"}`} onClick={() => (allowAddToCart ? add(p) : buyNow(p))}>
                        {allowAddToCart ? (
                          <>
                            <FiShoppingBag /> Add
                          </>
                        ) : (
                          <>
                            <FiZap /> Order Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-8 py-20 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
              <FiShoppingBag size={22} />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">No products in this category yet</h3>
            <p className="muted mt-1">We are restocking soon. Check back later.</p>
            <Link
              href="/#shop"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              Browse all products <FiArrowLeft className="rotate-180" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}