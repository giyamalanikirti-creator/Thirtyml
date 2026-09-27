import "server-only";

import { cookies } from "next/headers";
import { createHmac, randomUUID } from "node:crypto";
import {
  isSupabaseConfigured,
  supabaseAdmin,
  supabaseServer,
} from "@/lib/supabase/server";
import { demoClubs, demoClubDetail } from "@/lib/data/demo";

/**
 * Server-side cart. With Supabase configured, carts live in the `carts` /
 * `cart_items` tables (user carts under their id; anonymous carts under a
 * signed cookie token, merged on login). Without Supabase (zero-key local
 * dev), the cart lives in a signed cookie against the demo catalogue.
 */

const CART_COOKIE = "tml_cart";

export interface CartLine {
  id: string; // cart_items id, or cookie line key
  productId: string;
  productName: string;
  productType: string;
  clubId: string;
  clubName: string;
  clubSlug: string;
  citySlug: string;
  nightDate: string;
  quantity: number;
  maxPerOrder: number;
  priceWhenAdded: number;
  currentPrice: number;
  priceChanged: boolean;
  acknowledged: boolean;
  available: number;
  savedForLater: boolean;
}

export interface CartView {
  lines: CartLine[];
  /** lines grouped by club+night, cart page renders these groups */
  groups: { key: string; clubName: string; nightDate: string; lines: CartLine[] }[];
  subtotal: number;
  needsAcknowledgement: boolean;
  notices: string[];
}

export interface AddItemInput {
  productId: string;
  nightDate: string;
  quantity: number;
  tableId?: string;
}

// ------------------------------------------------------------- cookie utils

function cookieSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.RAZORPAY_KEY_SECRET ??
    "thirtyml-dev-cookie-secret"
  );
}

function sign(value: string): string {
  const mac = createHmac("sha256", cookieSecret())
    .update(value)
    .digest("base64url");
  return `${value}.${mac}`;
}

function verify(signed: string | undefined): string | null {
  if (!signed) return null;
  const dot = signed.lastIndexOf(".");
  if (dot < 0) return null;
  const value = signed.slice(0, dot);
  return sign(value) === signed ? value : null;
}

interface CookieCartLine {
  productId: string;
  nightDate: string;
  quantity: number;
  priceWhenAdded: number;
  acknowledged?: boolean;
  savedForLater?: boolean;
}

