"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatNaira } from "@/lib/format";

type Order = {
  id: string;
  reference: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/orders").then((r) => (r.ok ? r.json() : null)),
      apiFetch("/api/admin/products").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([o, p]) => {
        if (o?.orders) setOrders(o.orders);
        if (p?.products) setProductCount(p.products.length);
      })
      .finally(() => setLoading(false));
  }, []);

  const revenue = orders
    .filter((o) =>
      ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status)
    )
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const recent = orders.slice(0, 5);

  const stats = [
    { label: "Total Orders", value: String(orders.length) },
    { label: "Revenue", value: formatNaira(revenue) },
    { label: "Products", value: String(productCount) },
    { label: "Pending Orders", value: String(pendingCount) },
  ];

  if (loading) {
    return (
      <p className="text-sm text-cocoa/50">Loading dashboard…</p>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm font-semibold text-cocoa/60">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-gold">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Recent Orders</h2>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gold/10 text-left text-cocoa/60">
              <th className="px-5 py-3 font-semibold">Reference</th>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Total</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-cocoa/50">
                  No orders yet.
                </td>
              </tr>
            ) : (
              recent.map((o) => (
                <tr key={o.id} className="border-b border-gold/5 last:border-0">
                  <td className="px-5 py-3 font-mono text-xs">{o.reference}</td>
                  <td className="px-5 py-3">{o.customerName}</td>
                  <td className="px-5 py-3 font-semibold">
                    {formatNaira(o.total)}
                  </td>
                  <td className="px-5 py-3 text-cocoa/60">
                    {new Date(o.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
