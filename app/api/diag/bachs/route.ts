import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";

// TEMPORARY diagnostic — remove after fixing checkout.
export async function GET() {
  const key = process.env.BACHS_SECRET_KEY ?? "";
  const result: Record<string, unknown> = {
    keyPrefix: key.slice(0, 10),
    keyLength: key.length,
  };

  try {
    result.dns = await lookup("api.bachs.io");
  } catch (e: any) {
    result.dnsError = e?.message;
  }

  try {
    const res = await fetch("https://api.bachs.io/v1/accounts/me", {
      headers: { Authorization: `Bearer ${key}` },
    });
    result.status = res.status;
    result.body = (await res.text()).slice(0, 200);
  } catch (e: any) {
    result.fetchError = e?.message;
    result.cause = e?.cause?.code ?? String(e?.cause ?? "");
  }

  return NextResponse.json(result);
}