async function readCookieCart(): Promise<CookieCartLine[]> {
  const store = await cookies();
  const raw = verify(store.get(CART_COOKIE)?.value);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeCookieCart(lines: CookieCartLine[]): Promise<void> {
  const store = await cookies();
  const value = Buffer.from(JSON.stringify(lines)).toString("base64url");
  store.set(CART_COOKIE, sign(value), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
}

// ------------------------------------------------- demo (cookie) implementation

function demoProductLookup(productId: string) {
  for (const club of demoClubs) {
    const detail = demoClubDetail(club.citySlug, club.slug);
    if (!detail) continue;
    const product = detail.entryProducts.find((p) => p.id === productId);
    if (product) return { product, club: detail };
  }
  return null;
}

async function demoAddItems(items: AddItemInput[]): Promise<void> {
  const lines = await readCookieCart();
  for (const item of items) {
    const found = demoProductLookup(item.productId);
    if (!found) continue;
    const existing = lines.find(
      (l) => l.productId === item.productId && l.nightDate === item.nightDate
    );
    if (existing) {
      existing.quantity = Math.min(
        existing.quantity + item.quantity,
        found.product.maxPerOrder
      );
    } else {
      lines.push({
        productId: item.productId,
        nightDate: item.nightDate,
        quantity: Math.min(item.quantity, found.product.maxPerOrder),
        priceWhenAdded: found.product.price,
      });
    }
  }
  await writeCookieCart(lines);
}

async function demoCartView(): Promise<CartView> {
  const lines = await readCookieCart();
  const cartLines: CartLine[] = [];
  for (const line of lines) {
    const found = demoProductLookup(line.productId);
    if (!found) continue;
    cartLines.push({
      id: `${line.productId}:${line.nightDate}`,
      productId: line.productId,
      productName: found.product.name,
      productType: found.product.type,
      clubId: found.club.id,
      clubName: found.club.name,
      clubSlug: found.club.slug,
      citySlug: found.club.citySlug,
      nightDate: line.nightDate,
      quantity: line.quantity,
      maxPerOrder: found.product.maxPerOrder,
      priceWhenAdded: line.priceWhenAdded,
      currentPrice: found.product.price,
      priceChanged: found.product.price !== line.priceWhenAdded,
      acknowledged: Boolean(line.acknowledged),
      available: found.product.available,
      savedForLater: Boolean(line.savedForLater),
    });
  }
  return buildView(cartLines);
}

// --------------------------------------------------- supabase implementation

async function resolveCartId(create: boolean): Promise<string | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = supabaseAdmin();
  const store = await cookies();

  if (user) {
    // Merge any anonymous cart into the user's cart on first touch.
    const anonToken = verify(store.get(`${CART_COOKIE}_id`)?.value);
    const { data: existing } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    let cartId = existing?.id ?? null;
    if (!cartId && (create || anonToken)) {
      const { data: created } = await admin
        .from("carts")
        .insert({ user_id: user.id })
        .select("id")
        .single();
      cartId = created?.id ?? null;
    }
    if (anonToken && cartId) {
      const { data: anonCart } = await admin
        .from("carts")
        .select("id")
        .eq("anonymous_token", anonToken)
        .is("user_id", null)
        .maybeSingle();
      if (anonCart) {
        await admin
          .from("cart_items")
          .update({ cart_id: cartId })
          .eq("cart_id", anonCart.id);
        await admin.from("carts").delete().eq("id", anonCart.id);
      }
      store.delete(`${CART_COOKIE}_id`);
    }
    return cartId;
  }

  // Anonymous: signed cookie carries the cart token.
  const anonToken = verify(store.get(`${CART_COOKIE}_id`)?.value);
  if (anonToken) {
    const { data } = await admin
      .from("carts")
      .select("id")
      .eq("anonymous_token", anonToken)
      .maybeSingle();
    if (data) return data.id;
  }
  if (!create) return null;
  const token = randomUUID();
  const { data: created } = await admin
    .from("carts")
    .insert({ anonymous_token: token })
    .select("id")
    .single();
  if (!created) return null;
  store.set(`${CART_COOKIE}_id`, sign(token), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return created.id;
}

async function dbAddItems(items: AddItemInput[]): Promise<void> {
  const cartId = await resolveCartId(true);
  if (!cartId) throw new Error("Couldn't create a cart");
  const admin = supabaseAdmin();

  for (const item of items) {
    const { data: product } = await admin
      .from("products")
      .select("id, max_per_order, is_active")
      .eq("id", item.productId)
      .single();
    if (!product || !product.is_active) continue;

    const { data: priceRows } = await admin.rpc("catalog_prices", {
      p_product_ids: [item.productId],
      p_date: item.nightDate,
    });
    const current = priceRows?.[0]?.price ?? 0;

    let existingQuery = admin
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", item.productId)
      .eq("night_date", item.nightDate);
    existingQuery = item.tableId
      ? existingQuery.eq("table_id", item.tableId)
      : existingQuery.is("table_id", null);
    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      await admin
        .from("cart_items")
        .update({
          quantity: Math.min(
            existing.quantity + item.quantity,
            product.max_per_order
          ),
        })
        .eq("id", existing.id);
    } else {
      await admin.from("cart_items").insert({
        cart_id: cartId,
        product_id: item.productId,
        table_id: item.tableId ?? null,
        night_date: item.nightDate,
        quantity: Math.min(item.quantity, product.max_per_order),
        price_when_added: current,
      });
    }
  }
}

async function dbCartView(): Promise<CartView> {
  const cartId = await resolveCartId(false);
  if (!cartId) return buildView([]);
  const admin = supabaseAdmin();

  // Expire stale lines: past dates or older than 24h.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const { data: expired } = await admin
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId)
    .or(
      `night_date.lt.${today},created_at.lt.${new Date(Date.now() - 86400000).toISOString()}`
    )
    .select("id");

  const { data: items } = await admin
    .from("cart_items")
    .select(
      `id, product_id, table_id, night_date, quantity, price_when_added,
       price_change_acknowledged_at, saved_for_later,
       products(id, name, type, max_per_order, club_id,
                clubs(id, name, slug, cities(slug)))`
    )
    .eq("cart_id", cartId)
    .order("created_at");

  const productDates = new Map<string, Set<string>>();
  for (const item of items ?? []) {
    const set = productDates.get(item.night_date) ?? new Set<string>();
    set.add(item.product_id);
    productDates.set(item.night_date, set);
  }

  const priceMap = new Map<string, { price: number; available: number }>();
  for (const [date, ids] of productDates) {
    const { data: prices } = await admin.rpc("catalog_prices", {
      p_product_ids: [...ids],
      p_date: date,
    });
    for (const p of prices ?? []) {
      priceMap.set(`${p.product_id}:${date}`, {
        price: p.price ?? 0,
        available: p.available ?? 0,
      });
    }
  }

  const lines: CartLine[] = (items ?? []).map((item) => {
    const live = priceMap.get(`${item.product_id}:${item.night_date}`);
    const currentPrice = live?.price ?? item.price_when_added;
    return {
      id: item.id,
      productId: item.product_id,
      productName: item.products.name,
      productType: item.products.type,
      clubId: item.products.clubs.id,
      clubName: item.products.clubs.name,
      clubSlug: item.products.clubs.slug,
      citySlug: item.products.clubs.cities.slug,
      nightDate: item.night_date,
      quantity: item.quantity,
      maxPerOrder: item.products.max_per_order,
      priceWhenAdded: item.price_when_added,
      currentPrice,
      priceChanged: currentPrice !== item.price_when_added,
      acknowledged: item.price_change_acknowledged_at !== null,
      available: live?.available ?? 0,
      savedForLater: item.saved_for_later,
    };
  });

  const view = buildView(lines);
  if ((expired ?? []).length > 0) {
    view.notices.push(
      "Some items were removed because their night has passed or they sat in the cart for more than 24 hours."
    );
  }
  return view;
}

