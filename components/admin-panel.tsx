"use client";

import { Button, Input, Select, SelectItem, Switch, Textarea } from "@heroui/react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiStar, FiTrash2, FiX } from "react-icons/fi";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Config = {
  storeName: string;
  featureFlags: { cod: boolean; reviews: boolean; wishlist: boolean; coupons: boolean; addToCart: boolean };
  paymentConfig?: {
    bkash?: { enabled: boolean; mode?: string; callbackUrl?: string; appKey?: string; appSecret?: string; username?: string; password?: string };
    nagad?: { enabled: boolean; mode?: string; callbackUrl?: string; merchantId?: string; merchantNumber?: string; privateKey?: string };
    sslcommerz?: { enabled: boolean; mode?: string; callbackUrl?: string; sandbox?: boolean; storeId?: string; storePassword?: string };
  };
  emailConfig?: { host: string; port: number; user: string; pass: string; fromEmail: string };
  courierConfig?: {
    steadfast?: { enabled: boolean; apiKey?: string; secretKey?: string };
    pathao?: { enabled: boolean; clientId?: string; clientSecret?: string; clientEmail?: string };
    redx?: { enabled: boolean; apiKey?: string };
  };
  aiConfig?: { provider: string; apiKey: string; systemPromptOverride?: string };
  emailConfigured: boolean;
  courierConfigured: boolean;
  storageConfigured: boolean;
  storageConfig?: {
    provider: "local" | "hostinger-object-storage";
    folderPath?: string;
    publicBaseUrl?: string;
    endpoint?: string;
    region?: string;
    bucket?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  enableIpLimit: boolean;
  cooldownMinutes: number;
  marketingPixels?: { googleAnalyticsId?: string; metaPixelId?: string; tiktokPixelId?: string; gtmId?: string };
  chatConfig?: { whatsapp?: { enabled?: boolean; number?: string; template?: string }; messenger?: { enabled?: boolean; url?: string }; phone?: string };
  homePageConfig?: { sections: HomeSectionDef[] };
};

type HomeSectionDef = {
  id: string;
  title?: string;
  categoryIds: string[];
  mode: "carousel" | "grid" | "responsive";
  auto: boolean;
  seconds: number;
  perView: { mobile: number; tablet: number; desktop: number };
  pagination: boolean;
  loop: boolean;
  showViewAll: boolean;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  salePrice: string | null;
  stock: number;
  images: string[];
  isActive: boolean;
  showOnHome: boolean;
  category: { name: string };
};

type Order = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  paymentStatus: string;
  customerId: string | null;
  shippingDetails: { name?: string; phone?: string; address?: string; district?: string } | null;
  courierName?: string;
  courierTrackingId?: string;
};

type Category = { id: string; name: string; slug: string; parentId?: string | null; subCategories?: Category[] };
type Coupon = { id: string; code: string; type: string; value: string; minSpend?: string; usedCount: number; isActive: boolean };
type Review = { id: string; rating: number; comment?: string; isApproved: boolean; product: { name: string }; user: { name: string; email: string } };
type StaffUser = { id: string; name: string; email: string; staffType: string; allowedCategories?: string };

const money = (value: number | string) => "৳ " + Number(value).toLocaleString("en-BD");
const tokenKey = "epic-admin-token";

const api = (path: string, token: string, init?: RequestInit) =>
  fetch(apiUrl + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber/10 text-amber",
  CONFIRMED: "bg-primary/10 text-primary",
  PACKED: "bg-cyan/10 text-cyan",
  SHIPPED: "bg-blue-500/10 text-blue-500",
  DELIVERED: "bg-emerald/10 text-emerald",
  CANCELLED: "bg-rose-100 dark:bg-rose-500/10 text-rose-500",
  RETURNED: "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-slate-400",
};

const statusPill = (status: string) => STATUS_COLORS[status] ?? "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-slate-400";

type Section = "overview" | "products" | "categories" | "orders" | "coupons" | "reviews" | "staff" | "home" | "marketing" | "features" | "payments" | "delivery" | "storage";

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "◈" },
  { key: "products", label: "Products", icon: "▦" },
  { key: "categories", label: "Categories", icon: "▤" },
  { key: "orders", label: "Orders", icon: "⊞" },
  { key: "coupons", label: "Coupons", icon: "℅" },
  { key: "reviews", label: "Reviews", icon: "★" },
  { key: "staff", label: "Staff Team", icon: "◉" },
  { key: "home", label: "Home Layout", icon: "⌂" },
  { key: "marketing", label: "Pixels & Chat", icon: "⬡" },
  { key: "features", label: "Store Features", icon: "⊕" },
  { key: "payments", label: "Payments", icon: "¢" },
  { key: "delivery", label: "Delivery", icon: "◫" },
  { key: "storage", label: "Storage", icon: "▣" },
];

const title = (section: Section) => NAV.find((n) => n.key === section)?.label ?? "";

const categoryOptions = (categories: Category[]) =>
  categories
    .filter((c) => !c.parentId)
    .flatMap((c) => [c, ...(c.subCategories ?? categories.filter((s) => s.parentId === c.id))]);

