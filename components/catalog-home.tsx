"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiChevronLeft, FiChevronRight, FiShoppingBag, FiArrowRight, FiCheck, FiTruck, FiRefreshCw, FiShield, FiMessageCircle } from "react-icons/fi";
import { CarouselSlider } from "./carousel-slider";

const money = (v: number | string) => `৳ ${Number(v).toLocaleString("en-BD")}`;

const FALLBACK =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  salePrice: string | null;
  description?: string;
  images: string[];
  categoryId: string;
  productType?: string;
  category: { id?: string; name: string; slug: string };
  attributes?: { id: string; name: string; values: { id: string; value: string }[] }[];
  variations?: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    salePrice: number | null;
    stock: number;
    image: string | null;
    attributes: { attributeId: string; valueId: string; value: { value: string } }[];
  }[];
};

type Variation = NonNullable<Product["variations"]>[number];

type Category = { id: string; name: string; slug: string; parentId?: string | null; subCategories?: Category[] };

type HeroSlide = {
  id: string;
  image: string;
  badge: string | null;
  title: string | null;
  accent: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
  buttonLink: string | null;
  secondaryLabel: string | null;
  secondaryLink: string | null;
};

const scrollToId = (link: string) => document.getElementById(link.replace(/^#/, ""))?.scrollIntoView({ behavior: "smooth" });

const CTA = ({ label, href, primary }: { label: string; href?: string; primary?: boolean }) => {
  const text = label || (primary ? "এখনই কিনুন" : "কালেকশন দেখুন");
  const base = primary
    ? "inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-7 py-3 rounded-full text-sm transition shadow hover:shadow-lg transform active:scale-95"
    : "inline-flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-full text-xs transition shadow-sm hover:shadow active:scale-95";
  if (href) {
    if (href.startsWith("#")) return <button className={base} onClick={() => scrollToId(href)}>{text} <FiArrowRight size={14} /></button>;
    const isExternal = /^https?:/.test(href);
    return <Link href={href} className={base} target={isExternal ? "_blank" : undefined}>{text} <FiArrowRight size={14} /></Link>;
  }
  return <button className={base} onClick={() => scrollToId("#shop")}>{text} <FiArrowRight size={14} /></button>;
};

function CatalogCard({
  p,
  allowAddToCart,
  add,
  buyNow,
  whatsapp,
}: {
  p: Product;
  allowAddToCart: boolean;
  add: (p: Product, variation?: Variation) => void;
  buyNow: (p: Product, variation?: Variation) => void;
  whatsapp: string | null;
}) {
  const img = p.images?.[0] || FALLBACK;
  const hasSale = Boolean(p.salePrice && Number(p.salePrice) < Number(p.price));
  const salePrice = hasSale ? Number(p.salePrice) : null;
  const price = Number(p.price);
  const isVariable = p.productType === "VARIABLE" && (p.variations?.length ?? 0) > 0;
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const sizeAttr = (p.attributes ?? []).find((a) => /size|সাইজ/i.test(a.name));
  const sizes = sizeAttr?.values.map((v) => v.value) ?? [];

  const selectedVariation = isVariable && selectedSize
    ? (p.variations ?? []).find((v) =>
        v.attributes.some(
          (va) => /size|সাইজ/i.test(sizeAttr?.name ?? "") && va.value.value === selectedSize
        )
      )
    : null;

  const displayPrice = selectedVariation
    ? (selectedVariation.salePrice && selectedVariation.salePrice < selectedVariation.price)
      ? selectedVariation.salePrice
      : selectedVariation.price
    : (salePrice ?? price);
  const displayOriginal = selectedVariation
    ? (selectedVariation.salePrice && selectedVariation.salePrice < selectedVariation.price)
      ? selectedVariation.price
      : null
    : (hasSale ? price : null);

  const handleAddToCart = () => {
    if (!allowAddToCart) return;
    if (isVariable) {
      if (selectedVariation) {
        if (selectedVariation.stock <= 0) { toast.error("এই সাইজ স্টকে নেই"); return; }
        add(p, selectedVariation);
      } else if (sizes.length > 0) {
        toast.error("প্রথমে একটি সাইজ সিলেক্ট করুন");
      } else {
        add(p);
      }
    } else {
      add(p);
    }
  };

  const handleBuyNow = () => {
    if (isVariable) {
      if (selectedVariation) {
        if (selectedVariation.stock <= 0) { toast.error("এই সাইজ স্টকে নেই"); return; }
        buyNow(p, selectedVariation);
      } else if (sizes.length > 0) {
        toast.error("প্রথমে একটি সাইজ সিলেক্ট করুন");
      } else {
        buyNow(p);
      }
    } else {
      buyNow(p);
    }
  };

  const waHref = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(`আমি ${p.name}${selectedSize ? ` (সাইজ: ${selectedSize})` : ""} (${money(displayPrice)}) নিতে চাই।`)}`
    : null;

  return (
    <div className="flex w-[270px] min-w-[270px] sm:w-[290px] sm:min-w-[290px] max-w-[290px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-xl">
      <div>
        <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-xl bg-gray-100 group">
          <span className="absolute left-2.5 top-2.5 z-10 rounded bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-gray-800 shadow-sm backdrop-blur-sm">
            {p.category.name}
          </span>
          {hasSale && (
            <span className="absolute right-2.5 top-2.5 z-10 rounded bg-rose-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              ছাড়
            </span>
          )}
          <Link href={`/products/${p.slug}`} className="block h-full w-full">
            <Image
              src={img}
              alt={p.name}
              fill
              sizes="290px"
              className="object-cover object-top transition duration-500 group-hover:scale-105"
            />
          </Link>
        </div>
        <Link href={`/products/${p.slug}`} className="mb-1 block text-base font-bold leading-snug text-gray-900 line-clamp-1 hover:text-brand-green">
          {p.name}
        </Link>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">{money(displayPrice)}</span>
          {displayOriginal && <span className="text-xs text-gray-400 line-through">{money(displayOriginal)}</span>}
        </div>

        {sizes.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-gray-600">
              সাইজ সিলেক্ট করুন:
              {selectedSize && <span className="ml-1 font-bold text-[#093d2b]">({selectedSize})</span>}
            </p>
            <div className="flex items-center gap-1.5">
              {sizes.map((size) => {
                const sizeVariation = (p.variations ?? []).find((v) =>
                  v.attributes.some((va) => va.value.value === size)
                );
                const outOfStock = sizeVariation ? sizeVariation.stock <= 0 : false;
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`flex-1 rounded py-1.5 text-center text-xs font-semibold transition
                      ${outOfStock
                        ? isSelected
                          ? "border-2 border-gray-400 bg-gray-300 text-white shadow-sm"
                          : "border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-gray-400"
                        : isSelected
                          ? "border-2 border-[#093d2b] bg-[#093d2b] text-white shadow-sm"
                          : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-[#093d2b] hover:bg-emerald-50"
                      }`}
                  >
                    {size}{outOfStock ? " ✕" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#093d2b] px-3 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#0c4e37] hover:shadow-md active:scale-[0.98]"
        >
          <span className="text-sm text-amber-400">⚡</span>
          <span>সরাসরি অর্ডার করুন</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!allowAddToCart}
            className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition ${
              !allowAddToCart
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            <FiShoppingBag size={13} /> কার্টে রাখুন
          </button>
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              <FiMessageCircle size={13} /> হোয়াটসঅ্যাপ
            </a>
          ) : (
            <span className="flex items-center justify-center rounded-lg border border-gray-100 bg-gray-50 py-2 text-xs text-gray-400">
              <FiMessageCircle size={13} /> হোয়াটসঅ্যাপ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogHome({
  products,
  categories,
  heroSlides,
  allowAddToCart,
  whatsapp,
  add,
  buyNow,
}: {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  allowAddToCart: boolean;
  whatsapp: string | null;
  add: (p: Product, variation?: Variation) => void;
  buyNow: (p: Product, variation?: Variation) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const rootCats = categories.filter((c) => !c.parentId);
  const catCounts = rootCats.map((c) => ({
    ...c,
    count: products.filter((p) => p.categoryId === c.id).length,
  }));
  const tabCats = catCounts.filter((c) => c.count > 0);
  const filteredProducts =
    activeTab === "all" ? products : products.filter((p) => p.categoryId === activeTab);

  const categorySliders = tabCats.slice(0, 4).map((c) => ({
    ...c,
    items: products.filter((p) => p.categoryId === c.id),
  }));

  const img = (p: Product) => p.images?.[0] || FALLBACK;

  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        <div className="overflow-hidden rounded-2xl shadow-xl">
          <CarouselSlider
            items={heroSlides.map((s) => (
              <div key={s.id} className="relative flex min-h-[420px] items-center overflow-hidden bg-gradient-to-r from-[#031d14] via-[#093d2b] to-[#12573d] text-white md:min-h-[480px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.title || "Banner"} className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <div className="relative z-10 grid w-full items-center gap-6 px-8 py-8 md:grid-cols-12 md:px-14">
                  <div className="space-y-4 md:col-span-7">
                    {s.badge && <p className="text-sm font-medium tracking-wide text-amber-300">{s.badge}</p>}
                    <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                      {s.title || "প্রতিটি মুহূর্তে"} <br />
                      <span className="text-amber-400">{s.accent || "স্টাইলের সঙ্গী"}</span>
                    </h1>
                    {s.subtitle && (
                      <p className="flex flex-wrap items-center gap-2 text-xs text-emerald-100/80 font-light md:text-sm">
                        {s.subtitle.split("|").map((t, i) => (
                          <span key={i} className="flex items-center gap-2">
                            {i > 0 && <span className="opacity-50">|</span>}
                            {t.trim()}
                          </span>
                        ))}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 pt-3">
                      <CTA label={s.buttonLabel ?? ""} href={s.buttonLink ?? "#shop"} primary />
                      <CTA label={s.secondaryLabel ?? ""} href={s.secondaryLink ?? "#categories"} />
                    </div>
                  </div>
                  <div className="relative flex justify-center md:col-span-5 md:justify-end">
                    <div className="relative max-w-xs w-full md:max-w-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.image}
                        alt="Banner"
                        className="h-72 w-full rounded-xl object-cover object-top shadow-2xl md:h-96"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            seconds={5}
            auto={heroSlides.length > 1}
            loop={heroSlides.length > 1}
            perView={{ mobile: 1, tablet: 1, desktop: 1 }}
            pagination={heroSlides.length > 1}
            ariaLabel="Hero banner carousel"
          />
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#093d2b]">
              <FiShoppingBag size={18} />
            </span>
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">ক্যাটাগরি সমূহ</h2>
          </div>
          <Link href="#shop" className="flex items-center gap-1 text-sm font-semibold text-[#093d2b] hover:underline">
            সকল দেখুন <span>→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {catCounts.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div className="relative mb-2.5 aspect-square overflow-hidden rounded-lg bg-emerald-50">
                <Image
                  src={img(products.find((p) => p.categoryId === c.id) ?? { images: [] } as any)}
                  alt={c.name}
                  fill
                  sizes="200px"
                  className="rounded-lg object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="truncate text-xs font-bold text-gray-800 group-hover:text-[#093d2b] sm:text-sm">{c.name}</h3>
              <p className="text-[11px] text-gray-400">({c.count} টি)</p>
            </Link>
          ))}
        </div>
      </section>

      {/* POPULAR PRODUCTS */}
      <section id="shop" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-amber-700 sm:text-sm">আমাদের জনপ্রিয় কালেকশন</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">স্টোরের সেরা পণ্য সমূহ</h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            <button
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${activeTab === "all" ? "border-[#093d2b] bg-[#093d2b] text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"}`}
              onClick={() => setActiveTab("all")}
            >
              সবগুলো
            </button>
            {tabCats.map((c) => (
              <button
                key={c.id}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${activeTab === c.id ? "border-[#093d2b] bg-[#093d2b] text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"}`}
                onClick={() => setActiveTab(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <CarouselSlider
          items={filteredProducts.slice(0, 8).map((p) => (
            <CatalogCard key={p.id} p={p} add={add} buyNow={buyNow} allowAddToCart={allowAddToCart} whatsapp={whatsapp} />
          ))}
          seconds={5}
          auto
          loop
          perView={{ mobile: 1, tablet: 2, desktop: 4 }}
          pagination
          ariaLabel="Popular products"
        />
      </section>

      {/* CATEGORY SLIDERS */}
      {categorySliders.map((c) => (
        <section key={c.id} className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-5 flex items-end justify-between border-b border-gray-100 pb-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">{c.name} কালেকশন</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{c.name}</h2>
            </div>
            <Link href={`/categories/${c.slug}`} className="mr-2 text-xs font-semibold text-[#093d2b] hover:underline sm:text-sm">
              সবগুলো দেখুন →
            </Link>
          </div>
          <CarouselSlider
            items={c.items.map((p) => (
              <CatalogCard key={p.id} p={p} add={add} buyNow={buyNow} allowAddToCart={allowAddToCart} whatsapp={whatsapp} />
            ))}
            seconds={4}
            auto
            loop
            perView={{ mobile: 1, tablet: 2, desktop: 3 }}
            pagination
            ariaLabel={`${c.name} collection`}
          />
        </section>
      ))}

      {/* TRUST */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid grid-cols-1 gap-6 rounded-xl border border-emerald-100 bg-emerald-50/70 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <FiShield size={22} />, title: "১০০% অরিজিনাল পণ্য", sub: "নকল পণ্যের সাথে আপস নয়" },
            { icon: <FiTruck size={22} />, title: "সারা বাংলাদেশে ডেলিভারি", sub: "দ্রুত ও নিরাপদ ডেলিভারি" },
            { icon: <FiRefreshCw size={22} />, title: "সহজ রিটার্ন পলিসি", sub: "৭ দিনের মধ্যে রিটার্ন সুবিধা" },
            { icon: <FiCheck size={22} />, title: "নিরাপদ পেমেন্ট", sub: "ক্যাশ অন ডেলিভারি / বিকাশ / ব্যাংক" },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#093d2b] text-white">
                {t.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t.title}</h4>
                <p className="text-xs text-gray-500">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROMO */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-100 to-amber-50 p-6 shadow-sm sm:p-8">
            <div className="z-10 max-w-[60%] space-y-2">
              <span className="rounded bg-amber-200/70 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900">বিশেষ কালেকশন</span>
              <h3 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
                ঈদে পরুন <br /><span className="text-[#093d2b]">ঐতিহ্যের ছোঁয়া</span>
              </h3>
              <p className="text-xs text-gray-600">বিশেষ ডিজাইনের পণ্য এখন আপনার জন্য</p>
              <div className="pt-2">
                <Link href="#shop" className="inline-flex items-center gap-1.5 rounded-full bg-[#093d2b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0c4e37]">
                  কালেকশন দেখুন →
                </Link>
              </div>
            </div>
            <div className="relative h-40 w-32 shrink-0 sm:h-48 sm:w-44">
              <Image
                src={products[0]?.images[0] || FALLBACK}
                alt="Promo 1"
                fill
                sizes="180px"
                className="rounded-xl object-cover shadow-md"
              />
            </div>
          </div>
          <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-100/70 to-emerald-50 p-6 shadow-sm sm:p-8">
            <div className="relative h-40 w-32 shrink-0 sm:h-48 sm:w-44">
              <Image
                src={products[1]?.images[0] || products[0]?.images[0] || FALLBACK}
                alt="Promo 2"
                fill
                sizes="180px"
                className="rounded-xl object-cover shadow-md"
              />
            </div>
            <div className="z-10 max-w-[60%] space-y-2 text-right">
              <span className="rounded bg-emerald-200/70 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-900">একই ডিজাইনে</span>
              <h3 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
                এক্সক্লুসিভ সেট <br /><span className="text-amber-700">সেট পণ্য</span>
              </h3>
              <p className="text-xs text-gray-600">আকর্ষণীয় মূল্যে কম্বো অফার</p>
              <div className="flex justify-end pt-2">
                <Link href="#shop" className="inline-flex items-center gap-1.5 rounded-full bg-[#093d2b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0c4e37]">
                  সেট দেখুন →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
