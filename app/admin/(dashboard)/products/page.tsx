"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatNaira } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // kobo
  category: string;
  sizes: string;
  image: string;
  stock: number;
  featured: boolean;
};

const CATEGORIES = ["CLOTHES", "SHOES", "ONESIES", "TOWELS"];

const emptyForm = {
  name: "",
  description: "",
  priceNaira: "",
  category: "CLOTHES",
  sizes: "0-6M,6-12M,1-2Y",
  stock: "10",
  featured: false,
  image: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/products");
    if (res.ok) {
      const d = await res.json();
      setProducts(d.products);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      priceNaira: String(p.price / 100),
      category: p.category,
      sizes: p.sizes,
      stock: String(p.stock),
      featured: p.featured,
      image: p.image,
    });
    setError("");
    setModalOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const priceKobo = Math.round(parseFloat(form.priceNaira) * 100);
    if (!Number.isFinite(priceKobo) || priceKobo <= 0) {
      setError("Enter a valid price in naira.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: priceKobo,
      category: form.category,
      sizes: form.sizes,
      stock: parseInt(form.stock, 10) || 0,
      featured: form.featured,
      image: form.image,
    };

    const res = await fetch(
      editing ? `/api/admin/products/${editing.id}` : "/api/admin/products",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to save product.");
      return;
    }
    setModalOpen(false);
    load();
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    }
  }

  const inputCls =
    "w-full rounded-xl border border-gold/20 bg-white px-3 py-2 text-sm outline-none focus:border-gold";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-cocoa/60">
            Add, edit or remove store products.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-goldlight"
        >
          + Add Product
        </button>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gold/10 text-left text-cocoa/60">
              <th className="px-5 py-3 font-semibold">Product</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">Stock</th>
              <th className="px-5 py-3 font-semibold">Featured</th>
              <th className="px-5 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-cocoa/50">
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-cocoa/50">
                  No products yet. Click &quot;Add Product&quot;.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-gold/5 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-cocoa/50">{p.sizes}</p>
                  </td>
                  <td className="px-5 py-3">{p.category}</td>
                  <td className="px-5 py-3 font-semibold">
                    {formatNaira(p.price)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        p.stock === 0 ? "font-bold text-red-500" : undefined
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">{p.featured ? "⭐" : "—"}</td>
                  <td className="space-x-3 px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-xs font-bold text-gold hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p)}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="font-display text-xl font-bold">
              {editing ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={save} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-cocoa/60">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-cocoa/60">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-cocoa/60">
                    Price (₦)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.priceNaira}
                    onChange={(e) =>
                      setForm({ ...form, priceNaira: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cocoa/60">
                    Stock
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-cocoa/60">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-cocoa/60">
                    Sizes (comma-separated)
                  </label>
                  <input
                    required
                    value={form.sizes}
                    onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-cocoa/60">
                  Image path (optional, e.g. /products/my-item.svg)
                </label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className={inputCls}
                  placeholder="/products/placeholder.svg"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                  className="h-4 w-4 accent-gold"
                />
                Featured on homepage
              </label>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-cocoa/60 hover:bg-cocoa/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-white shadow transition hover:bg-goldlight disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
