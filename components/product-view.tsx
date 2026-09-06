"use client";

import { Button, Textarea } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTruck,
} from "react-icons/fi";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
};

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  salePrice: string | null;
  stock: number;
  description: string;
  longDescription?: string | null;
  images: string[];
  category: { name: string; slug: string };
  reviews?: Review[];
};

export function ProductView({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/api/products/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProduct(data);
        if (data?.images?.length) setActiveImg(data.images[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const token = localStorage.getItem("epic-customer-token");
    if (!token) return;
    fetch(`${apiUrl}/api/wishlist`, { headers: { Authorization: "Bearer " + token } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Array<{ productId: string }>) => setWishlisted(list.some((i) => i.productId === product?.id)))
      .catch(() => {});
  }, [slug]);

  if (loading) {
    return (
      <main className="product-page" style={{ textAlign: "center", padding: "100px 0" }}>
        <p style={{ color: "var(--muted)" }}>Loading product details…</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-page" style={{ textAlign: "center", padding: "100px 0" }}>
        <h2>Product not found</h2>
        <Link href="/" className="back-link">
          <FiArrowLeft /> Return to store collection
        </Link>
      </main>
    );
  }

  const finalPrice = Number(product.salePrice ?? product.price);
  const hasSale = Boolean(product.salePrice && Number(product.salePrice) < Number(product.price));

  function addToCart(redirect = false) {
    if (!product) return;
    const old = JSON.parse(localStorage.getItem("epic-cart") ?? "[]");
    const existing = old.find((i: any) => i.id === product.id);

    const updated = existing
      ? old.map((i: any) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
      : [
          ...old,
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            images: product.images,
            price: finalPrice,
            categoryId: product.category.slug,
            qty,
          },
        ];

    localStorage.setItem("epic-cart", JSON.stringify(updated));

    if (redirect) {
      window.location.href = "/checkout";
    } else {
      window.location.href = "/";
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("epic-customer-token");
    if (!token) {
      toast.error("রিভিউ দিতে প্রথমে আপনার একাউন্টে সাইন ইন করুন");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${apiUrl}/api/products/${product!.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!res.ok) throw new Error("Review submission failed");
      toast.success("রিভিউটি সফলভাবে জমা হয়েছে! অনুমোদনের পর প্রদর্শিত হবে।");
      setComment("");
} catch {
      toast.error("রিভিউ সাবমিট করা যায়নি");
    } finally {
      setSubmittingReview(false);
    }
  }

  async function toggleWishlist() {
    if (!product) return;
    const token = localStorage.getItem("epic-customer-token");
    if (!token) {
      toast("প্রোডাক্টটি উইশলিস্টে রাখতে সাইন ইন করুন");
      window.location.href = "/account";
      return;
    }
    setWishlisted((prev) => !prev);
    const res = await fetch(`${apiUrl}/api/wishlist/${product.id}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    }).catch(() => null);
    if (!res || !res.ok) setWishlisted((prev) => !prev);
  }

  return (
    <main className="product-page">
      <Link href="/" className="back-link">
        <FiArrowLeft /> Back to collection
      </Link>

      <div className="product-detail">
        {/* Left Column: Image Showcase */}
        <div>
          <div className="detail-image">
            <Image
              src={activeImg || product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"}
              alt={product.name}
              fill
              sizes="50vw"
              priority
            />
          </div>

          {product.images.length > 1 && (
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              {product.images.map((imgUrl, index) => (
                <button
                  key={imgUrl + index}
                  onClick={() => setActiveImg(imgUrl)}
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: activeImg === imgUrl ? "2px solid var(--primary)" : "1px solid var(--border)",
                    cursor: "pointer",
                    padding: 0,
                    background: "none",
                  }}
                >
                  <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & CTA */}
        <div className="product-detail-info">
          <span className="eyebrow">{product.category.name}</span>
          <h1>{product.name}</h1>

          <div className="price-tag">
            {hasSale && <del>৳ {Number(product.price).toLocaleString("en-BD")}</del>}
            <span>৳ {finalPrice.toLocaleString("en-BD")}</span>
          </div>

          {product.stock > 0 ? (
            <div className="stock-badge">
              <span className="dot" /> In Stock ({product.stock} items available)
            </div>
          ) : (
            <div className="stock-badge" style={{ color: "#ef4444", background: "#fef2f2" }}>
              <span className="dot" style={{ background: "#ef4444" }} /> Out of stock
            </div>
          )}

          <p className="description">{product.description}</p>

          {product.longDescription && (
            <div
              style={{
                marginTop: "18px",
                paddingTop: "16px",
                borderTop: "1px dashed var(--border)",
                fontSize: "0.92rem",
                lineHeight: 1.7,
                color: "var(--ink-secondary)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "var(--ink)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Product Details
              </span>
              {product.longDescription.split("\n\n").map((para, i) => (
                <p key={i} style={{ margin: "0 0 10px" }}>
                  {para}
                </p>
              ))}
            </div>
          )}

          {/* Quantity Selector */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
              QUANTITY
            </label>
            <div className="qty-control" style={{ padding: "6px 14px" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <FiMinus />
              </button>
              <span style={{ fontSize: "1rem", minWidth: "30px", textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "36px" }}>
            <Button
              color="primary"
              size="lg"
              className="flex-1 font-bold shadow-lg"
              isDisabled={!product.stock}
              onPress={() => addToCart(true)}
            >
              Buy Now
            </Button>
            <Button
              variant="flat"
              size="lg"
              className="flex-1 font-bold"
              isDisabled={!product.stock}
              onPress={() => addToCart(false)}
            >
              <FiShoppingBag /> Add to Bag
            </Button>
            <Button
              variant="bordered"
              size="lg"
              aria-label="Add to wishlist"
              onPress={toggleWishlist}
              style={{ color: wishlisted ? "#ef4444" : "inherit", borderColor: wishlisted ? "#ef4444" : undefined }}
            >
              <FiHeart fill={wishlisted ? "#ef4444" : "none"} />
            </Button>
          </div>

          {/* Trust Highlights */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
              display: "grid",
              gap: "14px",
              fontSize: "0.88rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FiTruck style={{ color: "var(--primary)", fontSize: "1.2rem" }} />
              <span>Fast nationwide shipping in Bangladesh</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FiShield style={{ color: "var(--primary)", fontSize: "1.2rem" }} />
              <span>100% Genuine product guarantee</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FiCheckCircle style={{ color: "var(--primary)", fontSize: "1.2rem" }} />
              <span>Cash on delivery available at checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section style={{ marginTop: "60px", paddingTop: "40px", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.8rem", marginBottom: "24px" }}>
          Customer Reviews ({product.reviews?.length ?? 0})
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          {/* Reviews List */}
          <div style={{ display: "grid", gap: "16px" }}>
            {!product.reviews?.length ? (
              <p style={{ color: "var(--muted)" }}>No customer reviews yet. Be the first to leave a review!</p>
            ) : (
              product.reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    background: "var(--surface)",
                    padding: "18px",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "0.95rem" }}>{rev.user.name}</strong>
                    <div style={{ display: "flex", gap: "2px", color: "#f59e0b" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar key={star} fill={star <= rev.rating ? "#f59e0b" : "none"} style={{ fontSize: "0.9rem" }} />
                      ))}
                    </div>
                  </div>
                  {rev.comment && <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-secondary)" }}>{rev.comment}</p>}
                </div>
              ))
            )}
          </div>

          {/* Review Submission Form */}
          <form
            onSubmit={submitReview}
            style={{
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "24px",
              display: "grid",
              gap: "16px",
              height: "fit-content",
            }}
          >
            <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif" }}>Write a Review</h3>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
                RATING
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      border: 0,
                      background: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: star <= rating ? "#f59e0b" : "#cbd5e1",
                      fontSize: "1.5rem",
                    }}
                  >
                    <FiStar fill={star <= rating ? "#f59e0b" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Your Review Comment"
              placeholder="Tell others what you think about this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              minRows={3}
            />

            <Button type="submit" color="primary" isLoading={submittingReview} className="font-bold shadow-md">
              Submit Review
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
