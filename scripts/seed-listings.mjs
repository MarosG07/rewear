// Populates the live database with presentation listings owned by a handful of
// demo personas. Idempotent: re-running skips owners that already have listings.
//
//   node scripts/seed-listings.mjs
//
// To remove everything this creates:  node scripts/unseed-listings.mjs
import { createClient } from "@supabase/supabase-js";
import { loadEnv, OWNERS, LISTINGS, SEED_PASSWORD, email } from "./seed-data.mjs";

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function signInOwner(o) {
  // Create the account (auto-creates a profile via DB trigger) or sign in if it
  // already exists, then return an authed client session for this persona.
  let { data, error } = await supabase.auth.signUp({
    email: email(o.slug),
    password: SEED_PASSWORD,
    options: { data: { name: o.name } },
  });
  if (error && /already/i.test(error.message)) {
    ({ data, error } = await supabase.auth.signInWithPassword({
      email: email(o.slug),
      password: SEED_PASSWORD,
    }));
  }
  if (error) throw new Error(`${o.slug}: ${error.message}`);
  if (!data.session) throw new Error(`${o.slug}: no session (is email confirmation on?)`);
  return data.session.user.id;
}

let created = 0;
for (let i = 0; i < OWNERS.length; i++) {
  const o = OWNERS[i];
  const uid = await signInOwner(o);

  // Fill in the profile details the signup trigger doesn't set.
  await supabase.from("profiles").update({ avatar_url: o.avatar, location: o.location }).eq("id", uid);

  // Skip if this persona was already seeded.
  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", uid);
  if (count && count > 0) {
    console.log(`• ${o.name}: already has ${count} listing(s) — skipping`);
    continue;
  }

  const rows = LISTINGS.filter((l) => l.owner === i).map((l) => ({
    owner_id: uid,
    name: l.name,
    category: l.category,
    condition: l.condition,
    size: l.size,
    neighborhood: l.neighborhood,
    description: l.description,
    image_url: l.photo,
    images: [l.photo],
    boosted: !!l.boosted,
  }));
  const { error } = await supabase.from("listings").insert(rows);
  if (error) throw new Error(`${o.slug} insert: ${error.message}`);
  created += rows.length;
  console.log(`✓ ${o.name}: ${rows.length} listings`);
}

await supabase.auth.signOut();
console.log(`\nDone — ${created} new listing(s) across ${OWNERS.length} demo accounts.`);
