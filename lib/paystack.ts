const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export type InitializeResult = {
  authorization_url: string;
  reference: string;
};

export async function initializeTransaction(params: {
  email: string;
  amount: number; // kobo
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack initialize failed");
  }
  return data.data as InitializeResult;
}

export type VerifyResult = {
  status: string; // "success" | "failed" | ...
  reference: string;
  amount: number; // kobo
};

export async function verifyTransaction(
  reference: string
): Promise<VerifyResult> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: authHeaders() }
  );
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack verification failed");
  }
  return data.data as VerifyResult;
}
