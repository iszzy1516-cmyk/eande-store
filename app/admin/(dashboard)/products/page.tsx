"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatNaira } from "@/lib/format";
import { apiFetch } from "@/lib/api";

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

type CsvRow = {
  name: string;
  category: string;
  priceNaira: number;
  sizes: string;
  stock: number;
  description: string;
  featured: boolean;
  image: string;
  errors: string[];
};

/** Minimal RFC-4180 CSV parser (handles quotes and escaped quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string>("");

  function handleCsvFile(file: File | undefined | null) {
    if (!file) return;
    setImportResult("");
    file.text().then((text) => {
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setImportResult("No data rows found. First row must be the header.");
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (names: string[]) =>
        header.findIndex((h) => names.includes(h));

      const iName = idx(["name"]);
      const iCat = idx(["category"]);
      const iPrice = idx(["price", "price_naira", "pricenaira"]);
      const iSizes = idx(["sizes"]);
      const iStock = idx(["stock", "qty", "quantity"]);
      const iDesc = idx(["description", "desc"]);
      const iFeat = idx(["featured"]);
      const iImg = idx(["image", "photo", "image_url"]);

      if ([iName, iCat, iPrice, iSizes, iStock, iDesc].some((i) => i === -1)) {
        setImportResult(
          "Missing required columns. Need: name, category, price, sizes, stock, description (optional: featured, image)."
        );
        return;
      }

      const parsed: CsvRow[] = rows.slice(1).map((r) => {
        const get = (i: number) => (r[i] ?? "").trim();
        const errors: string[] = [];
        const name = get(iName);
        const category = get(iCat).toUpperCase();
        const priceNaira = parseFloat(get(iPrice).replace(/[₦,\s]/g, ""));
        const stock = parseInt(get(iStock), 10);
        const sizes = get(iSizes);
        const description = get(iDesc);
        if (name.length < 2) errors.push("name too short");
        if (!["CLOTHES", "SHOES", "ONESIES", "TOWELS"].includes(category))
          errors.push("bad category");
        if (!Number.isFinite(priceNaira) || priceNaira <= 0)
          errors.push("bad price");
        if (!Number.isInteger(stock) || stock < 0) errors.push("bad stock");
        if (!sizes) errors.push("missing sizes");
        if (!description) errors.push("missing description");
        return {
          name,
          category,
          priceNaira,
          sizes,
          stock,
          description,
          featured: ["true", "yes", "1"].includes(get(iFeat).toLowerCase()),
          image: iImg >= 0 ? get(iImg) : "",
          errors,
        };
      });
      setCsvRows(parsed);
    });
  }

  async function importCsv() {
    if (!csvRows) return;
    setImporting(true);
    setImportResult("");
    try {
      const res = await apiFetch("/api/admin/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          products: csvRows.map((r) => ({
            name: r.name,
            category: r.category,
            priceNaira: r.priceNaira,
            sizes: r.sizes,
            stock: r.stock,
            description: r.description,
            featured: r.featured,
            image: r.image || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult(data.error || "Import failed.");
        return;
      }
      const failed = data.results.filter((r: { ok: boolean }) => !r.ok);
      setImportResult(
        `Imported ${data.created} of ${data.total} products.` +
          (failed.length
            ? ` Failed: ${failed
                .map((f: { name: string; error?: string }) => `${f.name} (${f.error})`)
                .join(", ")}`
            : "")
      );
      setCsvRows(null);
      load();
    } catch {
      setImportResult("Network error during import.");
    } finally {
      setImporting(false);
    }
  }

  async function handleImageFile(file: File | undefined | null) {
    if (!file) return;
    setUploadError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Only JPG, PNG or WebP images.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image is too large (max 5MB).");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/admin/uploads", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed.");
        return;
      }
      setForm((f) => ({ ...f, image: data.url }));
    } catch {
      setUploadError("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }

  async function load() {
    const res = await apiFetch("/api/admin/products");
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

    const res = await apiFetch(
      editing ? `/api/admin/products/${editing.id}` : "/api/admin/products",
      {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
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
    const res = await apiFetch(`/api/admin/products/${p.id}`, {
      method: "DELETE",
      headers: { "X-Requested-With": "XMLHttpRequest" },
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
        <div className="flex gap-2">
          <label
            className="cursor-pointer rounded-xl border border-gold px-5 py-2.5 text-sm font-bold text-gold transition hover:bg-gold/10"
          >
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                handleCsvFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-goldlight"
          >
            + Add Product
          </button>
        </div>
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

      {csvRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4">
          <div className="card max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6">
            <h2 className="font-display text-xl font-bold">
              Import {csvRows.length} products
            </h2>
            <p className="mt-1 text-xs text-cocoa/60">
              Rows with errors will be skipped. Columns: name, category,
              price, sizes, stock, description, featured, image.
            </p>
            {importResult && (
              <p className="mt-3 rounded-lg bg-gold/10 px-3 py-2 text-sm font-semibold text-cocoa">
                {importResult}
              </p>
            )}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gold/10 text-left text-xs text-cocoa/60">
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Price (₦)</th>
                    <th className="px-3 py-2 font-semibold">Sizes</th>
                    <th className="px-3 py-2 font-semibold">Stock</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.map((r, i) => (
                    <tr key={i} className="border-b border-gold/5 last:border-0">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.category}</td>
                      <td className="px-3 py-2">
                        {Number.isFinite(r.priceNaira) ? r.priceNaira : "—"}
                      </td>
                      <td className="px-3 py-2">{r.sizes}</td>
                      <td className="px-3 py-2">{r.stock}</td>
                      <td className="px-3 py-2">
                        {r.errors.length ? (
                          <span className="text-xs font-bold text-red-600">
                            {r.errors.join(", ")}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-green-700">
                            ok
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCsvRows(null)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-cocoa/60 hover:bg-cocoa/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={importCsv}
                disabled={importing || csvRows.every((r) => r.errors.length)}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-white shadow transition hover:bg-goldlight disabled:opacity-50"
              >
                {importing
                  ? "Importing…"
                  : `Import ${csvRows.filter((r) => !r.errors.length).length} products`}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Photo
                </label>
                <div className="flex items-center gap-3">
                  <label
                    className={`flex-1 cursor-pointer rounded-xl border border-dashed border-gold/40 bg-white px-4 py-4 text-center text-sm font-semibold text-gold transition hover:bg-gold/5 ${uploading ? "opacity-50" : ""}`}
                  >
                    {uploading
                      ? "Uploading…"
                      : form.image
                        ? "Change photo"
                        : "Click to choose a photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        handleImageFile(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {form.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image}
                      alt="Preview"
                      className="h-16 w-16 rounded-xl border border-gold/20 object-cover"
                    />
                  )}
                </div>
                {uploadError && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {uploadError}
                  </p>
                )}
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