// ------------------------------------------------------------------- shared

function buildView(lines: CartLine[]): CartView {
  const active = lines.filter((l) => !l.savedForLater);
  const groups = new Map<string, CartLine[]>();
  for (const line of active) {
    const key = `${line.clubId}:${line.nightDate}`;
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }
  return {
    lines,
    groups: [...groups.entries()].map(([key, groupLines]) => ({
      key,
      clubName: groupLines[0].clubName,
      nightDate: groupLines[0].nightDate,
      lines: groupLines,
    })),
    subtotal: active.reduce((sum, l) => sum + l.currentPrice * l.quantity, 0),
    needsAcknowledgement: active.some((l) => l.priceChanged && !l.acknowledged),
    notices: [],
  };
}

// ---------------------------------------------------------------- public API

export async function addItemsToCart(items: AddItemInput[]): Promise<void> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return dbAddItems(items);
  }
  return demoAddItems(items);
}

export async function getCartView(): Promise<CartView> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return dbCartView();
  }
  return demoCartView();
}

export async function setLineQuantity(
  lineId: string,
  quantity: number
): Promise<void> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const cartId = await resolveCartId(false);
    if (!cartId) return;
    const admin = supabaseAdmin();
    if (quantity <= 0) {
      await admin
        .from("cart_items")
        .delete()
        .eq("id", lineId)
        .eq("cart_id", cartId);
    } else {
      await admin
        .from("cart_items")
        .update({ quantity })
        .eq("id", lineId)
        .eq("cart_id", cartId);
    }
    return;
  }
  const lines = await readCookieCart();
  const [productId, nightDate] = lineId.split(":");
  const next = lines
    .map((l) =>
      l.productId === productId && l.nightDate === nightDate
        ? { ...l, quantity }
        : l
    )
    .filter((l) => l.quantity > 0);
  await writeCookieCart(next);
}

export async function acknowledgePriceChanges(): Promise<void> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const cartId = await resolveCartId(false);
    if (!cartId) return;
    const admin = supabaseAdmin();
    // Re-baseline: accept current price as the new reference.
    const view = await dbCartView();
    for (const line of view.lines) {
      if (line.priceChanged) {
        await admin
          .from("cart_items")
          .update({
            price_when_added: line.currentPrice,
            price_change_acknowledged_at: new Date().toISOString(),
          })
          .eq("id", line.id)
          .eq("cart_id", cartId);
      }
    }
    return;
  }
  const lines = await readCookieCart();
  const view = await demoCartView();
  const changed = new Set(
    view.lines.filter((l) => l.priceChanged).map((l) => l.id)
  );
  await writeCookieCart(
    lines.map((l) =>
      changed.has(`${l.productId}:${l.nightDate}`)
        ? {
            ...l,
            acknowledged: true,
            priceWhenAdded:
              view.lines.find(
                (v) => v.id === `${l.productId}:${l.nightDate}`
              )?.currentPrice ?? l.priceWhenAdded,
          }
        : l
    )
  );
}

export async function toggleSavedForLater(lineId: string): Promise<void> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const cartId = await resolveCartId(false);
    if (!cartId) return;
    const admin = supabaseAdmin();
    const { data } = await admin
      .from("cart_items")
      .select("saved_for_later")
      .eq("id", lineId)
      .eq("cart_id", cartId)
      .single();
    if (data) {
      await admin
        .from("cart_items")
        .update({ saved_for_later: !data.saved_for_later })
        .eq("id", lineId);
    }
    return;
  }
  const lines = await readCookieCart();
  const [productId, nightDate] = lineId.split(":");
  await writeCookieCart(
    lines.map((l) =>
      l.productId === productId && l.nightDate === nightDate
        ? { ...l, savedForLater: !l.savedForLater }
        : l
    )
  );
}

export async function clearCart(): Promise<void> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const cartId = await resolveCartId(false);
    if (!cartId) return;
    await supabaseAdmin().from("cart_items").delete().eq("cart_id", cartId);
    return;
  }
  await writeCookieCart([]);
}
