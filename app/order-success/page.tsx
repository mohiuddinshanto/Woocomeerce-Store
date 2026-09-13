"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiCheckCircle, FiChevronRight, FiClock, FiCreditCard, FiPackage, FiUser } from "react-icons/fi";
import { SiteHeader } from "../../components/site-header";

type LastOrder = {
  id?: string;
  total?: number;
  paymentMethod?: string;
  placedAt?: string;
};

const money = (value: number) => "৳ " + value.toLocaleString("en-BD");

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("epic-last-order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <main className="order-success-page">
      <SiteHeader />

      <section className="order-success-body">
        <div className="order-success-card">
          <div className="success-badge">
            <FiCheckCircle size={38} />
          </div>
          <span className="eyebrow">THANK YOU</span>
          <h1>Order placed successfully!</h1>
          <p className="order-success-sub">
            {order?.id
              ? <>Your order <strong className="order-id">#{order.id.slice(0, 8).toUpperCase()}</strong> has been received. A confirmation email is on its way if you provided one.</>
              : <>Your order has been received. A confirmation email is on its way.</>}
          </p>

          {order && (
            <div className="order-success-meta">
              <div className="meta-item">
                <FiClock />
                <span>Placed</span>
                <strong>{order.placedAt ? new Date(order.placedAt).toLocaleString("en-GB") : "Just now"}</strong>
              </div>
              <div className="meta-item">
                <FiCreditCard />
                <span>Payment</span>
                <strong>{order.paymentMethod ?? "Cash on delivery"}</strong>
              </div>
              <div className="meta-item">
                <FiPackage />
                <span>Total</span>
                <strong>{money(order.total ?? 0)}</strong>
              </div>
            </div>
          )}

          <div className="order-success-note">
            <FiUser />
            <span>Track your order anytime from your profile. Our team will confirm your delivery soon.</span>
          </div>

          <div className="order-success-actions">
            <Link href="/account" className="btn-primary">
              My Orders — Track Delivery <FiChevronRight />
            </Link>
            <Link href="/" className="btn-ghost">
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}