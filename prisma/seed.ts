import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  // ---------- CLOTHES ----------
  {
    name: "Pink “Love” 4-Piece Set",
    slug: "pink-love-4piece-set",
    description:
      "A soft blush-pink long-sleeve bodysuit with floral shorts, matching bow headband and socks. A complete ready-to-wear outfit.",
    price: 1250000, // ₦12,500
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 10,
    featured: true,
  },
  {
    name: "Peach Tee & Daisy Leggings Set",
    slug: "peach-tee-daisy-leggings-set",
    description:
      "A gentle peach long-sleeve tee paired with dusty-blue daisy-print leggings and a sweet bow detail at the waist.",
    price: 950000, // ₦9,500
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 12,
    featured: false,
  },
  {
    name: "Strawberry Smocked Sundress",
    slug: "strawberry-smocked-dress",
    description:
      "A breezy organic-cotton sundress with a smocked bodice, tie shoulders and an all-over strawberry print. Perfect for sunny days.",
    price: 1100000, // ₦11,000
    category: "CLOTHES",
    sizes: "6-12M,1-2Y,2-3Y",
    stock: 8,
    featured: true,
  },
  {
    name: "Pink Tee & Plaid Leggings Set",
    slug: "pink-tee-plaid-leggings-set",
    description:
      "A soft pink short-sleeve tee with pink-and-cream plaid leggings — an easy everyday outfit.",
    price: 850000, // ₦8,500
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 14,
    featured: false,
  },
  {
    name: "“Love” Tee, Floral Leggings & Headband Set",
    slug: "love-tee-floral-leggings-set",
    description:
      "A blush “Love” puff-sleeve tee with mint floral leggings and a matching bow headband. Three pieces, one adorable look.",
    price: 1050000, // ₦10,500
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 10,
    featured: false,
  },
  {
    name: "Cupcake Tee & Rainbow Shorts Set",
    slug: "cupcake-tee-stripe-shorts-set",
    description:
      "A coral cupcake-graphic tee with rainbow-stripe shorts — bright, playful and comfy for all-day wear.",
    price: 800000, // ₦8,000
    category: "CLOTHES",
    sizes: "6-12M,1-2Y,2-3Y",
    stock: 12,
    featured: false,
  },
  {
    name: "“Mama’s Mini” 3-Piece Set",
    slug: "mamas-mini-set",
    description:
      "A pink “Mama’s Mini” tee with plaid leggings and a matching plaid bow headband. Made for matching moments.",
    price: 1000000, // ₦10,000
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 9,
    featured: true,
  },
  {
    name: "White Top & Polka Dot Bloomers Set",
    slug: "polka-dot-bloomers-set",
    description:
      "A crisp white flutter-sleeve top with soft pink polka-dot bloomers — light and comfy for warm days.",
    price: 750000, // ₦7,500
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 15,
    featured: false,
  },
  {
    name: "Everyday 4-Piece Tee & Shorts Set",
    slug: "everyday-4piece-shorts-set",
    description:
      "Two soft tees (pink and cream) with two pairs of shorts (pink and floral) — mix-and-match outfits in one bundle.",
    price: 1350000, // ₦13,500
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 7,
    featured: false,
  },
  {
    name: "“Daddy’s Girl” 3-Piece Set",
    slug: "daddys-girl-set",
    description:
      "A white ruffle-sleeve “Daddy’s Girl” tee with pink polka-dot bottoms and a matching bow headband.",
    price: 1000000, // ₦10,000
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 11,
    featured: true,
  },
  {
    name: "Crown Print 3-Piece Set",
    slug: "crown-leggings-3piece-set",
    description:
      "A white top with pink crown-print leggings and matching accessories — fit for your little princess.",
    price: 950000, // ₦9,500
    category: "CLOTHES",
    sizes: "0-3M,3-6M,6-12M",
    stock: 10,
    featured: false,
  },
  {
    name: "“Love” Tee & Floral Bloomers Set",
    slug: "love-bloomers-set",
    description:
      "A pink tee with a daisy “Love” print paired with soft floral bloomers. Sweet and simple.",
    price: 750000, // ₦7,500
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 13,
    featured: false,
  },
  {
    name: "Pink Top & Mint Floral Bloomers Set",
    slug: "mint-floral-bloomers-set",
    description:
      "A blush puff-sleeve top with mint floral bloomers — a fresh, comfy set for playtime.",
    price: 750000, // ₦7,500
    category: "CLOTHES",
    sizes: "0-6M,6-12M,1-2Y",
    stock: 12,
    featured: false,
  },
  {
    name: "Rainbow Stripe 4-Piece Set",
    slug: "rainbow-4piece-shorts-set",
    description:
      "Two tops (coral and white) with polka-dot and rainbow-stripe shorts — four pieces of mix-and-match fun.",
    price: 1300000, // ₦13,000
    category: "CLOTHES",
    sizes: "6-12M,1-2Y,2-3Y",
    stock: 6,
    featured: false,
  },
  {
    name: "Cartoon Tee & Pink Shorts Set",
    slug: "cartoon-tee-pink-shorts-set",
    description:
      "A cream cartoon-character tee with comfy pink shorts — a fun set for toddlers on the move.",
    price: 900000, // ₦9,000
    category: "CLOTHES",
    sizes: "1-2Y,2-3Y,3-4Y",
    stock: 10,
    featured: false,
  },
  {
    name: "Mustard Tee & Teal Pants Set",
    slug: "mustard-tee-teal-pants-set",
    description:
      "A mustard slogan tee with teal pants, plus a fun pair of kids’ sunglasses included.",
    price: 950000, // ₦9,500
    category: "CLOTHES",
    sizes: "6-12M,1-2Y,2-3Y",
    stock: 8,
    featured: false,
  },
  {
    name: "Dino Polo & Navy Joggers Set",
    slug: "dino-polo-joggers-set",
    description:
      "A colourful dinosaur-print polo shirt with navy joggers — a smart, comfy set for little explorers.",
    price: 1150000, // ₦11,500
    category: "CLOTHES",
    sizes: "6-12M,1-2Y,2-3Y,3-4Y",
    stock: 9,
    featured: true,
  },

  // ---------- ONESIES ----------
  {
    name: "Bunny Print Bubble Romper",
    slug: "bunny-bubble-romper",
    description:
      "A soft cream bubble romper with the sweetest orange bunny print. 100% cotton, gentle on delicate skin.",
    price: 650000, // ₦6,500
    category: "ONESIES",
    sizes: "0-6M,6-12M",
    stock: 16,
    featured: true,
  },
  {
    name: "Floral Bubble Romper",
    slug: "floral-bubble-romper",
    description:
      "A mint-and-pink floral bubble romper in breathable cotton with easy snap buttons for quick changes.",
    price: 650000, // ₦6,500
    category: "ONESIES",
    sizes: "0-6M,6-12M",
    stock: 14,
    featured: false,
  },
  {
    name: "Leopard Heart 4-Piece Layette Set",
    slug: "leopard-4piece-layette",
    description:
      "A 4-piece set with a leopard-heart bodysuit, pink ribbed pants, bib and headband. A perfect newborn gift.",
    price: 1200000, // ₦12,000
    category: "ONESIES",
    sizes: "0-3M,3-6M,6-9M",
    stock: 8,
    featured: false,
  },
  {
    name: "Pink Floral 4-Piece Layette Set",
    slug: "pink-floral-4piece-layette",
    description:
      "A 4-piece set with a floral bodysuit, pink pants, bow bib and headband — soft pinks for your little one.",
    price: 1200000, // ₦12,000
    category: "ONESIES",
    sizes: "0-3M,3-6M",
    stock: 10,
    featured: true,
  },
  {
    name: "Pink Bear Bodysuit",
    slug: "pink-bear-bodysuit",
    description:
      "A short-sleeve bodysuit covered in the cutest pink bears and florals. Soft ribbed cotton with envelope neckline.",
    price: 450000, // ₦4,500
    category: "ONESIES",
    sizes: "0-6M,6-12M,12-18M",
    stock: 20,
    featured: false,
  },
  {
    name: "“Mama” Bodysuit 3-Piece Layette",
    slug: "mama-3piece-layette",
    description:
      "A white “Mama” bodysuit with pink crown-print leggings and a matching bow turban hat. Picture-perfect.",
    price: 1100000, // ₦11,000
    category: "ONESIES",
    sizes: "0-3M,3-6M,6-9M",
    stock: 9,
    featured: true,
  },
  {
    name: "Navy Space Bodysuit",
    slug: "navy-space-bodysuit",
    description:
      "A navy space-print bodysuit with a fun pair of baby sunglasses included — for your little star.",
    price: 550000, // ₦5,500
    category: "ONESIES",
    sizes: "0-6M,6-12M,12-18M",
    stock: 15,
    featured: false,
  },

  // ---------- TOWELS ----------
  {
    name: "Hooded Towel & Washcloth Gift Set",
    slug: "hooded-towel-gift-set",
    description:
      "A hooded baby towel with matching washcloths in a ready-to-gift pack. Choose from duck, whale, giraffe or hippo designs.",
    price: 850000, // ₦8,500
    category: "TOWELS",
    sizes: "One Size",
    stock: 12,
    featured: false,
  },
  {
    name: "White Hooded Towel Gift Set",
    slug: "white-towel-gift-set",
    description:
      "A plush white hooded towel set finished with a ribbon bow — soft, absorbent and beautifully packaged for gifting.",
    price: 750000, // ₦7,500
    category: "TOWELS",
    sizes: "One Size",
    stock: 10,
    featured: false,
  },
];

async function main() {
  console.log("Seeding database (safe mode — upserts only, orders untouched)...");

  // Admin password comes from the environment. In development, generate a
  // random one if unset; in production it must be provided explicitly.
  let password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_INITIAL_PASSWORD is required to seed in production."
      );
    }
    password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    console.log(
      `ADMIN_INITIAL_PASSWORD not set — generated a random one for dev: ${password}`
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_INITIAL_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@eandekiddies.com" },
    update: { passwordHash },
    create: {
      email: "admin@eandekiddies.com",
      passwordHash,
    },
  });
  console.log("Admin user ready: admin@eandekiddies.com");

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, image: `/products/${product.slug}.jpg` },
      create: {
        ...product,
        image: `/products/${product.slug}.jpg`,
      },
    });
  }
  console.log(`Upserted ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
