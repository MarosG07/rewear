// Removes every demo persona created by seed-listings.mjs (and, by cascade,
// their listings, conversations and messages). Real users are untouched.
//
//   node scripts/unseed-listings.mjs
import { createClient } from "@supabase/supabase-js";
import { loadEnv, OWNERS, SEED_PASSWORD, email } from "./seed-data.mjs";

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let removed = 0;
for (const o of OWNERS) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email(o.slug),
    password: SEED_PASSWORD,
  });
  if (error) {
    console.log(`• ${o.name}: not present (${error.message})`);
    continue;
  }
  // SECURITY DEFINER RPC that deletes the caller's account + all owned rows.
  const { error: delErr } = await supabase.rpc("delete_my_account");
  if (delErr) {
    console.log(`✗ ${o.name}: ${delErr.message}`);
  } else {
    removed++;
    console.log(`✓ removed ${o.name}`);
  }
  await supabase.auth.signOut();
}

console.log(`\nDone — removed ${removed} demo account(s).`);
