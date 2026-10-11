"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "@/lib/api";

/**
 * Static hosting has no server middleware, so the admin shell guards itself:
 * no session → immediate redirect to login; nothing renders until verified.
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/auth/me`)
      .then((r) => {
        if (r.ok) {
          setAuthed(true);
        } else {
          window.location.href = "/admin/login";
        }
      })
      .catch(() => {
        window.location.href = "/admin/login";
      });
  }, []);

  if (authed !== true) {
    return (
      <p className="p-10 text-sm text-cocoa/50">
        {authed === null ? "Checking access…" : "Redirecting to login…"}
      </p>
    );
  }
  return <>{children}</>;
}
