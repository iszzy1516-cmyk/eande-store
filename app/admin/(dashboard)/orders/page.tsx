"use client";

import { Fragment, useEffect, useState } from "react";
import { formatNaira } from "@/lib/format";

type OrderItem = {
  productId: string;
  name: string;
  size: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  status: string;
  createdAt: string;
};

const STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { order } = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
    }
    setSaving(null);
  }

  function parseItems(raw: string): OrderItem[] {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-cocoa/60">
        View and manage customer orders.
      </p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gold/10 text-left text-cocoa/60">
              <th className="px-5 py-3 font-semibold">Reference</th>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Total</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-cocoa/50">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-cocoa/50">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <Fragment key={o.id}>
                  <tr className="border-b border-gold/5 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs">
                      {o.reference}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold">{o.customerName}</p>
                      <p className="text-xs text-cocoa/50">{o.phone}</p>
                    </td>
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
                      <select
                        value={o.status}
                        disabled={saving === o.id}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-bold outline-none ${
                          STATUS_STYLES[o.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded(expanded === o.id ? null : o.id)
                        }
                        className="text-xs font-bold text-gold hover:underline"
                      >
                        {expanded === o.id ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr className="bg-gold/5">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-cocoa/50">
                              Items
                            </p>
                            <ul className="mt-2 space-y-1">
                              {parseItems(o.items).map((item, i) => (
                                <li key={i} className="text-sm">
                                  {item.qty}× {item.name}{" "}
                                  <span className="text-cocoa/50">
                                    ({item.size})
                                  </span>{" "}
                                  — {formatNaira(item.price * item.qty)}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-cocoa/50">
                              Delivery
                            </p>
                            <p className="mt-2 text-sm">{o.address}</p>
                            <p className="mt-1 text-sm text-cocoa/60">
                              {o.email} · {o.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
