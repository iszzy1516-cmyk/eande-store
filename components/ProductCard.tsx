import Link from "next/link";
import { formatNaira } from "@/lib/format";

type Props = {
  product: {
    slug: string;
    name: string;
    price: number;
    image: string;
    stock: number;
    category?: string;
    sizes?: string;
  };
};

export default function ProductCard({ product }: Props) {
  const firstSize = product.sizes?.split(",")[0]?.trim();

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {firstSize && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-cocoa">
            {firstSize}
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-cocoa/80 px-2.5 py-1 text-[11px] font-bold text-white">
            Sold out
          </span>
        )}
      </div>
      <h3 className="mt-3 line-clamp-1 text-sm font-bold text-cocoa">
        {product.name}
      </h3>
      {product.category && (
        <p className="mt-0.5 text-xs capitalize text-cocoa/50">
          {product.category.toLowerCase()}
        </p>
      )}
      <p className="mt-1 font-display text-base font-bold text-gold">
        {formatNaira(product.price)}
      </p>
    </Link>
  );
}
