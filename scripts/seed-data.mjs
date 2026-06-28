// Shared data for the presentation seed scripts.
// Seed accounts use a recognizable email prefix so they can be wiped cleanly
// (see unseed-listings.mjs). Nothing here touches real users' data.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  const txt = readFileSync(resolve(root, ".env"), "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

export const SEED_PASSWORD = "rewear-demo-2026";

// 6 personas — each gets a profile (name, avatar, location) and a few listings.
export const OWNERS = [
  { slug: "sarah", name: "Sarah Martinez", avatar: "https://i.pravatar.cc/150?img=1", location: "Ruzafa, Valencia" },
  { slug: "emma", name: "Emma Rodriguez", avatar: "https://i.pravatar.cc/150?img=3", location: "Ruzafa, Valencia" },
  { slug: "jordan", name: "Jordan Taylor", avatar: "https://i.pravatar.cc/150?img=4", location: "Cabanyal, Valencia" },
  { slug: "olivia", name: "Olivia Williams", avatar: "https://i.pravatar.cc/150?img=5", location: "Benimaclet, Valencia" },
  { slug: "sophia", name: "Sophia Anderson", avatar: "https://i.pravatar.cc/150?img=6", location: "El Carmen, Valencia" },
  { slug: "diego", name: "Diego Fernández", avatar: "https://i.pravatar.cc/150?img=11", location: "Malvarrosa, Valencia" },
];

export const email = (slug) => `seed.${slug}@rewear.app`;

const img = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}`;

// 18 listings (mirrors the original mock catalogue). `owner` indexes OWNERS.
export const LISTINGS = [
  { owner: 0, name: "Linen Wide-Leg Pants", category: "Pants", photo: img("1515886657613-9f3515b0c78f"), condition: "Like New", size: "M", neighborhood: "Ruzafa", boosted: true,
    description: "Comfortable wide-leg linen pants in natural cream. Perfect for warm weather and casual occasions. Breathable fabric with a relaxed fit." },
  { owner: 1, name: "Floral Summer Dress", category: "Dress", photo: img("1618932260643-eee4a2f652a6"), condition: "Like New", size: "S", neighborhood: "Ruzafa",
    description: "Lightweight summer dress with a delicate floral pattern. Flowing silhouette and comfortable fit. Perfect for garden parties or brunch." },
  { owner: 2, name: "Vintage Leather Jacket", category: "Jacket", photo: img("1539533018447-63fcce2678e3"), condition: "Worn", size: "M", neighborhood: "Cabanyal",
    description: "Genuine leather jacket with vintage appeal. Well-loved with a natural patina that adds character. Classic moto style with metal hardware." },
  { owner: 3, name: "Elegant Midi Dress", category: "Dress", photo: img("1581044777550-4cfa60707c03"), condition: "Like New", size: "M", neighborhood: "Benimaclet", boosted: true,
    description: "Sophisticated midi dress in rich burgundy. Flattering silhouette with elegant draping. Ideal for special occasions or date nights." },
  { owner: 4, name: "Silk Pattern Scarf", category: "Accessories", photo: img("1434389677669-e08b4cac3105"), condition: "Like New", size: "One Size", neighborhood: "El Carmen",
    description: "Luxurious silk scarf with an intricate geometric pattern. Versatile accessory you can wear multiple ways. Adds elegance to any outfit." },
  { owner: 5, name: "Retro Running Sneakers", category: "Sneakers", photo: img("1542291026-7eec264c27ff"), condition: "Good", size: "EU 42", neighborhood: "Malvarrosa",
    description: "Iconic retro running sneakers in red and white. A little broken in but plenty of life left. Comfortable cushioning for everyday wear." },
  { owner: 0, name: "Chunky Knit Sweater", category: "Sweater", photo: img("1576566588028-4147f3842f27"), condition: "Like New", size: "M", neighborhood: "Ruzafa",
    description: "Cozy oversized sweater in soft oatmeal. Hand-knit texture and relaxed fit. Perfect for crisp autumn days or layering in winter." },
  { owner: 1, name: "Wrap Maxi Dress", category: "Dress", photo: img("1572804013309-59a88b7e92f1"), condition: "New", size: "M", neighborhood: "Ruzafa",
    description: "Elegant wrap maxi dress in terracotta. Flattering tie waist and a flowing hem. Brand new with tags — never had the occasion." },
  { owner: 2, name: "Leather Ankle Boots", category: "Shoes", photo: img("1543163521-1bf539c55dd2"), condition: "Good", size: "EU 39", neighborhood: "Cabanyal",
    description: "Classic brown leather ankle boots with a low heel. Gently worn with a beautiful patina. Comfortable for all-day wear." },
  { owner: 3, name: "Oversized Wool Coat", category: "Coat", photo: img("1539533113208-f6df8cc8b543"), condition: "New", size: "L", neighborhood: "Benimaclet",
    description: "Classic wool coat in camel. Timeless oversized fit perfect for layering. Deep pockets and an elegant silhouette." },
  { owner: 4, name: "Classic Denim Jacket", category: "Jacket", photo: img("1591047139829-d91aecb6caea"), condition: "Good", size: "L", neighborhood: "El Carmen",
    description: "Timeless denim jacket in a medium wash. Classic button closure and chest pockets. Pairs well with everything." },
  { owner: 5, name: "Woven Straw Hat", category: "Accessories", photo: img("1572307480813-ceb0e59d8325"), condition: "Good", size: "One Size", neighborhood: "Malvarrosa",
    description: "Wide-brim woven straw hat for sunny days by the beach. Holds its shape well. A Cabanyal-summer essential." },
  { owner: 0, name: "Canvas Tote Bag", category: "Accessories", photo: img("1590874103328-eac38a683ce7"), condition: "New", size: "One Size", neighborhood: "Ruzafa",
    description: "Minimalist canvas tote in natural beige. Sturdy construction with leather handles. Perfect for market trips or daily essentials." },
  { owner: 1, name: "Pleated Midi Skirt", category: "Skirt", photo: img("1583496661160-fb5886a0aaaa"), condition: "Like New", size: "S", neighborhood: "El Carmen",
    description: "Flowing pleated midi skirt in soft sage. Elastic waistband for comfort and an elegant drape. Pairs beautifully with a tucked-in tee." },
  { owner: 2, name: "High-Top Canvas Sneakers", category: "Sneakers", photo: img("1525966222134-fcfa99b8ae77"), condition: "Worn", size: "EU 40", neighborhood: "Cabanyal",
    description: "Classic white high-top canvas sneakers. Lived-in and lovingly worn — perfect with everything. Laces recently replaced." },
  { owner: 3, name: "Striped Cotton Shirt", category: "Shirt", photo: img("1602810318383-e386cc2a3ccf"), condition: "New", size: "M", neighborhood: "Benimaclet",
    description: "Crisp breton-striped cotton shirt, never worn. Relaxed fit with a soft collar. A wardrobe staple that goes with everything." },
  { owner: 4, name: "Suede Crossbody Bag", category: "Accessories", photo: img("1584917865442-de89df76afd3"), condition: "Good", size: "One Size", neighborhood: "El Carmen",
    description: "Warm tan suede crossbody with an adjustable strap. Light signs of use that add character. Just the right size for the essentials." },
  { owner: 5, name: "Quilted Puffer Jacket", category: "Jacket", photo: img("1544022613-e87ca75a784a"), condition: "Like New", size: "L", neighborhood: "Malvarrosa",
    description: "Lightweight quilted puffer in deep olive. Packs down small and keeps you cosy. Barely worn — looking for a new home." },
];
