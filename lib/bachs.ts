import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET_KEY = process.env.BACHS_SECRET_KEY;

export function bachsConfigured(): boolean {
  return Boolean(SECRET_KEY);
}

function baseUrl(): string {
  return SECRET_KEY!.startsWith("sk_sandbox_")
    ? "https://sandbox-api.bachs.io"
    : "https://api.bachs.io";
}

function authHeaders() {
  return {
    Authorization: `Bearer ${SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function createCheckoutSession(params: {
  amountKobo: number;
  email: string;
  name: string;
  phone?: string;
  reference: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ checkoutId: string; checkoutUrl: string }> {
  // Bachs wants money as a decimal string at currency precision — never kobo.
  const amount = (params.amountKobo / 100).toFixed(2);
  const res = await fetch(`${baseUrl()}/v1/checkout-sessions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      pricing: { currency: "NGN", amount },
      customer: {
        email: params.email,
        name: params.name,
        ...(params.phone ? { phone_number: params.phone } : {}),
      },
      reference: params.reference,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ...(params.metadata ? { metadata: params.metadata } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.checkout_url) {
    throw new Error(
      data.message || data.error?.message || "Could not create Bachs checkout"
    );
  }
  return { checkoutId: data.checkout_id, checkoutUrl: data.checkout_url };
}

export type CheckoutSession = {
  checkoutId: string;
  status: string; // open | completed | expired | ...
  amount?: string; // decimal string, when present
  currency?: string;
};

export async function getCheckoutSession(
  checkoutId: string
): Promise<CheckoutSession> {
  const res = await fetch(`${baseUrl()}/v1/checkout-sessions/${checkoutId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Could not fetch checkout session");
  }
  return {
    checkoutId: data.checkout_id,
    status: data.status,
    amount: data.pricing?.amount ?? data.amount,
    currency: data.pricing?.currency ?? data.currency,
  };
}

/**
 * Verify an X-Bachs-Signature-V2 webhook header against the raw request body.
 * Message signed is "{timestamp}.{rawBody}" with HMAC-SHA256.
 */
export function verifyBachsSignature(
  rawBody: string,
  timestampHeader: string,
  signatureV2Header: string,
  secret: string
): boolean {
  const timestamp = parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestamp)) return false;
  // Reject stale deliveries (5 minute tolerance).
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const message = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret)
    .update(message, "utf8")
    .digest("hex");

  const signatures = signatureV2Header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));

  return signatures.some((s) => {
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(s));
    } catch {
      return false;
    }
  });
}
