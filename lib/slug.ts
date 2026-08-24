import { prisma } from "./db";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a URL-safe slug from a product name, ensuring uniqueness. */
export async function uniqueSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(name) || "product";
  let slug = base;
  let counter = 2;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter++}`;
  }
}