export function AdminPanel() {
  const [token, setToken] = useState("");
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(tokenKey);
    if (saved) {
      setToken(saved);
      load(saved);
    }
  }, []);

  async function load(current = token) {
    const response = await api("/api/admin/config", current);
    if (!response.ok) {
      localStorage.removeItem(tokenKey);
      setToken("");
      return;
    }
    setConfig(await response.json());
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(apiUrl + "/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const data = await response.json();
    if (!response.ok || (data.user?.role !== "ADMIN" && data.user?.role !== "STAFF"))
      return toast.error("Admin or Staff account required");
    localStorage.setItem(tokenKey, data.token);
    setToken(data.token);
    load(data.token);
  }

  async function save(payload: object) {
    setSaving(true);
    try {
      const response = await api("/api/admin/config", token, { method: "PATCH", body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setConfig(data);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (!token || !config) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#09090f] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/6 p-8 shadow-xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan flex items-center justify-center text-white font-display font-bold text-2xl shadow-lg shadow-primary/30 mb-4">
              A
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Control Dashboard</h1>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Enter your admin credentials to manage store catalog and orders.
            </p>
          </div>

          <form onSubmit={login} className="flex flex-col gap-4">
            <Input isRequired name="email" type="email" label="Admin email" placeholder="admin@store.com" />
            <Input isRequired name="password" type="password" label="Password" placeholder="••••••••" />
            <Button
              type="submit"
              className="h-11 bg-gradient-to-r from-primary to-indigo-500 text-white font-display font-bold rounded-xl shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
            >
              Open Control Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const flags = config.featureFlags;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-[#09090f]">
      {/* SIDEBAR */}
      <aside
        className={`${collapsed ? "w-16" : "w-60"} shrink-0 flex flex-col bg-white dark:bg-[#0d0d1a] border-r border-gray-200 dark:border-white/5 transition-all duration-300 overflow-hidden`}
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200 dark:border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan flex items-center justify-center text-white font-display font-bold text-sm shrink-0 shadow-lg shadow-primary/20">
            A
          </div>
          {!collapsed && (
            <div>
              <p className="font-display font-bold text-gray-900 dark:text-white text-sm leading-tight">{config.storeName}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Admin Control Panel</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSection(item.key);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                section === item.key
                  ? "bg-primary/10 text-primary"
                  : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              <span className={`text-base shrink-0 transition-transform group-hover:scale-110 ${section === item.key ? "text-primary" : ""}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {!collapsed && section === item.key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          ))}
        </nav>

        <div className="m-2 border-t border-gray-100 dark:border-white/6 pt-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm border border-gray-200 dark:border-white/8"
          >
            <span className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>◁</span>
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR */}
        <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#0d0d1a]/80 glass border-b border-gray-200 dark:border-white/5 shrink-0">
          <div>
            <h1 className="font-display font-bold text-lg text-gray-900 dark:text-white capitalize">{title(section)}</h1>
            <p className="text-xs text-gray-400 dark:text-slate-500">{config.storeName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="flat"
              color="danger"
              onPress={() => {
                localStorage.removeItem(tokenKey);
                setToken("");
              }}
            >
              Sign out
            </Button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center text-white text-[10px] font-bold">
                A
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-slate-300">Admin</span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {section === "overview" && <AdminOverview token={token} />}
          {section === "products" && <AdminProducts token={token} />}
          {section === "categories" && <AdminCategories token={token} />}
          {section === "orders" && <AdminOrders token={token} />}
          {section === "coupons" && <AdminCoupons token={token} />}
          {section === "reviews" && <AdminReviews token={token} />}
          {section === "staff" && <AdminStaff token={token} />}
          {section === "home" && <HomeLayoutSettings config={config} save={save} saving={saving} />}
          {section === "marketing" && <MarketingChatSettings config={config} save={save} saving={saving} />}
          {section === "features" && <FeatureSettings config={config} save={save} saving={saving} />}
{section === "payments" && <PaymentSettings config={config} save={save} saving={saving} />}
        {section === "delivery" && <DeliverySettings config={config} save={save} saving={saving} />}
          {section === "storage" && <StorageSettings save={save} saving={saving} configured={config.storageConfigured} storage={config.storageConfig} />}
        </div>
      </div>
    </div>
  );
}

/* ==================== OVERVIEW ==================== */
function AdminOverview({ token }: { token: string }) {
  const [data, setData] = useState<{ products: number; orders: number; customers: number; paidRevenue: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => {
    api("/api/admin/dashboard", token)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
    api("/api/admin/orders", token)
      .then((r) => r.json())
      .then((res) => Array.isArray(res) && setOrders(res))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [token]);

  async function updateOrderStatus(id: string, status: string, paymentStatus: string) {
    try {
      const res = await api(`/api/admin/orders/${id}`, token, { method: "PATCH", body: JSON.stringify({ status, paymentStatus }) });
      if (res.ok) {
        toast.success("অর্ডার স্ট্যাটাস আপডেট হয়েছে");
        load();
      }
    } catch {
      toast.error("আপডেট করা যায়নি");
    }
  }

  const KPI = [
    { label: "Active Products", value: data ? String(data.products) : "—", icon: "▦", color: "from-primary to-indigo-400" },
    { label: "Total Orders", value: data ? String(data.orders) : "—", icon: "⊞", color: "from-cyan to-teal-400" },
    { label: "Customers", value: data ? String(data.customers) : "—", icon: "◉", color: "from-violet-500 to-purple-400" },
    { label: "Paid Revenue", value: data ? money(data.paidRevenue) : "—", icon: "¢", color: "from-amber to-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI.map((k) => (
          <div key={k.label} className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-5 hover:border-primary/20 transition-colors">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-white text-lg shadow-lg mb-3`}>
              {k.icon}
            </div>
            <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-900 dark:text-white">Recent Orders</h3>
          <span className="text-xs text-gray-400 dark:text-slate-500">Manage status & payment</span>
        </div>

        {!orders.length ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">No orders placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/8">
                  {["Order", "Customer", "Date", "Total", "Payment", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/4">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-primary font-bold">#{order.id.slice(0, 8)}</td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-gray-800 dark:text-slate-200 text-xs">{order.shippingDetails?.name ?? "Guest"}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">{order.shippingDetails?.phone}</p>
                    </td>
                    <td className="py-3 px-3 text-gray-400 dark:text-slate-500 text-xs whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-xs text-gray-800 dark:text-slate-200">{money(order.totalAmount)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.paymentStatus === "PAID" ? "bg-emerald/10 text-emerald" : "bg-amber/10 text-amber"}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusPill(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Select
                          size="sm"
                          aria-label="Order status"
                          selectedKeys={[order.status]}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value, order.paymentStatus)}
                          className="w-32"
                        >
                          {["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
                            <SelectItem key={s}>{s}</SelectItem>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          variant={order.paymentStatus === "PAID" ? "solid" : "flat"}
                          color={order.paymentStatus === "PAID" ? "success" : "warning"}
                          onPress={() => updateOrderStatus(order.id, order.status, order.paymentStatus === "PAID" ? "UNPAID" : "PAID")}
                        >
                          {order.paymentStatus === "PAID" ? "Paid" : "Mark Paid"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== PRODUCTS ==================== */
function AdminProducts({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showOnHome, setShowOnHome] = useState(true);

  const load = () =>
    Promise.all([
      api("/api/admin/products", token).then((r) => r.json()),
      api("/api/admin/categories", token).then((r) => r.json()),
    ])
      .then(([p, c]) => {
        if (Array.isArray(p)) setProducts(p);
        if (Array.isArray(c)) setCategories(c);
      })
      .catch(() => {});

  useEffect(() => {
    load();
  }, [token]);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  async function pickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    setUploading(true);
    toast("Uploading image…");
    try {
      const response = await fetch(apiUrl + "/api/admin/upload", { method: "POST", headers: { Authorization: "Bearer " + token }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setImages((current) => [...current, data.url]);
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
    event.target.value = "";
  }

  function removeImage(urlToRemove: string) {
    setImages((current) => current.filter((url) => url !== urlToRemove));
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!images.length) return toast.error("Upload at least one image first");
    const payload = {
      categoryId: String(form.get("categoryId")),
      name: String(form.get("name")),
      slug: String(form.get("slug")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: String(form.get("description")),
      longDescription: form.get("longDescription") ? String(form.get("longDescription")) : undefined,
      price: Number(form.get("price")),
      salePrice: form.get("salePrice") ? Number(form.get("salePrice")) : undefined,
      stock: Number(form.get("stock") || 0),
      images,
      showOnHome,
    };
    try {
      const response = await api("/api/admin/products", token, { method: "POST", body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success("Product created!");
      setImages([]);
      setCreating(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create product");
    }
  }

  async function toggleActive(product: Product) {
    const response = await api("/api/admin/products/" + product.id, token, { method: "PATCH", body: JSON.stringify({ isActive: !product.isActive }) });
    if (response.ok) {
      toast.success("Product status updated");
      load();
    } else toast.error("Update failed");
  }

  async function toggleHome(product: Product) {
    const response = await api("/api/admin/products/" + product.id, token, { method: "PATCH", body: JSON.stringify({ showOnHome: !product.showOnHome }) });
    if (response.ok) {
      toast.success(product.showOnHome ? "Now hidden from home page" : "Now visible on home page");
      load();
    } else toast.error("Update failed");
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    const response = await api("/api/admin/products/" + product.id, token, { method: "DELETE" });
    if (response.ok) {
      toast.success("Product deleted");
      load();
    } else toast.error("Delete failed");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
          {(["list", "add"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setCreating(t === "add")}
              className={`px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all ${
                creating === (t === "add")
                  ? "bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              }`}
            >
              {t === "list" ? "Product List" : "+ Add Product"}
            </button>
          ))}
        </div>
        {!creating && (
          <div className="flex items-center gap-2 h-9 px-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, category..."
              className="bg-transparent text-xs text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 outline-none w-44"
            />
          </div>
        )}
      </div>

      {creating ? (
        <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
          <form onSubmit={createProduct} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Product Name" name="name" isRequired placeholder="Classic Cotton Shirt" />
              <Input label="Slug (Auto Generated)" name="slug" placeholder="classic-cotton-shirt" />
              <Select label="Category" name="categoryId" isRequired placeholder="Select a category">
                {categoryOptions(categories).map((category) => (
                  <SelectItem key={category.id}>{category.parentId ? `↳  ${category.name}` : category.name}</SelectItem>
                ))}
              </Select>
              <Input label="Regular Price (BDT)" name="price" type="number" isRequired placeholder="1500" />
              <Input label="Sale Price (BDT)" name="salePrice" type="number" placeholder="1200 (Optional)" />
              <Input label="Initial Stock Qty" name="stock" type="number" defaultValue="10" />
            </div>

            <Textarea label="Short Description" name="description" isRequired minRows={3} placeholder="One or two crisp sentences for cards, search and quick glance…" />
            <Textarea label="Long Description (Full Details)" name="longDescription" minRows={5} placeholder="Extended description for the product page — materials, care, shipping, what's in the box…" />

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/4 rounded-xl border border-gray-200 dark:border-white/8">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Show on Home Page</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  {showOnHome
                    ? "Appears automatically on the home page with this category."
                    : "Hidden from home page — available only on the category page."}
                </p>
              </div>
              <Switch isSelected={showOnHome} onValueChange={setShowOnHome} color="primary" />
            </div>

            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors">
              <label className="cursor-pointer inline-flex flex-col items-center gap-2">
                <span className="text-2xl">📤</span>
                <span className="text-sm text-gray-500 dark:text-slate-400">{uploading ? "Uploading image…" : "Click to upload product image"}</span>
                <input type="file" accept="image/*" onChange={pickImage} hidden />
              </label>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {images.map((url, index) => (
                  <div key={url + index} className="relative w-20 h-20">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-white/8">
              <button
                type="submit"
                className="px-6 h-10 bg-gradient-to-r from-primary to-indigo-500 text-white font-display font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                Create & Publish Product
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-6 h-10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/3">
                <tr className="border-b border-gray-100 dark:border-white/8">
                  {["Product", "Category", "Price", "Stock", "Status", "", "Actions"].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/4">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <img src={p.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80"} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-xs max-w-[220px] truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono italic">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 dark:text-slate-400">{p.category?.name ?? "—"}</td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-gray-900 dark:text-white">{money(p.salePrice ?? p.price)}</td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-xs font-bold ${p.stock === 0 ? "text-rose-500" : p.stock < 20 ? "text-amber" : "text-emerald"}`}>{p.stock}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isActive ? "bg-emerald/10 text-emerald" : "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-slate-400"}`}>
                        {p.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          title={p.showOnHome ? "Visible on home page" : "Only on category page"}
                          onClick={() => toggleHome(p)}
                          className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.showOnHome ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-gray-100 dark:bg-white/8 text-gray-400 dark:text-slate-500 hover:bg-gray-200"
                          }`}
                        >
                          {p.showOnHome ? "Home ✓" : "Shop only"}
                        </span>
                        <Button size="sm" variant="flat" color={p.isActive ? "success" : "default"} onPress={() => toggleActive(p)}>
                          {p.isActive ? "Active" : "Hidden"}
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => deleteProduct(p)}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center justify-center text-xs"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== CATEGORIES ==================== */
function AdminCategories({ token }: { token: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [creating, setCreating] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    api("/api/admin/categories", token)
      .then((r) => r.json())
      .then((res) => Array.isArray(res) && setCategories(res))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [token]);

  async function createCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    if (name.length < 2) return toast.error("Category name must be at least 2 characters");
    try {
      const res = await api("/api/admin/categories", token, {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          parentId: parentId || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(parentId ? "Sub-category created!" : "Category created!");
      setCreating(false);
      setParentId("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create category");
    }
  }

  async function renameCategory(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const name = prompt("Category name", cat.name);
    if (!name || name.trim().length < 2) return;
    const res = await api(`/api/admin/categories/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      toast.success("Category updated");
      setEditingId(null);
      load();
    } else toast.error("Update failed");
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await api(`/api/admin/categories/${id}`, token, { method: "DELETE" });
    if (res.ok) {
      toast.success("Category deleted");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Delete failed");
    }
  }

  const subCategories = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display font-bold text-gray-900 dark:text-white">
          Categories & Sub-categories ({categories.filter((c) => !c.parentId).length} parents)
        </h3>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-2 px-4 h-9 bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          {creating ? (
            <>
              <FiX /> Cancel
            </>
          ) : (
            <>
              <FiPlus /> New Category
            </>
          )}
        </button>
      </div>

      {creating && (
        <form onSubmit={createCategory} className="p-5 bg-gray-50 dark:bg-white/4 rounded-xl border border-gray-200 dark:border-white/8 space-y-4">
          <Input label="Category Name" name="name" isRequired placeholder="e.g. T-Shirts, Men's Wear, Shoes..." />
          <Select label="Parent Category (Optional)" aria-label="Parent category" selectedKeys={parentId ? [parentId] : []} onChange={(e) => setParentId(e.target.value)}>
            <>
              <SelectItem key="none" textValue="none">
                — Top-level category (no parent) —
              </SelectItem>
              {(categories.filter((c) => !c.parentId) ?? []).map((c) => (
                <SelectItem key={c.id}>{c.name}</SelectItem>
              ))}
            </>
          </Select>
          <button type="submit" className="h-10 px-5 bg-primary text-white text-sm font-bold font-display rounded-xl hover:bg-primary-dark transition-colors">
            {parentId ? "Create Sub-category" : "Create Category"}
          </button>
        </form>
      )}

      {!categories.length ? (
        <p className="text-sm text-gray-400 dark:text-slate-500">No categories yet. Create your first category above.</p>
      ) : (
        <div className="space-y-4">
          {categories.filter((c) => !c.parentId).map((cat) => {
            const subs = subCategories(cat.id);
            return (
              <div key={cat.id} className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-cyan flex items-center justify-center text-white text-xs font-bold">
                    {cat.name[0]?.toUpperCase() ?? "C"}
                  </span>
                  <div className="flex-1">
                    <p className="font-display font-bold text-sm text-gray-900 dark:text-white">{cat.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      /{cat.slug} · {subs.length} sub-categories
                    </p>
                  </div>
                  {editingId === cat.id ? (
                    <button
                      onClick={() => renameCategory(cat.id)}
                      className="px-3 h-8 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingId(cat.id)}
                      className="px-3 h-8 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      Rename
                    </button>
                  )}
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center justify-center text-xs"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                {subs.length > 0 && (
                  <div className="px-5 pb-4 space-y-2">
                    {subs.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-white/4 rounded-xl">
                        <span className="text-xs text-primary font-bold">↳</span>
                        <p className="flex-1 text-sm font-medium text-gray-700 dark:text-slate-300">{sub.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">/{sub.slug}</p>
                        <button
                          onClick={() => deleteCategory(sub.id)}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center justify-center text-xs"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ==================== ORDERS (KANBAN) ==================== */
function AdminOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const load = () => {
    api("/api/admin/orders", token)
      .then((r) => r.json())
      .then((res) => Array.isArray(res) && setOrders(res))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [token]);

  async function updateStatus(id: string, status: string, paymentStatus: string) {
    const res = await api(`/api/admin/orders/${id}`, token, { method: "PATCH", body: JSON.stringify({ status, paymentStatus }) });
    if (res.ok) {
      toast.success("অর্ডার স্ট্যাটাস আপডেট হয়েছে");
      load();
    } else toast.error("আপডেট করা যায়নি");
  }

  const columns = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
  const columnColor: Record<string, string> = {
    PENDING: "text-amber border-amber/30 bg-amber/5",
    CONFIRMED: "text-primary border-primary/30 bg-primary/5",
    PACKED: "text-cyan border-cyan/30 bg-cyan/5",
    SHIPPED: "text-blue-500 border-blue-500/30 bg-blue-500/5",
    DELIVERED: "text-emerald border-emerald/30 bg-emerald/5",
    CANCELLED: "text-rose-500 border-rose-500/30 bg-rose-500/5",
  };
  const dotColor: Record<string, string> = {
    PENDING: "bg-amber",
    CONFIRMED: "bg-primary",
    PACKED: "bg-cyan",
    SHIPPED: "bg-blue-500",
    DELIVERED: "bg-emerald",
    CANCELLED: "bg-rose-500",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
          {(["kanban", "table"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                view === v ? "bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white shadow-sm" : "text-gray-400 dark:text-slate-500"
              }`}
            >
              {v === "kanban" ? "⊞ Kanban" : "≡ Table"}
            </button>
          ))}
          <span className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 self-center">{orders.length} orders</span>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 overflow-x-auto pb-2">
          {columns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col);
            return (
              <div key={col} className="min-w-[200px]">
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border ${columnColor[col]}`}>
                  <span className={`w-2 h-2 rounded-full ${dotColor[col]}`} />
                  <span className="text-xs font-bold">{col}</span>
                  <span className="ml-auto text-xs opacity-60">{colOrders.length}</span>
                </div>
                <div className="space-y-3">
                  {colOrders.map((o) => (
                    <div key={o.id} className="bg-white dark:bg-[#111118] rounded-xl border border-gray-100 dark:border-white/6 p-4 hover:border-primary/20 transition-all hover:shadow-md">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-primary">#{o.id.slice(0, 6)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.paymentStatus === "PAID" ? "bg-emerald/10 text-emerald" : "bg-amber/10 text-amber"}`}>
                          {o.paymentStatus}
                        </span>
                      </div>
                      <p className="font-display font-semibold text-sm text-gray-900 dark:text-white">{o.shippingDetails?.name ?? "Guest"}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{o.shippingDetails?.phone}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/6">
                        <span className="text-xs text-gray-400 dark:text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                        <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">{money(o.totalAmount)}</span>
                      </div>
                      <div className="mt-3">
                        <Select size="sm" aria-label="Move status" selectedKeys={[o.status]} onChange={(e) => updateStatus(o.id, e.target.value, o.paymentStatus)} className="w-full">
                          {columns.map((s) => (
                            <SelectItem key={s}>{s}</SelectItem>
                          ))}
                        </Select>
                      </div>
                    </div>
                  ))}
                  {!colOrders.length && <p className="text-xs text-gray-300 dark:text-slate-600 text-center py-3">No orders</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/3 border-b border-gray-100 dark:border-white/8">
                <tr>
                  {["Order ID", "Customer", "Date", "Total", "Payment", "Status", ""].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/4">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-primary font-bold">#{o.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-slate-200 text-xs">{o.shippingDetails?.name ?? "Guest"}</td>
                    <td className="py-3 px-4 text-gray-400 dark:text-slate-500 text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-gray-800 dark:text-slate-200">{money(o.totalAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.paymentStatus === "PAID" ? "bg-emerald/10 text-emerald" : "bg-amber/10 text-amber"}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusPill(o.status)}`}>{o.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant={o.paymentStatus === "PAID" ? "flat" : "solid"}
                        color={o.paymentStatus === "PAID" ? "default" : "warning"}
                        onPress={() => updateStatus(o.id, o.status, o.paymentStatus === "PAID" ? "UNPAID" : "PAID")}
                      >
                        {o.paymentStatus === "PAID" ? "Unpay" : "Mark Paid"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!orders.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== SHARED CARD WRAPPER ==================== */
function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-display font-bold text-gray-900 dark:text-white">{title}</h3>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

function ListCard({ items, empty, render }: { items: unknown[]; empty: string; render: (item: any) => React.ReactNode }) {
  return (
    <div className="space-y-3">
      {items.length ? items.map((item, i) => <div key={i}>{render(item)}</div>) : <p className="text-sm text-gray-400 dark:text-slate-500">{empty}</p>}
    </div>
  );
}

/* ==================== COUPONS ==================== */
function AdminCoupons({ token }: { token: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [creating, setCreating] = useState(false);

  const load = () => {
    api("/api/admin/coupons", token)
      .then((r) => r.json())
      .then((res) => Array.isArray(res) && setCoupons(res))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [token]);

  async function createCoupon(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const res = await api("/api/admin/coupons", token, {
        method: "POST",
        body: JSON.stringify({
          code: String(f.get("code")).toUpperCase(),
          type: f.get("type"),
          value: Number(f.get("value")),
          minSpend: f.get("minSpend") ? Number(f.get("minSpend")) : undefined,
          usageLimit: f.get("usageLimit") ? Number(f.get("usageLimit")) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Coupon created!");
      setCreating(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create coupon");
    }
  }

  async function deleteCoupon(id: string) {
    if (confirm("Delete this coupon code?")) {
      await api(`/api/admin/coupons/${id}`, token, { method: "DELETE" });
      toast.success("Coupon deleted");
      load();
    }
  }

  return (
    <Card
      title={`Promo Coupons & Vouchers (${coupons.length})`}
      action={
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-2 px-4 h-9 bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          {creating ? <><FiX /> Cancel</> : <><FiPlus /> New Coupon</>}
        </button>
      }
    >
      {creating && (
        <form onSubmit={createCoupon} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-5 bg-gray-50 dark:bg-white/4 rounded-xl border border-gray-200 dark:border-white/8">
          <Input label="Coupon Code" name="code" placeholder="SAVE20" isRequired />
          <Select label="Discount Type" name="type" defaultSelectedKeys={["PERCENTAGE"]}>
            <SelectItem key="PERCENTAGE">Percentage (%)</SelectItem>
            <SelectItem key="FLAT">Flat Amount (BDT)</SelectItem>
          </Select>
          <Input label="Discount Value" name="value" type="number" isRequired placeholder="15" />
          <Input label="Minimum Spend (BDT)" name="minSpend" type="number" placeholder="1000" />
          <Input label="Usage Limit" name="usageLimit" type="number" placeholder="100" />
          <button type="submit" className="sm:col-span-2 h-10 bg-primary text-white font-display font-bold rounded-xl hover:bg-primary-dark transition-colors">
            Save Coupon
          </button>
        </form>
      )}
      <ListCard
        items={coupons}
        empty="No coupons yet. Create one to start offering discounts."
        render={(c: Coupon) => (
          <div className="flex items-center justify-between p-4 bg-white dark:bg-white/4 rounded-xl border border-gray-100 dark:border-white/6">
            <div>
              <strong className="font-mono font-bold text-sm text-gray-900 dark:text-white">{c.code}</strong>
              <div className="text-xs text-gray-400 dark:text-slate-500">
                {c.type === "PERCENTAGE" ? `${c.value}% OFF` : `৳ ${c.value} OFF`} · Used: {c.usedCount} times
              </div>
            </div>
            <button
              onClick={() => deleteCoupon(c.id)}
              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center justify-center text-xs"
            >
              <FiTrash2 />
            </button>
          </div>
        )}
      />
    </Card>
  );
}

/* ==================== REVIEWS ==================== */
function AdminReviews({ token }: { token: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  const load = () => {
    api("/api/admin/reviews", token)
      .then((r) => r.json())
      .then((res) => Array.isArray(res) && setReviews(res))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [token]);

  async function toggleApprove(id: string, isApproved: boolean) {
    await api(`/api/admin/reviews/${id}`, token, { method: "PATCH", body: JSON.stringify({ isApproved: !isApproved }) });
    toast.success("Review status updated");
    load();
  }

  async function deleteReview(id: string) {
    await api(`/api/admin/reviews/${id}`, token, { method: "DELETE" });
    toast.success("Review deleted");
    load();
  }

  return (
    <Card title={`Product Reviews Moderation (${reviews.length})`}>
      <ListCard
        items={reviews}
        empty="No customer reviews yet. Approved reviews appear on the storefront."
        render={(r: Review) => (
          <div className="p-4 bg-white dark:bg-white/4 rounded-xl border border-gray-100 dark:border-white/6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong className="text-sm text-gray-900 dark:text-white">{r.product?.name}</strong>
                <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  by {r.user?.name} ({r.user?.email})
                </div>
              </div>
              <div className="flex items-center gap-0.5 text-amber">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar key={s} fill={s <= r.rating ? "#f59e0b" : "none"} className="text-xs" />
                ))}
              </div>
            </div>
            {r.comment && <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">"{r.comment}"</p>}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" color={r.isApproved ? "success" : "default"} variant={r.isApproved ? "solid" : "flat"} onPress={() => toggleApprove(r.id, r.isApproved)}>
                {r.isApproved ? "Approved ✓" : "Pending Moderation"}
              </Button>
              <Button size="sm" color="danger" variant="flat" onPress={() => deleteReview(r.id)}>
                Delete
              </Button>
            </div>
          </div>
        )}
      />
    </Card>
  );
}

/* ==================== STAFF ==================== */
function AdminStaff({ token }: { token: string }) {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [creating, setCreating] = useState(false);

  const load = () => {
    api("/api/admin/staff", token)
      .then((r) => r.json())
      .then((res) => Array.isArray(res) && setStaff(res))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [token]);

  async function createStaff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const res = await api("/api/admin/staff", token, {
        method: "POST",
        body: JSON.stringify({ name: f.get("name"), email: f.get("email"), password: f.get("password"), staffType: f.get("staffType") }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Staff account created!");
      setCreating(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create staff");
    }
  }

  async function removeStaff(id: string) {
    if (confirm("Remove this staff user?")) {
      await api(`/api/admin/staff/${id}`, token, { method: "DELETE" });
      toast.success("Staff account removed");
      load();
    }
  }

  return (
    <Card
      title={`Staff Team & Access Control (${staff.length})`}
      action={
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-2 px-4 h-9 bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          {creating ? <><FiX /> Cancel</> : <><FiPlus /> Add Staff</>}
        </button>
      }
    >
      {creating && (
        <form onSubmit={createStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-5 bg-gray-50 dark:bg-white/4 rounded-xl border border-gray-200 dark:border-white/8">
          <Input label="Staff Name" name="name" isRequired />
          <Input label="Staff Email" name="email" type="email" isRequired />
          <Input label="Password" name="password" type="password" minLength={8} isRequired />
          <Select label="Staff Role Type" name="staffType" defaultSelectedKeys={["ORDER_MANAGER"]}>
            <SelectItem key="ORDER_MANAGER">Order Manager</SelectItem>
            <SelectItem key="PRODUCT_MANAGER">Product Manager</SelectItem>
          </Select>
          <button type="submit" className="sm:col-span-2 h-10 bg-primary text-white font-display font-bold rounded-xl hover:bg-primary-dark transition-colors">
            Create Staff Account
          </button>
        </form>
      )}
      <ListCard
        items={staff}
        empty="No staff members yet. Add team members to manage orders or products."
        render={(s: StaffUser) => (
          <div className="flex items-center gap-3 justify-between p-4 bg-white dark:bg-white/4 rounded-xl border border-gray-100 dark:border-white/6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan flex items-center justify-center text-white text-xs font-bold">
                {s.name?.[0]?.toUpperCase() ?? "S"}
              </div>
              <div>
                <strong className="text-sm text-gray-900 dark:text-white">{s.name}</strong>
                <div className="text-xs text-gray-400 dark:text-slate-500">{s.email} · {s.staffType}</div>
              </div>
            </div>
            <button
              onClick={() => removeStaff(s.id)}
              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center justify-center text-xs"
            >
              <FiTrash2 />
            </button>
          </div>
        )}
      />
    </Card>
  );
}

/* ==================== MARKETING ==================== */
function MarketingChatSettings({ config, save, saving }: { config: Config; save: (payload: object) => Promise<void>; saving: boolean }) {
  const pixels = config.marketingPixels ?? {};
  const chat = config.chatConfig ?? {};

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    save({
      marketingPixels: {
        googleAnalyticsId: f.get("gaId") || undefined,
        metaPixelId: f.get("metaId") || undefined,
        tiktokPixelId: f.get("tiktokId") || undefined,
        gtmId: f.get("gtmId") || undefined,
      },
      chatConfig: {
        whatsapp: { enabled: true, number: f.get("waNumber") || undefined, template: f.get("waTemplate") || undefined },
        messenger: { enabled: true, url: f.get("messengerUrl") || undefined },
        phone: f.get("phone") || undefined,
      },
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <form onSubmit={submit} className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">Tracking Pixels</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Google Analytics ID" name="gaId" defaultValue={pixels.googleAnalyticsId} placeholder="G-XXXXXXXXXX" />
          <Input label="Meta (Facebook) Pixel ID" name="metaId" defaultValue={pixels.metaPixelId} placeholder="1234567890" />
          <Input label="TikTok Pixel ID" name="tiktokId" defaultValue={pixels.tiktokPixelId} />
          <Input label="Google Tag Manager (GTM) ID" name="gtmId" defaultValue={pixels.gtmId} placeholder="GTM-XXXXXX" />
        </div>
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/8">
          <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Floating Customer Chat Widget</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="WhatsApp Number" name="waNumber" defaultValue={chat.whatsapp?.number} placeholder="8801712345678" />
            <Input label="WhatsApp Message Template" name="waTemplate" defaultValue={chat.whatsapp?.template} placeholder="Hello, I want to order..." />
            <Input label="Facebook Messenger Page URL" name="messengerUrl" defaultValue={chat.messenger?.url} placeholder="https://m.me/yourpage" />
            <Input label="Support Phone Number" name="phone" defaultValue={chat.phone} placeholder="01712345678" />
          </div>
        </div>
        <button type="submit" className="mt-6 px-5 h-10 bg-primary text-white text-sm font-bold font-display rounded-xl hover:bg-primary-dark transition-colors">
          {saving ? "Saving…" : "Save Marketing & Chat Settings"}
        </button>
      </form>
    </div>
  );
}

/* ==================== FEATURES ==================== */
function FeatureSettings({ config, save, saving }: { config: Config; save: (payload: object) => Promise<void>; saving: boolean }) {
  const flags = config.featureFlags;

  function ToggleRow({ label, description, selected, onChange }: { label: string; description: string; selected: boolean; onChange: (v: boolean) => void }) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/6 last:border-0">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{label}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">{description}</p>
        </div>
        <Switch isSelected={selected} onValueChange={onChange} color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">Store Features</h3>
        <div className="space-y-1">
          <ToggleRow label="Cash on Delivery (COD)" description="Let customers pay cash when their order arrives." selected={flags.cod} onChange={(cod) => save({ featureFlags: { ...flags, cod } })} />
          <ToggleRow label="Product Reviews" description="Allow customers to submit product reviews and ratings." selected={flags.reviews} onChange={(reviews) => save({ featureFlags: { ...flags, reviews } })} />
          <ToggleRow label="Wishlist Feature" description="Enable wishlist saving for customer accounts." selected={flags.wishlist} onChange={(wishlist) => save({ featureFlags: { ...flags, wishlist } })} />
          <ToggleRow label="Coupons & Discount Codes" description="Enable promo code discounts at checkout." selected={flags.coupons} onChange={(coupons) => save({ featureFlags: { ...flags, coupons } })} />
          <ToggleRow label="Add to Cart in product lists" description="ON: lists show the Add to Cart button (current). OFF: lists show only an Order Now button that goes straight to checkout. The single product page always keeps both." selected={flags.addToCart} onChange={(addToCart) => save({ featureFlags: { ...flags, addToCart } })} />
          <ToggleRow label="Order IP Rate Limit" description="Protect against repeated automated spam orders." selected={config.enableIpLimit} onChange={(enableIpLimit) => save({ enableIpLimit })} />
        </div>
      </div>

      <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">Identity & Rate Limiting</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Store Name" defaultValue={config.storeName} onBlur={(e) => e.target.value !== config.storeName && save({ storeName: e.target.value })} />
          <Input type="number" label="Cooldown Minutes" defaultValue={String(config.cooldownMinutes)} onBlur={(e) => save({ cooldownMinutes: Number(e.target.value) })} />
        </div>
      </div>
    </div>
  );
}

/* ==================== HOME LAYOUT ==================== */
type SmallCategory = { id: string; name: string; _count?: { products?: number } };

function HomeLayoutSettings({ config, save, saving }: { config: Config; save: (payload: object) => Promise<void>; saving: boolean }) {
  const [cats, setCats] = useState<SmallCategory[]>([]);
  const [sections, setSections] = useState<HomeSectionDef[]>(
    config.homePageConfig?.sections?.length
      ? config.homePageConfig.sections
      : []
  );

  useEffect(() => {
    api("/api/categories", "")
      .then(async (r) => {
        if (r.ok) setCats(await r.json());
      })
      .catch(() => {});
  }, []);

  function update(id: string, patch: Partial<HomeSectionDef>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function remove(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function add() {
    setSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}`,
        title: "",
        categoryIds: [],
        mode: "carousel",
        auto: true,
        seconds: 3,
        perView: { mobile: 1, tablet: 2, desktop: 4 },
        pagination: false,
        loop: false,
        showViewAll: true,
      },
    ]);
  }

  function submit() {
    for (const s of sections) {
      if (!s.categoryIds.length) return toast.error("Each section needs at least one category");
    }
    save({ homePageConfig: { sections } });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 h-10 text-sm font-bold text-white font-display hover:bg-primary-dark transition-colors"
        >
          <FiPlus /> Add Section
        </button>
        <p className="mt-2 text-xs text-gray-400">Each section shows products from the categories you choose below.</p>
      </div>

      {sections.length === 0 && (
        <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-8 text-center text-sm text-gray-400">
          No custom sections yet. Click “Add Section” — otherwise the storefront shows one carousel per category.
        </div>
      )}

      {sections.map((s, idx) => (
        <div key={s.id} className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display font-bold text-gray-900 dark:text-white">Section {idx + 1}</h3>
            <button
              type="button"
              onClick={() => remove(s.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 h-8 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <FiTrash2 /> Remove
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Section Title (optional)" placeholder="e.g. Summer Essentials" value={s.title ?? ""} onValueChange={(v) => update(s.id, { title: v })} />
            <Select
              label="Display Mode"
              selectedKeys={[s.mode]}
              onSelectionChange={(k) => update(s.id, { mode: (Array.from(k as Set<string>)[0] ?? "carousel") as HomeSectionDef["mode"] })}
            >
              <SelectItem key="carousel">Carousel</SelectItem>
              <SelectItem key="grid">Grid</SelectItem>
              <SelectItem key="responsive">Responsive (mobile grid, PC carousel)</SelectItem>
            </Select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Categories (one or more)
              </p>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[0.65rem] font-bold ${
                  s.categoryIds.length ? "bg-primary/10 text-primary" : "bg-red-50 text-red-500"
                }`}
              >
                {s.categoryIds.length} selected
              </span>
            </div>
            <p className="-mt-1 mb-2 text-[0.7rem] text-gray-400">
              Pick one category to show only those products — or pick several to combine them in this section.
            </p>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => {
                const on = s.categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={on ? "Click to remove" : "Click to select"}
                    onClick={() =>
                      update(s.id, {
                        categoryIds: on ? s.categoryIds.filter((x) => x !== c.id) : [...s.categoryIds, c.id],
                      })
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      on
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:border-primary/40 hover:text-gray-700"
                    }`}
                  >
                    <span
                      className={`grid h-3.5 w-3.5 place-items-center rounded border text-[0.6rem] leading-none ${
                        on ? "border-white/40 bg-white/20" : "border-gray-300 bg-white"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </span>
                    {c.name}
                    {typeof c._count?.products === "number" && (
                      <span className="font-mono opacity-80">({c._count.products})</span>
                    )}
                  </button>
                );
              })}
              {cats.length === 0 && <span className="text-xs text-gray-400">No categories found.</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Switch isSelected={s.auto} onValueChange={(v) => update(s.id, { auto: v })} color="primary">
              Auto-slide
            </Switch>
            <div>
              <Input type="number" min={1} max={60} label="Seconds" value={String(s.seconds)} onValueChange={(v) => update(s.id, { seconds: Math.max(1, Math.min(60, Number(v) || 1)) })} />
            </div>
            <Switch isSelected={s.pagination} onValueChange={(v) => update(s.id, { pagination: v })} color="primary">
              Pagination dots
            </Switch>
            <Switch isSelected={s.loop} onValueChange={(v) => update(s.id, { loop: v })} color="primary">
              Loop
            </Switch>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input type="number" min={1} max={4} label="Per view (Mobile)" value={String(s.perView.mobile)} onValueChange={(v) => update(s.id, { perView: { ...s.perView, mobile: Math.max(1, Math.min(4, Number(v) || 1)) } })} />
            <Input type="number" min={1} max={6} label="Per view (Tablet)" value={String(s.perView.tablet)} onValueChange={(v) => update(s.id, { perView: { ...s.perView, tablet: Math.max(1, Math.min(6, Number(v) || 1)) } })} />
            <Input type="number" min={1} max={8} label="Per view (Desktop)" value={String(s.perView.desktop)} onValueChange={(v) => update(s.id, { perView: { ...s.perView, desktop: Math.max(1, Math.min(8, Number(v) || 1)) } })} />
          </div>

          <Switch isSelected={s.showViewAll} onValueChange={(v) => update(s.id, { showViewAll: v })} color="primary">
            Show “View All” link
          </Switch>
        </div>
      ))}

      <button
        type="button"
        onClick={submit}
        className="px-5 h-10 bg-primary text-white text-sm font-bold font-display rounded-xl hover:bg-primary-dark transition-colors"
      >
        {saving ? "Saving…" : "Save Home Layout"}
      </button>
    </div>
  );
}

/* ==================== PAYMENTS ==================== */
function PaymentSettings({ save, saving, config }: { save: (payload: object) => Promise<void>; saving: boolean; config: Config }) {
  const [bkash, setBkash] = useState(Boolean(config.paymentConfig?.bkash?.enabled));
  const [nagad, setNagad] = useState(Boolean(config.paymentConfig?.nagad?.enabled));
  const [ssl, setSsl] = useState(Boolean(config.paymentConfig?.sslcommerz?.enabled));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    save({
      paymentConfig: {
        bkash: { enabled: bkash, mode: f.get("bkashMode") || "sandbox", callbackUrl: f.get("bkashCallback") || undefined, appKey: f.get("bkashKey") || undefined, appSecret: f.get("bkashSecret") || undefined, username: f.get("bkashUser") || undefined, password: f.get("bkashPassword") || undefined },
        nagad: { enabled: nagad, mode: f.get("nagadMode") || "sandbox", callbackUrl: f.get("nagadCallback") || undefined, merchantId: f.get("nagadMerchant") || undefined, merchantNumber: f.get("nagadNumber") || undefined, privateKey: f.get("nagadKey") || undefined },
        sslcommerz: { enabled: ssl, mode: f.get("sslMode") || "sandbox", callbackUrl: f.get("sslCallback") || undefined, sandbox: (f.get("sslMode") || "sandbox") === "sandbox", storeId: f.get("sslStore") || undefined, storePassword: f.get("sslPassword") || undefined },
      },
    });
  }

  function GatewayCard({ title, desc, enabled, setEnabled, children }: { title: string; desc: string; enabled: boolean; setEnabled: (v: boolean) => void; children?: React.ReactNode }) {
    return (
      <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{title}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{desc}</p>
          </div>
          <Switch isSelected={enabled} onValueChange={setEnabled} color="primary" />
        </div>
        {enabled && children}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <GatewayCard title="bKash Merchant Payment" desc="Accept direct bKash digital payment." enabled={bkash} setEnabled={setBkash}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Mode" name="bkashMode" defaultSelectedKeys={[config.paymentConfig?.bkash?.mode === "live" ? "live" : "sandbox"]}>
            <SelectItem key="sandbox">Sandbox (Test)</SelectItem>
            <SelectItem key="live">Live (Production)</SelectItem>
          </Select>
          <Input className="sm:col-span-2" name="bkashCallback" label="Callback URL" placeholder="https://store.com/api/payment/bkash/callback" defaultValue={config.paymentConfig?.bkash?.callbackUrl ?? ""} />
          <Input name="bkashKey" label="App Key" defaultValue={config.paymentConfig?.bkash?.appKey ?? ""} />
          <Input name="bkashSecret" label="App Secret" type="password" defaultValue={config.paymentConfig?.bkash?.appSecret ?? ""} />
        </div>
      </GatewayCard>

      <GatewayCard title="Nagad Merchant Payment" desc="Accept Nagad mobile banking payments." enabled={nagad} setEnabled={setNagad}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Mode" name="nagadMode" defaultSelectedKeys={[config.paymentConfig?.nagad?.mode === "live" ? "live" : "sandbox"]}>
            <SelectItem key="sandbox">Sandbox (Test)</SelectItem>
            <SelectItem key="live">Live (Production)</SelectItem>
          </Select>
          <Input className="sm:col-span-2" name="nagadCallback" label="Callback URL" defaultValue={config.paymentConfig?.nagad?.callbackUrl ?? ""} />
          <Input name="nagadMerchant" label="Merchant ID" defaultValue={config.paymentConfig?.nagad?.merchantId ?? ""} />
          <Input name="nagadNumber" label="Merchant Number" defaultValue={config.paymentConfig?.nagad?.merchantNumber ?? ""} />
        </div>
      </GatewayCard>

      <GatewayCard title="SSLCommerz Gateway" desc="Accept Visa/Mastercard, Amex, and internet banking." enabled={ssl} setEnabled={setSsl}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Mode" name="sslMode" defaultSelectedKeys={[config.paymentConfig?.sslcommerz?.mode === "live" ? "live" : "sandbox"]}>
            <SelectItem key="sandbox">Sandbox (Test)</SelectItem>
            <SelectItem key="live">Live (Production)</SelectItem>
          </Select>
          <Input name="sslStore" label="Store ID" defaultValue={config.paymentConfig?.sslcommerz?.storeId ?? ""} />
          <Input name="sslPassword" type="password" label="Store Password" defaultValue={config.paymentConfig?.sslcommerz?.storePassword ?? ""} />
        </div>
      </GatewayCard>

      <button type="submit" className="px-5 h-10 bg-primary text-white text-sm font-bold font-display rounded-xl hover:bg-primary-dark transition-colors">
        {saving ? "Saving…" : "Save Payment Settings"}
      </button>
    </form>
  );
}

/* ==================== DELIVERY ==================== */
function DeliverySettings({ save, saving, config }: { save: (payload: object) => Promise<void>; saving: boolean; config: Config }) {
  const [steadfast, setSteadfast] = useState(Boolean(config.courierConfig?.steadfast?.enabled));
  const [pathao, setPathao] = useState(Boolean(config.courierConfig?.pathao?.enabled));
  const [redx, setRedx] = useState(Boolean(config.courierConfig?.redx?.enabled));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    save({
      emailConfig: f.get("emailHost")
        ? { host: f.get("emailHost"), port: Number(f.get("emailPort")), user: f.get("emailUser"), pass: f.get("emailPass"), fromEmail: f.get("fromEmail") }
        : undefined,
      courierConfig: {
        steadfast: { enabled: steadfast, apiKey: f.get("steadfastKey") || undefined, secretKey: f.get("steadfastSecret") || undefined },
        pathao: { enabled: pathao, clientId: f.get("pathaoId") || undefined, clientSecret: f.get("pathaoSecret") || undefined, clientEmail: f.get("pathaoEmail") || undefined },
        redx: { enabled: redx, apiKey: f.get("redxKey") || undefined },
      },
    });
  }

  function ToggleRow({ label, description, selected, onChange, children }: { label: string; description: string; selected: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
    return (
      <div className="pb-6 border-b border-gray-100 dark:border-white/6 last:border-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{label}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{description}</p>
          </div>
          <Switch isSelected={selected} onValueChange={onChange} color="primary" />
        </div>
        {selected && children}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-5">Email SMTP</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input name="emailHost" label="SMTP Host" placeholder="smtp.gmail.com" defaultValue={config.emailConfig?.host ?? ""} />
          <Input name="emailPort" type="number" label="SMTP Port" defaultValue={config.emailConfig ? String(config.emailConfig.port) : "587"} />
          <Input name="emailUser" label="SMTP User" defaultValue={config.emailConfig?.user ?? ""} />
          <Input name="emailPass" type="password" label="SMTP Password" defaultValue={config.emailConfig?.pass ?? ""} />
          <Input className="sm:col-span-2" name="fromEmail" type="email" label="Sender Email" defaultValue={config.emailConfig?.fromEmail ?? ""} />
        </div>
      </div>

      <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Delivery Couriers</h3>
        <div className="space-y-1">
          <ToggleRow label="Steadfast Courier API" description="Automate order shipments via Steadfast Courier." selected={steadfast} onChange={setSteadfast}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input name="steadfastKey" label="API Key" defaultValue={config.courierConfig?.steadfast?.apiKey ?? ""} />
              <Input name="steadfastSecret" type="password" label="Secret Key" defaultValue={config.courierConfig?.steadfast?.secretKey ?? ""} />
            </div>
          </ToggleRow>
          <ToggleRow label="Pathao Courier API" description="Automate order shipments via Pathao Logistics." selected={pathao} onChange={setPathao}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input name="pathaoId" label="Client ID" defaultValue={config.courierConfig?.pathao?.clientId ?? ""} />
              <Input name="pathaoEmail" label="Client Email" defaultValue={config.courierConfig?.pathao?.clientEmail ?? ""} />
              <Input name="pathaoSecret" type="password" label="Client Secret" defaultValue={config.courierConfig?.pathao?.clientSecret ?? ""} />
            </div>
          </ToggleRow>
          <ToggleRow label="RedX Courier API" description="Automate order shipments via RedX." selected={redx} onChange={setRedx}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input name="redxKey" label="API Key" defaultValue={config.courierConfig?.redx?.apiKey ?? ""} />
            </div>
          </ToggleRow>
        </div>
      </div>

      <button type="submit" className="px-5 h-10 bg-primary text-white text-sm font-bold font-display rounded-xl hover:bg-primary-dark transition-colors">
        {saving ? "Saving…" : "Save Delivery Settings"}
      </button>
    </form>
  );
}

/* ==================== STORAGE ==================== */
function StorageSettings({ save, saving, configured, storage }: {
  save: (payload: object) => Promise<void>;
  saving: boolean;
  configured: boolean;
  storage: NonNullable<Config["storageConfig"]> | undefined;
}) {
  const [provider, setProvider] = useState<"local" | "hostinger-object-storage">(storage?.provider === "hostinger-object-storage" ? "hostinger-object-storage" : "local");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const payload =
      provider === "local"
        ? { storageConfig: { provider: "local", folderPath: f.get("folderPath"), publicBaseUrl: f.get("publicBaseUrl") } }
        : {
            storageConfig: {
              provider: "hostinger-object-storage",
              endpoint: f.get("endpoint"),
              region: f.get("region"),
              bucket: f.get("bucket"),
              accessKeyId: f.get("accessKeyId"),
              secretAccessKey: f.get("secretAccessKey"),
              publicBaseUrl: f.get("objPublicUrl") || undefined,
            },
          };
    save(payload);
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-white/4 rounded-2xl border border-gray-100 dark:border-white/6 p-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-3">Image Storage</h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-5">
          Configure public folder paths or Object Storage for product images. {configured && <span className="text-emerald font-bold">Active ✓</span>}
        </p>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/6 mb-5">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Use Object Storage</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Switch to S3 compatible object storage endpoint.</p>
          </div>
          <Switch isSelected={provider === "hostinger-object-storage"} onValueChange={(v) => setProvider(v ? "hostinger-object-storage" : "local")} color="primary" />
        </div>

        {provider === "local" ? (
          <div className="grid grid-cols-1 gap-4">
            <Input name="folderPath" label="Upload Folder Path" placeholder="../public_html/uploads/products" defaultValue={storage?.folderPath ?? ""} />
            <Input name="publicBaseUrl" label="Public Base URL" placeholder="https://yourstore.com/uploads/products" defaultValue={storage?.publicBaseUrl ?? ""} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input className="sm:col-span-2" name="endpoint" label="Endpoint URL" defaultValue={storage?.endpoint ?? ""} />
            <Input name="region" label="Region" defaultValue={storage?.region ?? ""} />
            <Input name="bucket" label="Bucket Name" defaultValue={storage?.bucket ?? ""} />
            <Input name="accessKeyId" label="Access Key ID" defaultValue={storage?.accessKeyId ?? ""} />
            <Input name="secretAccessKey" type="password" label="Secret Access Key" defaultValue={storage?.secretAccessKey ?? ""} />
            <Input name="objPublicUrl" label="Public Base URL (Optional)" defaultValue={storage?.publicBaseUrl ?? ""} />
          </div>
        )}

        <button type="submit" className="mt-6 px-5 h-10 bg-primary text-white text-sm font-bold font-display rounded-xl hover:bg-primary-dark transition-colors">
          {saving ? "Saving…" : "Save Storage Settings"}
        </button>
      </div>
    </form>
  );
}