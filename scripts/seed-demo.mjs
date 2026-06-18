// Seeds the Rewear app with demo users, listings, wishes and a few swap
// threads so it looks alive for a demo. Safe to re-run (skips existing users).
//
//   node scripts/seed-demo.mjs
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env. Requires email
// confirmation to be OFF (Supabase → Authentication → Providers → Email).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const PASSWORD = "demo1234"; // every demo account uses this
const img = (id) => `https://images.unsplash.com/photo-${id}?w=800`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Demo people, each with a few listings (+ optional wishes). Names/neighborhoods
// are Valencia-flavored; photos are real Unsplash images.
const USERS = [
  {
    name: "Lucía Romero",
    email: "demo.lucia@rewear.app",
    location: "Valencia, Spain",
    listings: [
      { name: "Pleated Midi Skirt", category: "Skirt", condition: "Like New", size: "S", neighborhood: "Ruzafa", image_url: img("1583496661160-fb5886a0aaaa"), description: "Flowing sage pleated skirt, worn twice." },
      { name: "Floral Summer Dress", category: "Dress", condition: "Like New", size: "S", neighborhood: "Ruzafa", image_url: img("1618932260643-eee4a2f652a6"), description: "Lightweight floral dress, perfect for spring." },
    ],
    wishes: [{ title: "Vintage Levi's 501, W28", category: "Pants", neighborhood: "Ruzafa", note: "Mid blue wash ideally." }],
  },
  {
    name: "Pablo Moreno",
    email: "demo.pablo@rewear.app",
    location: "Valencia, Spain",
    listings: [
      { name: "Classic Denim Jacket", category: "Jacket", condition: "Good", size: "L", neighborhood: "El Carmen", image_url: img("1591047139829-d91aecb6caea"), description: "Medium-wash denim jacket, well loved." },
      { name: "Striped Cotton Shirt", category: "Shirt", condition: "New", size: "M", neighborhood: "El Carmen", image_url: img("1602810318383-e386cc2a3ccf"), description: "Breton stripe, never worn." },
    ],
  },
  {
    name: "Carmen López",
    email: "demo.carmen@rewear.app",
    location: "Valencia, Spain",
    listings: [
      { name: "Leather Ankle Boots", category: "Shoes", condition: "Good", size: "EU 39", neighborhood: "Cabanyal", image_url: img("1543163521-1bf539c55dd2"), description: "Brown leather boots with a low heel." },
      { name: "Woven Straw Hat", category: "Accessories", condition: "Good", size: "One Size", neighborhood: "Malvarrosa", image_url: img("1572307480813-ceb0e59d8325"), description: "Wide-brim straw hat, beach essential." },
    ],
    wishes: [{ title: "Linen blazer, size M", category: "Jacket", neighborhood: "Cabanyal", note: "Neutral colour." }],
  },
  {
    name: "Diego Fernández",
    email: "demo.diego@rewear.app",
    location: "Valencia, Spain",
    listings: [
      { name: "Retro Running Sneakers", category: "Sneakers", condition: "Good", size: "EU 42", neighborhood: "Benimaclet", image_url: img("1542291026-7eec264c27ff"), description: "Red & white retro runners, broken in." },
      { name: "Quilted Puffer Jacket", category: "Jacket", condition: "Like New", size: "L", neighborhood: "Benimaclet", image_url: img("1544022613-e87ca75a784a"), description: "Olive puffer, packs down small." },
    ],
  },
  {
    name: "Marta Giménez",
    email: "demo.marta@rewear.app",
    location: "Valencia, Spain",
    listings: [
      { name: "Chunky Knit Sweater", category: "Sweater", condition: "Like New", size: "M", neighborhood: "Ruzafa", image_url: img("1576566588028-4147f3842f27"), description: "Cozy oatmeal hand-knit sweater." },
      { name: "Suede Crossbody Bag", category: "Accessories", condition: "Good", size: "One Size", neighborhood: "Malvarrosa", image_url: img("1584917865442-de89df76afd3"), description: "Tan suede bag with adjustable strap." },
    ],
    wishes: [{ title: "Ankle boots, EU 38", category: "Shoes", neighborhood: "Ruzafa" }],
  },
  {
    name: "Hugo Navarro",
    email: "demo.hugo@rewear.app",
    location: "Valencia, Spain",
    listings: [
      { name: "Oversized Wool Coat", category: "Coat", condition: "New", size: "L", neighborhood: "El Carmen", image_url: img("1539533113208-f6df8cc8b543"), description: "Camel wool coat, timeless." },
      { name: "Wrap Maxi Dress", category: "Dress", condition: "New", size: "M", neighborhood: "Cabanyal", image_url: img("1572804013309-59a88b7e92f1"), description: "Terracotta wrap maxi, tags on." },
    ],
  },
];

// [requesterIndex, ownerIndex, ownerListingIndex, opening message]
const SWAPS = [
  [2, 1, 0, "Hi Pablo! Love the denim jacket — would you swap for my boots?"],
  [3, 0, 1, "Hey Lucía, is the floral dress still available?"],
  [4, 5, 0, "Hugo that wool coat is perfect. Open to a swap?"],
];

async function ensureUser(u) {
  let { data, error } = await supabase.auth.signUp({
    email: u.email,
    password: PASSWORD,
    options: { data: { name: u.name } },
  });
  if (error && /already|registered/i.test(error.message)) {
    ({ data, error } = await supabase.auth.signInWithPassword({ email: u.email, password: PASSWORD }));
  }
  if (error) throw error;
  return data.user.id;
}

async function run() {
  const created = [];
  for (const u of USERS) {
    try {
      const uid = await ensureUser(u);
      await supabase.from("profiles").update({ name: u.name, location: u.location }).eq("id", uid);
      const listingIds = [];
      for (const l of u.listings) {
        const { data } = await supabase
          .from("listings")
          .insert({ owner_id: uid, ...l })
          .select("id")
          .single();
        if (data) listingIds.push(data.id);
      }
      for (const w of u.wishes ?? []) {
        await supabase.from("wishlist").insert({ user_id: uid, ...w });
      }
      created.push({ ...u, uid, listingIds });
      console.log(`✓ ${u.name} — ${listingIds.length} listings, ${(u.wishes ?? []).length} wishes`);
      await supabase.auth.signOut();
      await sleep(400);
    } catch (e) {
      console.error(`✗ ${u.name}:`, e.message);
    }
  }

  for (const [rI, oI, lI, msg] of SWAPS) {
    const requester = created[rI];
    const owner = created[oI];
    if (!requester || !owner || !owner.listingIds[lI]) continue;
    try {
      await supabase.auth.signInWithPassword({ email: requester.email, password: PASSWORD });
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ listing_id: owner.listingIds[lI], requester_id: requester.uid, owner_id: owner.uid })
        .select("id")
        .single();
      if (conv) {
        await supabase.from("messages").insert({ conversation_id: conv.id, sender_id: requester.uid, body: msg });
        console.log(`✓ swap: ${requester.name} → ${owner.name}`);
      }
      await supabase.auth.signOut();
      await sleep(300);
    } catch (e) {
      console.error("✗ swap:", e.message);
    }
  }

  console.log("\nDone. Demo accounts use password:", PASSWORD);
}

run();
