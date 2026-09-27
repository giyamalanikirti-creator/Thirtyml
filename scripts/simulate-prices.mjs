#!/usr/bin/env node
/**
 * Dev-only: nudges random entry prices every 20 seconds so realtime updates
 * can be watched in the browser. Uses the service role — NEVER run against
 * production.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run simulate:prices
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (local supabase: `npx supabase status`)."
  );
  process.exit(1);
}
if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
  console.error("Refusing to run against production.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function nudge() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, base_price")
    .eq("type", "entry")
    .eq("is_active", true);
  if (error) {
    console.error("fetch failed:", error.message);
    return;
  }
  const pick = products[Math.floor(Math.random() * products.length)];
  if (!pick || pick.base_price === 0) return;
  const delta = (Math.floor(Math.random() * 5) - 2) * 10000; // ±₹200 steps
  const next = Math.max(50000, pick.base_price + (delta === 0 ? 10000 : delta));
  const { error: updateError } = await supabase
    .from("products")
    .update({ base_price: next })
    .eq("id", pick.id);
  if (updateError) console.error("update failed:", updateError.message);
  else
    console.log(
      `${new Date().toLocaleTimeString()} ${pick.name}: ₹${pick.base_price / 100} → ₹${next / 100}`
    );
}

console.log("Nudging a random entry price every 20s. Ctrl-C to stop.");
nudge();
setInterval(nudge, 20000);
