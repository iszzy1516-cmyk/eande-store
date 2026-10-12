import ProductPageClient from "@/components/ProductPageClient";

export const dynamic = "force-static";

// Pre-render product pages for the static export from the live catalog.
// On the server deployment (Railway) any slug still renders at runtime.
export async function generateStaticParams() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return [{ slug: "placeholder" }]; // product data loads client-side
  try {
    const res = await fetch(`${base}/api/products`);
    if (!res.ok) return [{ slug: "placeholder" }];
    const d = await res.json();
    return (d.products as { slug: string }[]).map((p) => ({ slug: p.slug }));
  } catch {
    return [{ slug: "placeholder" }];
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductPageClient slug={slug} />;
}
